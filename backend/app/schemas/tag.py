from pydantic import BaseModel

class TagResponse(BaseModel):
    id: int
    name: str
    slug: str
    usage_count: int
    
    class Config:
        from_attributes = True
