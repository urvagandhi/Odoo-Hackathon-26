"""
Pydantic v2 schemas for Item validation.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ItemBase(BaseModel):
    """Shared fields between create and update."""

    name: str = Field(..., min_length=1, max_length=255, examples=["My Item"])
    description: str | None = Field(None, max_length=2000, examples=["A useful item"])


class ItemCreate(ItemBase):
    """Schema for creating a new item."""

    pass


class ItemUpdate(BaseModel):
    """Schema for updating an item — all fields optional."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)


class ItemResponse(ItemBase):
    """Schema returned to the client."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
