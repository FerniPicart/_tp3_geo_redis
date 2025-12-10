import redis
from config import REDIS_HOST, REDIS_PORT, REDIS_DB

class RedisService:
    def __init__(self):
        self.client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=True
        )

    def agregar_lugar(self, grupo: str, nombre: str, lat: float, lon: float) -> bool:
        """
        Agrega (o actualiza) un punto geoespacial en Redis. 
        Redis GEOADD espera:  longitude, latitude, member
        Devuelve True si la operación fue ejecutada (no necesariamente insertó un nuevo miembro).
        """
        key = f"geo:{grupo}"
        try:
            # Usar execute_command directamente para evitar el bug de redis-py
            self.client. execute_command('GEOADD', key, lon, lat, nombre)
            return True
        except Exception as e: 
            print("redis. geoadd error:", e)
            return False

    def obtener_cercanos(self, grupo:  str, lat: float, lon:  float, radio_km: float = 5):
        """
        Devuelve una lista de resultados desde Redis con distancias y coordenadas.
        Uso de GEORADIUS para compatibilidad amplia.
        Resultado típico por elemento: (member, distance, (lon, lat)) o (member, distance)
        """
        key = f"geo:{grupo}"
        try:
            # georadius:  key, longitude, latitude, radius, unit
            res = self.client.georadius(
                key,
                lon,
                lat,
                radio_km,
                unit="km",
                withdist=True,
                withcoord=True
            )
            return res  # lista (member, dist, (lon, lat))
        except Exception as e: 
            print("redis.georadius error:", e)
            return []

    def distancia(self, grupo: str, nombre: str, lat: float, lon: float):
        """
        Calcula la distancia (km) entre un miembro existente y las coordenadas del usuario.
        Estrategia: añadir temporalmente un miembro "__usuario_temp__" en el mismo key,
        pedir GEODIST entre el miembro y este temporal, y luego eliminarlo.
        Devuelve float (km) o None si no existe el miembro.
        """
        key = f"geo:{grupo}"
        tmp_member = "__usuario_temp__"
        try:
            # Usar execute_command para evitar el bug
            self.client.execute_command('GEOADD', key, lon, lat, tmp_member)

            # Calcular distancia entre el miembro y el temporal
            dist = self.client.geodist(key, nombre, tmp_member, unit="km")

            # Eliminar temporal
            try: 
                self.client.zrem(key, tmp_member)
            except Exception:
                # si falla el borrado, no queremos que rompa la respuesta
                pass

            if dist is None:
                return None

            # geodist puede devolver string/float; aseguramos float
            return float(dist)
        except Exception as e:
            print("redis.geodist error:", e)
            # intentar limpiar por si quedó el temp
            try:
                self.client. zrem(key, tmp_member)
            except Exception: 
                pass
            return None

    def obtener_todos_los_lugares(self):
        """
        Obtiene todos los lugares agrupados por categoría. 
        Retorna un diccionario con la estructura:
        {
            "grupo1": [{"nombre": "x", "lat": y, "lon": z}, ...],
            "grupo2": [...]
        }
        """
        try:
            # Grupos conocidos (puedes agregar más)
            grupos = ["cervecerias", "universidades", "farmacias", "emergencias", "supermercados"]
            resultado = {}
            total = 0
            
            for grupo in grupos:
                key = f"geo:{grupo}"
                # Usar ZRANGE para obtener todos los miembros del sorted set
                miembros = self.client.zrange(key, 0, -1)
                
                if miembros:
                    lugares = []
                    for miembro in miembros:
                        # Obtener las coordenadas de cada miembro
                        coords = self.client.geopos(key, miembro)
                        if coords and coords[0]:
                            lon, lat = coords[0]
                            lugares.append({
                                "nombre": miembro,
                                "lat": float(lat),
                                "lon": float(lon)
                            })
                    
                    if lugares:
                        resultado[grupo] = lugares
                        total += len(lugares)
            
            return {"grupos": resultado, "total": total}
        except Exception as e:
            print(f"Error obteniendo todos los lugares: {e}")
            return {"grupos": {}, "total": 0}

# instancia singleton para importar
redis_service = RedisService()