from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.theme import ThemeItem
from app.services.theme_service import ThemeService

router = APIRouter(prefix="/api/themes", tags=["themes"])


@router.get("", response_model=ApiResponse[list[ThemeItem]])
async def list_themes(
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[ThemeItem]]:
    themes = await ThemeService.list_themes(db)
    return ApiResponse(data=themes)
