import Link from "next/link";
import { useRouter } from "next/router";

export default function NavBar() {
  const router = useRouter();
  
  const isActive = (path) => router.pathname === path;
  
  const linkClass = (path) => {
    const baseClass = "text-sm font-medium transition-colors pb-1 border-b-2";
    if (isActive(path)) {
      return `${baseClass} text-indigo-600 border-indigo-600`;
    }
    return `${baseClass} text-gray-700 border-transparent hover:text-indigo-600 hover:border-gray-300`;
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 py-4">
      <div className="container-max px-4 flex items-center justify-between">
        <div className="text-lg font-bold text-gray-900">Puntos de Interés</div>
        <div className="flex items-center space-x-6">
          <Link href="/">
            <a className={linkClass("/")}>Inicio</a>
          </Link>
          <Link href="/add">
            <a className={linkClass("/add")}>Agregar</a>
          </Link>
          <Link href="/nearby">
            <a className={linkClass("/nearby")}>Buscar Cercanos</a>
          </Link>
          <Link href="/distance">
            <a className={linkClass("/distance")}>Calcular Distancia</a>
          </Link>
        </div>
      </div>
    </nav>
  );
}

