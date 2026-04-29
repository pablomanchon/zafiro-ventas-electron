import { useState } from 'react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import useUser from '../hooks/useUser'
import Main from '../layout/Main'
import Steel from '../layout/Steel'
import bgUrl from '../assets/fondo-h.webp'

const PLANES = {
  mensual: {
    label: 'Mensual',
    precioLabel: '$30.000',
    porMes: '$30.000 / mes',
    detalle: 'Renovación mes a mes',
    ahorro: null,
    link: import.meta.env.VITE_MP_MONTHLY_LINK as string,
  },
  anual: {
    label: 'Anual',
    precioLabel: '$180.000',
    porMes: '$15.000 / mes',
    detalle: '12 meses de acceso',
    ahorro: '50% OFF',
    link: import.meta.env.VITE_MP_YEARLY_LINK as string,
  },
} as const

type Plan = keyof typeof PLANES

export default function PageSuscripcion() {
  const { user, refetch } = useUser()
  const [searchParams] = useSearchParams()
  const pagoParam = searchParams.get('pago')

  const [planSel, setPlanSel] = useState<Plan>('mensual')
  const [verificando, setVerificando] = useState(false)

  const vencDate = user?.vencDate ? new Date(user.vencDate) : null
  const estaActivo = vencDate ? vencDate > new Date() : false
  const diasRestantes = vencDate
    ? Math.ceil((vencDate.getTime() - Date.now()) / 86400000)
    : 0

  const handlePagar = () => {
    const link = PLANES[planSel].link
    if (!link) {
      toast.error('Link de pago no configurado')
      return
    }
    window.open(link, '_blank')
  }

  const handleVerificar = async () => {
    setVerificando(true)
    try {
      const { expired } = await refetch()
      if (!expired) {
        toast.success('¡Suscripción activa! Gracias por tu pago.')
      } else {
        toast.info('El pago aún no fue confirmado. Puede tardar unos minutos.')
      }
    } finally {
      setVerificando(false)
    }
  }

  const content = (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 text-white">

      {/* Estado actual */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Suscripción</h1>
        <Steel typeWood={2} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
          <div className="text-sm">
            <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">Estado actual</p>
            {estaActivo ? (
              <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                Activa hasta {vencDate?.toLocaleDateString('es-AR')}
                <span className="text-white/50 font-normal">({diasRestantes} días restantes)</span>
              </p>
            ) : (
              <p className="font-semibold text-red-400">Suscripción vencida</p>
            )}
          </div>
          {user?.name && (
            <p className="text-white/50 text-sm">{user.name}</p>
          )}
        </Steel>
      </div>

      {/* Banner de regreso de MP */}
      {pagoParam === 'ok' && (
        <Steel typeWood={2} className="p-4 border border-emerald-600 bg-emerald-900/30">
          <p className="font-semibold text-emerald-300">
            ¡Pago recibido! La suscripción se activa en unos minutos.
          </p>
          <p className="text-sm text-white/60 mt-1">
            Usá el botón "Verificar pago" para actualizar tu estado.
          </p>
        </Steel>
      )}
      {pagoParam === 'error' && (
        <Steel typeWood={2} className="p-4 border border-red-700 bg-red-900/20">
          <p className="font-semibold text-red-400">El pago fue rechazado o cancelado.</p>
          <p className="text-sm text-white/60 mt-1">Intentá de nuevo con otra tarjeta.</p>
        </Steel>
      )}

      {/* Selector de planes */}
      <div>
        <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Elegí tu plan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(PLANES) as Plan[]).map((key) => {
            const p = PLANES[key]
            const seleccionado = planSel === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlanSel(key)}
                className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                  seleccionado
                    ? 'border-cyan-400 bg-cyan-900/30 shadow-lg shadow-cyan-900/40'
                    : 'border-white/15 bg-white/5 hover:border-white/30'
                }`}
              >
                {p.ahorro && (
                  <span className="absolute top-3 right-3 text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    {p.ahorro}
                  </span>
                )}
                <p className="font-bold text-base mb-1">{p.label}</p>
                <p className="text-2xl font-extrabold text-white">{p.precioLabel}</p>
                <p className="text-sm text-cyan-300 mt-0.5">{p.porMes}</p>
                <p className="text-xs text-white/50 mt-1">{p.detalle}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handlePagar}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-3 font-bold text-white transition shadow shadow-black/40"
        >
          <ExternalLink size={18} />
          Pagar con MercadoPago
        </button>

        <button
          type="button"
          onClick={() => void handleVerificar()}
          disabled={verificando}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 disabled:opacity-50 px-5 py-3 font-semibold text-white transition text-sm"
        >
          {verificando ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          Verificar pago
        </button>
      </div>

      <p className="text-xs text-white/30 text-center">
        El pago se procesa de forma segura a través de MercadoPago. Al completarlo, tu suscripción se activa automáticamente.
      </p>
    </div>
  )

  return (
    <Main
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      className="flex items-center justify-center min-h-screen p-4"
    >
      <div className="w-full bg-black/70 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black border border-white/10 p-6">
        {content}
      </div>
    </Main>
  )
}
