import uvicorn
from fastapi import FastAPI

from inbound.http.app import HTTPApplication
from infrastructure.logger import configure_logging
from infrastructure.settings import app_settings, http_settings


def create_app() -> FastAPI:
    return HTTPApplication.build().asgi_app


if __name__ == "__main__":
    configure_logging()
    uvicorn.run(
        'main:create_app',
        factory=True,
        reload=app_settings.DEBUG,
        reload_dirs=app_settings.ROOT_DIR,
        host=http_settings.HOST,
        port=http_settings.PORT,
        workers=http_settings.WORKERS,
        loop='uvloop',
    )
