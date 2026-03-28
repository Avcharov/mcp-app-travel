from typing import Any

from domain.place.models import Place
from outbound.google_maps import GoogleMapsClient
from outbound.google_routes import GoogleRoutesClient


class PlacesService:

    def __init__(
        self,
        *,
        google_maps_client: GoogleMapsClient,
        google_routes_client: GoogleRoutesClient,
    ) -> None:
        self._google_maps_client = google_maps_client
        self._google_routes_client = google_routes_client

    async def find_the_place(
        self,
        *,
        name: str,
    ) -> list[Place]:
        places = await self._google_maps_client.get_places(name=name)

        return [
            Place(
                name=place["name"],
                formatted_address=place["formatted_address"],
                lat=place["geometry"]["location"]["lat"],
                lng=place["geometry"]["location"]["lng"],
                place_id=place["place_id"],
            ) for place in places
        ]

    async def compute_route(
        self,
        *,
        origin_place_id: str,
        destination_place_id: str,
        travel_mode: str,
    ) -> list[dict[str, Any]]:
        response = await self._google_routes_client.compute_route(
            origin_place_id=origin_place_id,
            destination_place_id=destination_place_id,
            travel_mode=travel_mode,
        )
        return response["routes"]

    @classmethod
    def build(self) -> PlacesService:
        return PlacesService(
            google_maps_client=GoogleMapsClient.build(),
            google_routes_client=GoogleRoutesClient.build(),
        )
