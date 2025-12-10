from fastapi import APIRouter, HTTPException
from models.lugares_models import LugarCreate, CercanosRequest, DistanciaRequest
from services.redis_service import redis_service

router = APIRouter()

@router.post("/agregar")
def agregar_lugar(data: LugarCreate):
    ok = redis_service.agregar_lugar(
        grupo=data.grupo,
        nombre=data.nombre,
        lat=data.lat,
        lon=data.lon
    )

    if not ok:
        raise HTTPException(status_code=500, detail="Error al guardar lugar en Redis")

    return {"message": "Lugar agregado correctamente"}

@router.post("/cercanos")
def obtener_cercanos(data: CercanosRequest):
    resultados = redis_service.obtener_cercanos(
        grupo=data.grupo,
        lat=data.lat,
        lon=data.lon,
        radio_km=5
    )

    # normalizar la respuesta: cada item puede tener (member, dist, (lon, lat))
    lugares = []
    for item in resultados:
        # posible formato: [member, dist, [lon, lat]] o (member, dist, (lon, lat))
        try:
            member = item[0]
            dist = float(item[1]) if item[1] is not None else None
            coord = None
            if len(item) >= 3 and item[2]:
                # coord puede venir como [lon, lat] o tuple
                lon_coord, lat_coord = item[2]
                coord = {"lat": float(lat_coord), "lon": float(lon_coord)}
        except Exception:
            # defensivo: si el formato es distinto, intentar convertir de forma simple
            member = item
            dist = None
            coord = None

        lugares.append({
            "nombre": member,
            "distancia_km": round(dist, 3) if dist is not None else None,
            "coord": coord
        })

    return {"cantidad": len(lugares), "lugares": lugares}

@router.post("/distancia")
def obtener_distancia(data: DistanciaRequest):
    dist = redis_service.distancia(
        grupo=data.grupo,
        nombre=data.nombre,
        lat=data.lat_usuario,
        lon=data.lon_usuario
    )

    if dist is None:
        raise HTTPException(status_code=404, detail="Lugar no encontrado o error al calcular distancia")

    return {
        "lugar": data.nombre,
        "distancia_km": round(dist, 6)
    }
