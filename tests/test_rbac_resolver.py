"""Tests for RBAC resolver — rule loading, diff computation, title overrides."""

import pytest

from engine.models import AccessState
from engine.rbac_resolver import RBACResolver


@pytest.fixture
def resolver() -> RBACResolver:
    return RBACResolver()


class TestResolve:
    def test_engineering_base(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("engineering", "Software Engineer", "EMP001")
        assert "eng-all" in state.okta_groups
        assert "github-org-members" in state.okta_groups
        assert state.app_assignments["github"] == "developer"
        assert state.app_assignments["slack"] == "member"
        assert state.app_assignments["zoom"] == "licensed"

    def test_engineering_senior_title_override(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("engineering", "Senior Engineer", "EMP001")
        assert "eng-senior" in state.okta_groups
        assert "on-call-rotation" in state.okta_groups
        assert state.app_assignments["github"] == "maintainer"  # overridden from developer

    def test_engineering_manager_title_override(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("engineering", "Engineering Manager", "EMP001")
        assert "eng-leads" in state.okta_groups
        assert "people-managers" in state.okta_groups
        assert state.app_assignments["github"] == "admin"

    def test_sales_base(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("sales", "Sales Rep", "EMP010")
        assert "sales-all" in state.okta_groups
        assert state.app_assignments["salesforce"] == "standard_user"
        assert state.app_assignments["slack"] == "member"

    def test_unknown_department(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("nonexistent", "Some Title", "EMP999")
        assert state.okta_groups == []
        assert state.app_assignments == {}

    def test_unknown_title_uses_base(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("engineering", "Intern", "EMP999")
        assert "eng-all" in state.okta_groups
        assert state.app_assignments["github"] == "developer"
        assert "eng-senior" not in state.okta_groups

    def test_product_vp(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("product", "VP Product", "EMP007")
        assert "product-all" in state.okta_groups
        assert "executive-team" in state.okta_groups
        assert state.app_assignments["figma"] == "admin"

    def test_it_security_engineer(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("it", "Security Engineer", "EMP008")
        assert "it-all" in state.okta_groups
        assert "okta-admins" in state.okta_groups
        assert "security-team" in state.okta_groups
        assert state.app_assignments["google_workspace"] == "admin"


class TestComputeDiff:
    def test_no_changes(self, resolver: RBACResolver) -> None:
        state = resolver.resolve("engineering", "Software Engineer", "EMP001")
        diff = resolver.compute_diff(state, state)
        assert not diff.has_changes

    def test_promotion_within_department(self, resolver: RBACResolver) -> None:
        """Engineer promoted to Senior Engineer — gains groups, role upgrade."""
        current = resolver.resolve("engineering", "Software Engineer", "EMP001")
        target = resolver.resolve("engineering", "Senior Engineer", "EMP001")
        diff = resolver.compute_diff(current, target)

        assert "eng-senior" in diff.groups_to_add
        assert "on-call-rotation" in diff.groups_to_add
        assert diff.groups_to_remove == []
        assert diff.apps_to_provision.get("github") == "maintainer"  # role upgrade
        assert diff.apps_to_deprovision == []

    def test_department_change(self, resolver: RBACResolver) -> None:
        """Marketing Content Specialist moves to Engineering."""
        current = resolver.resolve("marketing", "Content Specialist", "EMP019")
        target = resolver.resolve("engineering", "Software Engineer", "EMP019")
        diff = resolver.compute_diff(current, target)

        assert "eng-all" in diff.groups_to_add
        assert "github-org-members" in diff.groups_to_add
        assert "marketing-all" in diff.groups_to_remove
        assert "github" in diff.apps_to_provision
        assert "hubspot" in diff.apps_to_deprovision

    def test_leave_removes_everything(self, resolver: RBACResolver) -> None:
        """Simulating what a leaver diff looks like."""
        current = resolver.resolve("engineering", "Senior Engineer", "EMP001")
        target = AccessState(employee_id="EMP001")
        diff = resolver.compute_diff(current, target)

        assert set(diff.groups_to_remove) == set(current.okta_groups)
        assert set(diff.apps_to_deprovision) == set(current.app_assignments.keys())
        assert diff.groups_to_add == []
        assert diff.apps_to_provision == {}
