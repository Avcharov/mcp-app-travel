from pydantic import BaseModel


class ComputeRouteRequestContract(BaseModel):
    origin_place_id: str
    destination_place_id: str
    travel_mode: str
