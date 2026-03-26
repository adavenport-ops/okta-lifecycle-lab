"""Event router — core orchestrator for joiner/mover/leaver workflows."""

from __future__ import annotations

import time
from uuid import UUID

from rich.console import Console

from engine.audit_checker import AuditChecker
from engine.event_log import EventLog
from engine.metrics import MetricsCollector
from engine.models import (
    AccessState,
    EventType,
    HRISEvent,
    ProvisioningMetrics,
)
from engine.okta_client import OktaClient
from engine.rbac_resolver import RBACResolver
from engine.scim_provisioner import SCIMProvisioner

console = Console()


def _employee_meta(emp: "HRISEvent.employee.__class__") -> dict:
    """Build employee metadata dict for event log enrichment."""
    return {
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "email": emp.email,
        "department": emp.department,
        "title": emp.title,
    }


class EventRouter:
    def __init__(
        self,
        okta_client: OktaClient,
        rbac_resolver: RBACResolver,
        scim_provisioner: SCIMProvisioner,
        event_log: EventLog,
        metrics_collector: MetricsCollector,
    ) -> None:
        self._okta = okta_client
        self._rbac = rbac_resolver
        self._scim = scim_provisioner
        self._log = event_log
        self._metrics = metrics_collector
        self._access_states: dict[str, AccessState] = {}
        self._okta_user_ids: dict[str, str] = {}  # employee_id -> okta_user_id

    async def process_event(self, event: HRISEvent) -> None:
        console.print(
            f"[bold blue]Processing {event.event_type.value}[/] for "
            f"{event.employee.full_name} ({event.employee.employee_id})"
        )

        handlers = {
            EventType.JOIN: self._handle_join,
            EventType.MOVE: self._handle_move,
            EventType.LEAVE: self._handle_leave,
        }
        handler = handlers[event.event_type]
        await handler(event)

    async def _handle_join(self, event: HRISEvent) -> None:
        emp = event.employee
        errors: list[str] = []
        start = time.monotonic()

        # 1. Resolve target access state
        target = self._rbac.resolve(emp.department, emp.title, emp.employee_id)

        # 2. Create Okta user
        try:
            okta_user_id = await self._okta.create_user(
                emp.employee_id, emp.email, emp.first_name, emp.last_name
            )
            self._okta_user_ids[emp.employee_id] = okta_user_id
            self._log.append(
                event_id=event.event_id, event_type="join", employee_id=emp.employee_id,
                action="create_user",
                details={"okta_user_id": okta_user_id, **_employee_meta(emp)},
            )
            console.print(f"  [green]Created Okta user[/] {okta_user_id}")
        except Exception as e:
            errors.append(f"create_user: {e}")
            self._log.append(
                event_id=event.event_id, event_type="join", employee_id=emp.employee_id,
                action="create_user", result="failure", error=str(e),
            )
            return

        # 3. Add to groups
        for group in target.okta_groups:
            try:
                await self._okta.add_to_group(okta_user_id, group)
                self._log.append(
                    event_id=event.event_id, event_type="join", employee_id=emp.employee_id,
                    action="add_group", details={"group": group},
                )
            except Exception as e:
                errors.append(f"add_group({group}): {e}")

        console.print(f"  [green]Added to {len(target.okta_groups)} groups[/]")

        # 4. Provision downstream apps via SCIM
        provision_start = time.monotonic()
        for app_name, role in target.app_assignments.items():
            try:
                await self._scim.provision_user(
                    app_name, email=emp.email, first_name=emp.first_name,
                    last_name=emp.last_name, role=role, employee_id=emp.employee_id,
                )
                self._log.append(
                    event_id=event.event_id, event_type="join", employee_id=emp.employee_id,
                    action="provision_app", details={"app": app_name, "role": role},
                )
            except Exception as e:
                errors.append(f"provision({app_name}): {e}")
                self._log.append(
                    event_id=event.event_id, event_type="join", employee_id=emp.employee_id,
                    action="provision_app", result="failure",
                    error=str(e), details={"app": app_name},
                )

        provision_ms = (time.monotonic() - provision_start) * 1000
        total_ms = (time.monotonic() - start) * 1000

        console.print(f"  [green]Provisioned {len(target.app_assignments)} apps[/]")

        self._access_states[emp.employee_id] = target
        self._metrics.record(ProvisioningMetrics(
            event_id=event.event_id, event_type=EventType.JOIN, employee_id=emp.employee_id,
            time_to_provision_ms=provision_ms, errors=errors, total_duration_ms=total_ms,
        ))

        if errors:
            console.print(f"  [yellow]Completed with {len(errors)} error(s)[/]")
        else:
            console.print(f"  [green]Joiner complete[/] ({total_ms:.0f}ms)")

    async def _handle_move(self, event: HRISEvent) -> None:
        emp = event.employee
        errors: list[str] = []
        start = time.monotonic()

        # 1. Load current access state
        current = self._access_states.get(emp.employee_id)
        if current is None and event.previous_state:
            prev = event.previous_state
            current = self._rbac.resolve(prev.department, prev.title, prev.employee_id)

        if current is None:
            current = AccessState(employee_id=emp.employee_id)

        # 2. Resolve new target
        target = self._rbac.resolve(emp.department, emp.title, emp.employee_id)

        # 3. Compute diff
        diff = self._rbac.compute_diff(current, target)

        if not diff.has_changes:
            console.print("  [dim]No access changes required[/]")
            return

        self._log.append(
            event_id=event.event_id, event_type="move", employee_id=emp.employee_id,
            action="compute_diff", details={
                **_employee_meta(emp),
                "groups_to_add": diff.groups_to_add, "groups_to_remove": diff.groups_to_remove,
                "apps_to_provision": diff.apps_to_provision,
                "apps_to_deprovision": diff.apps_to_deprovision,
            },
        )

        okta_user_id = self._okta_user_ids.get(emp.employee_id)
        if not okta_user_id:
            okta_user_id = await self._okta.get_user_id(emp.email)
        if not okta_user_id:
            errors.append("Could not find Okta user ID")
            return

        # 4. Apply group changes
        for group in diff.groups_to_add:
            try:
                await self._okta.add_to_group(okta_user_id, group)
                self._log.append(
                    event_id=event.event_id, event_type="move", employee_id=emp.employee_id,
                    action="add_group", details={"group": group},
                )
            except Exception as e:
                errors.append(f"add_group({group}): {e}")

        for group in diff.groups_to_remove:
            try:
                await self._okta.remove_from_group(okta_user_id, group)
                self._log.append(
                    event_id=event.event_id, event_type="move", employee_id=emp.employee_id,
                    action="remove_group", details={"group": group},
                )
            except Exception as e:
                errors.append(f"remove_group({group}): {e}")

        # 5. Apply app changes
        provision_start = time.monotonic()
        for app_name, role in diff.apps_to_provision.items():
            try:
                await self._scim.provision_user(
                    app_name, email=emp.email, first_name=emp.first_name,
                    last_name=emp.last_name, role=role, employee_id=emp.employee_id,
                )
                self._log.append(
                    event_id=event.event_id, event_type="move", employee_id=emp.employee_id,
                    action="provision_app", details={"app": app_name, "role": role},
                )
            except Exception as e:
                errors.append(f"provision({app_name}): {e}")

        for app_name in diff.apps_to_deprovision:
            try:
                await self._scim.deprovision_user(app_name, email=emp.email)
                self._log.append(
                    event_id=event.event_id, event_type="move", employee_id=emp.employee_id,
                    action="deprovision_app", details={"app": app_name},
                )
            except Exception as e:
                errors.append(f"deprovision({app_name}): {e}")

        provision_ms = (time.monotonic() - provision_start) * 1000
        deprovision_ms = provision_ms if diff.apps_to_deprovision else 0
        total_ms = (time.monotonic() - start) * 1000

        self._access_states[emp.employee_id] = target
        self._metrics.record(ProvisioningMetrics(
            event_id=event.event_id, event_type=EventType.MOVE, employee_id=emp.employee_id,
            time_to_provision_ms=provision_ms, time_to_deprovision_ms=deprovision_ms,
            errors=errors, total_duration_ms=total_ms,
        ))

        console.print(
            f"  [green]Mover complete[/]: +{len(diff.groups_to_add)}/-{len(diff.groups_to_remove)} groups, "
            f"+{len(diff.apps_to_provision)}/-{len(diff.apps_to_deprovision)} apps ({total_ms:.0f}ms)"
        )

    async def _handle_leave(self, event: HRISEvent) -> None:
        emp = event.employee
        errors: list[str] = []
        start = time.monotonic()

        okta_user_id = self._okta_user_ids.get(emp.employee_id)
        if not okta_user_id:
            okta_user_id = await self._okta.get_user_id(emp.email)
        if not okta_user_id:
            errors.append("Could not find Okta user ID — user may not exist")
            console.print(f"  [red]Okta user not found for {emp.email}[/]")
            return

        access_state = self._access_states.get(
            emp.employee_id,
            self._rbac.resolve(emp.department, emp.title, emp.employee_id),
        )

        # 1. Disable Okta user
        try:
            await self._okta.disable_user(okta_user_id)
            self._log.append(
                event_id=event.event_id, event_type="leave", employee_id=emp.employee_id,
                action="disable_user",
                details={**_employee_meta(emp)},
            )
            console.print("  [green]Disabled Okta account[/]")
        except Exception as e:
            errors.append(f"disable_user: {e}")

        # 2. Revoke sessions
        try:
            await self._okta.revoke_sessions(okta_user_id)
            self._log.append(
                event_id=event.event_id, event_type="leave", employee_id=emp.employee_id,
                action="revoke_sessions",
            )
            console.print("  [green]Revoked all sessions[/]")
        except Exception as e:
            errors.append(f"revoke_sessions: {e}")

        # 3. Deprovision all apps via SCIM
        deprovision_start = time.monotonic()
        for app_name in access_state.app_assignments:
            try:
                await self._scim.deprovision_user(app_name, email=emp.email)
                self._log.append(
                    event_id=event.event_id, event_type="leave", employee_id=emp.employee_id,
                    action="deprovision_app", details={"app": app_name},
                )
            except Exception as e:
                errors.append(f"deprovision({app_name}): {e}")
                self._log.append(
                    event_id=event.event_id, event_type="leave", employee_id=emp.employee_id,
                    action="deprovision_app", result="failure",
                    error=str(e), details={"app": app_name},
                )
        deprovision_ms = (time.monotonic() - deprovision_start) * 1000

        console.print(f"  [green]Deprovisioned {len(access_state.app_assignments)} apps[/]")

        # 4. Remove from all groups
        for group in access_state.okta_groups:
            try:
                await self._okta.remove_from_group(okta_user_id, group)
                self._log.append(
                    event_id=event.event_id, event_type="leave", employee_id=emp.employee_id,
                    action="remove_group", details={"group": group},
                )
            except Exception as e:
                errors.append(f"remove_group({group}): {e}")

        console.print(f"  [green]Removed from {len(access_state.okta_groups)} groups[/]")

        total_ms = (time.monotonic() - start) * 1000

        # 5. Run post-deprovision audit (immediate in sim mode)
        try:
            audit_checker = AuditChecker(self._okta, self._scim, self._log)
            audit_result = await audit_checker.check(emp.employee_id, emp.email, access_state)

            if audit_result.passed:
                console.print("  [green]Post-deprovision audit: PASSED[/]")
            else:
                console.print("  [red]Post-deprovision audit: FAILED[/]")
                errors.append("Post-deprovision audit failed")
        except Exception as e:
            errors.append(f"audit_check: {e}")
            console.print(f"  [yellow]Audit check skipped: {e}[/]")

        # Cleanup state
        self._access_states.pop(emp.employee_id, None)
        self._okta_user_ids.pop(emp.employee_id, None)

        self._metrics.record(ProvisioningMetrics(
            event_id=event.event_id, event_type=EventType.LEAVE, employee_id=emp.employee_id,
            time_to_deprovision_ms=deprovision_ms, errors=errors, total_duration_ms=total_ms,
        ))

        if errors:
            console.print(f"  [yellow]Leaver complete with {len(errors)} error(s)[/] ({total_ms:.0f}ms)")
        else:
            console.print(f"  [green]Leaver complete[/] ({total_ms:.0f}ms)")
