import { createClient } from 'npm:@supabase/supabase-js@2'
import forge from 'npm:node-forge@1.3.1'

type JsonRecord = Record<string, unknown>

type RequestBody = {
  saleId?: number
  ventaId?: number
  trigger?: 'manual' | 'automatic'
  force?: boolean
}

const BUCKET = 'arca-credenciales'
const WSAA_SERVICE = 'wsfe'

const WSAA_URLS = {
  homologacion: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  produccion: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
}

const WSFE_URLS = {
  homologacion: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  produccion: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: JsonRecord,
  ) {
    super(message)
  }
}

function jsonResponse(status: number, body: JsonRecord) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function onlyDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '')
}

function requirePositiveInt(value: unknown, field: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${field} invalido`)
  }
  return parsed
}

function requireConfigValue<T>(value: T | null | undefined, field: string): T {
  if (value === null || value === undefined || value === '') {
    throw new HttpError(409, `Falta configurar ${field}`)
  }
  return value
}

function normalizeAmbiente(value: unknown): 'homologacion' | 'produccion' {
  return value === 'produccion' ? 'produccion' : 'homologacion'
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function textFromXml(xml: string, tagName: string) {
  const pattern = new RegExp(`<(?:\\w+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${tagName}>`)
  const match = xml.match(pattern)
  return match ? decodeXml(match[1].trim()) : null
}

function requiredXmlText(xml: string, tagName: string, context: string) {
  const value = textFromXml(xml, tagName)
  if (!value) throw new HttpError(502, `ARCA no devolvio ${tagName} en ${context}`)
  return value
}

function formatArcaDate(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function arcaErrorsFromXml(xml: string) {
  const messages: string[] = []
  const codeMatches = xml.matchAll(/<(?:\w+:)?Code>([\s\S]*?)<\/(?:\w+:)?Code>[\s\S]*?<(?:\w+:)?Msg>([\s\S]*?)<\/(?:\w+:)?Msg>/g)
  for (const match of codeMatches) {
    messages.push(`${decodeXml(match[1].trim())}: ${decodeXml(match[2].trim())}`)
  }
  const obsMatches = xml.matchAll(/<(?:\w+:)?Code>([\s\S]*?)<\/(?:\w+:)?Code>[\s\S]*?<(?:\w+:)?Msg>([\s\S]*?)<\/(?:\w+:)?Msg>/g)
  for (const match of obsMatches) {
    const msg = `${decodeXml(match[1].trim())}: ${decodeXml(match[2].trim())}`
    if (!messages.includes(msg)) messages.push(msg)
  }
  return messages
}

async function getAuthUser(supabaseUrl: string, anonKey: string, authHeader: string) {
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new HttpError(401, 'Sesion invalida o expirada')
  return data.user
}

async function downloadTextFile(admin: ReturnType<typeof createClient>, path: string, label: string) {
  const { data, error } = await admin.storage.from(BUCKET).download(path)
  if (error || !data) {
    throw new HttpError(500, `No se pudo leer ${label} desde Storage`, {
      cause: error?.message,
    })
  }
  return await data.text()
}

function createLoginTicketRequest() {
  const now = new Date()
  const generation = new Date(now.getTime() - 10 * 60 * 1000)
  const expiration = new Date(now.getTime() + 10 * 60 * 60 * 1000)

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(now.getTime() / 1000)}</uniqueId>
    <generationTime>${generation.toISOString()}</generationTime>
    <expirationTime>${expiration.toISOString()}</expirationTime>
  </header>
  <service>${WSAA_SERVICE}</service>
</loginTicketRequest>`
}

function signCms(loginTicketRequest: string, certificadoPem: string, privateKeyPem: string) {
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(loginTicketRequest, 'utf8')
  p7.addCertificate(certificadoPem)
  p7.addSigner({
    key: forge.pki.privateKeyFromPem(privateKeyPem),
    certificate: forge.pki.certificateFromPem(certificadoPem),
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  })
  p7.sign()

  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes())
}

