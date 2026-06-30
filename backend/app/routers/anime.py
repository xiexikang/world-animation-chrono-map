from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.anime import (
    AnimeFields,
    AnimeFilterRequest,
    AnimeItem,
    AnimeItemLite,
    AnimeListMeta,
    AnimeListRequest,
)
from app.schemas.common import ApiResponse, PaginatedData
from app.services.anime_service import AnimeService

router = APIRouter(prefix="/api/animes", tags=["animes"])


@router.post("", response_model=ApiResponse[PaginatedData[AnimeItemLite]])
async def list_animes(
    body: AnimeListRequest,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[PaginatedData[AnimeItemLite]]:
    data = await AnimeService.list_animes(db, body)
    if body.fields == AnimeFields.full:
        data.items = [AnimeItem.model_validate(row) for row in data.items]
    else:
        data.items = [AnimeItemLite.model_validate(row) for row in data.items]
    return ApiResponse(data=data)


@router.post("/meta", response_model=ApiResponse[AnimeListMeta])
async def list_animes_meta(
    body: AnimeFilterRequest,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[AnimeListMeta]:
    data = await AnimeService.list_animes_meta(db, body)
    return ApiResponse(data=data)


@router.get("/{tmdb_id}/{country_code}", response_model=ApiResponse[AnimeItem])
async def get_anime_detail(
    tmdb_id: int = Path(..., ge=1, description="TMDB TV 条目 ID"),
    country_code: str = Path(..., min_length=2, max_length=2, description="国家代码"),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[AnimeItem]:
    anime = await AnimeService.get_anime(db, tmdb_id, country_code.upper())
    if anime is None:
        raise HTTPException(status_code=404, detail="动画不存在")
    return ApiResponse(data=anime)
