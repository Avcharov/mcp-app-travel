import logging
from itertools import batched, pairwise
from typing import Any

from domain.place.models import OriginDestinationRoute, Place
from outbound.google_maps import GoogleMapsClient
from outbound.google_routes import GoogleRoutesClient
from outbound.location_guesser import LocationGuesserClient

logger = logging.getLogger(__name__)


class PlacesService:

    def __init__(
        self,
        *,
        google_maps_client: GoogleMapsClient,
        google_routes_client: GoogleRoutesClient,
        location_guesser_client: LocationGuesserClient,
    ) -> None:
        self._google_maps_client = google_maps_client
        self._google_routes_client = google_routes_client
        self._location_guesser_client = location_guesser_client

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

    async def predict_places_by_image(
        self,
        *,
        images: list[bytes],
    ) -> list[OriginDestinationRoute]:
        place_names = set()
        for image in images:
            predicted_place = await self._location_guesser_client.predict(image=image)
            place_names.add(f'{predicted_place["country"]}, {predicted_place["city"]}')
        logger.info(place_names)
        place_information = [(await self.find_the_place(name=name))[0] for name in place_names]

        if len(place_information) == 1:
            return [
                OriginDestinationRoute(
                    origin=place_information[0],
                    destination=None,
                    route=None,
                )
            ]

        routes = []
        for origin, destination in pairwise(place_information):
            routes.append(
                OriginDestinationRoute(
                    origin=origin,
                    destination=destination,
                    route=(await self.compute_route(
                        origin_place_id=origin.place_id,
                        destination_place_id=destination.place_id,
                        travel_mode="DRIVE",
                    ))[0],
                )
            )

        return routes

    @classmethod
    def build(self) -> PlacesService:
        return PlacesService(
            google_maps_client=GoogleMapsClient.build(),
            google_routes_client=GoogleRoutesClient.build(),
            location_guesser_client=LocationGuesserClient.build(),
        )
