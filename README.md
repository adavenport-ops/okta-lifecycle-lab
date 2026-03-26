# Okta Lifecycle Lab

[![CI](https://github.com/adavenport-ops/okta-lifecycle-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/adavenport-ops/okta-lifecycle-lab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

A self-contained lab that simulates HRIS-driven identity lifecycle automation — Joiner, Mover, and Leaver workflows — using Okta and SCIM 2.0 provisioning.

**Blog post:** [Okta Lifecycle Automation](https://adavenport.dev/blog/okta-lifecycle-automation/)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  HRIS Feed (JSON)                                                │
│  config/sample_hris_data.json                                    │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────┐     ┌─────────────────────────────────┐
│  Engine (Python)         │     │  RBAC Rules (YAML)              │
│                          │◄────│  config/rbac_rules.yml          │
│  Event Router            │     │  department + title → access    │
│  ├─ Joiner workflow      │     └─────────────────────────────────┘
│  ├─ Mover workflow       │
│  └─ Leaver workflow      │
│                          │
│  Okta Client             │     ┌─────────────────────────────────┐
│  ├─ SimulatedOktaClient  │     │  Mock SCIM Server (Flask)       │
│  └─ LiveOktaClient       │────▶│  Per-app SCIM 2.0 endpoints    │
│                          │     │  ├─ /slack/scim/v2/Users        │
│  SCIM Provisioner        │     │  ├─ /github/scim/v2/Users      │
│  Audit Checker           │     │  ├─ /zoom/scim/v2/Users        │
│  Metrics Collector       │     │  ├─ /gws/scim/v2/Users         │
└──────────┬───────────────┘     │  └─ ... (9 apps total)         │
           │                     │                                 │
           ▼                     │  SSE: /events                   │
┌──────────────────────┐         │  API: /api/employees            │
│  Event Log (JSONL)   │         └───────────────┬─────────────────┘
│  data/event_log.jsonl│                         │
└──────────────────────┘                         │
                                                 ▼
                                  ┌─────────────────────────────────┐
                                  │  Dashboard (React + TypeScript)  │
                                  │  ├─ Event timeline (real-time)   │
                                  │  ├─ Access diff view (movers)    │
                                  │  ├─ KPI metrics cards            │
                                  │  ├─ Audit charts                 │
                                  │  └─ User profile cards           │
                                  └─────────────────────────────────┘
```

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/adavenport-ops/okta-lifecycle-lab.git
cd okta-lifecycle-lab
docker compose up --build
```

What you'll see:
- **Mock SCIM server** starts on `http://localhost:5001`
- **Engine** processes 20 sample HRIS events (joins, moves, leaves)
- **Dashboard** is available at `http://localhost:3000`

Open `http://localhost:3000` to watch the lifecycle events flow through the pipeline in real time.

### Local Development

```bash
# Install Python dependencies
pip install -e ".[all]"

# Start the mock SCIM server (terminal 1)
python -m mock_scim.server

# Run the engine (terminal 2)
lifecycle-lab run --mode sim

# Start the dashboard (terminal 3)
cd dashboard && npm install && npm run dev
```

The dashboard is at `http://localhost:5173`, the SCIM server at `http://localhost:5001`.

## Features

### Joiner Workflow
When an employee joins, the engine:
1. Resolves their target access state from RBAC rules (department + title)
2. Creates an Okta user account
3. Adds them to the correct Okta groups
4. Provisions downstream SaaS apps via SCIM (Slack, GitHub, Zoom, etc.)

### Mover Workflow
When an employee changes roles, the engine computes an **access diff** — the delta between their current and target state:
- Groups to add / remove
- Apps to provision / deprovision (including role upgrades)

The dashboard visualizes this as a git-diff-style side-by-side view: red for removed access, green for added.

### Leaver Workflow
When an employee is terminated, the engine:
1. Disables the Okta account
2. Revokes all active sessions
3. Deprovisions every app assignment via SCIM
4. Removes from all Okta groups
5. Runs a post-deprovision audit to verify everything was cleaned up

### Mock SCIM 2.0 Server
RFC 7644-compliant endpoints for 9 downstream apps:

| App | SCIM Endpoint | Groups |
|-----|--------------|--------|
| Slack | `/slack/scim/v2` | Yes |
| GitHub Enterprise | `/github/scim/v2` | No |
| Zoom | `/zoom/scim/v2` | No |
| Google Workspace | `/gws/scim/v2` | Yes |
| Figma | `/figma/scim/v2` | No |
| Salesforce | `/salesforce/scim/v2` | No |
| HubSpot | `/hubspot/scim/v2` | No |
| NetSuite | `/netsuite/scim/v2` | No |
| Rippling | `/rippling/scim/v2` | No |

Each app has its own in-memory store. Full CRUD on Users, PATCH support for deactivation and role changes, Groups with member add/remove for apps that support it.

### Dashboard
Real-time React dashboard with:
- **Event timeline** — live feed of lifecycle events with type badges, action pills, duration
- **Access diff view** — side-by-side diff for mover events
- **KPI cards** — avg provision time, avg deprovision time, error rate, orphaned accounts
- **Audit charts** — event distribution + action breakdown
- **User cards** — click any user to see their full access state + provisioning history

## CLI Commands

```bash
# Process all sample HRIS events in simulation mode
lifecycle-lab run --mode sim

# Filter by event type
lifecycle-lab run --mode sim --event-type join
lifecycle-lab run --mode sim --event-type move
lifecycle-lab run --mode sim --event-type leave

# Process a custom HRIS feed
lifecycle-lab run --mode sim --feed path/to/events.json

# Stay alive after processing (used by Docker)
lifecycle-lab run --mode sim --serve

# Run against a live Okta tenant
lifecycle-lab run --mode live

# Run post-deprovision audit
lifecycle-lab audit --employee-id EMP001

# View event log metrics
lifecycle-lab metrics
```

## Project Structure

```
okta-lifecycle-lab/
├── engine/                     # Python lifecycle engine
│   ├── cli.py                  # Typer CLI (run, audit, metrics)
│   ├── models.py               # Pydantic models (Employee, HRISEvent, AccessState, etc.)
│   ├── event_router.py         # Joiner/Mover/Leaver orchestration
│   ├── rbac_resolver.py        # RBAC rule resolution + diff computation
│   ├── okta_client.py          # SimulatedOktaClient + LiveOktaClient
│   ├── scim_provisioner.py     # SCIM 2.0 provisioning via httpx
│   ├── audit_checker.py        # Post-deprovision verification
│   ├── metrics.py              # Provisioning metrics collector
│   └── event_log.py            # Append-only JSONL event log
├── mock_scim/                  # Flask SCIM 2.0 mock server
│   ├── server.py               # Per-app blueprints + SSE + API
│   ├── store.py                # In-memory SCIM User/Group store
│   └── apps/                   # App-specific SCIM behaviors
│       ├── slack.py            # Slack enterprise extension
│       ├── github.py           # GitHub SAML linkage
│       ├── zoom.py             # Zoom license types
│       └── google_workspace.py # Google Workspace org units
├── dashboard/                  # React 18 + TypeScript + Vite + Tailwind
│   └── src/
│       ├── App.tsx             # Main app layout
│       ├── hooks.ts            # SSE, employee directory, event grouping
│       ├── types.ts            # TypeScript interfaces
│       └── components/
│           ├── EventTimeline.tsx   # Real-time event feed
│           ├── AccessDiffView.tsx  # Git-diff style access changes
│           ├── KPICards.tsx        # Audit metric cards
│           ├── AuditCharts.tsx     # Recharts visualizations
│           └── UserCard.tsx        # Employee profile modal
├── config/
│   ├── rbac_rules.yml          # Department + title → access mappings
│   ├── sample_hris_data.json   # 20 sample employees
│   └── scim_app_registry.yml   # App SCIM endpoint registry
├── tests/                      # pytest suite (54 tests)
│   ├── test_rbac_resolver.py   # Rule loading, diff computation, title overrides
│   ├── test_event_router.py    # Joiner/mover/leaver flows
│   ├── test_audit_checker.py   # Pass/fail audit scenarios
│   └── test_scim_server.py     # SCIM Users + Groups CRUD
├── docker-compose.yml          # Three-service stack
├── Dockerfile                  # Engine + SCIM server image
├── .github/workflows/ci.yml   # Lint, test, build, Docker
├── pyproject.toml              # Python project config
└── Makefile                    # Dev shortcuts
```

## Configuration

### RBAC Rules (`config/rbac_rules.yml`)

Defines the mapping from department + title to target access state:

```yaml
departments:
  engineering:
    okta_groups: [eng-all, github-org-members]
    apps:
      github: developer
      slack: member
      zoom: licensed
    titles:
      "Senior Engineer":
        additional_groups: [eng-senior, on-call-rotation]
        additional_apps:
          github: maintainer    # role upgrade
      "Engineering Manager":
        additional_groups: [eng-leads, people-managers]
        additional_apps:
          github: admin
```

8 departments are included: Engineering, Product, People Ops, Sales, Marketing, Finance, IT — each with realistic title overrides.

### HRIS Feed Format (`config/sample_hris_data.json`)

```json
{
  "employees": [
    {
      "employee_id": "EMP001",
      "email": "alice.chen@example.com",
      "first_name": "Alice",
      "last_name": "Chen",
      "department": "engineering",
      "title": "Senior Engineer",
      "manager_email": "carlos.rivera@example.com",
      "status": "active",
      "start_date": "2026-03-20",
      "end_date": null
    }
  ]
}
```

Use `_previous_department` and `_previous_title` fields to stage mover scenarios. Set `status: "terminated"` with an `end_date` for leavers.

### App Registry (`config/scim_app_registry.yml`)

Maps app names to SCIM endpoints and supported roles. Change the `scim_endpoint` URLs to point at real SCIM providers when moving to live mode.

## Simulation Mode vs Live Mode

| | Simulation | Live |
|---|---|---|
| **Okta** | In-memory simulated client | Real Okta Management API |
| **SCIM** | Mock Flask server | Real SCIM endpoints |
| **Credentials** | None needed | `OKTA_DOMAIN` + `OKTA_API_TOKEN` |
| **Latency** | 50-200ms simulated delay | Real network latency |
| **Default** | Yes | Set `--mode live` |

### Connecting to a Live Okta Tenant

1. Create a free [Okta developer account](https://developer.okta.com/signup/)
2. Create an API token: **Security > API > Tokens**
3. Copy `.env.example` to `.env`:

```bash
OKTA_DOMAIN=https://dev-XXXXXX.okta.com
OKTA_API_TOKEN=00xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. Update `config/scim_app_registry.yml` to point at real SCIM endpoints
5. Run: `lifecycle-lab run --mode live`

## API Reference

### SSE Endpoint

`GET /events` — Server-Sent Events stream of the event log. Each message is a JSON object:

```json
{
  "timestamp": "2026-03-25T14:30:00.123456",
  "event_id": "a1b2c3d4-...",
  "event_type": "join",
  "employee_id": "EMP001",
  "action": "create_user",
  "result": "success",
  "duration_ms": 0.0,
  "details": {
    "employee_name": "Alice Chen",
    "department": "engineering",
    "okta_user_id": "00u00001000"
  }
}
```

### REST Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server health + per-app user/group counts |
| `GET /api/employees` | HRIS employee directory |
| `GET /<app>/scim/v2/Users` | List SCIM users for an app |
| `POST /<app>/scim/v2/Users` | Create a SCIM user |
| `PATCH /<app>/scim/v2/Users/:id` | Update a SCIM user |
| `DELETE /<app>/scim/v2/Users/:id` | Delete a SCIM user |
| `GET /<app>/scim/v2/Groups` | List SCIM groups (Slack, GWS) |
| `PATCH /<app>/scim/v2/Groups/:id` | Add/remove group members |

## Metrics

The dashboard tracks five key metrics:

| Metric | Target | What It Measures |
|--------|--------|-----------------|
| **Events Processed** | — | Total lifecycle events handled |
| **Avg Provision Time** | <15 min | Time from HRIS event to full access granted |
| **Avg Deprovision Time** | <5 min | Time from termination to full access revoked |
| **Error Rate** | 0% | Percentage of actions that failed |
| **Orphaned Accounts** | 0 | Users that failed post-deprovision audit |

## Development

```bash
make install           # Install all dependencies
make test              # Run pytest
make lint              # Ruff + mypy
make mock-scim         # Start mock SCIM server
make run               # Process events in sim mode
make dashboard         # Start React dev server
make docker-up         # Docker Compose up
make docker-down       # Docker Compose down
make clean             # Remove generated files
```

## License

[MIT](LICENSE) — [Alex Davenport](https://adavenport.dev)
