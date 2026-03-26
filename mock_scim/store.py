"""In-memory SCIM user and group store shared across all mock app endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _scim_error(status: int, detail: str, scim_type: str | None = None) -> dict[str, Any]:
    """RFC 7644 §3.12 error response."""
    err: dict[str, Any] = {
        "schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"],
        "detail": detail,
        "status": str(status),
    }
    if scim_type:
        err["scimType"] = scim_type
    return err


class SCIMStore:
    """Per-app in-memory store for SCIM Users and Groups."""

    def __init__(self, app_name: str, base_path: str) -> None:
        self.app_name = app_name
        self._base_path = base_path  # e.g. "/slack/scim/v2"
        self._users: dict[str, dict[str, Any]] = {}   # scim_id -> user resource
        self._groups: dict[str, dict[str, Any]] = {}   # scim_id -> group resource

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    def create_user(self, resource: dict[str, Any]) -> dict[str, Any]:
        # RFC 7644 §3.3 — uniqueness on userName
        username = resource.get("userName")
        if username and self.find_user_by_username(username):
            raise SCIMConflictError(f"User with userName '{username}' already exists")

        scim_id = str(uuid.uuid4())
        resource["id"] = scim_id
        resource.setdefault("active", True)
        resource["meta"] = {
            "resourceType": "User",
            "created": _now_iso(),
            "lastModified": _now_iso(),
            "location": f"{self._base_path}/Users/{scim_id}",
        }
        self._users[scim_id] = resource
        return resource

    def get_user(self, scim_id: str) -> dict[str, Any] | None:
        return self._users.get(scim_id)

    def find_user_by_username(self, username: str) -> dict[str, Any] | None:
        for user in self._users.values():
            if user.get("userName") == username:
                return user
        return None

    def find_user_by_external_id(self, external_id: str) -> dict[str, Any] | None:
        for user in self._users.values():
            if user.get("externalId") == external_id:
                return user
        return None

    def filter_users(self, filter_str: str) -> list[dict[str, Any]]:
        """Basic SCIM filter: userName eq "x", externalId eq "x", active eq true/false."""
        if 'userName eq' in filter_str:
            value = filter_str.split('"')[1] if '"' in filter_str else ""
            user = self.find_user_by_username(value)
            return [user] if user else []
        if 'externalId eq' in filter_str:
            value = filter_str.split('"')[1] if '"' in filter_str else ""
            user = self.find_user_by_external_id(value)
            return [user] if user else []
        if 'active eq' in filter_str:
            active_val = 'true' in filter_str.lower()
            return [u for u in self._users.values() if u.get("active") == active_val]
        return list(self._users.values())

    def replace_user(self, scim_id: str, resource: dict[str, Any]) -> dict[str, Any] | None:
        """PUT — full replace (RFC 7644 §3.5.1)."""
        user = self._users.get(scim_id)
        if user is None:
            return None
        # Preserve id and meta
        resource["id"] = scim_id
        resource["meta"] = user["meta"]
        resource["meta"]["lastModified"] = _now_iso()
        self._users[scim_id] = resource
        return resource

    def patch_user(self, scim_id: str, operations: list[dict[str, Any]]) -> dict[str, Any] | None:
        """PATCH — partial update (RFC 7644 §3.5.2)."""
        user = self._users.get(scim_id)
        if user is None:
            return None
        for op in operations:
            op_type = op.get("op", "").lower()
            path = op.get("path")
            value = op.get("value")
            if op_type == "replace":
                if path:
                    user[path] = value
                elif isinstance(value, dict):
                    user.update(value)
            elif op_type == "add":
                if path:
                    existing = user.get(path)
                    if isinstance(existing, list) and isinstance(value, list):
                        existing.extend(value)
                    else:
                        user[path] = value
                elif isinstance(value, dict):
                    user.update(value)
            elif op_type == "remove":
                if path and path in user:
                    del user[path]
        user["meta"]["lastModified"] = _now_iso()
        return user

    def delete_user(self, scim_id: str) -> bool:
        # Also remove from any groups
        for group in self._groups.values():
            members = group.get("members", [])
            group["members"] = [m for m in members if m.get("value") != scim_id]
        return self._users.pop(scim_id, None) is not None

    def list_users(self, start_index: int = 1, count: int = 100) -> dict[str, Any]:
        all_users = list(self._users.values())
        page = all_users[start_index - 1: start_index - 1 + count]
        return {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            "totalResults": len(all_users),
            "startIndex": start_index,
            "itemsPerPage": len(page),
            "Resources": page,
        }

    def user_count(self) -> int:
        return len(self._users)

    # ------------------------------------------------------------------
    # Groups
    # ------------------------------------------------------------------

    def create_group(self, resource: dict[str, Any]) -> dict[str, Any]:
        display_name = resource.get("displayName")
        if display_name and self.find_group_by_name(display_name):
            raise SCIMConflictError(f"Group with displayName '{display_name}' already exists")

        scim_id = str(uuid.uuid4())
        resource["id"] = scim_id
        resource.setdefault("members", [])
        resource["meta"] = {
            "resourceType": "Group",
            "created": _now_iso(),
            "lastModified": _now_iso(),
            "location": f"{self._base_path}/Groups/{scim_id}",
        }
        self._groups[scim_id] = resource
        return resource

    def get_group(self, scim_id: str) -> dict[str, Any] | None:
        return self._groups.get(scim_id)

    def find_group_by_name(self, display_name: str) -> dict[str, Any] | None:
        for group in self._groups.values():
            if group.get("displayName") == display_name:
                return group
        return None

    def filter_groups(self, filter_str: str) -> list[dict[str, Any]]:
        if 'displayName eq' in filter_str:
            value = filter_str.split('"')[1] if '"' in filter_str else ""
            group = self.find_group_by_name(value)
            return [group] if group else []
        return list(self._groups.values())

    def patch_group(self, scim_id: str, operations: list[dict[str, Any]]) -> dict[str, Any] | None:
        """PATCH on Groups — handles member add/remove (RFC 7644 §3.5.2)."""
        group = self._groups.get(scim_id)
        if group is None:
            return None

        for op in operations:
            op_type = op.get("op", "").lower()
            path = op.get("path", "")
            value = op.get("value")

            if op_type == "add" and "members" in path:
                members = group.setdefault("members", [])
                new_members = value if isinstance(value, list) else [value]
                existing_ids = {m.get("value") for m in members}
                for member in new_members:
                    if member.get("value") not in existing_ids:
                        members.append(member)
            elif op_type == "remove" and "members" in path:
                if value:
                    remove_ids = {m.get("value") for m in (value if isinstance(value, list) else [value])}
                    group["members"] = [m for m in group.get("members", []) if m.get("value") not in remove_ids]
                elif "[" in path:
                    # Handle path like 'members[value eq "xxx"]'
                    try:
                        eq_value = path.split('"')[1]
                        group["members"] = [m for m in group.get("members", []) if m.get("value") != eq_value]
                    except (IndexError, KeyError):
                        pass
            elif op_type == "replace":
                if path:
                    group[path] = value
                elif isinstance(value, dict):
                    group.update(value)

        group["meta"]["lastModified"] = _now_iso()
        return group

    def delete_group(self, scim_id: str) -> bool:
        return self._groups.pop(scim_id, None) is not None

    def list_groups(self, start_index: int = 1, count: int = 100) -> dict[str, Any]:
        all_groups = list(self._groups.values())
        page = all_groups[start_index - 1: start_index - 1 + count]
        return {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            "totalResults": len(all_groups),
            "startIndex": start_index,
            "itemsPerPage": len(page),
            "Resources": page,
        }

    def group_count(self) -> int:
        return len(self._groups)


class SCIMConflictError(Exception):
    """Raised when a uniqueness constraint is violated."""
