"""
Basic tests for the Places API.
Tests the core functionality: creating places and listing them.
"""
import pytest
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_get_places_initially_empty_or_existing():
    """Test GET /places returns a list (may be empty or have existing data)."""
    response = client.get("/places")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_place():
    """Test POST /places creates a new place."""
    place_data = {
        "name": "Test Coffee Shop",
        "category": "cafe",
        "lat": 40.7128,
        "lon": -74.0060
    }
    
    response = client.post("/places", json=place_data)
    assert response.status_code == 201
    
    data = response.json()
    assert "id" in data
    assert data["name"] == place_data["name"]
    assert data["category"] == place_data["category"]
    assert data["lat"] == place_data["lat"]
    assert data["lon"] == place_data["lon"]


def test_create_and_retrieve_place():
    """Test that a created place appears in GET /places."""
    # Create a place
    place_data = {
        "name": "Test Restaurant",
        "category": "restaurant",
        "lat": 41.3851,
        "lon": 2.1734
    }
    
    create_response = client.post("/places", json=place_data)
    assert create_response.status_code == 201
    created_place = create_response.json()
    place_id = created_place["id"]
    
    # Retrieve all places
    get_response = client.get("/places")
    assert get_response.status_code == 200
    
    places = get_response.json()
    # Check that our created place is in the list
    found = any(p["id"] == place_id for p in places)
    assert found, f"Created place with id {place_id} not found in GET /places"


def test_create_place_invalid_data():
    """Test POST /places with missing required fields returns error."""
    invalid_data = {
        "name": "Invalid Place",
        # Missing category, lat, lon
    }
    
    response = client.post("/places", json=invalid_data)
    assert response.status_code == 422  # Unprocessable Entity


def test_get_nearby_places():
    """Test GET /places/nearby with required parameters."""
    # First create a place
    place_data = {
        "name": "Nearby Test Place",
        "category": "test",
        "lat": 40.7128,
        "lon": -74.0060
    }
    client.post("/places", json=place_data)
    
    # Search nearby (same coordinates)
    response = client.get(
        "/places/nearby",
        params={
            "lat": 40.7128,
            "lon": -74.0060,
            "distance_km": 10
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Check that results include distance_km field
    if len(data) > 0:
        assert "distance_km" in data[0]


def test_get_nearby_places_missing_params():
    """Test GET /places/nearby without required params returns error."""
    response = client.get("/places/nearby")
    assert response.status_code == 422  # Missing required query params


def test_get_nearby_places_with_category_filter():
    """Test GET /places/nearby with category filter."""
    response = client.get(
        "/places/nearby",
        params={
            "lat": 40.7128,
            "lon": -74.0060,
            "distance_km": 100,
            "category": "restaurant"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # All results should have the specified category
    for place in data:
        assert place["category"] == "restaurant"



