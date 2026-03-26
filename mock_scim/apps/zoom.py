"""Zoom SCIM behaviors.

Zoom's SCIM API maps license types via a custom extension schema.
"""

ZOOM_SCHEMA = "urn:scim:schemas:extension:zoom:2.0:User"

# Zoom license types: 1 = Basic, 2 = Licensed, 3 = On-Prem
LICENSE_MAP = {"basic": 1, "licensed": 2, "on-prem": 3}


def enrich_user(resource: dict) -> dict:
    """Add Zoom-specific defaults to a newly created user resource."""
    roles = resource.get("roles", [])
    role_value = roles[0]["value"] if roles else "licensed"

    resource.setdefault("schemas", [])
    if ZOOM_SCHEMA not in resource["schemas"]:
        resource["schemas"].append(ZOOM_SCHEMA)

    resource.setdefault(ZOOM_SCHEMA, {"userType": LICENSE_MAP.get(role_value, 2)})

    return resource
