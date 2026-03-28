from typing import Any

from aiohttp import ClientResponse, ClientSession

from infrastructure.http import HTTPSessionManager
from infrastructure.settings import google_settings


class GoogleRoutesClient:

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
                base_url="https://routes.googleapis.com/directions/",
            )
            manager.add(http_session_name, self._session)
        else:
            self._session = session

    async def compute_route(
        self,
        origin_place_id: str,
        destination_place_id: str,
        travel_mode: str,
    ) -> dict[str, Any]:
        response = await self._request(
            url="v2:computeRoutes",
            method="POST",
            body={
                "origin": {
                    "placeId": origin_place_id,
                },
                "destination": {
                    "placeId": destination_place_id,
                },
                "travelMode": travel_mode,
            },
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": self._api_key,
                "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline",
            }
        )
        return await response.json()

    async def _request(
        self,
        *,
        url: str,
        method: str,
        headers: dict[str, Any] | None = None,
        query_params: dict[str, Any] | None = None,
        body: dict[str, Any] | None = None,
    ) -> ClientResponse:
        response = await self._session.request(
            url=url,
            method=method,
            params=query_params,
            headers=headers,
            json=body,
        )

        response.raise_for_status()

        return response

    @classmethod
    def build(cls) -> GoogleRoutesClient:
        return GoogleRoutesClient(
            api_key=google_settings.API_TOKEN,
        )
