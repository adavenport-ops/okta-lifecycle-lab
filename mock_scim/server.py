"""Flask-based mock SCIM 2.0 server with per-app blueprints (RFC 7644)."""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

from flask import Blueprint, Flask, Response, jsonify, request
from flask_cors import CORS

from mock_scim.store import SCIMConflictError, SCIMStore, _scim_error

app = Flask(__name__)
CORS(app)

EVENT_LOG_PATH = Path(os.environ.get("EVENT_LOG_PATH", "data/event_log.jsonl"))

# --------------------------------------------------------------------------
# Per-app config: name -> (url_prefix, supports)
# --------------------------------------------------------------------------
APP_DEFS: dict[str, dict] = {
    "slack":            {"prefix": "/slack/scim/v2",  "supports": ["users", "groups"]},
    "github":           {"prefix": "/github/scim/v2", "supports": ["users"]},
    "zoom":             {"prefix": "/zoom/scim/v2",   "supports": ["users"]},
    "google_workspace": {"prefix": "/gws/scim/v2",    "supports": ["users", "groups"]},
    "figma":            {"prefix": "/figma/scim/v2",   "supports": ["users"]},
    "salesforce":       {"prefix": "/salesforce/scim/v2", "supports": ["users"]},
    "hubspot":          {"prefix": "/hubspot/scim/v2",    "supports": ["users"]},
    "netsuite":         {"prefix": "/netsuite/scim/v2",   "supports": ["users"]},
    "rippling":         {"prefix": "/rippling/scim/v2",   "supports": ["users"]},
}

stores: dict[str, SCIMStore] = {}


def _make_scim_blueprint(app_name: str, prefix: str, supports: list[str]) -> Blueprint:
    """Create a Flask blueprint with SCIM 2.0 endpoints for one downstream app."""
    bp = Blueprint(app_name, __name__)
    store = SCIMStore(app_name, prefix)
    stores[app_name] = store

    # ── Users ────────────────────────────────────────────────────────────

    @bp.route("/Users", methods=["POST"])
    def create_user() -> tuple[Response, int]:
        resource = request.get_json(silent=True)
        if not resource:
            return jsonify(_scim_error(400, "Request body is required")), 400
        try:
            created = store.create_user(resource)
        except SCIMConflictError as e:
            return jsonify(_scim_error(409, str(e), "uniqueness")), 409
        return jsonify(created), 201

    @bp.route("/Users", methods=["GET"])
    def list_users() -> tuple[Response, int]:
        filter_str = request.args.get("filter", "")
        if filter_str:
            resources = store.filter_users(filter_str)
            return jsonify({
                "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
                "totalResults": len(resources),
                "startIndex": 1,
                "itemsPerPage": len(resources),
                "Resources": resources,
            }), 200

        start_index = int(request.args.get("startIndex", 1))
        count = int(request.args.get("count", 100))
        return jsonify(store.list_users(start_index, count)), 200

    @bp.route("/Users/<scim_id>", methods=["GET"])
    def get_user(scim_id: str) -> tuple[Response, int]:
        user = store.get_user(scim_id)
        if not user:
            return jsonify(_scim_error(404, f"User {scim_id} not found")), 404
        return jsonify(user), 200

    @bp.route("/Users/<scim_id>", methods=["PUT"])
    def replace_user(scim_id: str) -> tuple[Response, int]:
        resource = request.get_json(silent=True)
        if not resource:
            return jsonify(_scim_error(400, "Request body is required")), 400
        user = store.replace_user(scim_id, resource)
        if not user:
            return jsonify(_scim_error(404, f"User {scim_id} not found")), 404
        return jsonify(user), 200

    @bp.route("/Users/<scim_id>", methods=["PATCH"])
    def patch_user(scim_id: str) -> tuple[Response, int]:
        body = request.get_json(silent=True)
        if not body:
            return jsonify(_scim_error(400, "Request body is required")), 400
        operations = body.get("Operations", [])
        if not operations:
            return jsonify(_scim_error(400, "Operations list is required", "invalidValue")), 400
        user = store.patch_user(scim_id, operations)
        if not user:
            return jsonify(_scim_error(404, f"User {scim_id} not found")), 404
        return jsonify(user), 200

    @bp.route("/Users/<scim_id>", methods=["DELETE"])
    def delete_user(scim_id: str) -> tuple[Response, int]:
        if store.delete_user(scim_id):
            return Response(status=204)
        return jsonify(_scim_error(404, f"User {scim_id} not found")), 404

    # ── Groups (only if the app supports them) ───────────────────────────

    if "groups" in supports:
        @bp.route("/Groups", methods=["POST"])
        def create_group() -> tuple[Response, int]:
            resource = request.get_json(silent=True)
            if not resource:
                return jsonify(_scim_error(400, "Request body is required")), 400
            try:
                created = store.create_group(resource)
            except SCIMConflictError as e:
                return jsonify(_scim_error(409, str(e), "uniqueness")), 409
            return jsonify(created), 201

        @bp.route("/Groups", methods=["GET"])
        def list_groups() -> tuple[Response, int]:
            filter_str = request.args.get("filter", "")
            if filter_str:
                resources = store.filter_groups(filter_str)
                return jsonify({
                    "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
                    "totalResults": len(resources),
                    "startIndex": 1,
                    "itemsPerPage": len(resources),
                    "Resources": resources,
                }), 200

            start_index = int(request.args.get("startIndex", 1))
            count = int(request.args.get("count", 100))
            return jsonify(store.list_groups(start_index, count)), 200

        @bp.route("/Groups/<scim_id>", methods=["GET"])
        def get_group(scim_id: str) -> tuple[Response, int]:
            group = store.get_group(scim_id)
            if not group:
                return jsonify(_scim_error(404, f"Group {scim_id} not found")), 404
            return jsonify(group), 200

        @bp.route("/Groups/<scim_id>", methods=["PATCH"])
        def patch_group(scim_id: str) -> tuple[Response, int]:
            body = request.get_json(silent=True)
            if not body:
                return jsonify(_scim_error(400, "Request body is required")), 400
            operations = body.get("Operations", [])
            if not operations:
                return jsonify(_scim_error(400, "Operations list is required", "invalidValue")), 400
            group = store.patch_group(scim_id, operations)
            if not group:
                return jsonify(_scim_error(404, f"Group {scim_id} not found")), 404
            return jsonify(group), 200

        @bp.route("/Groups/<scim_id>", methods=["DELETE"])
        def delete_group(scim_id: str) -> tuple[Response, int]:
            if store.delete_group(scim_id):
                return Response(status=204)
            return jsonify(_scim_error(404, f"Group {scim_id} not found")), 404

    # ── ServiceProviderConfig (RFC 7644 §4) ──────────────────────────────

    @bp.route("/ServiceProviderConfig", methods=["GET"])
    def service_provider_config() -> tuple[Response, int]:
        return jsonify({
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
            "documentationUri": f"https://example.com/{app_name}/scim",
            "patch": {"supported": True},
            "bulk": {"supported": False, "maxOperations": 0, "maxPayloadSize": 0},
            "filter": {"supported": True, "maxResults": 200},
            "changePassword": {"supported": False},
            "sort": {"supported": False},
            "etag": {"supported": False},
            "authenticationSchemes": [
                {"type": "oauthbearertoken", "name": "OAuth Bearer Token",
                 "description": "Authentication via OAuth 2.0 Bearer Token"}
            ],
        }), 200

    return bp


