// src/pages/PageLicencia.tsx
import { useEffect } from "react";
import useUser from "../hooks/useUser";
import Main from "../layout/Main";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function PageLicencia() {
  const { user, refetch, expired } = useUser();
  const fecha = user?.fechaVencimiento ? new Date(user.fechaVencimiento) : null;
  const navigate = useNavigate();

  // Si en algún momento deja de estar vencida, redirige.
  useEffect(() => {
    if (expired === false) {
      navigate("/", { replace: true });
    }
  }, [expired, navigate]);

  const handleReintentar = async () => {
    const { expired: stillExpired } = await refetch();   // ⬅️ usamos el resultado fresco
    if (!stillExpired) {
      toast.success("✅ Licencia verificada, cierre y vuelva a abrir la aplicación");
      navigate("/", { replace: true });
    } else {
      toast.warn("⚠️ Sigue vencida");
    }
  };

  return (
    <Main className="p-6 text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-2">Licencia vencida</h1>
      {fecha && (
        <p className="mb-2">
          Venció el <b>{fecha.toLocaleDateString()}</b>.
        </p>
      )}
      <p className="mb-4">Contactate para renovar la licencia y seguir usando el sistema.</p>
      <button
        onClick={handleReintentar}
        className="px-4 py-2 bg-emerald-700 rounded shadow-inner shadow-black"
      >
        Reintentar
      </button>
    </Main>
  );
}
