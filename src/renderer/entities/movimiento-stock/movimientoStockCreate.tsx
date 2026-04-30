import { useState, useMemo, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { FormInput } from '../../layout/DynamicForm'
import DynamicForm from '../../layout/DynamicForm'
import Title from '../../layout/Title'
import MovimientoStockItemsTable, { type StockItem } from './movimientoStockItemsTable'
import { useStockMovements } from '../../hooks/useMovimientoStock'
import VendedorSelectInput from '../sellers/VendedorSelectInput'

const DRAFT_VENDEDOR_KEY = 'draft:movimiento-stock:vendedorId'

const EMPTY_ROWS: StockItem[] = [
  { productId: '', nombre: '', cantidad: 1 },
  { productId: '', nombre: '', cantidad: 1 },
  { productId: '', nombre: '', cantidad: 1 },
  { productId: '', nombre: '', cantidad: 1 },
]

interface Props {
  onSuccess?: () => void
}

export default function MovimientoStockCreate({ onSuccess }: Props) {
  const { createMove } = useStockMovements()

  const [formKey, setFormKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [vendedorId, setVendedorId] = useState<number | null>(() => {
    const stored = localStorage.getItem(DRAFT_VENDEDOR_KEY)
    if (!stored) return null
    const parsed = Number(stored)
    return isNaN(parsed) ? null : parsed
  })

  useEffect(() => {
    if (vendedorId !== null) {
      localStorage.setItem(DRAFT_VENDEDOR_KEY, String(vendedorId))
    } else {
      localStorage.removeItem(DRAFT_VENDEDOR_KEY)
    }
  }, [vendedorId])

  const ItemsProxy = useCallback(
    ({ value, onChange }: { value?: StockItem[]; onChange?: (v: StockItem[]) => void }) => (
      <MovimientoStockItemsTable value={value} onChange={onChange} />
    ),
    []
  )

  const inputs: FormInput[] = useMemo(
    () => [
      {
        name: 'moveType',
        label: 'Tipo de movimiento',
        type: 'select',
        value: 'in',
        options: [
          { label: 'Entrada (+ stock)', value: 'in' },
          { label: 'Salida (- stock)', value: 'out' },
        ],
      },
      {
        name: 'items',
        label: 'Productos',
        type: 'component',
        Component: ItemsProxy,
        value: EMPTY_ROWS,
      },
      {
        name: 'detalle',
        label: 'Detalle (opcional)',
        type: 'textarea',
      },
    ],
    [ItemsProxy]
  )

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSubmitting(true)

      const moveType = values.moveType as 'in' | 'out' | undefined
      const items: StockItem[] = values.items || []

      if (moveType !== 'in' && moveType !== 'out') {
        toast.error('Debes seleccionar un tipo de movimiento.')
        return
      }

      if (!vendedorId) {
        toast.error('Debes seleccionar un vendedor.')
        return
      }

      const productosValidos = items.filter(
        (it) => it.productId && Number(it.cantidad) > 0
      )

      if (productosValidos.length === 0) {
        toast.error('Agrega al menos un producto.')
        return
      }

      const detalle = (values.detalle as string | undefined)?.trim() || null
      const movimiento = await createMove(moveType, productosValidos, vendedorId, detalle)

      toast.success(`Movimiento ${movimiento.movimientoId} creado con éxito`)

      localStorage.removeItem(DRAFT_VENDEDOR_KEY)
      setVendedorId(null)
      setFormKey((k) => k + 1)
      onSuccess?.()
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : err?.message ?? 'Error al crear movimiento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 text-white p-5 w-[600px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
      <Title className="text-white pb-1">Crear Movimiento de Stock</Title>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-white">Vendedor</label>
        <VendedorSelectInput value={vendedorId} onChange={setVendedorId} />
      </div>

      <DynamicForm
        key={formKey}
        storageKey="draft:movimiento-stock:create"
        inputs={inputs}
        onSubmit={handleSubmit}
        titleBtn={submitting ? 'Guardando...' : 'Guardar Movimiento'}
        preventEnterSubmit
      />
    </div>
  )
}
