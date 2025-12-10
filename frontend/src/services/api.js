const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function handleResponse(res) {
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const err = (json && json.error) || (json && json.message) || res.statusText;
      throw new Error(err);
    }
    return json;
  } catch (e) {
    if (!res.ok) throw new Error(res.statusText || "Error en la petición");
    return text;
  }
}

export async function getAllPlaces() {
  const res = await fetch(`${BASE}/places`);
  return handleResponse(res);
}

export async function createPlace({ name, category, lat, lon }) {
  const res = await fetch(`${BASE}/places`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, category, lat: Number(lat), lon: Number(lon) })
  });
  return handleResponse(res);
}

export async function getNearby({ lat, lon, distance_km = 5, category = "" }) {
  // Try a dedicated endpoint first
  try {
    const url = new URL(`${BASE}/places/nearby`);
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("distance_km", distance_km);
    if (category) url.searchParams.set("category", category);
    const res = await fetch(url.toString());
    return handleResponse(res);
  } catch (e) {
    // Fallback: download all and filter locally (handled by caller)
    throw e;
  }
}