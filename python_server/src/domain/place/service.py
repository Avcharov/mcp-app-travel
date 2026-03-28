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
    ) -> Place:
        places = await self._google_maps_client.get_places(name=name)
        first_place = places[0]

        return Place(
            name=first_place["name"],
            formatted_address=first_place["formatted_address"],
            lat=first_place["geometry"]["location"]["lat"],
            lng=first_place["geometry"]["location"]["lng"],
            place_id=first_place["place_id"],
        )

    @classmethod
    def build(self) -> PlaceSearchService:
        return PlaceSearchService(
            google_maps_client=GoogleMapsClient.build(),
        )