async function loginWsaa({
  ambiente,
  certificadoPem,
  privateKeyPem,
}: {
  ambiente: 'homologacion' | 'produccion'
  certificadoPem: string
  privateKeyPem: string
}) {
  const cms = signCms(createLoginTicketRequest(), certificadoPem, privateKeyPem)
  const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <loginCms xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov">
      <in0>${escapeXml(cms)}</in0>
    </loginCms>
  </soapenv:Body>
</soapenv:Envelope>`

  const response = await fetch(WSAA_URLS[ambiente], {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: 'loginCms',
    },
    body: soap,
  })
  const xml = await response.text()

  if (!response.ok) {
    throw new HttpError(502, 'WSAA rechazo la autenticacion', {
      status: response.status,
      response: xml.slice(0, 1500),
    })
  }

  const ticketXml = requiredXmlText(xml, 'loginCmsReturn', 'WSAA')
  return {
    token: requiredXmlText(ticketXml, 'token', 'ticket WSAA'),
    sign: requiredXmlText(ticketXml, 'sign', 'ticket WSAA'),
    rawTicket: ticketXml,
  }
}

function buildAmounts(total: number, comprobanteTipo: number) {
  if (comprobanteTipo === 1 || comprobanteTipo === 6) {
    const neto = round2(total / 1.21)
    const iva = round2(total - neto)
    return { neto, iva, total: round2(total), ivaId: 5 }
  }

  return { neto: round2(total), iva: 0, total: round2(total), ivaId: null }
}

function condicionIvaReceptorId(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()

  if (normalized.includes('inscripto')) return 1
  if (normalized.includes('monotributo')) return 6
  if (normalized.includes('exento')) return 4
  if (normalized.includes('no categorizado')) return 7
  return 5
}

async function wsfeSoap({
  ambiente,
  action,
  body,
}: {
  ambiente: 'homologacion' | 'produccion'
  action: string
  body: string
}) {
  const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Header/>
  <soapenv:Body>
    ${body}
  </soapenv:Body>
</soapenv:Envelope>`

  const response = await fetch(WSFE_URLS[ambiente], {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `http://ar.gov.afip.dif.FEV1/${action}`,
    },
    body: soap,
  })
  const xml = await response.text()

  if (!response.ok) {
    throw new HttpError(502, `WSFEv1 rechazo ${action}`, {
      status: response.status,
      response: xml.slice(0, 1500),
    })
  }

  return xml
}

function authXml(token: string, sign: string, cuit: string) {
  return `<ar:Auth>
  <ar:Token>${escapeXml(token)}</ar:Token>
  <ar:Sign>${escapeXml(sign)}</ar:Sign>
  <ar:Cuit>${cuit}</ar:Cuit>
</ar:Auth>`
}

async function getLastVoucher({
  ambiente,
  token,
  sign,
  cuit,
  puntoVenta,
  comprobanteTipo,
}: {
  ambiente: 'homologacion' | 'produccion'
  token: string
  sign: string
  cuit: string
  puntoVenta: number
  comprobanteTipo: number
}) {
  const xml = await wsfeSoap({
    ambiente,
    action: 'FECompUltimoAutorizado',
    body: `<ar:FECompUltimoAutorizado>
  ${authXml(token, sign, cuit)}
  <ar:PtoVta>${puntoVenta}</ar:PtoVta>
  <ar:CbteTipo>${comprobanteTipo}</ar:CbteTipo>
</ar:FECompUltimoAutorizado>`,
  })

  const last = Number(textFromXml(xml, 'CbteNro') ?? 0)
  if (!Number.isInteger(last) || last < 0) {
    throw new HttpError(502, 'WSFEv1 no devolvio el ultimo comprobante autorizado', {
      response: xml.slice(0, 1500),
    })
  }
  return last
}

