from domain.place.models import Place
from outbound.google_maps.client import GoogleMapsClient


class PlaceSearchService:

    def __init__(
        self,
        *,
        google_maps_client: GoogleMapsClient,
    ) -> None:
        self._google_maps_client = google_maps_client

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

    @classmethod
    def build(self) -> PlaceSearchService:
        return PlaceSearchService(
            google_maps_client=GoogleMapsClient.build(),
        )
