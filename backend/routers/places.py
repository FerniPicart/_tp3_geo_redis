"""
Places API router - implements the frontend contract.
Endpoints:
- GET /places - List all places
- POST /places - Create a new place
- GET /places/nearby - Find nearby places
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from models.places_models import PlaceCreate, PlaceOut, PlaceNearbyOut
from storage import places_storage

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/places", response_model=List[PlaceOut], status_code=status.HTTP_200_OK)
def get_places():
    """
    Get all places.
    
    Returns:
        JSON array of PlaceOut objects
    """
    try:
        places = places_storage.get_all_places()
        return places
    except Exception as e:
        logger.error(f"Error getting places: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Error retrieving places from database"}
        )


@router.post("/places", response_model=PlaceOut, status_code=status.HTTP_201_CREATED)
def create_place(place: PlaceCreate):
    """
    Create a new place.
    
    Args:
        place: PlaceCreate model with name, category, lat, lon
        
    Returns:
        PlaceOut model with the created place including its ID
    """
    try:
        new_place = places_storage.add_place(place)
        return new_place
    except ValidationError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": f"Validation error: {str(e)}"}
        )
    except Exception as e:
        logger.error(f"Error creating place: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Error creating place in database"}
        )


@router.get("/places/nearby", response_model=List[PlaceNearbyOut], status_code=status.HTTP_200_OK)
def get_nearby_places(
    lat: float = Query(..., description="Latitude of the reference point"),
    lon: float = Query(..., description="Longitude of the reference point"),
    distance_km: float = Query(5.0, ge=0.1, le=1000, description="Maximum distance in kilometers"),
    category: Optional[str] = Query(None, description="Optional category filter")
):
    """
    Get nearby places within a specified distance.
    
    Query parameters:
        - lat (required): Latitude
        - lon (required): Longitude
        - distance_km (optional): Maximum distance in km (default: 5)
        - category (optional): Filter by category
        
    Returns:
        JSON array of PlaceNearbyOut objects sorted by distance (ascending)
    """
    try:
        nearby_places = places_storage.get_nearby_places(
            lat=lat,
            lon=lon,
            distance_km=distance_km,
            category=category
        )
        return nearby_places
    except Exception as e:
        logger.error(f"Error getting nearby places: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Error retrieving nearby places"}
        )

