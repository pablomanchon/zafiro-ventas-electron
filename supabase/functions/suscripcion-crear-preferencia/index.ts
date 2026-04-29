import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PLANES = {
  mensual: { monto: 30000, dias: 31,  titulo: 'Zafiro - Plan Mensual' },
  anual:   { monto: 180000, dias: 365, titulo: 'Zafiro - Plan Anual'   },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: perfil, error: perfilError } = await supabase.rpc('mi_perfil')
    if (perfilError || !perfil) throw new Error('No se pudo obtener el perfil')

    const kioscoId: string = perfil.kioscoId
    const { plan, origin } = await req.json() as { plan: 'mensual' | 'anual'; origin: string }

    if (!PLANES[plan]) throw new Error('Plan inválido')

    const { monto, titulo } = PLANES[plan]
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) throw new Error('MP_ACCESS_TOKEN no configurado')

    const preferenceBody = {
      items: [{
        title: titulo,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: monto,
      }],
      external_reference: `${kioscoId}|${plan}`,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/suscripcion-webhook`,
      back_urls: {
        success: `${origin}/suscripcion?pago=ok`,
        failure: `${origin}/suscripcion?pago=error`,
        pending: `${origin}/suscripcion?pago=pendiente`,
      },
      auto_return: 'approved',
      statement_descriptor: 'ZAFIRO SISTEMA',
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody),
    })

    if (!mpRes.ok) {
      const err = await mpRes.text()
      throw new Error(`Error MP: ${err}`)
    }

    const preference = await mpRes.json()

    // Registrar el intento
    await supabase.from('suscripcion_pago').insert({
      kiosco_id: kioscoId,
      plan,
      monto,
      mp_preference_id: preference.id,
      estado: 'pendiente',
    })

    return new Response(
      JSON.stringify({ init_point: preference.init_point, preference_id: preference.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
})
