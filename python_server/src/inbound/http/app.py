from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from inbound.http.routes.places import router as place_router
from infrastructure.http import HTTPSessionManager
from infrastructure.settings import app_settings


class HTTPApplication:

    def __init__(self) -> None:
        self._app = self._build_app()

    def _build_app(self) -> FastAPI:
        app = FastAPI(
            debug=app_settings.DEBUG,
            title=app_settings.NAME,
            lifespan=self._lifespan,
        )

        app.include_router(place_router)

        return app

    @property
    def asgi_app(self) -> FastAPI:
        return self._app

    @staticmethod
    @asynccontextmanager
    async def _lifespan(*args, **kwargs) -> AsyncIterator[None]:
        yield
        await HTTPSessionManager.build().close_all()

    @classmethod
    def build(cls) -> HTTPApplication:
        return HTTPApplication()
