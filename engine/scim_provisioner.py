"""SCIM provisioner — provisions/deprovisions users in downstream apps."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import httpx
import yaml

_DEFAULT_REGISTRY_PATH = Path(__file__).resolve().parent.parent / "config" / "scim_app_registry.yml"


class SCIMProvisioner:
    def __init__(self, registry_path: Path | str = _DEFAULT_REGISTRY_PATH) -> None:
        self._registry_path = Path(registry_path)
        self._apps: dict[str, dict[str, Any]] = {}
        self._client = httpx.AsyncClient(timeout=15.0)
        self._load()

    def _load(self) -> None:
        with open(self._registry_path) as f:
            data = yaml.safe_load(f)
        self._apps = data.get("apps", {})

    def get_endpoint(self, app_name: str) -> str | None:
        app = self._apps.get(app_name)
        return app["scim_endpoint"] if app else None

    async def provision_user(
        self,
        app_name: str,
        *,
        email: str,
        first_name: str,
        last_name: str,
        role: str,
        employee_id: str,
    ) -> dict[str, Any]:
        """Create or update a user in a downstream app via SCIM."""
        endpoint = self.get_endpoint(app_name)
        if not endpoint:
            raise ValueError(f"Unknown app: {app_name}")

        scim_user = {
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
            "userName": email,
            "name": {"givenName": first_name, "familyName": last_name},
            "emails": [{"value": email, "primary": True}],
            "active": True,
            "externalId": employee_id,
            "roles": [{"value": role}],
        }

        resp = await self._client.post(f"{endpoint}/Users", json=scim_user)
        resp.raise_for_status()
        return resp.json()

    async def deprovision_user(self, app_name: str, *, email: str) -> bool:
        """Deactivate a user in a downstream app via SCIM PATCH."""
        endpoint = self.get_endpoint(app_name)
        if not endpoint:
            raise ValueError(f"Unknown app: {app_name}")

        # First find the user
        resp = await self._client.get(
            f"{endpoint}/Users",
            params={"filter": f'userName eq "{email}"'},
        )
        resp.raise_for_status()
        resources = resp.json().get("Resources", [])
        if not resources:
            return False

        user_id = resources[0]["id"]

        # SCIM PATCH to deactivate
        patch_body = {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [{"op": "replace", "value": {"active": False}}],
        }
        resp = await self._client.patch(f"{endpoint}/Users/{user_id}", json=patch_body)
        resp.raise_for_status()
        return True

    async def check_user_deprovisioned(self, app_name: str, *, email: str) -> bool:
        """Check if a user is deprovisioned in a downstream app."""
        endpoint = self.get_endpoint(app_name)
        if not endpoint:
            return False

        resp = await self._client.get(
            f"{endpoint}/Users",
            params={"filter": f'userName eq "{email}"'},
        )
        resp.raise_for_status()
        resources = resp.json().get("Resources", [])
        if not resources:
            return True  # User doesn't exist = deprovisioned
        return not resources[0].get("active", True)
