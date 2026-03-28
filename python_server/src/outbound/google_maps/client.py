from typing import Any
from urllib.parse import urljoin

from aiohttp import ClientResponse, ClientSession

from infrastructure.http import HTTPSessionManager
from infrastructure.settings import google_map_settings


class GoogleMapsClient:

    def __init__(
        self,
        *,
        api_key: str,
    ) -> None:
        self._api_key = api_key
        manager = HTTPSessionManager()
        http_session_name = self.__class__.__name__

        if not (session := manager.get(http_session_name)):
            self._session = ClientSession(
                base_url="https://maps.googleapis.com/maps/api/",
            )
            manager.add(http_session_name, self._session)
        else:
            self._session = session

    async def get_places(self, name: str) -> list[dict[str, Any]]:
        response = await self._request(
            url="place/textsearch/json",
            method="GET",
            query_params={
                "query": name,
                "key": self._api_key,
            }
        )
        body = await response.json()
        return body["results"]

    async def _request(
        self,
        *,
        url: str,
        method: str,
        query_params: dict[str, Any],
    ) -> ClientResponse:
        response = await self._session.request(
            url=url,
            method=method,
            params=query_params,
        )
        body = await response.json()

        response.raise_for_status()
        if not body["status"] == "OK":
            raise Exception(body)

        return response

    @classmethod
    def build(cls) -> GoogleMapsClient:
        return GoogleMapsClient(
            api_key=google_map_settings.API_TOKEN,
        )
