from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Anime(Base):
    __tablename__ = "anime"

    tmdb_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    country_code: Mapped[str] = mapped_column(String(2), primary_key=True)
    adult: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    backdrop_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    poster_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_poster_path: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    original_language: Mapped[str] = mapped_column(String(16), nullable=False, default="")
    original_name: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    name: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    popularity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=0)
    first_air_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    softcore: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    vote_average: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    vote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    genre_ids: Mapped[list] = mapped_column(JSON, nullable=False)
    origin_country: Mapped[list] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
