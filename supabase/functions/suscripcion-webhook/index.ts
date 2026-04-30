import { createClient } from 'npm:@supabase/supabase-js@2'

const MP_MONTHLY_PLAN_ID = Deno.env.get('MP_MONTHLY_PLAN_ID') ?? ''
const MP_YEARLY_PLAN_ID = Deno.env.get('MP_YEARLY_PLAN_ID') ?? ''

const DIAS_POR_PLAN_ID: Record<string, number> = {
  [MP_MONTHLY_PLAN_ID]: 31,
  [MP_YEARLY_PLAN_ID]: 365,
}

const PLANES = {
  mensual: { dias: 31, monto: 30000 },
  anual: { dias: 365, monto: 180000 },
} as const

type Plan = keyof typeof PLANES

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

async function mpGet(path: string, token: string) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`MP ${path} -> ${res.status}`)
  return res.json()
}

async function extenderSuscripcionKiosco(
  kioscoId: string,
  plan: Plan,
  extraPago: { mpPaymentId?: string | null; mpPreferenceId?: string | null } = {},
) {
  const supabase = getSupabaseAdmin()
  const { dias, monto } = PLANES[plan]

  if (extraPago.mpPaymentId) {
    const { data: pagoExistente } = await supabase
      .from('suscripcion_pago')
      .select('id')
      .eq('mp_payment_id', extraPago.mpPaymentId)
      .maybeSingle()

    if (pagoExistente) {
      console.log(`Pago ya procesado: ${extraPago.mpPaymentId}`)
      return
    }
  }

  const { data: user } = await supabase
    .from('users')
    .select('venc_date')
    .eq('kiosco_id', kioscoId)
    .order('venc_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!user) throw new Error(`Kiosco sin usuario: ${kioscoId}`)

  const base = user.venc_date && new Date(user.venc_date) > new Date()
    ? new Date(user.venc_date)
    : new Date()

  base.setDate(base.getDate() + dias)

  await supabase
    .from('users')
    .update({
      venc_date: base.toISOString(),
      paymenth_date: new Date().toISOString(),
    })
    .eq('kiosco_id', kioscoId)

  let pagoPendienteActualizado = false

  if (extraPago.mpPreferenceId) {
    const { data: pagosActualizados } = await supabase
      .from('suscripcion_pago')
      .update({
        mp_payment_id: extraPago.mpPaymentId ?? null,
        estado: 'aprobado',
        aprobado_at: new Date().toISOString(),
      })
      .eq('kiosco_id', kioscoId)
      .eq('mp_preference_id', extraPago.mpPreferenceId)
      .eq('estado', 'pendiente')
      .select('id')

    pagoPendienteActualizado = Boolean(pagosActualizados?.length)
  }

  if (!pagoPendienteActualizado) {
    await supabase.from('suscripcion_pago').insert({
      kiosco_id: kioscoId,
      plan,
      monto,
      mp_preference_id: extraPago.mpPreferenceId ?? null,
      mp_payment_id: extraPago.mpPaymentId ?? null,
      estado: 'aprobado',
      aprobado_at: new Date().toISOString(),
    })
  }

  console.log(`Suscripcion extendida: kiosco ${kioscoId} -> ${base.toISOString()}`)
}

async function extenderSuscripcionPorEmail(email: string, planId: string) {
  const dias = DIAS_POR_PLAN_ID[planId]
  if (!dias) throw new Error(`Plan desconocido: ${planId}`)

  const supabase = getSupabaseAdmin()
  const { data: user } = await supabase
    .from('users')
    .select('kiosco_id')
    .eq('email', email)
    .single()

  if (!user) throw new Error(`Usuario no encontrado: ${email}`)

  await extenderSuscripcionKiosco(user.kiosco_id, dias === 365 ? 'anual' : 'mensual')
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('OK', { status: 200 })

  try {
    const body = await req.json()
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!
    const { type, data } = body

    if (type === 'payment' && data?.id) {
      const payment = await mpGet(`/v1/payments/${data.id}`, mpToken)
      if (payment.status !== 'approved') return new Response('ok', { status: 200 })

      const externalReference = String(payment.external_reference ?? '')
      const [kioscoId, plan] = externalReference.split('|') as [string, Plan]

      if (!kioscoId || !PLANES[plan]) {
        throw new Error(`external_reference invalido: ${externalReference}`)
      }

      await extenderSuscripcionKiosco(kioscoId, plan, {
        mpPaymentId: String(payment.id),
        mpPreferenceId: payment.preference_id ? String(payment.preference_id) : null,
      })

      return new Response('ok', { status: 200 })
    }

    // Pago dentro de una suscripcion recurrente
    if (type === 'subscription_authorized_payment' && data?.id) {
      const authorizedPayment = await mpGet(`/authorized_payments/${data.id}`, mpToken)
      const preapprovalId = authorizedPayment.preapproval_id
      if (!preapprovalId) return new Response('ok', { status: 200 })

      const preapproval = await mpGet(`/preapproval/${preapprovalId}`, mpToken)
      const email: string = preapproval.payer_email
      const planId: string = preapproval.preapproval_plan_id

      if (preapproval.status === 'authorized') {
        await extenderSuscripcionPorEmail(email, planId)
      }
      return new Response('ok', { status: 200 })
    }

    // Primera suscripcion recurrente creada
    if (type === 'subscription_preapproval' && data?.id) {
      const preapproval = await mpGet(`/preapproval/${data.id}`, mpToken)
      const email: string = preapproval.payer_email
      const planId: string = preapproval.preapproval_plan_id

      if (preapproval.status === 'authorized') {
        await extenderSuscripcionPorEmail(email, planId)
      }
      return new Response('ok', { status: 200 })
    }

    return new Response('ignored', { status: 200 })
  } catch (err) {
    console.error('webhook error:', err)
    return new Response('error handled', { status: 200 })
  }
})
