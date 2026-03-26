"""GitHub Enterprise SCIM behaviors.

GitHub's SCIM implementation uses the externalId field to match SSO
identities and manages org-level roles via a custom extension.
"""

GITHUB_SCHEMA = "urn:scim:schemas:extension:github:2.0:User"

VALID_ROLES = {"developer", "maintainer", "admin", "billing_manager"}


def enrich_user(resource: dict) -> dict:
    """Add GitHub-specific defaults to a newly created user resource."""
    roles = resource.get("roles", [])
    if not roles:
        resource["roles"] = [{"value": "developer", "primary": True}]

    # GitHub requires externalId for SAML linkage
    if not resource.get("externalId"):
        resource["externalId"] = resource.get("userName", "")

    return resource
