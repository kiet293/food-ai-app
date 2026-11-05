from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import CustomException


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(CustomException)
    async def custom_exception_handler(
        request: Request, exc: CustomException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.message,
                "code": exc.code,
                "timestamp": _timestamp(),
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            headers=exc.headers,
            content={
                "status": "error",
                "message": str(exc.detail),
                "code": f"HTTP_{exc.status_code}_ERROR",
                "timestamp": _timestamp(),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = []
        for error in exc.errors():
            if isinstance(error.get("input"), bytes):
                error = dict(error)
                error["input"] = error["input"].decode("utf-8", errors="ignore")
            errors.append(error)

        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "message": "Dữ liệu đầu vào không hợp lệ",
                "code": "VALIDATION_ERROR",
                "data": jsonable_encoder(errors, custom_encoder={ValueError: str}),
                "timestamp": _timestamp(),
            },
        )
