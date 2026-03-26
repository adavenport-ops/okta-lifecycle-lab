"""Provisioning metrics collector."""

from __future__ import annotations

from engine.models import ProvisioningMetrics


class MetricsCollector:
    def __init__(self) -> None:
        self._metrics: list[ProvisioningMetrics] = []

    def record(self, metrics: ProvisioningMetrics) -> None:
        self._metrics.append(metrics)

    @property
    def all_metrics(self) -> list[ProvisioningMetrics]:
        return list(self._metrics)

    def summary(self) -> dict:
        if not self._metrics:
            return {"total_events": 0}

        total = len(self._metrics)
        by_type = {}
        total_errors = 0
        total_provision_ms = 0.0
        total_deprovision_ms = 0.0

        for m in self._metrics:
            t = m.event_type.value
            by_type[t] = by_type.get(t, 0) + 1
            total_errors += len(m.errors)
            total_provision_ms += m.time_to_provision_ms
            total_deprovision_ms += m.time_to_deprovision_ms

        return {
            "total_events": total,
            "by_type": by_type,
            "total_errors": total_errors,
            "avg_provision_ms": round(total_provision_ms / total, 1),
            "avg_deprovision_ms": round(total_deprovision_ms / total, 1) if total_deprovision_ms else 0,
        }
