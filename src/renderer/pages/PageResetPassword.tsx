import { useState } from 'react'
import { toast } from 'sonner'
import { Store, Lock } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'

export default function PageResetPassword() {
  const { updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    if (!password.trim()) {
      toast.error('Ingresá la nueva contraseña')
      return
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      setSubmitting(true)
      await updatePassword(password)
      toast.success('Contraseña actualizada correctamente')
      await signOut()
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo actualizar la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1016] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#101722]">
        <div className="p-6 sm:p-8 lg:p-10 bg-[#0f141c]">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/75 mb-8">
            <Store size={16} />
            Zafiro Stock y Ventas
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Lock size={18} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold">Nueva contraseña</h2>
          </div>
          <p className="text-sm text-white/60 mb-8">
            Elegí una nueva contraseña para tu cuenta. Deberás iniciar sesión con ella después.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Nueva contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Mínimo 6 caracteres"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Confirmar contraseña</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Repetí la contraseña"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#1f7a8c] px-4 py-3 font-semibold transition hover:bg-[#2a93a8] disabled:opacity-60"
            >
              {submitting ? 'Actualizando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
