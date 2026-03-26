"""Tests for event router — joiner/mover/leaver flows with simulated client."""

import pytest

from engine.event_log import EventLog
from engine.event_router import EventRouter
from engine.metrics import MetricsCollector
from engine.models import Employee, EmployeeStatus, EventType, HRISEvent
from engine.okta_client import SimulatedOktaClient
from engine.rbac_resolver import RBACResolver
from engine.scim_provisioner import SCIMProvisioner


@pytest.fixture
def event_log(tmp_path):
    return EventLog(tmp_path / "test_events.jsonl")


@pytest.fixture
def okta_client(event_log):
    return SimulatedOktaClient(event_log)


@pytest.fixture
def router(okta_client, event_log):
    return EventRouter(
        okta_client=okta_client,
        rbac_resolver=RBACResolver(),
        scim_provisioner=SCIMProvisioner(),
        event_log=event_log,
        metrics_collector=MetricsCollector(),
    )


def _make_employee(**overrides) -> Employee:
    defaults = {
        "employee_id": "EMP100",
        "email": "test.user@example.com",
        "first_name": "Test",
        "last_name": "User",
        "department": "engineering",
        "title": "Software Engineer",
        "manager_email": "manager@example.com",
        "status": "active",
        "start_date": "2026-03-25",
    }
    defaults.update(overrides)
    return Employee(**defaults)


class TestJoiner:
    @pytest.mark.asyncio
    async def test_joiner_creates_user_and_provisions(self, router, okta_client):
        emp = _make_employee()
        event = HRISEvent(event_type=EventType.JOIN, employee=emp)

        await router.process_event(event)

        # Okta user was created
        okta_id = await okta_client.get_user_id(emp.email)
        assert okta_id is not None

        # User was added to groups
        groups = await okta_client.list_user_groups(okta_id)
        assert "eng-all" in groups
        assert "github-org-members" in groups

        # Metrics were recorded
        assert len(router._metrics.all_metrics) == 1
        assert router._metrics.all_metrics[0].event_type == EventType.JOIN

    @pytest.mark.asyncio
    async def test_joiner_with_title_override(self, router, okta_client):
        emp = _make_employee(title="Senior Engineer")
        event = HRISEvent(event_type=EventType.JOIN, employee=emp)

        await router.process_event(event)

        okta_id = await okta_client.get_user_id(emp.email)
        groups = await okta_client.list_user_groups(okta_id)
        assert "eng-senior" in groups
        assert "on-call-rotation" in groups


class TestMover:
    @pytest.mark.asyncio
    async def test_mover_applies_diff(self, router, okta_client):
        # First, join as marketing content specialist
        emp_before = _make_employee(
            department="marketing", title="Content Specialist",
        )
        join_event = HRISEvent(event_type=EventType.JOIN, employee=emp_before)
        await router.process_event(join_event)

        # Now move to engineering
        emp_after = _make_employee(department="engineering", title="Software Engineer")
        move_event = HRISEvent(
            event_type=EventType.MOVE,
            employee=emp_after,
            previous_state=emp_before,
        )
        await router.process_event(move_event)

        okta_id = await okta_client.get_user_id(emp_after.email)
        groups = await okta_client.list_user_groups(okta_id)
        assert "eng-all" in groups
        assert "marketing-all" not in groups


class TestLeaver:
    @pytest.mark.asyncio
    async def test_leaver_disables_and_deprovisions(self, router, okta_client):
        # First join
        emp = _make_employee()
        join_event = HRISEvent(event_type=EventType.JOIN, employee=emp)
        await router.process_event(join_event)

        okta_id = await okta_client.get_user_id(emp.email)
        assert okta_id is not None
        assert not okta_client.is_disabled(okta_id)

        # Now leave
        emp_leaving = _make_employee(status="terminated", end_date="2026-03-25")
        leave_event = HRISEvent(event_type=EventType.LEAVE, employee=emp_leaving)
        await router.process_event(leave_event)

        # Okta user is disabled
        assert okta_client.is_disabled(okta_id)

        # Groups should be removed
        groups = await okta_client.list_user_groups(okta_id)
        assert groups == []

        # Metrics recorded for both events
        assert len(router._metrics.all_metrics) == 2
