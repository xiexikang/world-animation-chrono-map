from datetime import datetime

from pydantic import BaseModel


class CountryItem(BaseModel):
    code: str
    name: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CountryStatItem(BaseModel):
    code: str
    total: int
