from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class AnimeFields(str, Enum):
    full = "full"
    lite = "lite"


class SortBy(str, Enum):
    popularity = "popularity"
    vote_average = "vote_average"
    first_air_date = "first_air_date"
    created_at = "created_at"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


class AnimeFilterRequest(BaseModel):
    keyword: str | None = Field(default=None, description="关键词，匹配 name / original_name")
    country_code: str | None = Field(default=None, min_length=2, max_length=2, description="国家代码")
    genre_id: int | None = Field(default=None, ge=1, description="TMDB 类型 ID，匹配 genre_ids 数组")
    decade: int | None = Field(
        default=None,
        description="年代：70/80/90/00(传0)/10/20，对应 1970s–2020s",
    )
    sort_by: SortBy = Field(default=SortBy.first_air_date, description="排序字段")
    sort_order: SortOrder = Field(default=SortOrder.desc, description="排序方向")

    @field_validator("decade")
    @classmethod
    def validate_decade(cls, value: int | None) -> int | None:
        if value is None:
            return None
        allowed = {70, 80, 90, 0, 10, 20}
        if value not in allowed:
            raise ValueError("decade 必须为 70、80、90、00(0)、10、20 之一")
        return value

    @field_validator("keyword")
    @classmethod
    def strip_keyword(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("country_code")
    @classmethod
    def upper_country_code(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.upper()


class AnimeListMeta(BaseModel):
    total: int
    max_updated_at: datetime | None


class AnimeListRequest(AnimeFilterRequest):
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=100, ge=1, le=300, description="每页条数")
    fields: AnimeFields = Field(default=AnimeFields.lite, description="列表字段集：lite 省略大字段")


class AnimeItemLite(BaseModel):
    tmdb_id: int
    country_code: str
    poster_path: str | None
    full_poster_path: str
    original_name: str
    name: str
    popularity: Decimal
    first_air_date: date | None
    vote_average: Decimal
    genre_ids: list[Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnimeItem(AnimeItemLite):
    adult: bool
    backdrop_path: str | None
    original_language: str
    overview: str | None
    softcore: bool
    vote_count: int
    origin_country: list[Any]

    model_config = {"from_attributes": True}
