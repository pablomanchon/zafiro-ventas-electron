import { supabase } from './supabase'

export type ProductoStockMinimo = {
  id: number
  nombre: string
  codigo: string | null
  stock: number
  stockMinimo: number
  bajoDemanda: boolean
}

export async function productosStockMinimosListar(): Promise<ProductoStockMinimo[]> {
  const { data, error } = await supabase.rpc('productos_stock_minimos_listar')
  if (error) throw error
  return (data ?? []) as ProductoStockMinimo[]
}

export async function productoStockMinimoGuardar(id: number, stockMinimo: number): Promise<void> {
  const { error } = await supabase.rpc('producto_stock_minimo_guardar', {
    p_id: id,
    p_stock_minimo: stockMinimo,
  })
  if (error) throw error
}
