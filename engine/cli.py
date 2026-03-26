"""Typer CLI for the lifecycle lab."""

from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from engine.event_log import EventLog
from engine.event_router import EventRouter
from engine.metrics import MetricsCollector
from engine.models import Employee, EmployeeStatus, EventType, HRISEvent
from engine.okta_client import LiveOktaClient, SimulatedOktaClient
from engine.rbac_resolver import RBACResolver
from engine.scim_provisioner import SCIMProvisioner

app = typer.Typer(name="lifecycle-lab", help="Okta Identity Lifecycle Automation Lab")
console = Console()

_CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
_SAMPLE_DATA = _CONFIG_DIR / "sample_hris_data.json"


def _load_sample_events(
    feed_path: Path | None = None,
    event_type_filter: str | None = None,
) -> list[HRISEvent]:
    """Load HRIS events from sample data or a custom feed."""
    path = feed_path or _SAMPLE_DATA
    with open(path) as f:
        data = json.load(f)

    events: list[HRISEvent] = []
    for emp_data in data["employees"]:
        previous_dept = emp_data.pop("_previous_department", None)
        previous_title = emp_data.pop("_previous_title", None)
        employee = Employee(**emp_data)

        if employee.status == EmployeeStatus.TERMINATED:
            event_type = EventType.LEAVE
        elif previous_dept or previous_title:
            event_type = EventType.MOVE
        else:
            event_type = EventType.JOIN

        if event_type_filter and event_type.value != event_type_filter:
            continue

        previous_state = None
        if event_type == EventType.MOVE and (previous_dept or previous_title):
            previous_state = employee.model_copy(update={
                "department": previous_dept or employee.department,
                "title": previous_title or employee.title,
            })

        events.append(HRISEvent(
            event_type=event_type,
            timestamp=datetime.utcnow(),
            employee=employee,
            previous_state=previous_state,
        ))

    return events


def _build_router(mode: str) -> EventRouter:
    event_log = EventLog()

    if mode == "live":
        domain = os.environ.get("OKTA_DOMAIN")
        token = os.environ.get("OKTA_API_TOKEN")
        if not domain or not token:
            console.print("[red]OKTA_DOMAIN and OKTA_API_TOKEN must be set for live mode[/]")
            raise typer.Exit(1)
        okta_client = LiveOktaClient(domain, token, event_log)
    else:
        okta_client = SimulatedOktaClient(event_log)

    return EventRouter(
        okta_client=okta_client,
        rbac_resolver=RBACResolver(),
        scim_provisioner=SCIMProvisioner(),
        event_log=event_log,
        metrics_collector=MetricsCollector(),
    )


@app.command()
def run(
    mode: str = typer.Option("sim", help="Mode: 'sim' (simulated) or 'live' (real Okta tenant)"),
    event_type: str | None = typer.Option(None, "--event-type", help="Filter: join, move, or leave"),
    feed: Path | None = typer.Option(None, help="Path to custom HRIS feed JSON"),
    serve: bool = typer.Option(False, "--serve", help="Stay alive after processing (for Docker)"),
) -> None:
    """Process HRIS lifecycle events."""
    console.print(f"[bold]Okta Lifecycle Lab[/] — mode: [cyan]{mode}[/]")
    console.print()

    events = _load_sample_events(feed, event_type)
    console.print(f"Loaded [bold]{len(events)}[/] events")
    console.print()

    router = _build_router(mode)

    async def _run() -> None:
        for event in events:
            await router.process_event(event)
            console.print()

        # Print summary
        summary = router._metrics.summary()
        console.print("[bold]Summary[/]")
        table = Table()
        table.add_column("Metric", style="bold")
        table.add_column("Value")
        table.add_row("Total events", str(summary["total_events"]))
        for t, count in summary.get("by_type", {}).items():
            table.add_row(f"  {t}", str(count))
        table.add_row("Total errors", str(summary["total_errors"]))
        table.add_row("Avg provision (ms)", str(summary["avg_provision_ms"]))
        table.add_row("Avg deprovision (ms)", str(summary["avg_deprovision_ms"]))
        console.print(table)

        if serve:
            console.print("\n[dim]Serving — waiting for container shutdown (Ctrl+C to exit)[/]")
            try:
                while True:
                    await asyncio.sleep(3600)
            except (KeyboardInterrupt, asyncio.CancelledError):
                pass

    asyncio.run(_run())


@app.command()
def audit(
    employee_id: str = typer.Option(..., "--employee-id", help="Employee ID to audit"),
    mode: str = typer.Option("sim", help="Mode: 'sim' or 'live'"),
) -> None:
    """Run post-deprovision audit for a specific employee."""
    console.print(f"[bold]Running audit for {employee_id}[/]")
    console.print("[yellow]Audit requires the employee to have been processed in a prior run.[/]")
    console.print("[dim]Use 'lifecycle-lab run' first to process events.[/]")


@app.command()
def metrics() -> None:
    """Show metrics from the event log."""
    event_log = EventLog()
    entries = event_log.read_all()

    if not entries:
        console.print("[dim]No events found. Run 'lifecycle-lab run' first.[/]")
        return

    table = Table(title="Event Log Summary")
    table.add_column("Timestamp")
    table.add_column("Type")
    table.add_column("Employee")
    table.add_column("Action")
    table.add_column("Result")

    for entry in entries[-20:]:  # Last 20 entries
        table.add_row(
            entry.get("timestamp", "")[:19],
            entry.get("event_type", ""),
            entry.get("employee_id", ""),
            entry.get("action", ""),
            entry.get("result", ""),
        )

    console.print(table)
    console.print(f"\n[dim]Showing last 20 of {len(entries)} entries[/]")


if __name__ == "__main__":
    app()
