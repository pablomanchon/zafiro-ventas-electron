import { supabase } from './supabase'

export type KioscoPerfil = {
  id: string
  nombre: string
  telefono: string | null
  direccion: string | null
  tipoCambioUsd: number
}

export async function kioscoObtener(): Promise<KioscoPerfil> {
  const { data, error } = await supabase.rpc('kiosco_obtener')
  if (error) throw error
  return data as KioscoPerfil
}

export async function kioscoActualizar(input: {
  nombre: string
  telefono?: string | null
  direccion?: string | null
  tipoCambioUsd?: number | null
}): Promise<void> {
  const { error } = await supabase.rpc('kiosco_actualizar', {
    p_nombre: input.nombre,
    p_telefono: input.telefono ?? null,
    p_direccion: input.direccion ?? null,
    p_tipo_cambio_usd: input.tipoCambioUsd ?? null,
  })
  if (error) throw error
}
