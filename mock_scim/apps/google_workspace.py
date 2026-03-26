"""Google Workspace SCIM behaviors.

Google Workspace supports both Users and Groups via SCIM. It uses
orgUnitPath for organizational placement and custom schemas for
admin status.
"""

GWS_SCHEMA = "urn:scim:schemas:extension:gws:2.0:User"

VALID_ROLES = {"user", "admin", "super_admin"}


def enrich_user(resource: dict) -> dict:
    """Add Google Workspace-specific defaults to a newly created user resource."""
    roles = resource.get("roles", [])
    role_value = roles[0]["value"] if roles else "user"

    resource.setdefault("schemas", [])
    if GWS_SCHEMA not in resource["schemas"]:
        resource["schemas"].append(GWS_SCHEMA)

    resource.setdefault(GWS_SCHEMA, {
        "orgUnitPath": "/",
        "isAdmin": role_value in ("admin", "super_admin"),
    })

    return resource
