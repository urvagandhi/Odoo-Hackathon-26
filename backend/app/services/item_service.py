"""
Business-logic layer for Item operations.
Keeps route handlers thin and testable.
All methods are async for use with asyncpg.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate


class ItemService:
    """Service class encapsulating Item CRUD logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Create ───────────────────────────────────────────
    async def create(self, data: ItemCreate) -> Item:
        item = Item(**data.model_dump())
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    # ── Read (list) ──────────────────────────────────────
    async def get_all(self, skip: int = 0, limit: int = 100) -> list[Item]:
        stmt = select(Item).offset(skip).limit(limit).order_by(Item.created_at.desc())
        result = await self.db.scalars(stmt)
        return list(result.all())

    # ── Read (single) ────────────────────────────────────
    async def get_by_id(self, item_id: int) -> Item:
        item = await self.db.get(Item, item_id)
        if not item:
            raise NotFoundException("Item", item_id)
        return item

    # ── Update ───────────────────────────────────────────
    async def update(self, item_id: int, data: ItemUpdate) -> Item:
        item = await self.get_by_id(item_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    # ── Delete ───────────────────────────────────────────
    async def delete(self, item_id: int) -> None:
        item = await self.get_by_id(item_id)
        await self.db.delete(item)
        await self.db.commit()
