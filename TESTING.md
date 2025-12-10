# Manual Testing Guide

This document provides instructions for manually testing the Places API endpoints.

## Prerequisites

1. Start Docker services:
   ```bash
   docker-compose up --build
   ```

2. Or start services locally:
   ```bash
   # Start Redis
   redis-server --port 6379
   
   # Start backend
   cd backend
   REDIS_HOST=localhost uvicorn main:app --reload --port 8000
   ```

## API Endpoints Testing

### 1. Check API is Running

```bash
curl http://localhost:8000/
```

Expected response:
```json
{"status": "API activa"}
```

### 2. GET /places (List all places - initially empty)

```bash
curl http://localhost:8000/places
```

Expected response:
```json
[]
```

### 3. POST /places (Create a place)

```bash
curl -X POST http://localhost:8000/places \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Central Park",
    "category": "park",
    "lat": 40.785091,
    "lon": -73.968285
  }'
```

Expected response (201 Created):
```json
{
  "id": "some-uuid-here",
  "name": "Central Park",
  "category": "park",
  "lat": 40.785091,
  "lon": -73.968285
}
```

### 4. POST /places (Create more places for testing)

```bash
# Brooklyn Museum
curl -X POST http://localhost:8000/places \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Brooklyn Museum",
    "category": "museum",
    "lat": 40.671389,
    "lon": -73.963611
  }'

# Times Square
curl -X POST http://localhost:8000/places \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Times Square",
    "category": "landmark",
    "lat": 40.758896,
    "lon": -73.985130
  }'

# Italian Restaurant
curl -X POST http://localhost:8000/places \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carbone",
    "category": "restaurant",
    "lat": 40.725033,
    "lon": -73.999600
  }'
```

### 5. GET /places (List all places - should have data)

```bash
curl http://localhost:8000/places
```

Expected response:
```json
[
  {
    "id": "uuid-1",
    "name": "Central Park",
    "category": "park",
    "lat": 40.785091,
    "lon": -73.968285
  },
  {
    "id": "uuid-2",
    "name": "Brooklyn Museum",
    "category": "museum",
    "lat": 40.671389,
    "lon": -73.963611
  },
  ...
]
```

### 6. GET /places/nearby (Find nearby places)

Search near Times Square (40.758896, -73.985130):

```bash
curl "http://localhost:8000/places/nearby?lat=40.758896&lon=-73.985130&distance_km=5"
```

Expected response:
```json
[
  {
    "id": "uuid-3",
    "name": "Times Square",
    "category": "landmark",
    "lat": 40.758896,
    "lon": -73.98513,
    "distance_km": 0.0
  },
  {
    "id": "uuid-4",
    "name": "Carbone",
    "category": "restaurant",
    "lat": 40.725033,
    "lon": -73.9996,
    "distance_km": 3.899
  },
  {
    "id": "uuid-1",
    "name": "Central Park",
    "category": "park",
    "lat": 40.785091,
    "lon": -73.968285,
    "distance_km": 3.127
  }
]
```

### 7. GET /places/nearby (With category filter)

```bash
curl "http://localhost:8000/places/nearby?lat=40.758896&lon=-73.985130&distance_km=10&category=restaurant"
```

Expected response (only restaurants):
```json
[
  {
    "id": "uuid-4",
    "name": "Carbone",
    "category": "restaurant",
    "lat": 40.725033,
    "lon": -73.9996,
    "distance_km": 3.899
  }
]
```

### 8. POST /places (Invalid data - missing fields)

```bash
curl -X POST http://localhost:8000/places \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Place"
  }'
```

Expected response (422 Unprocessable Entity):
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "category"],
      "msg": "Field required",
      ...
    },
    ...
  ]
}
```

### 9. GET /places/nearby (Missing required parameters)

```bash
curl "http://localhost:8000/places/nearby"
```

Expected response (422 Unprocessable Entity):
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "lat"],
      "msg": "Field required",
      ...
    },
    ...
  ]
}
```

## Testing with Frontend

1. Make sure backend is running on port 8000
2. In your frontend Next.js project, set the API base URL:
   ```bash
   export NEXT_PUBLIC_API_BASE=http://localhost:8000
   # or add to .env.local
   ```

3. Start the frontend:
   ```bash
   npm run dev
   ```

4. Test the following frontend flows:
   - **Home**: Should load and show empty/existing places
   - **Add Place**: Create a new place and verify it appears in the list
   - **Nearby Search**: Search for places near a location
   - **Distance Check**: Calculate distance to a specific place

## CORS Verification

Test CORS headers from frontend:

```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/places -v
```

Expected headers in response:
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Methods: *`
- `Access-Control-Allow-Headers: *`

## API Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Troubleshooting

### Redis Connection Error

If you see "Error connecting to Redis":
1. Check Redis is running: `redis-cli ping` (should return "PONG")
2. Check REDIS_HOST and REDIS_PORT environment variables
3. For Docker: make sure the `redis` service is running

### Port Already in Use

If port 8000 is already in use:
```bash
# Find process using port 8000
lsof -ti:8000
# Kill the process
kill -9 <PID>
```

### CORS Errors

If frontend shows CORS errors:
1. Check backend CORS configuration in `main.py`
2. Verify frontend is running on http://localhost:3000 or http://127.0.0.1:3000
3. Add the frontend origin to the CORS allowed origins list
