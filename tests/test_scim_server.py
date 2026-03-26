"""Tests for the mock SCIM 2.0 server — Users and Groups endpoints."""

import pytest

from mock_scim.server import app, stores


@pytest.fixture
def client():
    app.config["TESTING"] = True
    # Reset all stores between tests
    for store in stores.values():
        store._users.clear()
        store._groups.clear()
    with app.test_client() as client:
        yield client


def _scim_user(email: str = "alice@example.com", employee_id: str = "EMP001", role: str = "member"):
    return {
        "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
        "userName": email,
        "name": {"givenName": "Alice", "familyName": "Chen"},
        "emails": [{"value": email, "primary": True}],
        "active": True,
        "externalId": employee_id,
        "roles": [{"value": role}],
    }


# --------------------------------------------------------------------------
# Users — CRUD
# --------------------------------------------------------------------------

class TestCreateUser:
    def test_create_user_returns_201(self, client):
        resp = client.post("/slack/scim/v2/Users", json=_scim_user())
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["id"]
        assert data["userName"] == "alice@example.com"
        assert data["meta"]["resourceType"] == "User"
        assert "/slack/scim/v2/Users/" in data["meta"]["location"]

    def test_create_user_across_apps(self, client):
        """Same email can exist in different apps (separate stores)."""
        r1 = client.post("/slack/scim/v2/Users", json=_scim_user())
        r2 = client.post("/github/scim/v2/Users", json=_scim_user())
        assert r1.status_code == 201
        assert r2.status_code == 201
        assert r1.get_json()["id"] != r2.get_json()["id"]

    def test_duplicate_username_returns_409(self, client):
        client.post("/slack/scim/v2/Users", json=_scim_user())
        resp = client.post("/slack/scim/v2/Users", json=_scim_user())
        assert resp.status_code == 409
        assert "uniqueness" in resp.get_json().get("scimType", "")

    def test_create_user_no_body_returns_400(self, client):
        resp = client.post("/slack/scim/v2/Users", content_type="application/json")
        assert resp.status_code == 400


class TestGetUser:
    def test_get_existing_user(self, client):
        create = client.post("/slack/scim/v2/Users", json=_scim_user())
        scim_id = create.get_json()["id"]

        resp = client.get(f"/slack/scim/v2/Users/{scim_id}")
        assert resp.status_code == 200
        assert resp.get_json()["userName"] == "alice@example.com"

    def test_get_nonexistent_user_returns_404(self, client):
        resp = client.get("/slack/scim/v2/Users/nonexistent")
        assert resp.status_code == 404


class TestListAndFilterUsers:
    def test_list_empty(self, client):
        resp = client.get("/slack/scim/v2/Users")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["totalResults"] == 0
        assert data["Resources"] == []

    def test_list_with_users(self, client):
        client.post("/slack/scim/v2/Users", json=_scim_user("a@example.com"))
        client.post("/slack/scim/v2/Users", json=_scim_user("b@example.com"))
        resp = client.get("/slack/scim/v2/Users")
        assert resp.get_json()["totalResults"] == 2

    def test_filter_by_username(self, client):
        client.post("/slack/scim/v2/Users", json=_scim_user("a@example.com"))
        client.post("/slack/scim/v2/Users", json=_scim_user("b@example.com"))

        resp = client.get('/slack/scim/v2/Users?filter=userName eq "a@example.com"')
        assert resp.status_code == 200
        resources = resp.get_json()["Resources"]
        assert len(resources) == 1
        assert resources[0]["userName"] == "a@example.com"

    def test_filter_by_external_id(self, client):
        client.post("/slack/scim/v2/Users", json=_scim_user("a@example.com", "EMP001"))
        client.post("/slack/scim/v2/Users", json=_scim_user("b@example.com", "EMP002"))

        resp = client.get('/slack/scim/v2/Users?filter=externalId eq "EMP002"')
        resources = resp.get_json()["Resources"]
        assert len(resources) == 1
        assert resources[0]["externalId"] == "EMP002"

    def test_filter_no_match(self, client):
        client.post("/slack/scim/v2/Users", json=_scim_user())
        resp = client.get('/slack/scim/v2/Users?filter=userName eq "nobody@example.com"')
        assert resp.get_json()["totalResults"] == 0