async function solicitarCae({
  ambiente,
  token,
  sign,
  cuit,
  puntoVenta,
  comprobanteTipo,
  concepto,
  documentoTipo,
  documentoNro,
  condicionIvaReceptor,
  comprobanteNro,
  importes,
  monedaId,
  monedaCotizacion,
}: {
  ambiente: 'homologacion' | 'produccion'
  token: string
  sign: string
  cuit: string
  puntoVenta: number
  comprobanteTipo: number
  concepto: number
  documentoTipo: number
  documentoNro: string
  condicionIvaReceptor: number
  comprobanteNro: number
  importes: ReturnType<typeof buildAmounts>
  monedaId: string
  monedaCotizacion: number
}) {
  const cbteFecha = formatArcaDate()
  const ivaXml = importes.ivaId
    ? `<ar:Iva>
        <ar:AlicIva>
          <ar:Id>${importes.ivaId}</ar:Id>
          <ar:BaseImp>${importes.neto.toFixed(2)}</ar:BaseImp>
          <ar:Importe>${importes.iva.toFixed(2)}</ar:Importe>
        </ar:AlicIva>
      </ar:Iva>`
    : ''

  const xml = await wsfeSoap({
    ambiente,
    action: 'FECAESolicitar',
    body: `<ar:FECAESolicitar>
  ${authXml(token, sign, cuit)}
  <ar:FeCAEReq>
    <ar:FeCabReq>
      <ar:CantReg>1</ar:CantReg>
      <ar:PtoVta>${puntoVenta}</ar:PtoVta>
      <ar:CbteTipo>${comprobanteTipo}</ar:CbteTipo>
    </ar:FeCabReq>
    <ar:FeDetReq>
      <ar:FECAEDetRequest>
        <ar:Concepto>${concepto}</ar:Concepto>
        <ar:DocTipo>${documentoTipo}</ar:DocTipo>
        <ar:DocNro>${documentoNro}</ar:DocNro>
        <ar:CondicionIVAReceptorId>${condicionIvaReceptor}</ar:CondicionIVAReceptorId>
        <ar:CbteDesde>${comprobanteNro}</ar:CbteDesde>
        <ar:CbteHasta>${comprobanteNro}</ar:CbteHasta>
        <ar:CbteFch>${cbteFecha}</ar:CbteFch>
        <ar:ImpTotal>${importes.total.toFixed(2)}</ar:ImpTotal>
        <ar:ImpTotConc>0.00</ar:ImpTotConc>
        <ar:ImpNeto>${importes.neto.toFixed(2)}</ar:ImpNeto>
        <ar:ImpOpEx>0.00</ar:ImpOpEx>
        <ar:ImpTrib>0.00</ar:ImpTrib>
        <ar:ImpIVA>${importes.iva.toFixed(2)}</ar:ImpIVA>
        <ar:MonId>${escapeXml(monedaId)}</ar:MonId>
        <ar:MonCotiz>${monedaCotizacion.toFixed(6)}</ar:MonCotiz>
        ${ivaXml}
      </ar:FECAEDetRequest>
    </ar:FeDetReq>
  </ar:FeCAEReq>
</ar:FECAESolicitar>`,
  })

  const resultado = textFromXml(xml, 'Resultado')
  const cae = textFromXml(xml, 'CAE')
  const caeVencimiento = textFromXml(xml, 'CAEFchVto')
  const errors = arcaErrorsFromXml(xml)

  if (resultado !== 'A' || !cae || !caeVencimiento) {
    throw new HttpError(409, errors[0] ? `ARCA rechazo la factura: ${errors.join(' | ')}` : 'ARCA no autorizo la factura', {
      resultado: resultado ?? null,
      response: xml.slice(0, 2500),
    })
  }

  return { cae, caeVencimiento, rawResponse: xml }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse(405, { error: 'Metodo no permitido' })

  try {
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const anonKey = getRequiredEnv('SUPABASE_ANON_KEY')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) throw new HttpError(401, 'Falta Authorization header')

    const user = await getAuthUser(supabaseUrl, anonKey, authHeader)
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const body = (await req.json().catch(() => ({}))) as RequestBody
    const ventaId = requirePositiveInt(body.saleId ?? body.ventaId, 'saleId')
    const trigger = body.trigger ?? 'manual'
    const force = body.force === true

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('id,kiosco_id,deleted')
      .eq('auth_id', user.id)
      .eq('deleted', false)
      .single()

    if (profileError || !profile?.kiosco_id) {
      throw new HttpError(403, 'No se pudo resolver el kiosco del usuario')
    }

    const kioscoId = profile.kiosco_id as string

    const { data: config, error: configError } = await admin
      .from('kiosco_facturacion_config')
      .select('*')
      .eq('kiosco_id', kioscoId)
      .maybeSingle()

    if (configError) throw new HttpError(500, 'No se pudo leer la configuracion fiscal')
    if (!config) throw new HttpError(409, 'Este kiosco no tiene configuracion fiscal')

    const modo = String(config.facturacion_modo ?? 'manual')
    if (modo === 'desactivada' && !force) {
      return jsonResponse(200, {
        skipped: true,
        reason: 'facturacion_desactivada',
        message: 'La facturacion esta desactivada para este kiosco',
      })
    }

    if (trigger === 'automatic' && modo !== 'automatica' && !force) {
      return jsonResponse(200, {
        skipped: true,
        reason: 'facturacion_manual',
        message: 'La venta se guardo sin factura porque el kiosco usa facturacion manual',
      })
    }

    if (config.arca_habilitado !== true && !force) {
      throw new HttpError(409, 'ARCA no esta habilitado para este kiosco')
    }

    const cuit = onlyDigits(requireConfigValue(config.cuit, 'CUIT emisor'))
    const puntoVenta = requirePositiveInt(config.punto_venta, 'puntoVenta')
    const comprobanteTipo = requirePositiveInt(config.comprobante_tipo_default, 'comprobanteTipoDefault')
    const concepto = requirePositiveInt(config.concepto_default ?? 1, 'conceptoDefault')
    const ambiente = normalizeAmbiente(config.arca_ambiente)
    const monedaId = String(config.moneda_id ?? 'PES')
    const monedaCotizacion = Number(config.moneda_cotizacion ?? 1)

    if (cuit.length !== 11) throw new HttpError(409, 'El CUIT emisor debe tener 11 digitos')

    const { data: credential, error: credentialError } = await admin
      .from('arca_credenciales')
      .select('certificado_storage_path,private_key_storage_path')
      .eq('kiosco_id', kioscoId)
      .eq('ambiente', ambiente)
      .eq('activo', true)
      .maybeSingle()

    if (credentialError) throw new HttpError(500, 'No se pudo leer la credencial ARCA')
    if (!credential) throw new HttpError(409, `No hay credencial ARCA activa para ${ambiente}`)

    const { data: sale, error: saleError } = await admin
      .from('venta')
      .select(`
        id,
        kiosco_id,
        cliente_id,
        total,
        deleted,
        factura_estado,
        factura_id,
        cliente:cliente_id (
          id,
          nombre,
          apellido,
          documento_tipo,
          documento_nro,
          condicion_iva,
          razon_social
        )
      `)
      .eq('id', ventaId)
      .eq('kiosco_id', kioscoId)
      .eq('deleted', false)
      .single()

    if (saleError || !sale) throw new HttpError(404, 'Venta no encontrada')

    const { data: existingInvoice, error: existingError } = await admin
      .from('factura')
      .select('*')
      .eq('kiosco_id', kioscoId)
      .eq('venta_id', ventaId)
      .maybeSingle()

    if (existingError) throw new HttpError(500, 'No se pudo consultar la factura existente')
    if (existingInvoice?.estado === 'autorizada') {
      return jsonResponse(200, { invoice: existingInvoice, alreadyAuthorized: true })
    }

    const cliente = Array.isArray(sale.cliente) ? sale.cliente[0] : sale.cliente
    const total = Number(sale.total ?? 0)
    if (!Number.isFinite(total) || total <= 0) {
      throw new HttpError(409, 'La venta no tiene un total valido para facturar')
    }

    const certificadoPem = await downloadTextFile(admin, credential.certificado_storage_path as string, 'certificado ARCA')
    const privateKeyPem = await downloadTextFile(admin, credential.private_key_storage_path as string, 'clave privada ARCA')

    const { token, sign, rawTicket } = await loginWsaa({ ambiente, certificadoPem, privateKeyPem })
    const nextVoucher = await getLastVoucher({
      ambiente,
      token,
      sign,
      cuit,
      puntoVenta,
      comprobanteTipo,
    }) + 1

    const importes = buildAmounts(total, comprobanteTipo)
    const documentoTipo = cliente?.documento_tipo ? Number(cliente.documento_tipo) : 99
    const documentoNro = cliente?.documento_nro ? onlyDigits(cliente.documento_nro) : '0'
    const condicionIvaReceptor = condicionIvaReceptorId(cliente?.condicion_iva)
    const arcaResult = await solicitarCae({
      ambiente,
      token,
      sign,
      cuit,
      puntoVenta,
      comprobanteTipo,
      concepto,
      documentoTipo,
      documentoNro,
      condicionIvaReceptor,
      comprobanteNro: nextVoucher,
      importes,
      monedaId,
      monedaCotizacion,
    })

    const invoicePayload = {
      kiosco_id: kioscoId,
      venta_id: ventaId,
      ambiente,
      estado: 'autorizada',
      cuit_emisor: cuit,
      punto_venta: puntoVenta,
      comprobante_tipo: comprobanteTipo,
      comprobante_nro: nextVoucher,
      concepto,
      documento_tipo: documentoTipo,
      documento_nro: documentoNro,
      arca_observaciones: [{ condicionIvaReceptorId: condicionIvaReceptor }],
      moneda_id: monedaId,
      moneda_cotizacion: monedaCotizacion,
      importe_neto: importes.neto,
      importe_iva: importes.iva,
      importe_total: importes.total,
      cae: arcaResult.cae,
      cae_vencimiento: `${arcaResult.caeVencimiento.slice(0, 4)}-${arcaResult.caeVencimiento.slice(4, 6)}-${arcaResult.caeVencimiento.slice(6, 8)}`,
      arca_request: {
        trigger,
        ventaId,
        clienteId: sale.cliente_id,
        wsaaExpiration: textFromXml(rawTicket, 'expirationTime'),
      },
      arca_response: {
        raw: arcaResult.rawResponse,
      },
      error_message: null,
    }

    const { data: invoice, error: invoiceError } = existingInvoice
      ? await admin
        .from('factura')
        .update(invoicePayload)
        .eq('id', existingInvoice.id)
        .select('*')
        .single()
      : await admin
        .from('factura')
        .insert(invoicePayload)
        .select('*')
        .single()

    if (invoiceError || !invoice) {
      throw new HttpError(500, 'No se pudo guardar la factura autorizada', {
        cause: invoiceError?.message,
      })
    }

    await admin
      .from('venta')
      .update({
        factura_estado: 'autorizada',
        factura_id: invoice.id,
      })
      .eq('id', ventaId)
      .eq('kiosco_id', kioscoId)

    return jsonResponse(200, {
      invoice,
      authorized: true,
      message: `Factura autorizada por ARCA. CAE ${arcaResult.cae}`,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, {
        error: error.message,
        details: error.details ?? null,
      })
    }

    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Error inesperado',
    })
  }
})
