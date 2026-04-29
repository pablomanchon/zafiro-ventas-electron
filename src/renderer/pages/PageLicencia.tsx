import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useUser from "../hooks/useUser";
import Main from "../layout/Main";
import Steel from "../layout/Steel";

export default function PageLicencia() {
  const { user, refetch, expired } = useUser();
  const fecha = user?.vencDate ? new Date(user.vencDate) : null;
  const navigate = useNavigate();

  useEffect(() => {
    if (expired === false) {
      navigate("/", { replace: true });
    }
  }, [expired, navigate]);

  const handleReintentar = async () => {
    const { expired: stillExpired } = await refetch();
    if (!stillExpired) {
      toast.success("Licencia verificada");
      navigate("/", { replace: true });
    } else {
      toast.warning("Sigue vencida");
    }
  };

  return (
    <Main className="p-6 text-white flex flex-col items-center justify-center gap-4">
      <Steel typeWood={2} className="w-full max-w-sm flex flex-col items-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-bold">Suscripción vencida</h1>
        {fecha && (
          <p className="text-white/70">
            Venció el <b>{fecha.toLocaleDateString('es-AR')}</b>.
          </p>
        )}
        <p className="text-white/60 text-sm">Renová tu suscripción para seguir usando el sistema.</p>
        <button
          onClick={() => navigate('/suscripcion')}
          className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold shadow-inner shadow-black transition"
        >
          Renovar suscripción
        </button>
        <button
          onClick={handleReintentar}
          className="text-sm text-white/40 hover:text-white/70 transition"
        >
          Ya pagué, verificar
        </button>
      </Steel>
    </Main>
  );
}

