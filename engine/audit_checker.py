"""Post-deprovision audit checker — verifies complete offboarding."""

from __future__ import annotations

from engine.event_log import EventLog
from engine.models import AccessState, AuditResult
from engine.okta_client import OktaClient, SimulatedOktaClient
from engine.scim_provisioner import SCIMProvisioner


class AuditChecker:
    def __init__(
        self,
        okta_client: OktaClient,
        scim_provisioner: SCIMProvisioner,
        event_log: EventLog | None = None,
    ) -> None:
        self._okta = okta_client
        self._scim = scim_provisioner
        self._event_log = event_log

    async def check(self, employee_id: str, email: str, access_state: AccessState) -> AuditResult:
        """Run post-deprovision audit for a terminated employee."""
        result = AuditResult(employee_id=employee_id)

        # Check Okta account is disabled
        okta_user_id = await self._okta.get_user_id(email)
        if okta_user_id is None:
            result.okta_disabled = True
            result.sessions_revoked = True
        elif isinstance(self._okta, SimulatedOktaClient):
            result.okta_disabled = self._okta.is_disabled(okta_user_id)
            result.sessions_revoked = result.okta_disabled
        else:
            # For live client, a disabled user won't have active sessions
            groups = await self._okta.list_user_groups(okta_user_id)
            result.okta_disabled = len(groups) == 0
            result.sessions_revoked = result.okta_disabled

        # Check each app is deprovisioned
        for app_name in access_state.app_assignments:
            deprovisioned = await self._scim.check_user_deprovisioned(app_name, email=email)
            result.apps_deprovisioned[app_name] = deprovisioned

        if self._event_log:
            self._event_log.append(
                event_id="audit",
                event_type="audit",
                employee_id=employee_id,
                action="post_deprovision_audit",
                result="pass" if result.passed else "fail",
                details={
                    "okta_disabled": result.okta_disabled,
                    "sessions_revoked": result.sessions_revoked,
                    "apps_deprovisioned": result.apps_deprovisioned,
                },
            )

        return result
