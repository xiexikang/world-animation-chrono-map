from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.theme import Theme


class ThemeService:
    @classmethod
    async def list_themes(cls, db: AsyncSession) -> list[Theme]:
        stmt = select(Theme).order_by(Theme.sort_order.asc(), Theme.tmdb_genre_id.asc())
        return list((await db.execute(stmt)).scalars().all())
