"""Tests for post-deprovision audit checker."""

import pytest

from engine.audit_checker import AuditChecker
from engine.event_log import EventLog
from engine.models import AccessState
from engine.okta_client import SimulatedOktaClient
from engine.scim_provisioner import SCIMProvisioner


@pytest.fixture
def event_log(tmp_path):
    return EventLog(tmp_path / "test_audit.jsonl")


@pytest.fixture
def okta_client(event_log):
    return SimulatedOktaClient(event_log)


@pytest.fixture
def checker(okta_client, event_log):
    return AuditChecker(
        okta_client=okta_client,
        scim_provisioner=SCIMProvisioner(),
        event_log=event_log,
    )


class TestAuditPass:
    @pytest.mark.asyncio
    async def test_nonexistent_user_passes(self, checker):
        """A user that doesn't exist in Okta is considered deprovisioned."""
        state = AccessState(employee_id="EMP999", app_assignments={})
        result = await checker.check("EMP999", "nobody@example.com", state)
        assert result.okta_disabled is True
        assert result.sessions_revoked is True

    @pytest.mark.asyncio
    async def test_disabled_user_passes(self, checker, okta_client):
        """A properly disabled user with no apps passes audit."""
        okta_id = await okta_client.create_user("EMP100", "test@example.com", "Test", "User")
        await okta_client.disable_user(okta_id)

        state = AccessState(employee_id="EMP100", app_assignments={})
        result = await checker.check("EMP100", "test@example.com", state)
        assert result.okta_disabled is True
        assert result.passed is True


class TestAuditFail:
    @pytest.mark.asyncio
    async def test_active_user_fails(self, checker, okta_client):
        """An active (not disabled) user fails audit."""
        await okta_client.create_user("EMP100", "test@example.com", "Test", "User")

        state = AccessState(employee_id="EMP100", app_assignments={})
        result = await checker.check("EMP100", "test@example.com", state)
        assert result.okta_disabled is False
        assert result.passed is False
