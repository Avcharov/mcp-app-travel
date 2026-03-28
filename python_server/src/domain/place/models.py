from pydantic import BaseModel


class Place(BaseModel):
    name: str
    formatted_address: str
    lat: float
    lng: float
    place_id: str
