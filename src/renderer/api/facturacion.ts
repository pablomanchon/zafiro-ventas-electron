import { supabase } from './supabase'

export type FacturacionModo = 'desactivada' | 'manual' | 'automatica'
export type ArcaAmbiente = 'homologacion' | 'produccion'

export type FacturacionConfig = {
  kioscoId: string
  kioscoNombre: string
  cuit: string | null
  razonSocial: string | null
  condicionFiscal: string | null
  puntoVenta: number | null
  comprobanteTipoDefault: number | null
  conceptoDefault: number
  monedaId: string
  monedaCotizacion: number
  facturacionModo: FacturacionModo
  arcaAmbiente: ArcaAmbiente
  arcaHabilitado: boolean
}

export type FacturaResumen = {
  id: string
  ventaId: number
  fechaVenta: string
  estado: 'pendiente' | 'autorizada' | 'rechazada' | 'error'
  ambiente: ArcaAmbiente
  cuitEmisor: string
  puntoVenta: number
  comprobanteTipo: number
  comprobanteNro: number | null
  importeTotal: number
  cae: string | null
  caeVencimiento: string | null
  errorMessage: string | null
  createdAt: string
}

export type FacturarVentaInput = {
  ventaId: number
  trigger?: 'manual' | 'automatic'
  force?: boolean
}

export type ArcaCredencialResumen = {
  id: string
  ambiente: ArcaAmbiente
  activo: boolean
  tieneCertificado: boolean
  tienePrivateKey: boolean
  tienePassphrase: boolean
  createdAt: string
  updatedAt: string
}

export type ArcaCertificadoSolicitud = {
  id: string
  ambiente: ArcaAmbiente
  cuit: string
  organizacion: string
  commonName: string
  estado: 'pendiente' | 'completada' | 'cancelada'
  createdAt: string
  updatedAt: string
}

function normalizeError(error: unknown): never {
  if (error instanceof Error) throw error
  if (typeof error === 'string') throw new Error(error)
  if (error && typeof error === 'object') {
    const maybe = error as Record<string, unknown>
    const message = typeof maybe.message === 'string' ? maybe.message : null
    const details =
      typeof maybe.details === 'string'
        ? maybe.details
        : maybe.details && typeof maybe.details === 'object'
          ? Object.values(maybe.details as Record<string, unknown>)
              .filter((value): value is string => typeof value === 'string' && value.length > 0)
              .join(' ')
          : null
    const code = typeof maybe.code === 'string' ? maybe.code : null
    const parts = [message, details, code ? `(${code})` : null].filter(Boolean)
    if (parts.length > 0) throw new Error(parts.join(' '))
  }
  throw new Error('Ocurrio un error inesperado')
}

function messageFromPayload(payload: unknown) {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return null

  const record = payload as Record<string, unknown>
  const error = typeof record.error === 'string' ? record.error : null
  const message = typeof record.message === 'string' ? record.message : null
  const details = record.details
  const cause =
    details && typeof details === 'object'
      ? (details as Record<string, unknown>).cause
      : null
  const causeMessage = typeof cause === 'string' ? cause : null

  return [error ?? message, causeMessage].filter(Boolean).join(': ') || null
}

async function normalizeFunctionError(error: unknown): Promise<never> {
  const context = error && typeof error === 'object' ? (error as { context?: unknown }).context : null

  if (context instanceof Response) {
    const response = context.clone()
    const contentType = response.headers.get('content-type') ?? ''
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null)
    const backendMessage = messageFromPayload(payload)

    if (backendMessage) throw new Error(backendMessage)
  }

  return normalizeError(error)
}

async function runRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) return normalizeError(error)
  return data as T
}

export async function getFacturacionConfig(): Promise<FacturacionConfig> {
  return runRpc<FacturacionConfig>('facturacion_configuracion_obtener')
}

export async function saveFacturacionConfig(
  payload: Partial<FacturacionConfig>,
): Promise<FacturacionConfig> {
  return runRpc<FacturacionConfig>('facturacion_configuracion_guardar', { payload })
}

export async function listFacturas(from?: string, to?: string): Promise<FacturaResumen[]> {
  return runRpc<FacturaResumen[]>('facturas_listar', {
    p_from: from ?? null,
    p_to: to ?? null,
  })
}

export async function getArcaCredencialesResumen(): Promise<ArcaCredencialResumen[]> {
  return runRpc<ArcaCredencialResumen[]>('arca_credenciales_resumen')
}

export async function getArcaSolicitudesResumen(): Promise<ArcaCertificadoSolicitud[]> {
  return runRpc<ArcaCertificadoSolicitud[]>('arca_certificado_solicitudes_resumen')
}

export async function desactivarArcaCredenciales(
  ambiente: ArcaAmbiente,
): Promise<ArcaCredencialResumen[]> {
  return runRpc<ArcaCredencialResumen[]>('arca_credenciales_desactivar', {
    p_ambiente: ambiente,
  })
}

export async function subirArcaCredenciales({
  ambiente,
  certificado,
  privateKey,
  solicitudId,
}: {
  ambiente: ArcaAmbiente
  certificado: File
  privateKey?: File | null
  solicitudId?: string | null
}) {
  const selectedSolicitudId = solicitudId?.trim()
  const body = new FormData()
  body.append('ambiente', ambiente)
  body.append('certificado', certificado)
  if (selectedSolicitudId) {
    body.append('solicitudId', selectedSolicitudId)
    body.append('solicitud_id', selectedSolicitudId)
  }
  else if (privateKey) body.append('privateKey', privateKey)

  const { data, error } = await supabase.functions.invoke('subir-credenciales-arca', {
    body,
  })

  if (error) return normalizeFunctionError(error)
  return data
}

export async function generarSolicitudArca(
  ambiente: ArcaAmbiente,
  payload?: {
    cuit?: string
    organizacion?: string
  },
) {
  const { data, error } = await supabase.functions.invoke('generar-solicitud-arca', {
    body: {
      ambiente,
      cuit: payload?.cuit,
      organizacion: payload?.organizacion,
    },
  })

  if (error) return normalizeFunctionError(error)
  return data as {
    solicitud: ArcaCertificadoSolicitud
    csrPem: string
    csrFileName: string
    message: string
  }
}

export async function facturarVenta({
  ventaId,
  trigger = 'manual',
  force = false,
}: FacturarVentaInput) {
  const { data, error } = await supabase.functions.invoke('facturar-venta', {
    body: {
      ventaId,
      trigger,
      force,
    },
  })

  if (error) return normalizeFunctionError(error)
  return data
}