# --------------------------------------------------------------------------
# Register all app blueprints
# --------------------------------------------------------------------------
for _app_name, _app_def in APP_DEFS.items():
    bp = _make_scim_blueprint(_app_name, _app_def["prefix"], _app_def["supports"])
    app.register_blueprint(bp, url_prefix=_app_def["prefix"])


# --------------------------------------------------------------------------
# SSE endpoint for the dashboard
# --------------------------------------------------------------------------
@app.route("/events")
def sse_events() -> Response:
    """Server-Sent Events stream from the event log."""

    def generate():
        yield "data: {\"type\": \"connected\"}\n\n"
        if EVENT_LOG_PATH.exists():
            with open(EVENT_LOG_PATH) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        yield f"data: {line}\n\n"

    return Response(generate(), mimetype="text/event-stream")


# --------------------------------------------------------------------------
# Employee directory API (for dashboard)
# --------------------------------------------------------------------------
SAMPLE_DATA_PATH = Path(os.environ.get(
    "SAMPLE_DATA_PATH",
    str(Path(__file__).resolve().parent.parent / "config" / "sample_hris_data.json"),
))


@app.route("/api/employees")
def api_employees() -> tuple[Response, int]:
    """Return the HRIS employee directory for the dashboard."""
    if not SAMPLE_DATA_PATH.exists():
        return jsonify({"employees": []}), 200
    with open(SAMPLE_DATA_PATH) as f:
        data = json.load(f)
    return jsonify(data), 200


# --------------------------------------------------------------------------
# Health / status
# --------------------------------------------------------------------------
@app.route("/health")
def health() -> tuple[Response, int]:
    status = {}
    for name, store in stores.items():
        status[name] = {
            "users": store.user_count(),
            "groups": store.group_count(),
            "supports": APP_DEFS[name]["supports"],
        }
    return jsonify({"status": "ok", "apps": status}), 200


if __name__ == "__main__":
    port = int(os.environ.get("SCIM_PORT", 5001))
    host = os.environ.get("SCIM_HOST", "0.0.0.0")
    app.run(host=host, port=port, debug=True)
