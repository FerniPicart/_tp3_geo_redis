import { useState } from "react";
import NavBar from "../components/NavBar";
import { createPlace } from "../services/api";

// Categorías según backend/models/places_models.py (CategoryEnum)
const CATEGORIES = [
  "Cervecerías artesanales",
  "Universidades",
  "Farmacias",
  "Centro de atención de emergencias",
  "Supermercados"
];

// Ubicación de referencia (Concepción del Uruguay, Entre Ríos, Argentina)
const USER_LOCATION = { lat: -32.4833, lon: -58.2333 };

// Genera coordenadas aleatorias dentro de un radio en km
function randomCoordsInRadius(centerLat, centerLon, radiusKm) {
  // Aproximación:  1 grado ≈ 111 km
  const kmPerDegree = 111;
  
  // Generar ángulo aleatorio
  const angle = Math.random() * 2 * Math.PI;
  
  // Generar distancia aleatoria dentro del radio
  const distance = Math.random() * radiusKm;
  
  // Calcular offset en grados
  const deltaLat = (distance / kmPerDegree) * Math.cos(angle);
  const deltaLon = (distance / (kmPerDegree * Math. cos(centerLat * Math.PI / 180))) * Math.sin(angle);
  
  return {
    lat: (centerLat + deltaLat).toFixed(6),
    lon: (centerLon + deltaLon).toFixed(6)
  };
}

export default function Add() {
  const [form, setForm] = useState({ name: "", category: "", lat:  "", lon: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState("5");

  const onChange = (k) => (e) => setForm({ ...form, [k]:  e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await createPlace(form);
      setMsg({ ok: true, text: "Lugar agregado correctamente." });
      setForm({ name:  "", category: "", lat: "", lon: "" });
    } catch (err) {
      setMsg({ ok: false, text: err.message || "Error al crear lugar" });
    } finally {
      setLoading(false);
    }
  };

  const useRandomInRadius = () => {
    const radius = Number(selectedRadius);
    const coords = randomCoordsInRadius(USER_LOCATION.lat, USER_LOCATION.lon, radius);
    setForm({ ...form, lat: coords.lat, lon: coords.lon });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="container-max px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Agregar Lugar</h1>

        {msg && (
          <div className={msg.ok ? "message-success mb-4" : "message-error mb-4"}>{msg.text}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-5 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input 
              type="text"
              value={form.name} 
              onChange={onChange("name")} 
              placeholder="Ej: Palacio San José"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select value={form. category} onChange={onChange("category")} required>
              <option value="">-- Seleccionar --</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Coordenadas</h3>
            
            <div className="flex space-x-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitud</label>
                <input 
                  type="number"
                  step="any"
                  value={form.lat} 
                  onChange={onChange("lat")}
                  placeholder="-32.4833" 
                  required 
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitud</label>
                <input 
                  type="number"
                  step="any"
                  value={form.lon} 
                  onChange={onChange("lon")}
                  placeholder="-58.2333" 
                  required 
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generar coordenadas aleatorias
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Ubicación de referencia:  {USER_LOCATION.lat}, {USER_LOCATION.lon} (Concepción del Uruguay, Entre Ríos)
              </p>
              
              <div className="flex items-center space-x-3">
                <select 
                  value={selectedRadius} 
                  onChange={(e) => setSelectedRadius(e. target.value)}
                  className="flex-1"
                >
                  <option value="5">Dentro de 5 km</option>
                  <option value="50">Dentro de 50 km</option>
                  <option value="100">Dentro de 100 km</option>
                </select>
                
                <button 
                  type="button" 
                  className="btn-secondary whitespace-nowrap"
                  onClick={useRandomInRadius}
                >
                  Generar
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Lugar"}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => { window.location.href = "/"; }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
