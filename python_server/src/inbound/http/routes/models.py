from enum import StrEnum

from pydantic import BaseModel


class TravelMode(StrEnum):
    TRAVEL_MODE_UNSPECIFIED = "TRAVEL_MODE_UNSPECIFIED"
    DRIVE = "DRIVE"
    BICYCLE = "BICYCLE"
    WALK = "WALK"
    TWO_WHEELER = "TWO_WHEELER"
    TRANSIT = "TRANSIT"


class ComputeRouteRequestContract(BaseModel):
    origin_place_id: str
    destination_place_id: str
    travel_mode: str
