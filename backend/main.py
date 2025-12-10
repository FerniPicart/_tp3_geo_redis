from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers.lugares_router import router as lugares_router
from routers.places import router as places_router
from services.redis_service import redis_service

app = FastAPI(title="API Turismo - Redis GEO")

# === CORS ===
# Allow frontend development servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register new places router (frontend-facing API)
app.include_router(places_router)

# Keep old lugares router for backwards compatibility
app.include_router(lugares_router, prefix="/lugares")

@app.get("/")
def root():
    return {"status": "API activa"}

@app.get("/redis-ping")
def redis_ping():
    ok = redis_service.client.ping()
    return {"redis_ok": ok}

@app.get("/lugares/todos")
def obtener_todos():
    """
    Endpoint para obtener todos los lugares almacenados en Redis,
    agrupados por categoría.
    """
    try:
        data = redis_service.obtener_todos_los_lugares()
        return data
    except Exception as e: 
        print(f"Error al obtener lugares: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener lugares de la base de datos")
