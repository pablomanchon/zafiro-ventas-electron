import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Store, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'

type Mode = 'login' | 'register'

export default function PageAuth() {
  const { signIn, signUp, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [kioscoNombre, setKioscoNombre] = useState('')

  const title = useMemo(
    () => (mode === 'login' ? 'Ingresar al kiosco' : 'Crear tu kiosco'),
    [mode]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || loading) return

    if (!email.trim() || !password.trim()) {
      toast.error('Completá email y contraseña')
      return
    }

    if (mode === 'register' && (!nombre.trim() || !kioscoNombre.trim())) {
      toast.error('Completá tu nombre y el nombre del kiosco')
      return
    }

    try {
      setSubmitting(true)

      if (mode === 'login') {
        await signIn(email.trim(), password)
        toast.success('Sesión iniciada')
        return
      }

      const result = await signUp({
        email: email.trim(),
        password,
        nombre: nombre.trim(),
        kioscoNombre: kioscoNombre.trim(),
      })

      if (result.needsEmailConfirmation) {
        toast.info('Te enviamos un email para confirmar la cuenta')
      } else {
        toast.success('Kiosco creado con éxito')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo completar la operación')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1016] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#101722]">
        <section className="relative p-6 sm:p-8 lg:p-10 bg-[radial-gradient(circle_at_top_left,_rgba(46,160,190,0.32),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))]">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/75">
            <Store size={16} />
            Zafiro Stock y Ventas
          </div>

          <div className="mt-8 sm:mt-12 max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              Gestioná tu kiosco con datos privados para cada cuenta.
            </h1>
            <p className="mt-4 text-white/70 text-sm sm:text-base leading-7">
              Cada usuario trabaja dentro de su propio kiosco, con ventas, productos, caja y clientes
              totalmente aislados del resto.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Aislamiento</p>
              <p className="mt-2 text-white/80">Los datos quedan separados por kiosco desde la base.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Acceso</p>
              <p className="mt-2 text-white/80">Entrá con email y contraseña desde cualquier dispositivo.</p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10 bg-[#0f141c]">
          <div className="flex gap-2 rounded-2xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                mode === 'login' ? 'bg-[#1f7a8c] text-white' : 'text-white/65 hover:bg-white/5'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <LogIn size={16} />
                Iniciar sesión
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                mode === 'register' ? 'bg-[#1f7a8c] text-white' : 'text-white/65 hover:bg-white/5'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <UserPlus size={16} />
                Registrarse
              </span>
            </button>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-2 text-sm text-white/60">
              {mode === 'login'
                ? 'Usá tu cuenta para entrar a tu kiosco.'
                : 'Creamos tu cuenta y tu kiosco en el mismo paso.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm text-white/70">Tu nombre</span>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500"
                    placeholder="Ej. Pablo"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-white/70">Nombre del kiosco</span>
                  <input
                    value={kioscoNombre}
                    onChange={(e) => setKioscoNombre(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500"
                    placeholder="Ej. Kiosco Central"
                  />
                </label>
              </>
            )}

            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="tu@email.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="********"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full rounded-2xl bg-[#1f7a8c] px-4 py-3 font-semibold transition hover:bg-[#2a93a8] disabled:opacity-60"
            >
              {submitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta y kiosco'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

