import { supabase } from './supabase'

type Plan = 'mensual' | 'anual'

type CrearPreferenciaResponse = {
  init_point?: string
  preference_id?: string
}

export async function crearPreferenciaSuscripcion(plan: Plan): Promise<CrearPreferenciaResponse> {
  const { data, error } = await supabase.functions.invoke<CrearPreferenciaResponse>(
    'suscripcion-crear-preferencia',
    {
      body: { plan, origin: window.location.origin },
    },
  )

  if (error) {
    const response = (error as any)?.context as Response | undefined
    if (response) {
      try {
        const body = await response.clone().json()
        if (body?.error) throw new Error(String(body.error))
      } catch (parsedError) {
        if (parsedError instanceof Error && parsedError.message) throw parsedError
      }
    }
    throw error
  }
  if (!data?.init_point) throw new Error('MercadoPago no devolvio un link de pago')

  return data
}
