from fastapi import APIRouter

from domain.place.models import Place
from domain.place.service import PlaceSearchService

router = APIRouter(
    prefix="/places",
)


@router.get("/")
async def get_place_by_name(name: str) -> Place:
    return await PlaceSearchService.build().find_the_place(name=name)
