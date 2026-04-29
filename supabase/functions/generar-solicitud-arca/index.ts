import { createClient } from 'npm:@supabase/supabase-js@2'
import forge from 'npm:node-forge@1.3.1'

type JsonRecord = Record<string, unknown>

const BUCKET = 'arca-credenciales'

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

function normalizeAmbiente(value: unknown) {
  const ambiente = String(value ?? 'homologacion')
  if (ambiente !== 'homologacion' && ambiente !== 'produccion') {
    throw new HttpError(400, 'Ambiente ARCA invalido')
  }
  return ambiente
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

function buildCsr({
  cuit,
  organizacion,
  commonName,
}: {
  cuit: string
  organizacion: string
  commonName: string
}) {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 })
  const csr = forge.pki.createCertificationRequest()
  csr.publicKey = keys.publicKey
  csr.setSubject([
    { name: 'countryName', value: 'AR' },
    { name: 'organizationName', value: organizacion },
    { name: 'commonName', value: commonName },
    { name: 'serialNumber', value: `CUIT ${cuit}` },
  ])
  csr.sign(keys.privateKey, forge.md.sha256.create())

  if (!csr.verify()) {
    throw new HttpError(500, 'No se pudo validar el CSR generado')
  }

  return {
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    csrPem: forge.pki.certificationRequestToPem(csr),
  }
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
    const body = (await req.json().catch(() => ({}))) as JsonRecord
    const ambiente = normalizeAmbiente(body.ambiente)

    const { data: config, error: configError } = await admin
      .from('kiosco_facturacion_config')
      .select('cuit,razon_social')
      .eq('kiosco_id', kioscoId)
      .maybeSingle()

    if (configError) throw new HttpError(500, 'No se pudo leer la configuracion fiscal')

    const cuit = onlyDigits(body.cuit ?? config?.cuit)
    const organizacion = String(body.organizacion ?? config?.razon_social ?? '').trim()
    const commonName = String(body.commonName ?? 'Zafiro').trim() || 'Zafiro'

    if (cuit.length !== 11) throw new HttpError(409, 'Configura un CUIT emisor valido de 11 digitos')
    if (!organizacion) throw new HttpError(409, 'Configura una razon social antes de generar el CSR')

    const { privateKeyPem, csrPem } = buildCsr({ cuit, organizacion, commonName })

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const basePath = `${kioscoId}/${ambiente}/solicitudes/${stamp}`
    const privateKeyPath = `${basePath}/private.key`
    const csrPath = `${basePath}/pedido.csr`

    const keyUpload = await admin.storage
      .from(BUCKET)
      .upload(privateKeyPath, new Blob([privateKeyPem], { type: 'text/plain' }), {
        contentType: 'text/plain',
        upsert: false,
      })

    if (keyUpload.error) {
      throw new HttpError(500, 'No se pudo guardar la clave privada', {
        cause: keyUpload.error.message,
      })
    }

    const csrUpload = await admin.storage
      .from(BUCKET)
      .upload(csrPath, new Blob([csrPem], { type: 'text/plain' }), {
        contentType: 'text/plain',
        upsert: false,
      })

    if (csrUpload.error) {
      await admin.storage.from(BUCKET).remove([privateKeyPath])
      throw new HttpError(500, 'No se pudo guardar el CSR', {
        cause: csrUpload.error.message,
      })
    }

    const { data: solicitud, error: solicitudError } = await admin
      .from('arca_certificado_solicitudes')
      .insert({
        kiosco_id: kioscoId,
        ambiente,
        cuit,
        organizacion,
        common_name: commonName,
        private_key_storage_path: privateKeyPath,
        csr_storage_path: csrPath,
        estado: 'pendiente',
      })
      .select('id,ambiente,cuit,organizacion,common_name,estado,created_at,updated_at')
      .single()

    if (solicitudError || !solicitud) {
      await admin.storage.from(BUCKET).remove([privateKeyPath, csrPath])
      throw new HttpError(500, 'No se pudo registrar la solicitud ARCA', {
        cause: solicitudError?.message,
      })
    }

    return jsonResponse(200, {
      solicitud: {
        id: solicitud.id,
        ambiente: solicitud.ambiente,
        cuit: solicitud.cuit,
        organizacion: solicitud.organizacion,
        commonName: solicitud.common_name,
        estado: solicitud.estado,
        createdAt: solicitud.created_at,
        updatedAt: solicitud.updated_at,
      },
      csrPem,
      csrFileName: `arca-${ambiente}-${cuit}.csr`,
      message: 'Solicitud CSR generada. Subi este archivo a ARCA y luego carga el certificado .crt devuelto.',
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
