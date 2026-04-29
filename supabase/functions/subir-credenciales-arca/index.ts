import { createClient } from 'npm:@supabase/supabase-js@2'

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

function normalizeAmbiente(value: FormDataEntryValue | null) {
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

function assertFile(value: FormDataEntryValue | null, field: string) {
  if (!(value instanceof File)) throw new HttpError(400, `Falta archivo ${field}`)
  if (value.size <= 0) throw new HttpError(400, `El archivo ${field} esta vacio`)
  if (value.size > 1024 * 1024) throw new HttpError(400, `El archivo ${field} supera 1MB`)
  return value
}

function optionalFile(value: FormDataEntryValue | null) {
  if (!value) return null
  if (!(value instanceof File)) return null
  if (value.size <= 0) return null
  return value
}

async function readPemFile(file: File, expected: 'certificate' | 'private-key') {
  const text = await file.text()

  if (expected === 'certificate' && !text.includes('BEGIN CERTIFICATE')) {
    throw new HttpError(400, 'El certificado debe estar en formato PEM .crt')
  }

  const hasPrivateKey =
    text.includes('BEGIN PRIVATE KEY') ||
    text.includes('BEGIN RSA PRIVATE KEY') ||
    text.includes('BEGIN ENCRYPTED PRIVATE KEY')

  if (expected === 'private-key' && !hasPrivateKey) {
    throw new HttpError(400, 'La clave privada debe estar en formato PEM .key')
  }

  return new Blob([text], { type: 'text/plain' })
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

    const formData = await req.formData()
    const ambiente = normalizeAmbiente(formData.get('ambiente'))
    const solicitudId = String(
      formData.get('solicitudId') ?? formData.get('solicitud_id') ?? '',
    ).trim()
    const certFile = assertFile(formData.get('certificado'), 'certificado')
    const keyFile = optionalFile(formData.get('privateKey'))

    const certificadoBlob = await readPemFile(certFile, 'certificate')

    const kioscoId = profile.kiosco_id as string
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const basePath = `${kioscoId}/${ambiente}/${stamp}`
    const certificadoPath = `${basePath}/certificado.crt`
    let privateKeyPath = `${basePath}/private.key`

    if (solicitudId) {
      const { data: solicitud, error: solicitudError } = await admin
        .from('arca_certificado_solicitudes')
        .select('id,ambiente,kiosco_id,private_key_storage_path,estado')
        .eq('id', solicitudId)
        .eq('kiosco_id', kioscoId)
        .eq('ambiente', ambiente)
        .single()

      if (solicitudError || !solicitud) {
        throw new HttpError(404, 'Solicitud CSR no encontrada para este kiosco y ambiente')
      }

      if (solicitud.estado !== 'pendiente') {
        throw new HttpError(409, 'La solicitud CSR ya no esta pendiente')
      }

      privateKeyPath = solicitud.private_key_storage_path as string
    } else if (!keyFile) {
      throw new HttpError(400, 'Selecciona una solicitud CSR o carga la clave privada .key')
    }

    const certUpload = await admin.storage
      .from(BUCKET)
      .upload(certificadoPath, certificadoBlob, {
        contentType: 'text/plain',
        upsert: false,
      })

    if (certUpload.error) {
      throw new HttpError(500, 'No se pudo subir el certificado', {
        cause: certUpload.error.message,
      })
    }

    if (!solicitudId && keyFile) {
      const privateKeyBlob = await readPemFile(keyFile, 'private-key')
      const keyUpload = await admin.storage
        .from(BUCKET)
        .upload(privateKeyPath, privateKeyBlob, {
          contentType: 'text/plain',
          upsert: false,
        })

      if (keyUpload.error) {
        await admin.storage.from(BUCKET).remove([certificadoPath])
        throw new HttpError(500, 'No se pudo subir la clave privada', {
          cause: keyUpload.error.message,
        })
      }
    }

    await admin
      .from('arca_credenciales')
      .update({ activo: false })
      .eq('kiosco_id', kioscoId)
      .eq('ambiente', ambiente)
      .eq('activo', true)

    const { data: credential, error: credentialError } = await admin
      .from('arca_credenciales')
      .insert({
        kiosco_id: kioscoId,
        ambiente,
        certificado_storage_path: certificadoPath,
        private_key_storage_path: privateKeyPath,
        solicitud_id: solicitudId || null,
        activo: true,
      })
      .select('id,ambiente,activo,created_at,updated_at')
      .single()

    if (credentialError || !credential) {
      await admin.storage
        .from(BUCKET)
        .remove(solicitudId ? [certificadoPath] : [certificadoPath, privateKeyPath])
      throw new HttpError(500, 'No se pudo registrar la credencial ARCA', {
        cause: credentialError?.message,
      })
    }

    if (solicitudId) {
      await admin
        .from('arca_certificado_solicitudes')
        .update({ estado: 'completada' })
        .eq('id', solicitudId)
        .eq('kiosco_id', kioscoId)
    }

    return jsonResponse(200, {
      credential: {
        id: credential.id,
        ambiente: credential.ambiente,
        activo: credential.activo,
        tieneCertificado: true,
        tienePrivateKey: true,
        createdAt: credential.created_at,
        updatedAt: credential.updated_at,
      },
      message: 'Credenciales ARCA guardadas para el kiosco',
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
