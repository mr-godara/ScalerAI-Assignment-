from pydantic import BaseModel, Field
from typing import TypeVar, Generic, Tuple, List

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="1-based page number.")
    page_size: int = Field(default=50, ge=1, le=300, description="Number of results per page.")

def paginate(query, params: PaginationParams) -> tuple[list, int]:
    total = query.count()
    items = query.offset((params.page - 1) * params.page_size).limit(params.page_size).all()
    return items, total
