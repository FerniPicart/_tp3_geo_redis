import { useState } from "react";
import NavBar from "../components/NavBar";
import { getNearby, getAllPlaces } from "../services/api";

// Categorías (de backend/models/places_models.py)
const CATEGORIES = [
  "Cervecerías artesanales",
  "Universidades",
  "Farmacias",
  "Centro de atención de emergencias",
  "Supermercados"
];

// Ubicación por defecto: Concepción del Uruguay, Entre Ríos
const DEFAULT_REF = { lat: -32.4833, lon: -58.2333 };

// Genera coordenadas aleatorias dentro de un radio en km (distribución uniforme en área)
function randomCoordsInRadius(centerLat, centerLon, radiusKm) {
  const kmPerDegree = 111; // aproximación
  const angle = Math.random() * 2 * Math.PI;
  const distance = radiusKm * Math.sqrt(Math.random()); // sqrt para distribución uniforme
  const centerLatRad = (centerLat * Math.PI) / 180;
  const deltaLat = (distance / kmPerDegree) * Math.cos(angle);
  const deltaLon = (distance / (kmPerDegree * Math.cos(centerLatRad))) * Math.sin(angle);
  return {
    lat: Number((centerLat + deltaLat).toFixed(6)),
    lon: Number((centerLon + deltaLon).toFixed(6))
  };
}

// Haversine (fallback local)
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Nearby() {
  const [q, setQ] = useState({ lat: "", lon: "", distance_km: "5", category: "" });
  const [refLoc] = useState(DEFAULT_REF); // referencia interna (oculta)
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (k) => (e) => setQ({ ...q, [k]: e.target.value });

  const validateCoords = (lat, lon) => {
    if (lat === "" || lon === "") return false;
    const nlat = Number(lat);
    const nlon = Number(lon);
    return Number.isFinite(nlat) && Number.isFinite(nlon);
  };

  const onSearch = async () => {
    setMsg(null);
    setResults([]);
    if (!validateCoords(q.lat, q.lon)) {
      setMsg({ ok: false, text: "Por favor ingresa latitud y longitud válidas." });
      return;
    }
    setLoading(true);
    try {
      // Intentar endpoint especializado
      try {
        const payload = {
          lat: Number(q.lat),
          lon: Number(q.lon),
          distance_km: Number(q.distance_km),
          category: q.category || ""
        };
        const res = await getNearby(payload);
        setResults(Array.isArray(res) ? res : []);
        setMsg({ ok: true, text: "Búsqueda realizada con éxito (servidor)." });
      } catch (e) {
        // Fallback local: obtener todos y filtrar por Haversine
        const all = await getAllPlaces();
        const filtered = (all || [])
          .map((p) => ({
            ...p,
            distance_km: haversineKm(Number(q.lat), Number(q.lon), Number(p.lat), Number(p.lon))
          }))
          .filter((p) => p.distance_km <= Number(q.distance_km) && (q.category ? p.category === q.category : true))
          .sort((a, b) => a.distance_km - b.distance_km);
        setResults(filtered);
        setMsg({ ok: true, text: "Búsqueda realizada con éxito (filtrado local)." });
      }
    } catch (err) {
      setMsg({ ok: false, text: err.message || "Error en búsqueda" });
    } finally {
      setLoading(false);
    }
  };

  // Genera coordenadas aleatorias tomando refLoc como centro.
  // El radio máximo es 50 km (según tu requisito)
  const generateRandomForSearch = (radiusKm = 50) => {
    const coords = randomCoordsInRadius(refLoc.lat, refLoc.lon, Math.min(radiusKm, 50));
    setQ({ ...q, lat: String(coords.lat), lon: String(coords.lon) });
    setMsg({ ok: true, text: `Coordenadas aleatorias generadas (hasta ${Math.min(radiusKm,50)} km).` });
  };

  return (
    <div>
      <NavBar />
      <main className="container-max px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">DATOS BUSQUEDA:</h1>

        {msg && <div className={msg.ok ? "message-success mb-4" : "message-error mb-4"}>{msg.text}</div>}

        <div className="space-y-4 max-w-xl mb-6">
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Latitud</label>
                <input value={q.lat} onChange={onChange("lat")} />
              </div>
              <div>
                <label className="block text-sm font-medium">Longitud</label>
                <input value={q.lon} onChange={onChange("lon")} />
              </div>
              <div>
                <label className="block text-sm font-medium">Distancia</label>
                <select value={q.distance_km} onChange={onChange("distance_km")}>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="50">50 km</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Categoría</label>
                <select value={q.category} onChange={onChange("category")}>
                  <option value="">-- (todas) --</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {/* Referencia oculta (no se muestra), pero se mantiene internamente para generación */}
              </div>
              <div className="flex items-center space-x-2">
                <select defaultValue="50" className="hidden" aria-hidden="true">
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="50">50 km</option>
                </select>
                <button type="button" className="btn-secondary" onClick={() => generateRandomForSearch(50)}>
                  Generar Aleatorio
                </button>
              </div>
            </div>
          </div>

          {/* Sección de referencia oculta para que no aparezca en la UI pero quede la posibilidad */}
          <div className="hidden" aria-hidden="true">
            <label>Referencia lat</label>
            <input value={refLoc.lat} readOnly />
            <label>Referencia lon</label>
            <input value={refLoc.lon} readOnly />
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={onSearch} disabled={loading}>{loading ? "Buscando..." : "Buscar"}</button>
            <button type="button" className="btn-secondary" onClick={() => { setQ({ lat: "", lon: "", distance_km: "5", category: "" }); setResults([]); setMsg(null); }}>
              Limpiar
            </button>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="text-gray-600">No hay resultados.</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Categoría</th>
                  <th className="px-4 py-2 text-left">Latitud</th>
                  <th className="px-4 py-2 text-left">Longitud</th>
                  <th className="px-4 py-2 text-left">Dist (km)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((p, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.category}</td>
                    <td className="px-4 py-2 font-mono">{p.lat}</td>
                    <td className="px-4 py-2 font-mono">{p.lon}</td>
                    <td className="px-4 py-2">{(p.distance_km || p.distance_km === 0) ? Number(p.distance_km).toFixed(3) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
