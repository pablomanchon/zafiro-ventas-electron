import { useEffect, useState } from 'react'
import type * as React from 'react'
import { toast } from 'sonner'
import { Building2, LoaderCircle, Phone, MapPin, Save, DollarSign } from 'lucide-react'
import Title from '../layout/Title'
import Glass from '../layout/Glass'
import { kioscoObtener, kioscoActualizar, type KioscoPerfil } from '../api/negocio'
import { useAuth } from '../hooks/useAuth'

type FormState = {
  nombre: string
  telefono: string
  direccion: string
  tipoCambioUsd: string
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-white/80">{label}</span>
      {children}
      {hint && <span className="text-xs text-white/45">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none transition focus:border-cyan-300/70 focus:bg-black/45'

export default function PageNegocio() {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({ nombre: '', telefono: '', direccion: '', tipoCambioUsd: '1000' })

  useEffect(() => {
    kioscoObtener()
      .then((data: KioscoPerfil) => {
        setForm({
          nombre: data.nombre ?? '',
          telefono: data.telefono ?? '',
          direccion: data.direccion ?? '',
          tipoCambioUsd: String(data.tipoCambioUsd ?? 1000),
        })
      })
      .catch(() => toast.error('No se pudo cargar el perfil del negocio'))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('El nombre del negocio es obligatorio')
      return
    }
    setSaving(true)
    try {
      const tipoCambioUsd = Number(form.tipoCambioUsd)
      await kioscoActualizar({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
        tipoCambioUsd: tipoCambioUsd > 0 ? tipoCambioUsd : null,
      })
      await refreshProfile()
      toast.success('Negocio actualizado')
    } catch {
      toast.error('No se pudo guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Title>Negocio</Title>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <Glass className="flex flex-col gap-5 p-5">
            <div className="flex items-center gap-3">
              <Building2 className="text-cyan-200" size={22} />
              <h2 className="text-lg font-bold">Datos del negocio</h2>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <LoaderCircle className="animate-spin" size={16} />
                Cargando...
              </div>
            ) : (
              <>
                <Field label="Nombre del negocio">
                  <input
                    className={inputClass}
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Kiosco El Sol"
                    required
                  />
                </Field>

                <Field label="Teléfono" hint="Opcional. Para contacto o tickets.">
                  <div className="relative">
                    <Phone
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      className={`${inputClass} pl-8`}
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="Ej: 2994 123456"
                    />
                  </div>
                </Field>

                <Field label="Dirección" hint="Opcional.">
                  <div className="relative">
                    <MapPin
                      size={15}
                      className="absolute left-3 top-3.5 text-white/40"
                    />
                    <textarea
                      className={`${inputClass} pl-8 resize-none`}
                      name="direccion"
                      value={form.direccion}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Ej: Av. San Martín 123, Neuquén"
                    />
                  </div>
                </Field>

                <Field label="Tipo de cambio USD" hint="Pesos por cada dólar. Se usa al registrar pagos en USD.">
                  <div className="relative">
                    <DollarSign
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      className={`${inputClass} pl-8`}
                      name="tipoCambioUsd"
                      type="number"
                      min={1}
                      step={1}
                      value={form.tipoCambioUsd}
                      onChange={handleChange}
                      placeholder="Ej: 1000"
                    />
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-cyan-200/20 bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white shadow shadow-black transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Guardar
                </button>
              </>
            )}
          </Glass>
        </form>

        <aside className="flex flex-col gap-3">
          <Glass className="border border-cyan-300/20 p-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 text-cyan-200" size={22} />
              <div>
                <h3 className="text-lg font-bold">¿Para qué sirve?</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  El nombre aparece en la barra lateral. El teléfono y dirección se podrán usar en
                  tickets y comprobantes.
                </p>
              </div>
            </div>
          </Glass>
        </aside>
      </div>
    </div>
  )
}
