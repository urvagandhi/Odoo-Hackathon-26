"""
Tests for the Items CRUD endpoints.
All tests are async using pytest-asyncio and httpx.AsyncClient.
"""

import pytest


@pytest.mark.asyncio
class TestCreateItem:
    async def test_create_item_success(self, client):
        response = await client.post("/items", json={"name": "Test Item", "description": "A test"})
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Item"
        assert data["description"] == "A test"
        assert "id" in data
        assert "created_at" in data

    async def test_create_item_without_description(self, client):
        response = await client.post("/items", json={"name": "No Desc"})
        assert response.status_code == 201
        assert response.json()["description"] is None

    async def test_create_item_empty_name_fails(self, client):
        response = await client.post("/items", json={"name": "", "description": "Bad"})
        assert response.status_code == 422


@pytest.mark.asyncio
class TestListItems:
    async def test_list_items_empty(self, client):
        response = await client.get("/items")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_items_returns_created(self, client):
        await client.post("/items", json={"name": "Item 1"})
        await client.post("/items", json={"name": "Item 2"})
        response = await client.get("/items")
        assert response.status_code == 200
        assert len(response.json()) == 2


@pytest.mark.asyncio
class TestGetItem:
    async def test_get_item_success(self, client):
        create_resp = await client.post("/items", json={"name": "Find Me"})
        item_id = create_resp.json()["id"]
        response = await client.get(f"/items/{item_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Find Me"

    async def test_get_item_not_found(self, client):
        response = await client.get("/items/9999")
        assert response.status_code == 404


@pytest.mark.asyncio
class TestUpdateItem:
    async def test_update_item_success(self, client):
        create_resp = await client.post("/items", json={"name": "Old Name"})
        item_id = create_resp.json()["id"]
        response = await client.put(f"/items/{item_id}", json={"name": "New Name"})
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"

    async def test_update_item_not_found(self, client):
        response = await client.put("/items/9999", json={"name": "Ghost"})
        assert response.status_code == 404


@pytest.mark.asyncio
class TestDeleteItem:
    async def test_delete_item_success(self, client):
        create_resp = await client.post("/items", json={"name": "Delete Me"})
        item_id = create_resp.json()["id"]
        response = await client.delete(f"/items/{item_id}")
        assert response.status_code == 204
        # Verify it's gone
        get_resp = await client.get(f"/items/{item_id}")
        assert get_resp.status_code == 404

    async def test_delete_item_not_found(self, client):
        response = await client.delete("/items/9999")
        assert response.status_code == 404
