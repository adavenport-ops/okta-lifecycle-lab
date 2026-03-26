"""Append-only JSON event log for audit trail and dashboard SSE."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

_DEFAULT_LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "event_log.jsonl"


class _UUIDEncoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, UUID):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


class EventLog:
    def __init__(self, log_path: Path | str = _DEFAULT_LOG_PATH) -> None:
        self._path = Path(log_path)
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def append(
        self,
        *,
        event_id: UUID | str,
        event_type: str,
        employee_id: str,
        action: str,
        result: str = "success",
        error: str | None = None,
        duration_ms: float = 0.0,
        details: dict[str, Any] | None = None,
    ) -> None:
        entry: dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_id": str(event_id),
            "event_type": event_type,
            "employee_id": employee_id,
            "action": action,
            "result": result,
            "duration_ms": duration_ms,
        }
        if error:
            entry["error"] = error
        if details:
            entry["details"] = details

        with open(self._path, "a") as f:
            f.write(json.dumps(entry, cls=_UUIDEncoder) + "\n")

    def read_all(self) -> list[dict[str, Any]]:
        if not self._path.exists():
            return []
        entries = []
        with open(self._path) as f:
            for line in f:
                line = line.strip()
                if line:
                    entries.append(json.loads(line))
        return entries
