"""
Storage module for places using Redis hash.
Uses a simple Redis hash 'places' where each field is an ID and the value is a JSON string.
"""
import json
import uuid
import logging
from typing import List, Optional
import math

from config import REDIS_HOST, REDIS_PORT, REDIS_DB
from models.places_models import PlaceCreate, PlaceOut, PlaceNearbyOut
import redis

# Configure logging
logger = logging.getLogger(__name__)

# Earth's radius in kilometers (for Haversine distance calculation)
EARTH_RADIUS_KM = 6371.0


class PlacesStorage:
    """Storage class for managing places in Redis."""
    
    def __init__(self):
        self.client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=True
        )
        self.hash_key = "places"
    
    def add_place(self, create: PlaceCreate) -> PlaceOut:
        """
        Add a new place to Redis.
        
        Args:
            create: PlaceCreate model with place data
            
        Returns:
            PlaceOut model with the created place including its ID
        """
        # Generate unique ID
        place_id = str(uuid.uuid4())
        
        # Create PlaceOut object
        place = PlaceOut(
            id=place_id,
            name=create.name,
            category=create.category,
            lat=create.lat,
            lon=create.lon
        )
        
        # Store as JSON string in Redis hash
        self.client.hset(
            self.hash_key,
            place_id,
            place.model_dump_json()
        )
        
        return place
    
    def get_all_places(self) -> List[PlaceOut]:
        """
        Get all places from Redis.
        
        Returns:
            List of PlaceOut models
        """
        # Get all hash values
        places_data = self.client.hgetall(self.hash_key)
        
        places = []
        for place_id, place_json in places_data.items():
            try:
                place_dict = json.loads(place_json)
                places.append(PlaceOut(**place_dict))
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Error parsing place {place_id}: {e}")
                continue
        
        return places
    
    def get_place(self, place_id: str) -> Optional[PlaceOut]:
        """
        Get a single place by ID.
        
        Args:
            place_id: The place ID
            
        Returns:
            PlaceOut model or None if not found
        """
        place_json = self.client.hget(self.hash_key, place_id)
        
        if place_json is None:
            return None
        
        try:
            place_dict = json.loads(place_json)
            return PlaceOut(**place_dict)
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing place {place_id}: {e}")
            return None
    
    def get_nearby_places(
        self,
        lat: float,
        lon: float,
        distance_km: float = 5.0,
        category: Optional[str] = None
    ) -> List[PlaceNearbyOut]:
        """
        Get nearby places within a specified distance.
        Uses Haversine formula to calculate distances.
        
        Args:
            lat: User's latitude
            lon: User's longitude
            distance_km: Maximum distance in kilometers (default: 5)
            category: Optional category filter
            
        Returns:
            List of PlaceNearbyOut models sorted by distance (ascending)
        """
        all_places = self.get_all_places()
        
        nearby_places = []
        for place in all_places:
            # Filter by category if specified
            if category and place.category != category:
                continue
            
            # Calculate distance using Haversine formula
            dist = self._haversine_distance(lat, lon, place.lat, place.lon)
            
            # Filter by distance
            if dist <= distance_km:
                nearby_places.append(
                    PlaceNearbyOut(
                        id=place.id,
                        name=place.name,
                        category=place.category,
                        lat=place.lat,
                        lon=place.lon,
                        distance_km=round(dist, 3)
                    )
                )
        
        # Sort by distance (ascending)
        nearby_places.sort(key=lambda p: p.distance_km)
        
        return nearby_places
    
    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points on Earth.
        Uses the Haversine formula.
        
        Args:
            lat1, lon1: First point coordinates
            lat2, lon2: Second point coordinates
            
        Returns:
            Distance in kilometers
        """
        # Convert degrees to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Differences
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Haversine formula
        a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        distance = EARTH_RADIUS_KM * c
        return distance


# Singleton instance
places_storage = PlacesStorage()
