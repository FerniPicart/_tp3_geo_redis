import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { getAllPlaces } from "../services/api";

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math. sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Distance() {
  // Ubicación de referencia (Concepción del Uruguay, Entre Ríos, Argentina)
  const [userLoc, setUserLoc] = useState({ lat: "-32.4833", lon: "-58.2333" });
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await getAllPlaces();
        setPlaces(Array.isArray(all) ? all : []);
      } catch (e) {
        setError(e.message || "No se pudieron cargar lugares");
      }
    })();
  }, []);

  const onCalculate = () => {
    setError(null);
    setResult(null);
    const place = places.find(p => p.name === selected || p.id === selected);
    if (!place) {
      setError("Selecciona un punto válido.");
      return;
    }
    const d = haversineKm(Number(userLoc.lat), Number(userLoc.lon), Number(place.lat), Number(place.lon));
    setResult({ place, distance_km: d. toFixed(3) });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="container-max px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Calcular Distancia</h1>

        {error && <div className="message-error mb-4">{error}</div>}
        {result && (
          <div className="message-success mb-4">
            La distancia al lugar <strong>{result.place.name}</strong> ({result.place.category}) es <strong>{result.distance_km} km</strong>. 
          </div>
        )}

        <div className="max-w-xl space-y-5">
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tu ubicación</h3>
            <p className="text-xs text-gray-500 mb-3">Concepción del Uruguay, Entre Ríos</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitud</label>
                <input 
                  type="number"
                  step="any"
                  value={userLoc.lat} 
                  onChange={(e) => setUserLoc({ ... userLoc, lat: e. target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitud</label>
                <input 
                  type="number"
                  step="any"
                  value={userLoc.lon} 
                  onChange={(e) => setUserLoc({ ...userLoc, lon: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar lugar</label>
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">-- Selecciona un lugar --</option>
              {places.map((p, i) => (
                <option key={i} value={p. name}>{p.name} — {p.category}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={onCalculate}>Calcular Distancia</button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => { window.location.href = "/"; }}
            >
              Volver
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}