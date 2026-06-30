import math

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.anime import Anime
from app.schemas.anime import AnimeFilterRequest, AnimeListMeta, AnimeListRequest, SortBy, SortOrder
from app.schemas.common import PaginatedData, PaginationMeta


class AnimeService:
    DECADE_YEAR_RANGES: dict[int, tuple[int, int]] = {
        70: (1970, 1979),
        80: (1980, 1989),
        90: (1990, 1999),
        0: (2000, 2009),  # 前端 00 年代
        10: (2010, 2019),
        20: (2020, 2029),
    }

    SORT_COLUMNS = {
        SortBy.popularity: Anime.popularity,
        SortBy.vote_average: Anime.vote_average,
        SortBy.first_air_date: Anime.first_air_date,
        SortBy.created_at: Anime.created_at,
    }

    @classmethod
    def _build_filters(cls, params: AnimeFilterRequest):
        filters = [
            Anime.adult.is_(False),
            Anime.softcore.is_(False),
        ]

        if params.country_code:
            filters.append(Anime.country_code == params.country_code)

        if params.keyword:
            pattern = f"%{params.keyword}%"
            filters.append(or_(Anime.name.like(pattern), Anime.original_name.like(pattern)))

        if params.genre_id is not None:
            filters.append(func.json_contains(Anime.genre_ids, str(params.genre_id)))

        if params.decade is not None:
            start_year, end_year = cls.DECADE_YEAR_RANGES[params.decade]
            filters.append(func.year(Anime.first_air_date).between(start_year, end_year))

        return filters

    @classmethod
    async def list_animes(cls, db: AsyncSession, params: AnimeListRequest) -> PaginatedData:
        filters = cls._build_filters(params)

        count_stmt = select(func.count()).select_from(Anime).where(*filters)
        total = (await db.execute(count_stmt)).scalar_one()

        sort_column = cls.SORT_COLUMNS[params.sort_by]
        order_expr = sort_column.asc() if params.sort_order == SortOrder.asc else sort_column.desc()

        offset = (params.page - 1) * params.page_size
        list_stmt = (
            select(Anime)
            .where(*filters)
            .order_by(order_expr, Anime.tmdb_id.desc())
            .offset(offset)
            .limit(params.page_size)
        )

        rows = (await db.execute(list_stmt)).scalars().all()
        total_pages = math.ceil(total / params.page_size) if total else 0

        return PaginatedData(
            items=rows,
            pagination=PaginationMeta(
                page=params.page,
                page_size=params.page_size,
                total=total,
                total_pages=total_pages,
            ),
        )

    @classmethod
    async def list_animes_meta(cls, db: AsyncSession, params: AnimeFilterRequest) -> AnimeListMeta:
        filters = cls._build_filters(params)

        count_stmt = select(func.count()).select_from(Anime).where(*filters)
        total = (await db.execute(count_stmt)).scalar_one()

        max_stmt = select(func.max(Anime.updated_at)).where(*filters)
        max_updated_at = (await db.execute(max_stmt)).scalar_one()

        return AnimeListMeta(total=total, max_updated_at=max_updated_at)

    @classmethod
    async def get_anime(cls, db: AsyncSession, tmdb_id: int, country_code: str) -> Anime | None:
        stmt = select(Anime).where(
            Anime.tmdb_id == tmdb_id,
            Anime.country_code == country_code,
            Anime.adult.is_(False),
            Anime.softcore.is_(False),
        )
        return (await db.execute(stmt)).scalar_one_or_none()
