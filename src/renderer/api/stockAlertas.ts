import { getAll, update } from './crud'

export type ProductoStockMinimo = {
  id: number
  nombre: string
  codigo: string | null
  stock: number
  stockMinimo: number
  bajoDemanda: boolean
}

export async function productosStockMinimosListar(): Promise<ProductoStockMinimo[]> {
  const productos = await getAll<any>('productos')

  return productos.map((p) => {
    const stock = Number(p.stock ?? 0)
    const stockMinimo = Number(p.stock_minimo ?? p.stockMinimo ?? 0)

    return {
      id: Number(p.id),
      nombre: String(p.nombre ?? ''),
      codigo: p.codigo ?? null,
      stock,
      stockMinimo,
      bajoDemanda: stockMinimo > 0 && stock <= stockMinimo,
    }
  })
}

export async function productoStockMinimoGuardar(id: number, stockMinimo: number): Promise<void> {
  await update('productos', id, { stock_minimo: stockMinimo })
}
