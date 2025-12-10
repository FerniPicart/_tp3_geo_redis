import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import { getAllPlaces } from "../services/api";

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPlaces = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllPlaces();
      setPlaces(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message || "Error al cargar lugares");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="container-max px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Listado de Lugares</h1>
          <button 
            onClick={fetchPlaces} 
            className="rounded-md bg-indigo-500 text-white px-4 py-2 hover: bg-indigo-600 transition-colors"
          >
            Actualizar
          </button>
        </div>

        {error && <div className="message-error mb-4">{error}</div>}
        {loading ?  (
          <div className="text-center py-12 text-gray-500 text-lg">Cargando...</div>
        ) : (
          <>
            {places.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-xl mb-4">No hay lugares registrados</p>
                <p className="text-gray-500 text-base">
                  Comienza{" "}
                  <Link href="/add">
                    <a className="text-indigo-600 hover: text-indigo-700 underline font-medium">
                      agregando
                    </a>
                  </Link>
                  {" "}un nuevo lugar de interés
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Latitud</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Longitud</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {places.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{p. name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{p.lat}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{p.lon}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}