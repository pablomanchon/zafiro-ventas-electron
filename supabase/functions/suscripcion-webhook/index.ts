import { createClient } from 'npm:@supabase/supabase-js@2'

const MP_MONTHLY_PLAN_ID = Deno.env.get('MP_MONTHLY_PLAN_ID') ?? ''
const MP_YEARLY_PLAN_ID  = Deno.env.get('MP_YEARLY_PLAN_ID')  ?? ''

const DIAS_POR_PLAN: Record<string, number> = {
  [MP_MONTHLY_PLAN_ID]: 31,
  [MP_YEARLY_PLAN_ID]:  365,
}

async function mpGet(path: string, token: string) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`MP ${path} → ${res.status}`)
  return res.json()
}

async function extenderSuscripcion(email: string, planId: string) {
  const dias = DIAS_POR_PLAN[planId]
  if (!dias) throw new Error(`Plan desconocido: ${planId}`)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: user } = await supabase
    .from('users')
    .select('kiosco_id, venc_date')
    .eq('email', email)
    .single()

  if (!user) throw new Error(`Usuario no encontrado: ${email}`)

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
    .eq('kiosco_id', user.kiosco_id)

  // Registrar el cobro
  await supabase.from('suscripcion_pago').insert({
    kiosco_id: user.kiosco_id,
    plan: dias === 365 ? 'anual' : 'mensual',
    monto: dias === 365 ? 180000 : 30000,
    estado: 'aprobado',
    aprobado_at: new Date().toISOString(),
  })

  console.log(`Suscripción extendida: ${email} → ${base.toISOString()}`)
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('OK', { status: 200 })

  try {
    const body = await req.json()
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!
    const { type, data } = body

    // Pago dentro de una suscripción recurrente
    if (type === 'subscription_authorized_payment' && data?.id) {
      const authorizedPayment = await mpGet(`/authorized_payments/${data.id}`, mpToken)
      const preapprovalId = authorizedPayment.preapproval_id
      if (!preapprovalId) return new Response('ok', { status: 200 })

      const preapproval = await mpGet(`/preapproval/${preapprovalId}`, mpToken)
      const email: string = preapproval.payer_email
      const planId: string = preapproval.preapproval_plan_id

      if (preapproval.status === 'authorized') {
        await extenderSuscripcion(email, planId)
      }
      return new Response('ok', { status: 200 })
    }

    // Primera suscripción creada (estado autorizado)
    if (type === 'subscription_preapproval' && data?.id) {
      const preapproval = await mpGet(`/preapproval/${data.id}`, mpToken)
      const email: string = preapproval.payer_email
      const planId: string = preapproval.preapproval_plan_id

      if (preapproval.status === 'authorized') {
        await extenderSuscripcion(email, planId)
      }
      return new Response('ok', { status: 200 })
    }

    return new Response('ignored', { status: 200 })
  } catch (err) {
    console.error('webhook error:', err)
    return new Response('error handled', { status: 200 })
  }
})
