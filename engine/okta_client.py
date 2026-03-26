"""Okta client — simulated and live implementations."""

from __future__ import annotations

import asyncio
import random
import time
from abc import ABC, abstractmethod
from typing import Any

import httpx

from engine.event_log import EventLog


class OktaClient(ABC):
    """Abstract base class for Okta operations."""

    @abstractmethod
    async def create_user(self, employee_id: str, email: str, first_name: str, last_name: str) -> str:
        """Create an Okta user. Returns the Okta user ID."""
        ...

    @abstractmethod
    async def disable_user(self, okta_user_id: str) -> None:
        ...

    @abstractmethod
    async def add_to_group(self, okta_user_id: str, group_name: str) -> None:
        ...

    @abstractmethod
    async def remove_from_group(self, okta_user_id: str, group_name: str) -> None:
        ...

    @abstractmethod
    async def revoke_sessions(self, okta_user_id: str) -> None:
        ...

    @abstractmethod
    async def list_user_groups(self, okta_user_id: str) -> list[str]:
        ...

    @abstractmethod
    async def get_user_id(self, email: str) -> str | None:
        ...


class SimulatedOktaClient(OktaClient):
    """In-memory simulated Okta client for demo/testing."""

    def __init__(self, event_log: EventLog | None = None) -> None:
        self._users: dict[str, dict[str, Any]] = {}  # okta_id -> user data
        self._groups: dict[str, set[str]] = {}  # group_name -> set of okta_ids
        self._email_to_id: dict[str, str] = {}
        self._disabled: set[str] = set()
        self._event_log = event_log
        self._next_id = 1000

    async def _simulate_delay(self) -> None:
        delay = random.uniform(0.05, 0.2)
        await asyncio.sleep(delay)

    async def create_user(self, employee_id: str, email: str, first_name: str, last_name: str) -> str:
        await self._simulate_delay()
        okta_id = f"00u{self._next_id:08d}"
        self._next_id += 1
        self._users[okta_id] = {
            "employee_id": employee_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "status": "ACTIVE",
        }
        self._email_to_id[email] = okta_id
        return okta_id

    async def disable_user(self, okta_user_id: str) -> None:
        await self._simulate_delay()
        if okta_user_id in self._users:
            self._users[okta_user_id]["status"] = "DEPROVISIONED"
            self._disabled.add(okta_user_id)

    async def add_to_group(self, okta_user_id: str, group_name: str) -> None:
        await self._simulate_delay()
        if group_name not in self._groups:
            self._groups[group_name] = set()
        self._groups[group_name].add(okta_user_id)

    async def remove_from_group(self, okta_user_id: str, group_name: str) -> None:
        await self._simulate_delay()
        if group_name in self._groups:
            self._groups[group_name].discard(okta_user_id)

    async def revoke_sessions(self, okta_user_id: str) -> None:
        await self._simulate_delay()

    async def list_user_groups(self, okta_user_id: str) -> list[str]:
        await self._simulate_delay()
        return [g for g, members in self._groups.items() if okta_user_id in members]

    async def get_user_id(self, email: str) -> str | None:
        await self._simulate_delay()
        return self._email_to_id.get(email)

    def is_disabled(self, okta_user_id: str) -> bool:
        return okta_user_id in self._disabled


class LiveOktaClient(OktaClient):
    """Real Okta Management API client."""

    def __init__(self, domain: str, api_token: str, event_log: EventLog | None = None) -> None:
        self._domain = domain.rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=f"{self._domain}/api/v1",
            headers={
                "Authorization": f"SSWS {api_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=30.0,
        )
        self._event_log = event_log
        self._group_cache: dict[str, str] = {}  # group_name -> group_id

    async def _get_group_id(self, group_name: str) -> str:
        if group_name in self._group_cache:
            return self._group_cache[group_name]
        resp = await self._client.get("/groups", params={"q": group_name})
        resp.raise_for_status()
        groups = resp.json()
        for g in groups:
            if g["profile"]["name"] == group_name:
                self._group_cache[group_name] = g["id"]
                return g["id"]
        raise ValueError(f"Group not found: {group_name}")

    async def create_user(self, employee_id: str, email: str, first_name: str, last_name: str) -> str:
        resp = await self._client.post(
            "/users",
            params={"activate": "true"},
            json={
                "profile": {
                    "firstName": first_name,
                    "lastName": last_name,
                    "email": email,
                    "login": email,
                    "employeeNumber": employee_id,
                },
            },
        )
        resp.raise_for_status()
        return resp.json()["id"]

    async def disable_user(self, okta_user_id: str) -> None:
        resp = await self._client.post(f"/users/{okta_user_id}/lifecycle/deactivate")
        resp.raise_for_status()

    async def add_to_group(self, okta_user_id: str, group_name: str) -> None:
        group_id = await self._get_group_id(group_name)
        resp = await self._client.put(f"/groups/{group_id}/users/{okta_user_id}")
        resp.raise_for_status()

    async def remove_from_group(self, okta_user_id: str, group_name: str) -> None:
        group_id = await self._get_group_id(group_name)
        resp = await self._client.delete(f"/groups/{group_id}/users/{okta_user_id}")
        resp.raise_for_status()

    async def revoke_sessions(self, okta_user_id: str) -> None:
        resp = await self._client.delete(f"/users/{okta_user_id}/sessions")
        resp.raise_for_status()

    async def list_user_groups(self, okta_user_id: str) -> list[str]:
        resp = await self._client.get(f"/users/{okta_user_id}/groups")
        resp.raise_for_status()
        return [g["profile"]["name"] for g in resp.json()]

    async def get_user_id(self, email: str) -> str | None:
        resp = await self._client.get(f"/users/{email}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()["id"]
