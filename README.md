# Geo Redis API - Backend

Backend API para gestión de lugares con búsqueda geoespacial usando FastAPI, Redis y Docker.

## 🚀 Características

- **API REST** con FastAPI
- **Almacenamiento en Redis** usando hash para lugares
- **Búsqueda geoespacial** con cálculo de distancias (Haversine)
- **Validación con Pydantic**
- **CORS** configurado para desarrollo frontend
- **Dockerizado** para fácil despliegue

## 📋 Requisitos

- Docker y Docker Compose
- Python 3.10+ (para desarrollo local)

## 🔧 Configuración

### Variables de Entorno

El backend utiliza las siguientes variables de entorno:

```bash
REDIS_HOST=redis      # Hostname del servidor Redis (default: redis)
REDIS_PORT=6379       # Puerto de Redis (default: 6379)
```

### Archivo `.env` (opcional para desarrollo local)

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🐳 Uso con Docker Compose

### Levantar los servicios

```bash
docker-compose up --build
```

Esto iniciará:
- **Redis**: Puerto 6379
- **Backend API**: Puerto 8000
- **Frontend** (si está configurado): Puerto 3000

### Detener los servicios

```bash
docker-compose down
```

## 🔌 API Endpoints

### Base URL

```
http://localhost:8000
```

### 1. Listar todos los lugares

**GET** `/places`

**Respuesta**: `200 OK`

```json
[
  {
    "id": "uuid-string",
    "name": "Central Park",
    "category": "park",
    "lat": 40.785091,
    "lon": -73.968285
  }
]
```

### 2. Crear un lugar

**POST** `/places`

**Request Body**:
```json
{
  "name": "Brooklyn Museum",
  "category": "museum",
  "lat": 40.671389,
  "lon": -73.963611
}
```

**Respuesta**: `201 Created`

```json
{
  "id": "generated-uuid",
  "name": "Brooklyn Museum",
  "category": "museum",
  "lat": 40.671389,
  "lon": -73.963611
}
```

**Errores**:
- `422 Unprocessable Entity`: Datos de entrada inválidos
- `500 Internal Server Error`: Error del servidor

```json
{
  "error": "mensaje de error"
}
```

### 3. Buscar lugares cercanos

**GET** `/places/nearby?lat={lat}&lon={lon}&distance_km={distance}&category={category}`

**Query Parameters**:
- `lat` (requerido): Latitud del punto de referencia
- `lon` (requerido): Longitud del punto de referencia
- `distance_km` (opcional): Radio de búsqueda en kilómetros (default: 5)
- `category` (opcional): Filtrar por categoría

**Ejemplo**:
```bash
GET /places/nearby?lat=40.7128&lon=-74.0060&distance_km=10&category=restaurant
```

**Respuesta**: `200 OK`

```json
[
  {
    "id": "uuid-string",
    "name": "Italian Bistro",
    "category": "restaurant",
    "lat": 40.7150,
    "lon": -74.0080,
    "distance_km": 0.342
  },
  {
    "id": "uuid-string-2",
    "name": "Sushi Place",
    "category": "restaurant",
    "lat": 40.7100,
    "lon": -74.0050,
    "distance_km": 0.521
  }
]
```

**Nota**: Los resultados están ordenados por distancia (ascendente).

## 🧪 Pruebas

### Ejecutar tests

Con Docker (recomendado):

```bash
docker-compose exec backend pytest tests/ -v
```

Desarrollo local:

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

### Pruebas manuales con curl

```bash
# 1. Verificar que el API está activa
curl http://localhost:8000/

# 2. Listar lugares (inicialmente vacío)
curl http://localhost:8000/places

# 3. Crear un lugar
curl -X POST http://localhost:8000/places \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Place",
    "category": "cafe",
    "lat": 40.7128,
    "lon": -74.0060
  }'

# 4. Listar lugares (debe incluir el creado)
curl http://localhost:8000/places

# 5. Buscar lugares cercanos
curl "http://localhost:8000/places/nearby?lat=40.7128&lon=-74.0060&distance_km=5"
```

## 📊 Estructura del Proyecto

```
backend/
├── main.py                 # Aplicación FastAPI principal
├── config.py              # Configuración (Redis, env vars)
├── storage.py             # Módulo de almacenamiento en Redis
├── requirements.txt       # Dependencias Python
├── Dockerfile            # Imagen Docker
├── models/
│   ├── places_models.py  # Schemas Pydantic para Places API
│   └── lugares_models.py # Schemas legacy (compatibilidad)
├── routers/
│   ├── places.py         # Router Places API (frontend)
│   └── lugares_router.py # Router legacy (compatibilidad)
├── services/
│   └── redis_service.py  # Servicio Redis GEO (legacy)
└── tests/
    └── test_places_api.py # Tests básicos
```

## �� Migración y Compatibilidad

El backend mantiene dos APIs:

1. **Nueva API** (`/places`): Compatible con el frontend Next.js
   - Usa almacenamiento simple en Redis hash
   - Cálculo de distancia con fórmula de Haversine
   - Respuestas JSON limpias

2. **API Legacy** (`/lugares`): Mantiene compatibilidad con código anterior
   - Usa Redis GEO commands
   - Endpoints: `/lugares/agregar`, `/lugares/cercanos`, etc.

## 🛠️ Desarrollo Local (sin Docker)

### Instalar Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

### Ejecutar el servidor

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📝 Notas de Implementación

### Almacenamiento Redis

La nueva API usa un enfoque simple de Redis hash:
- **Key**: `places`
- **Fields**: UUIDs de lugares
- **Values**: JSON strings de los datos del lugar

```
HSET places <uuid> '{"id":"<uuid>","name":"...","category":"...","lat":...,"lon":...}'
```

Este enfoque es suficiente para datasets pequeños/medianos. Para datasets grandes o búsquedas geoespaciales más complejas, se puede migrar a Redis GEO commands o RediSearch.

### Cálculo de Distancias

Usa la **fórmula de Haversine** para calcular la distancia del círculo máximo entre dos puntos en la Tierra:

```python
distance = R * 2 * atan2(sqrt(a), sqrt(1-a))
```

Donde:
- R = radio de la Tierra (6371 km)
- a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)

Precisión: ±0.5% para la mayoría de los casos de uso.

## 🐛 Troubleshooting

### Redis connection refused

```bash
# Verificar que Redis está corriendo
docker-compose ps

# Ver logs de Redis
docker-compose logs redis
```

### CORS errors en el frontend

Verificar que `allow_origins` en `main.py` incluya la URL del frontend:

```python
allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
```

### Puerto 8000 ya en uso

```bash
# Cambiar el puerto en docker-compose.yml
ports:
  - "8001:8000"  # host:container
```

## 📄 Licencia

Este proyecto es de código abierto.

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📧 Contacto

Para preguntas o sugerencias, abrir un issue en el repositorio.
