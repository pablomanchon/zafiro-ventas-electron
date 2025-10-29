// src/guards/RequireActiveLicense.tsx
import { Outlet, Navigate } from "react-router-dom";
import useUser from "../hooks/useUser";

export default function RequireActiveLicense() {
  const { loading, expired } = useUser();

  if (loading) return <div className="p-6 text-white">Cargando licencia…</div>;
  if (expired) return <Navigate to="/licencia" replace />;

  return <Outlet />; // deja pasar a las rutas hijas
}
