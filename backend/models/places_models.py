from enum import Enum
from pydantic import BaseModel, Field

class CategoryEnum(str, Enum):
    CERVECERIAS = "Cervecerías artesanales"
    UNIVERSIDADES = "Universidades"
    FARMACIAS = "Farmacias"
    EMERGENCIAS = "Centro de atención de emergencias"
    SUPERMERCADOS = "Supermercados"

class PlaceCreate(BaseModel):
    """Schema for creating a new place."""
    name: str = Field(..., min_length=1, description="Name of the place")
    category: CategoryEnum = Field(..., description="Category of the place")
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")


class PlaceOut(BaseModel):
    """Schema for place output."""
    id: str = Field(..., description="Unique identifier")
    name: str = Field(..., description="Name of the place")
    # Keep output as string to be resilient with existing data storage; pydantic will
    # still serialize the enum value as its string.
    category: str = Field(..., description="Category of the place")
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")


class PlaceNearbyOut(PlaceOut):
    """Schema for nearby place output with distance."""
    distance_km: float = Field(..., description="Distance in kilometers")