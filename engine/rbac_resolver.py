"""RBAC resolver — maps department + title to target access state."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import yaml

from engine.models import AccessDiff, AccessState

_DEFAULT_RULES_PATH = Path(__file__).resolve().parent.parent / "config" / "rbac_rules.yml"


class RBACResolver:
    def __init__(self, rules_path: Path | str = _DEFAULT_RULES_PATH) -> None:
        self._rules_path = Path(rules_path)
        self._rules: dict = {}
        self._load()

    def _load(self) -> None:
        with open(self._rules_path) as f:
            self._rules = yaml.safe_load(f)

    def resolve(self, department: str, title: str, employee_id: str) -> AccessState:
        """Resolve target access state for a department + title combination."""
        dept_rules = self._rules.get("departments", {}).get(department)
        if dept_rules is None:
            return AccessState(employee_id=employee_id)

        groups = list(dept_rules.get("okta_groups", []))
        apps = dict(dept_rules.get("apps", {}))

        title_overrides = dept_rules.get("titles", {}).get(title)
        if title_overrides:
            groups.extend(title_overrides.get("additional_groups", []))
            apps.update(title_overrides.get("additional_apps", {}))

        return AccessState(
            employee_id=employee_id,
            okta_groups=sorted(set(groups)),
            app_assignments=apps,
            provisioned_at=datetime.utcnow(),
        )

    def compute_diff(self, current: AccessState, target: AccessState) -> AccessDiff:
        """Compute the diff between current and target access states."""
        current_groups = set(current.okta_groups)
        target_groups = set(target.okta_groups)

        current_apps = set(current.app_assignments.keys())
        target_apps = set(target.app_assignments.keys())

        # For apps that exist in both, check if the role changed — reprovision if so
        apps_to_provision: dict[str, str] = {}
        for app in target_apps:
            if app not in current_apps:
                apps_to_provision[app] = target.app_assignments[app]
            elif current.app_assignments[app] != target.app_assignments[app]:
                apps_to_provision[app] = target.app_assignments[app]

        return AccessDiff(
            employee_id=current.employee_id,
            groups_to_add=sorted(target_groups - current_groups),
            groups_to_remove=sorted(current_groups - target_groups),
            apps_to_provision=apps_to_provision,
            apps_to_deprovision=sorted(current_apps - target_apps),
        )