class TestPatchUser:
    def test_patch_deactivate(self, client):
        create = client.post("/slack/scim/v2/Users", json=_scim_user())
        scim_id = create.get_json()["id"]

        resp = client.patch(f"/slack/scim/v2/Users/{scim_id}", json={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [{"op": "replace", "value": {"active": False}}],
        })
        assert resp.status_code == 200
        assert resp.get_json()["active"] is False

    def test_patch_add_role(self, client):
        create = client.post("/slack/scim/v2/Users", json=_scim_user())
        scim_id = create.get_json()["id"]

        resp = client.patch(f"/slack/scim/v2/Users/{scim_id}", json={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [{"op": "replace", "path": "roles", "value": [{"value": "admin"}]}],
        })
        assert resp.status_code == 200
        assert resp.get_json()["roles"] == [{"value": "admin"}]

    def test_patch_nonexistent_user_returns_404(self, client):
        resp = client.patch("/slack/scim/v2/Users/nonexistent", json={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [{"op": "replace", "value": {"active": False}}],
        })
        assert resp.status_code == 404

    def test_patch_no_operations_returns_400(self, client):
        create = client.post("/slack/scim/v2/Users", json=_scim_user())
        scim_id = create.get_json()["id"]
        resp = client.patch(f"/slack/scim/v2/Users/{scim_id}", json={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [],
        })
        assert resp.status_code == 400


class TestReplaceUser:
    def test_put_replaces_user(self, client):
        create = client.post("/slack/scim/v2/Users", json=_scim_user())
        scim_id = create.get_json()["id"]

        updated = _scim_user("newemail@example.com")
        resp = client.put(f"/slack/scim/v2/Users/{scim_id}", json=updated)
        assert resp.status_code == 200
        assert resp.get_json()["userName"] == "newemail@example.com"
        assert resp.get_json()["id"] == scim_id  # ID preserved

    def test_put_nonexistent_returns_404(self, client):
        resp = client.put("/slack/scim/v2/Users/nonexistent", json=_scim_user())
        assert resp.status_code == 404


class TestDeleteUser:
    def test_delete_user(self, client):
        create = client.post("/slack/scim/v2/Users", json=_scim_user())
        scim_id = create.get_json()["id"]

        resp = client.delete(f"/slack/scim/v2/Users/{scim_id}")
        assert resp.status_code == 204

        # Verify gone
        resp = client.get(f"/slack/scim/v2/Users/{scim_id}")
        assert resp.status_code == 404

    def test_delete_nonexistent_returns_404(self, client):
        resp = client.delete("/slack/scim/v2/Users/nonexistent")
        assert resp.status_code == 404

    def test_delete_user_removes_from_groups(self, client):
        """Deleting a user also removes them from any groups."""
        user = client.post("/slack/scim/v2/Users", json=_scim_user()).get_json()
        group = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
            "members": [{"value": user["id"], "display": "Alice"}],
        }).get_json()

        client.delete(f"/slack/scim/v2/Users/{user['id']}")

        group_after = client.get(f"/slack/scim/v2/Groups/{group['id']}").get_json()
        assert group_after["members"] == []


# --------------------------------------------------------------------------
# Groups — CRUD (only for apps that support groups)
# --------------------------------------------------------------------------

class TestCreateGroup:
    def test_create_group_returns_201(self, client):
        resp = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["id"]
        assert data["displayName"] == "engineering"
        assert data["members"] == []
        assert data["meta"]["resourceType"] == "Group"

    def test_create_group_with_members(self, client):
        user = client.post("/slack/scim/v2/Users", json=_scim_user()).get_json()

        resp = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
            "members": [{"value": user["id"], "display": "Alice"}],
        })
        assert resp.status_code == 201
        assert len(resp.get_json()["members"]) == 1

    def test_duplicate_group_name_returns_409(self, client):
        client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
        })
        resp = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
        })
        assert resp.status_code == 409

    def test_groups_not_supported_returns_404(self, client):
        """GitHub doesn't support Groups — should 404."""
        resp = client.post("/github/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "test",
        })
        assert resp.status_code == 404


