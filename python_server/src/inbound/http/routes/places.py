from typing import Any

from fastapi import APIRouter

from domain.place.models import Place
from domain.place.service import PlacesService
from inbound.http.routes.models import ComputeRouteRequestContract

router = APIRouter(
    prefix="/places",
)


@router.get("/")
async def get_place_by_name(name: str) -> list[Place]:
    return await PlacesService.build().find_the_place(name=name)


@router.post("/compute_route/")
async def compute_route(origin_destination: ComputeRouteRequestContract) -> list[dict[str, Any]]:
    return await PlacesService.build().compute_route(
        origin_place_id=origin_destination.origin_place_id,
        destination_place_id=origin_destination.destination_place_id,
        travel_mode=origin_destination.travel_mode,
    )
