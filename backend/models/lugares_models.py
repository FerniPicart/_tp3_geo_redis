from pydantic import BaseModel, Field
from typing import Literal

GrupoTipo = Literal[
    "cervecerias",
    "universidades",
    "farmacias",
    "emergencias",
    "supermercados"
]

class LugarCreate(BaseModel):
    grupo: GrupoTipo
    nombre: str = Field(..., min_length=2)
    lat: float
    lon: float

class CercanosRequest(BaseModel):
    grupo: GrupoTipo
    lat: float
    lon: float

class DistanciaRequest(BaseModel):
    grupo: GrupoTipo
    nombre: str
    lat_usuario: float
    lon_usuario: float
