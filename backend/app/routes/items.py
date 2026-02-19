"""
Item CRUD endpoints.
All route handlers are async for use with asyncpg.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate
from app.services.item_service import ItemService

router = APIRouter()


def _service(db: AsyncSession = Depends(get_db)) -> ItemService:
    """Dependency that injects an ItemService with an async DB session."""
    return ItemService(db)


@router.post(
    "",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new item",
)
async def create_item(data: ItemCreate, service: ItemService = Depends(_service)):
    return await service.create(data)


@router.get(
    "",
    response_model=list[ItemResponse],
    summary="List all items",
)
async def list_items(
    skip: int = 0,
    limit: int = 100,
    service: ItemService = Depends(_service),
):
    return await service.get_all(skip=skip, limit=limit)


@router.get(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Get a single item by ID",
)
async def get_item(item_id: int, service: ItemService = Depends(_service)):
    return await service.get_by_id(item_id)


@router.put(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Update an existing item",
)
async def update_item(item_id: int, data: ItemUpdate, service: ItemService = Depends(_service)):
    return await service.update(item_id, data)


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an item",
)
async def delete_item(item_id: int, service: ItemService = Depends(_service)):
    await service.delete(item_id)
