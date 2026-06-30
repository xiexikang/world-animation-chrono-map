from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.country import CountryItem, CountryStatItem
from app.services.country_service import CountryService

router = APIRouter(prefix="/api/countries", tags=["countries"])


@router.get("/stats", response_model=ApiResponse[list[CountryStatItem]])
async def country_stats(
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[CountryStatItem]]:
    stats = await CountryService.anime_counts_by_country(db)
    return ApiResponse(data=stats)


@router.get("", response_model=ApiResponse[list[CountryItem]])
async def list_countries(
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[CountryItem]]:
    countries = await CountryService.list_countries(db)
    return ApiResponse(data=countries)
