from datetime import datetime

from pydantic import BaseModel, Field


class ThemeItem(BaseModel):
    tmdb_genre_id: int = Field(..., ge=1, description="TMDB 类型 ID")
    name: str = Field(..., min_length=1, max_length=64, description="中文名称")
    sort_order: int = Field(..., description="展示排序")
    show_in_tags: bool = Field(..., description="是否参与主题标签与筛选")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
