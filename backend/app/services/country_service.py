from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.anime import Anime
from app.models.country import Country
from app.schemas.country import CountryStatItem


class CountryService:
    @classmethod
    async def list_countries(cls, db: AsyncSession) -> list[Country]:
        stmt = select(Country).order_by(Country.sort_order.asc(), Country.code.asc())
        return list((await db.execute(stmt)).scalars().all())

    @classmethod
    async def anime_counts_by_country(cls, db: AsyncSession) -> list[CountryStatItem]:
        stmt = (
            select(Anime.country_code, func.count())
            .where(Anime.adult.is_(False), Anime.softcore.is_(False))
            .group_by(Anime.country_code)
            .order_by(Anime.country_code.asc())
        )
        rows = (await db.execute(stmt)).all()
        return [CountryStatItem(code=code, total=total) for code, total in rows]
