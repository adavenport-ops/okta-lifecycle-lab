"""Core Pydantic models for the lifecycle engine."""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    TERMINATED = "terminated"


class EventType(str, Enum):
    JOIN = "join"
    MOVE = "move"
    LEAVE = "leave"


class Employee(BaseModel):
    employee_id: str
    email: str
    first_name: str
    last_name: str
    department: str
    title: str
    manager_email: str | None = None
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    start_date: date
    end_date: date | None = None

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class HRISEvent(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    event_type: EventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    employee: Employee
    previous_state: Employee | None = None


class AccessState(BaseModel):
    employee_id: str
    okta_groups: list[str] = Field(default_factory=list)
    app_assignments: dict[str, str] = Field(default_factory=dict)
    provisioned_at: datetime | None = None


class AccessDiff(BaseModel):
    employee_id: str
    groups_to_add: list[str] = Field(default_factory=list)
    groups_to_remove: list[str] = Field(default_factory=list)
    apps_to_provision: dict[str, str] = Field(default_factory=dict)
    apps_to_deprovision: list[str] = Field(default_factory=list)

    @property
    def has_changes(self) -> bool:
        return bool(
            self.groups_to_add
            or self.groups_to_remove
            or self.apps_to_provision
            or self.apps_to_deprovision
        )


class AuditResult(BaseModel):
    employee_id: str
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    okta_disabled: bool = False
    sessions_revoked: bool = False
    apps_deprovisioned: dict[str, bool] = Field(default_factory=dict)

    @property
    def passed(self) -> bool:
        return (
            self.okta_disabled
            and self.sessions_revoked
            and all(self.apps_deprovisioned.values())
        )


class ProvisioningMetrics(BaseModel):
    event_id: UUID
    event_type: EventType
    employee_id: str
    time_to_provision_ms: float = 0.0
    time_to_deprovision_ms: float = 0.0
    errors: list[str] = Field(default_factory=list)
    total_duration_ms: float = 0.0
