import logging
from typing import Any

import aiohttp
from aiohttp import ClientResponse, ClientSession

from infrastructure.http import HTTPSessionManager
from infrastructure.settings import location_guesser_settings

logger = logging.getLogger(__name__)

class LocationGuesserClient:

    def __init__(
        self,
        *,
        host: str,
    ):
        manager = HTTPSessionManager()
        http_session_name = self.__class__.__name__

        if not (session := manager.get(http_session_name)):
            self._session = ClientSession(
                base_url=host,
            )
            manager.add(http_session_name, self._session)
        else:
            self._session = session

    async def predict(
        self,
        *,
        image: bytes,
    ) -> dict[str, Any]:
        data = aiohttp.FormData()
        data.add_field("image", image, filename="image.jpg")

        response = await self._request(
            url="predict",
            method="POST",
            data=data,
            headers={
                "Content-Type": "multipart/form-data; boundary=undefined",
            },
        )

        return await response.json()

    async def _request(
        self,
        *,
        url: str,
        method: str,
        data: Any,
        headers: dict[str, Any] | None = None,
    ) -> ClientResponse:
        response = await self._session.request(
            url=url,
            method=method,
            headers=headers,
            data=data,
        )

        logger.error(await response.text())
        response.raise_for_status()

        return response

    @classmethod
    def build(cls) -> LocationGuesserClient:
        return LocationGuesserClient(
            host=location_guesser_settings.HOST,
        )
