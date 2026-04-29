import { useEffect, useMemo, useState } from 'react'
import type * as React from 'react'
import { toast } from 'sonner'
import {
  BadgeCheck,
  FileText,
  KeyRound,
  LoaderCircle,
  RefreshCcw,
  Save,
  Settings2,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import Title from '../layout/Title'
import Glass from '../layout/Glass'
import {
  desactivarArcaCredenciales,
  generarSolicitudArca,
  getArcaCredencialesResumen,
  getFacturacionConfig,
  getArcaSolicitudesResumen,
  saveFacturacionConfig,
  subirArcaCredenciales,
  type ArcaAmbiente,
  type ArcaCertificadoSolicitud,
  type ArcaCredencialResumen,
  type FacturacionConfig,
  type FacturacionModo,
} from '../api/facturacion'

type FormState = {
  cuit: string
  razonSocial: string
  condicionFiscal: string
  puntoVenta: string
  comprobanteTipoDefault: string
  conceptoDefault: string
  monedaId: string
  monedaCotizacion: string
  facturacionModo: FacturacionModo
  arcaAmbiente: ArcaAmbiente
  arcaHabilitado: boolean
}

const defaultForm: FormState = {
  cuit: '',
  razonSocial: '',
  condicionFiscal: '',
  puntoVenta: '',
  comprobanteTipoDefault: '',
  conceptoDefault: '1',
  monedaId: 'PES',
  monedaCotizacion: '1',
  facturacionModo: 'manual',
  arcaAmbiente: 'homologacion',
  arcaHabilitado: false,
}

const comprobanteOptions = [
  { value: '1', label: 'Factura A (1)' },
  { value: '6', label: 'Factura B (6)' },
  { value: '11', label: 'Factura C (11)' },
]

const condicionOptions = [
  'Responsable Inscripto',
  'Monotributo',
  'Exento',
  'Consumidor Final',
]

function toForm(config: FacturacionConfig): FormState {
  return {
    cuit: config.cuit ?? '',
    razonSocial: config.razonSocial ?? '',
    condicionFiscal: config.condicionFiscal ?? '',
    puntoVenta: config.puntoVenta?.toString() ?? '',
    comprobanteTipoDefault: config.comprobanteTipoDefault?.toString() ?? '',
    conceptoDefault: config.conceptoDefault?.toString() ?? '1',
    monedaId: config.monedaId ?? 'PES',
    monedaCotizacion: config.monedaCotizacion?.toString() ?? '1',
    facturacionModo: config.facturacionModo ?? 'manual',
    arcaAmbiente: config.arcaAmbiente ?? 'homologacion',
    arcaHabilitado: config.arcaHabilitado ?? false,
  }
}

function cleanNumber(value: string) {
  return value.replace(/\D/g, '')
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

export default function PageFacturacion() {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [credenciales, setCredenciales] = useState<ArcaCredencialResumen[]>([])
  const [solicitudes, setSolicitudes] = useState<ArcaCertificadoSolicitud[]>([])
  const [credencialAmbiente, setCredencialAmbiente] = useState<ArcaAmbiente>('homologacion')
  const [solicitudId, setSolicitudId] = useState('')
  const [generatedCsr, setGeneratedCsr] = useState<{ pem: string; fileName: string } | null>(null)
  const [certificadoFile, setCertificadoFile] = useState<File | null>(null)
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [certificateModalOpen, setCertificateModalOpen] = useState(false)

  const modeCopy = useMemo(() => {
    if (form.facturacionModo === 'desactivada') {
      return 'Las ventas se guardan sin emitir comprobante fiscal.'
    }
    if (form.facturacionModo === 'automatica') {
      return 'Cada venta intenta emitir su comprobante automaticamente al cobrarse.'
    }
    return 'Las ventas se guardan normalmente y se facturan desde el detalle de cada venta.'
  }, [form.facturacionModo])

  useEffect(() => {
    let active = true

    Promise.all([getFacturacionConfig(), getArcaCredencialesResumen(), getArcaSolicitudesResumen()])
      .then(([config, credentials, requests]) => {
        if (!active) return
        if (config) {
          setForm(toForm(config))
          setCredencialAmbiente(config.arcaAmbiente ?? 'homologacion')
        }
        setCredenciales(credentials ?? [])
        setSolicitudes(requests ?? [])
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar facturacion')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const refreshCredenciales = async () => {
    const [credentialRows, requestRows] = await Promise.all([
      getArcaCredencialesResumen(),
      getArcaSolicitudesResumen(),
    ])
    setCredenciales(credentialRows ?? [])
    setSolicitudes(requestRows ?? [])
  }

  const activeCredential = credenciales.find(
    (credential) => credential.ambiente === credencialAmbiente && credential.activo,
  )
  const pendingSolicitudes = solicitudes.filter(
    (solicitud) => solicitud.ambiente === credencialAmbiente && solicitud.estado === 'pendiente',
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cuit = cleanNumber(form.cuit)
    if (cuit && cuit.length !== 11) {
      toast.error('El CUIT debe tener 11 digitos')
      return
    }

    setSaving(true)
    try {
      const saved = await saveFacturacionConfig({
        cuit,
        razonSocial: form.razonSocial.trim() || null,
        condicionFiscal: form.condicionFiscal.trim() || null,
        puntoVenta: form.puntoVenta ? Number(form.puntoVenta) : null,
        comprobanteTipoDefault: form.comprobanteTipoDefault
          ? Number(form.comprobanteTipoDefault)
          : null,
        conceptoDefault: Number(form.conceptoDefault || 1),
        monedaId: 'PES',
        monedaCotizacion: 1,
        facturacionModo: form.facturacionModo,
        arcaAmbiente: form.arcaAmbiente,
        arcaHabilitado: form.arcaHabilitado,
      })

      setForm(toForm(saved))
      toast.success('Configuracion de facturacion guardada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la configuracion')
    } finally {
      setSaving(false)
    }
  }

  const handleCredentialsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!certificadoFile) {
      toast.error('Selecciona el certificado .crt que devuelve ARCA')
      return
    }

    if (!solicitudId && !privateKeyFile) {
      toast.error('Selecciona una solicitud o carga los archivos del certificado externo')
      return
    }

    setUploading(true)
    try {
      await subirArcaCredenciales({
        ambiente: credencialAmbiente,
        certificado: certificadoFile,
        privateKey: privateKeyFile,
        solicitudId: solicitudId || null,
      })
      setCertificadoFile(null)
      setPrivateKeyFile(null)
      setSolicitudId('')
      await refreshCredenciales()
      toast.success('Certificado ARCA guardado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el certificado')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateSolicitud = async () => {
    const cuit = cleanNumber(form.cuit)
    const organizacion = form.razonSocial.trim()

    if (cuit.length !== 11) {
      toast.error('El CUIT emisor debe tener 11 digitos para generar la solicitud')
      return
    }

    if (!organizacion) {
      toast.error('Completa la razon social antes de generar la solicitud')
      return
    }

    setGenerating(true)
    try {
      const result = await generarSolicitudArca(credencialAmbiente, {
        cuit,
        organizacion,
      })
      setGeneratedCsr({ pem: result.csrPem, fileName: result.csrFileName })
      setSolicitudId(result.solicitud.id)
      await refreshCredenciales()
      toast.success('Solicitud generada. Descargala y subila a ARCA.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar la solicitud')
    } finally {
      setGenerating(false)
    }
  }

  const downloadGeneratedCsr = () => {
    if (!generatedCsr) return
    const url = URL.createObjectURL(new Blob([generatedCsr.pem], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = generatedCsr.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDeactivateCredentials = async () => {
    setUploading(true)
    try {
      const rows = await desactivarArcaCredenciales(credencialAmbiente)
      setCredenciales(rows ?? [])
      toast.success('Certificado desactivado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desactivar el certificado')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Glass className="flex min-h-[18rem] items-center justify-center border border-white/10">
        <div className="flex items-center gap-3 text-white/80">
          <LoaderCircle className="animate-spin" size={22} />
          <span>Cargando configuracion fiscal...</span>
        </div>
      </Glass>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <Title className="mb-1 flex items-center justify-center gap-2">
        <Settings2 size={22} />
        Configuracion de facturacion
      </Title>

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <Glass className="border border-cyan-400/20 p-4 shadow-inner shadow-black">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <section className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => updateField('facturacionModo', 'desactivada')}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.facturacionModo === 'desactivada'
                    ? 'border-red-300/70 bg-red-950/45'
                    : 'border-white/10 bg-black/20 hover:bg-black/35'
                }`}
              >
                <p className="font-bold">Desactivada</p>
                <p className="mt-1 text-xs text-white/60">No factura ventas por defecto.</p>
              </button>
              <button
                type="button"
                onClick={() => updateField('facturacionModo', 'manual')}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.facturacionModo === 'manual'
                    ? 'border-cyan-300/80 bg-cyan-950/50'
                    : 'border-white/10 bg-black/20 hover:bg-black/35'
                }`}
              >
                <p className="font-bold">Manual</p>
                <p className="mt-1 text-xs text-white/60">El usuario decide cuando facturar.</p>
              </button>
              <button
                type="button"
                onClick={() => updateField('facturacionModo', 'automatica')}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.facturacionModo === 'automatica'
                    ? 'border-emerald-300/80 bg-emerald-950/45'
                    : 'border-white/10 bg-black/20 hover:bg-black/35'
                }`}
              >
                <p className="font-bold">Automatica</p>
                <p className="mt-1 text-xs text-white/60">Preparada para facturar al vender.</p>
              </button>
            </section>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/70">
              {modeCopy}
            </div>

            <section className="grid gap-4 md:grid-cols-2">
              <Field label="CUIT emisor" hint="Solo numeros, 11 digitos.">
                <input
                  className={inputClass}
                  value={form.cuit}
                  onChange={(event) => updateField('cuit', cleanNumber(event.target.value))}
                  placeholder="Ej. 20123456789"
                  inputMode="numeric"
                  maxLength={11}
                />
              </Field>

              <Field label="Razon social">
                <input
                  className={inputClass}
                  value={form.razonSocial}
                  onChange={(event) => updateField('razonSocial', event.target.value)}
                  placeholder="Nombre fiscal del kiosco"
                />
              </Field>

              <Field label="Condicion fiscal">
                <select
                  className={inputClass}
                  value={form.condicionFiscal}
                  onChange={(event) => updateField('condicionFiscal', event.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {condicionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Punto de venta">
                <input
                  className={inputClass}
                  value={form.puntoVenta}
                  onChange={(event) => updateField('puntoVenta', cleanNumber(event.target.value))}
                  placeholder="Ej. 1"
                  inputMode="numeric"
                />
              </Field>

              <Field label="Tipo de comprobante default">
                <select
                  className={inputClass}
                  value={form.comprobanteTipoDefault}
                  onChange={(event) => updateField('comprobanteTipoDefault', event.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {comprobanteOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Concepto">
                <select
                  className={inputClass}
                  value={form.conceptoDefault}
                  onChange={(event) => updateField('conceptoDefault', event.target.value)}
                >
                  <option value="1">Productos</option>
                  <option value="2">Servicios</option>
                  <option value="3">Productos y servicios</option>
                </select>
              </Field>

              <Field label="Ambiente ARCA">
                <select
                  className={inputClass}
                  value={form.arcaAmbiente}
                  onChange={(event) => updateField('arcaAmbiente', event.target.value as ArcaAmbiente)}
                >
                  <option value="homologacion">Homologacion</option>
                  <option value="produccion">Produccion</option>
                </select>
              </Field>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
                <input
                  type="checkbox"
                  checked={form.arcaHabilitado}
                  onChange={(event) => updateField('arcaHabilitado', event.target.checked)}
                  className="h-5 w-5 accent-cyan-400"
                />
                <span>
                  <span className="block font-semibold">Habilitar ARCA para este kiosco</span>
                  <span className="text-xs text-white/50">Permite emitir comprobantes con el certificado cargado.</span>
                </span>
              </label>
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-700 px-4 py-2.5 font-bold text-white shadow shadow-black transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
                Guardar configuracion
              </button>
            </div>
          </form>
        </Glass>

        <aside className="flex flex-col gap-3">
          <Glass className="border border-amber-300/20 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 text-amber-200" size={24} />
              <div>
                <h3 className="text-lg font-bold">Seguridad</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  La configuracion fiscal se guarda por kiosco. El certificado queda protegido y se
                  usa solo para emitir comprobantes.
                </p>
              </div>
            </div>
          </Glass>

          <Glass className="border border-cyan-300/20 p-4">
            <div className="mb-4 flex items-start gap-3">
              <KeyRound className="mt-1 text-cyan-200" size={24} />
              <div>
                <h3 className="text-lg font-bold">Certificado ARCA</h3>
                <p className="mt-1 text-sm text-white/65">
                  Carga o renueva el certificado que habilita la emision de comprobantes.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Field label="Ambiente">
                <select
                  className={inputClass}
                  value={credencialAmbiente}
                  onChange={(event) => {
                    setCredencialAmbiente(event.target.value as ArcaAmbiente)
                    setSolicitudId('')
                    setGeneratedCsr(null)
                  }}
                >
                  <option value="homologacion">Homologacion</option>
                  <option value="produccion">Produccion</option>
                </select>
              </Field>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm">
                {activeCredential ? (
                  <div className="text-emerald-100">
                    <p className="font-semibold">Certificado activo</p>
                    <p className="mt-1 text-xs text-white/55">
                      Ambiente: {activeCredential.ambiente}. Actualizado:{' '}
                      {new Date(activeCredential.updatedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-amber-100">
                    <p className="font-semibold">Certificado pendiente</p>
                    <p className="mt-1 text-xs text-white/55">
                      Carga un certificado para poder emitir comprobantes en este ambiente.
                    </p>
                  </div>
                )}
              </div>
                <button
                  type="button"
                  onClick={() => setCertificateModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-700 px-3 py-2.5 text-sm font-bold text-white shadow shadow-black transition hover:bg-cyan-600"
                >
                  <KeyRound size={17} />
                  Configurar certificado
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void refreshCredenciales()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={16} />
                  Actualizar
                </button>
            </div>
          </Glass>

          <Glass className="border border-white/10 p-4">
            <div className="flex items-start gap-3">
              <FileText className="mt-1 text-cyan-200" size={24} />
              <div>
                <h3 className="text-lg font-bold">Como facturar</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  En modo automatico, Zafiro emite el comprobante al cobrar la venta. En modo
                  manual, abrí una venta y tocá Facturar.
                </p>
              </div>
            </div>
          </Glass>

          <Glass className="border border-emerald-300/20 p-4">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-1 text-emerald-200" size={24} />
              <div>
                <h3 className="text-lg font-bold">Ambientes</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Usa homologacion para pruebas. Cambia a produccion cuando el kiosco ya este listo
                  para emitir comprobantes reales.
                </p>
              </div>
            </div>
          </Glass>
        </aside>
      </div>

      {certificateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-[min(94vw,760px)] flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950 shadow-2xl shadow-black">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-1 text-cyan-200" size={23} />
                <div>
                  <h3 className="text-xl font-bold text-white">Certificado ARCA</h3>
                  <p className="mt-1 text-sm text-white/60">
                    Completa la solicitud y carga el certificado devuelto por ARCA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setCertificateModalOpen(false)}
                className="rounded-lg border border-white/10 bg-black/30 p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-auto p-4">
              <Field label="Ambiente">
                <select
                  className={inputClass}
                  value={credencialAmbiente}
                  onChange={(event) => {
                    setCredencialAmbiente(event.target.value as ArcaAmbiente)
                    setSolicitudId('')
                    setGeneratedCsr(null)
                  }}
                >
                  <option value="homologacion">Homologacion</option>
                  <option value="produccion">Produccion</option>
                </select>
              </Field>

              <div className="rounded-2xl border border-cyan-200/15 bg-cyan-950/20 p-3">
                <p className="text-sm font-bold text-white">Paso 1: generar solicitud para ARCA</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">
                  Descarga el archivo de solicitud y subilo en ARCA. ARCA devuelve el certificado
                  que se carga en el paso siguiente.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => void handleGenerateSolicitud()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200/20 bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white shadow shadow-black transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generating ? <LoaderCircle className="animate-spin" size={17} /> : <KeyRound size={17} />}
                    Generar solicitud
                  </button>
                  <button
                    type="button"
                    disabled={!generatedCsr}
                    onClick={downloadGeneratedCsr}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText size={16} />
                    Descargar solicitud
                  </button>
                </div>
                {generatedCsr && (
                  <p className="mt-2 text-xs text-emerald-100">
                    Solicitud lista: {generatedCsr.fileName}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-violet-200/15 bg-violet-950/20 p-3">
                <p className="text-sm font-bold text-white">Paso 1.5: subir la solicitud en AFIP</p>
                <ol className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-white/60">
                  <li>
                    <span className="font-semibold text-white/80">1.</span> Ingresa a{' '}
                    <span className="font-semibold text-violet-200">afip.gob.ar</span> e iniciá
                    sesión con tu CUIT y clave fiscal.
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">2.</span> Buscá el servicio{' '}
                    <span className="font-semibold text-violet-200">
                      "Administración de Certificados Digitales"
                    </span>
                    .
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">3.</span> Hacé clic en{' '}
                    <span className="font-semibold text-violet-200">"Agregar alias"</span> o{' '}
                    <span className="font-semibold text-violet-200">"Nuevo certificado"</span> y
                    subí el archivo de solicitud que descargaste en el paso anterior.
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">4.</span> AFIP generará el
                    certificado. Descargalo como{' '}
                    <span className="font-semibold text-violet-200">.crt</span> y volvé aquí para
                    cargarlo en el paso 2.
                  </li>
                </ol>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-3">
                <p className="text-sm font-bold text-white">Paso 2: cargar certificado devuelto por ARCA</p>

                <Field label="Solicitud usada">
                  <select
                    className={inputClass}
                    value={solicitudId}
                    onChange={(event) => {
                      setSolicitudId(event.target.value)
                      if (event.target.value) setPrivateKeyFile(null)
                    }}
                  >
                    <option value="">Cargar certificado externo</option>
                    {pendingSolicitudes.map((solicitud) => (
                      <option key={solicitud.id} value={solicitud.id}>
                        {solicitud.cuit} - {new Date(solicitud.createdAt).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Certificado .crt">
                  <input
                    className={inputClass}
                    type="file"
                    accept=".crt,.cer,.pem,text/plain"
                    onChange={(event) => setCertificadoFile(event.target.files?.[0] ?? null)}
                  />
                  {certificadoFile && (
                    <span className="text-xs text-white/50">Seleccionado: {certificadoFile.name}</span>
                  )}
                </Field>

                <Field
                  label="Clave privada .key"
                  hint="Solo hace falta si el certificado fue creado fuera de Zafiro."
                >
                  <input
                    className={inputClass}
                    type="file"
                    accept=".key,.pem,text/plain"
                    disabled={Boolean(solicitudId)}
                    onChange={(event) => setPrivateKeyFile(event.target.files?.[0] ?? null)}
                  />
                  {privateKeyFile && (
                    <span className="text-xs text-white/50">Seleccionada: {privateKeyFile.name}</span>
                  )}
                </Field>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-700 px-3 py-2.5 text-sm font-bold text-white shadow shadow-black transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? <LoaderCircle className="animate-spin" size={17} /> : <Upload size={17} />}
                    Guardar certificado
                  </button>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => void refreshCredenciales()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCcw size={16} />
                    Actualizar
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-amber-300/20 bg-amber-950/20 p-3">
                <p className="text-sm font-bold text-amber-200">Paso final obligatorio: asociar el servicio en AFIP</p>
                <p className="mt-1 text-xs text-white/55">
                  Sin este paso el certificado no podrá emitir comprobantes.
                </p>
                <ol className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-white/60">
                  <li>
                    <span className="font-semibold text-white/80">1.</span> Volvé a{' '}
                    <span className="font-semibold text-amber-200">afip.gob.ar</span> e iniciá
                    sesión.
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">2.</span> Ingresá en{' '}
                    <span className="font-semibold text-amber-200">
                      "Administrador de Relaciones de Clave Fiscal"
                    </span>
                    .
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">3.</span> Hacé clic en{' '}
                    <span className="font-semibold text-amber-200">"Nueva relación"</span>.
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">4.</span> Elegí el servicio{' '}
                    <span className="font-semibold text-amber-200">"WSFEv1"</span>.
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">5.</span> Asociá el certificado
                    que creaste y guardá los cambios.
                  </li>
                </ol>
              </div>

              {activeCredential && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void handleDeactivateCredentials()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200/20 bg-red-950/60 px-3 py-2.5 text-sm font-semibold text-red-50 transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Desactivar certificado activo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
