"""Slack-specific SCIM behaviors.

Slack's SCIM API has a custom enterprise extension schema for guest status
and channel membership. This module provides hooks for Slack-specific
resource transformations applied by the store.
"""

SLACK_ENTERPRISE_SCHEMA = "urn:scim:schemas:extension:slack:guest:2.0:User"

VALID_ROLES = {"member", "admin", "owner", "restricted", "ultra_restricted"}


def enrich_user(resource: dict) -> dict:
    """Add Slack-specific defaults to a newly created user resource."""
    roles = resource.get("roles", [])
    if not roles:
        resource["roles"] = [{"value": "member", "primary": True}]

    # Slack guest extension: default to non-guest
    if SLACK_ENTERPRISE_SCHEMA not in resource.get("schemas", []):
        resource.setdefault("schemas", []).append(SLACK_ENTERPRISE_SCHEMA)
    resource.setdefault(SLACK_ENTERPRISE_SCHEMA, {"type": "regular"})

    return resource
