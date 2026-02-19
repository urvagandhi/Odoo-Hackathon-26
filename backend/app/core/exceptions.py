"""
Custom exceptions and global exception handlers for FastAPI.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class NotFoundException(Exception):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str = "Resource", resource_id: int | str | None = None):
        self.resource = resource
        self.resource_id = resource_id
        self.message = (
            f"{resource} with id '{resource_id}' not found"
            if resource_id
            else f"{resource} not found"
        )
        super().__init__(self.message)


class BadRequestException(Exception):
    """Raised for invalid client input that Pydantic doesn't catch."""

    def __init__(self, message: str = "Bad request"):
        self.message = message
        super().__init__(self.message)


def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers on the FastAPI app."""

    @app.exception_handler(NotFoundException)
    async def not_found_handler(_request: Request, exc: NotFoundException):
        return JSONResponse(
            status_code=404,
            content={"detail": exc.message},
        )

    @app.exception_handler(BadRequestException)
    async def bad_request_handler(_request: Request, exc: BadRequestException):
        return JSONResponse(
            status_code=400,
            content={"detail": exc.message},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(_request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