class TestPatchGroup:
    def test_add_member(self, client):
        user = client.post("/slack/scim/v2/Users", json=_scim_user()).get_json()
        group = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
        }).get_json()

        resp = client.patch(f"/slack/scim/v2/Groups/{group['id']}", json={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [{
                "op": "add",
                "path": "members",
                "value": [{"value": user["id"], "display": "Alice"}],
            }],
        })
        assert resp.status_code == 200
        assert len(resp.get_json()["members"]) == 1

    def test_remove_member_by_value(self, client):
        user = client.post("/slack/scim/v2/Users", json=_scim_user()).get_json()
        group = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
            "members": [{"value": user["id"], "display": "Alice"}],
        }).get_json()

        resp = client.patch(f"/slack/scim/v2/Groups/{group['id']}", json={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [{
                "op": "remove",
                "path": "members",
                "value": [{"value": user["id"]}],
            }],
        })
        assert resp.status_code == 200
        assert resp.get_json()["members"] == []

    def test_remove_member_by_path_filter(self, client):
        user = client.post("/slack/scim/v2/Users", json=_scim_user()).get_json()
        group = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
            "members": [{"value": user["id"], "display": "Alice"}],
        }).get_json()

        resp = client.patch(f"/slack/scim/v2/Groups/{group['id']}", json={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [{
                "op": "remove",
                "path": f'members[value eq "{user["id"]}"]',
            }],
        })
        assert resp.status_code == 200
        assert resp.get_json()["members"] == []

    def test_add_duplicate_member_is_idempotent(self, client):
        user = client.post("/slack/scim/v2/Users", json=_scim_user()).get_json()
        group = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
            "members": [{"value": user["id"], "display": "Alice"}],
        }).get_json()

        resp = client.patch(f"/slack/scim/v2/Groups/{group['id']}", json={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [{
                "op": "add",
                "path": "members",
                "value": [{"value": user["id"], "display": "Alice"}],
            }],
        })
        assert resp.status_code == 200
        assert len(resp.get_json()["members"]) == 1  # Not duplicated


class TestDeleteGroup:
    def test_delete_group(self, client):
        group = client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
        }).get_json()

        resp = client.delete(f"/slack/scim/v2/Groups/{group['id']}")
        assert resp.status_code == 204

    def test_delete_nonexistent_group_returns_404(self, client):
        resp = client.delete("/slack/scim/v2/Groups/nonexistent")
        assert resp.status_code == 404


class TestFilterGroups:
    def test_filter_by_display_name(self, client):
        client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "engineering",
        })
        client.post("/slack/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "sales",
        })

        resp = client.get('/slack/scim/v2/Groups?filter=displayName eq "engineering"')
        assert resp.status_code == 200
        resources = resp.get_json()["Resources"]
        assert len(resources) == 1
        assert resources[0]["displayName"] == "engineering"


# --------------------------------------------------------------------------
# ServiceProviderConfig & Health
# --------------------------------------------------------------------------

class TestServiceProviderConfig:
    def test_spc_returns_config(self, client):
        resp = client.get("/slack/scim/v2/ServiceProviderConfig")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["patch"]["supported"] is True
        assert data["filter"]["supported"] is True


class TestHealth:
    def test_health_endpoint(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "ok"
        assert "slack" in data["apps"]
        assert "github" in data["apps"]
        assert "groups" in data["apps"]["slack"]["supports"]
        assert "groups" not in data["apps"]["github"]["supports"]


# --------------------------------------------------------------------------
# Google Workspace — Groups support too
# --------------------------------------------------------------------------

class TestGoogleWorkspaceGroups:
    def test_gws_supports_groups(self, client):
        resp = client.post("/gws/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "gws-admins",
        })
        assert resp.status_code == 201

    def test_gws_users_and_groups_separate(self, client):
        user = client.post("/gws/scim/v2/Users", json=_scim_user()).get_json()
        group = client.post("/gws/scim/v2/Groups", json={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            "displayName": "admins",
            "members": [{"value": user["id"]}],
        }).get_json()

        assert client.get(f"/gws/scim/v2/Users/{user['id']}").status_code == 200
        assert client.get(f"/gws/scim/v2/Groups/{group['id']}").status_code == 200
