from typing import Any

from pydantic import BaseModel


class Place(BaseModel):
    name: str
    formatted_address: str
    lat: float
    lng: float
    place_id: str


class OriginDestinationRoute(BaseModel):
    origin: Place
    destination: Place | None
    route: dict[str, Any] | None
