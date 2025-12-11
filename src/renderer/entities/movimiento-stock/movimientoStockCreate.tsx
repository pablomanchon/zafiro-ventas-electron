// src/pages/movimiento-stock/MovimientoStockCreate.tsx
import { useState, useMemo, useCallback, useEffect } from 'react'
import { toast } from 'react-toastify'
import type { FormInput } from '../../layout/DynamicForm'
import DynamicForm from '../../layout/DynamicForm'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import MovimientoStockItemsTable, { type StockItem } from './movimientoStockItemsTable'
import bgUrl from '../../assets/fondo-w.png'
import { useStockMovements } from '../../hooks/useMovimientoStock'

type MovimientoInitPayload = {
  moveType?: 'in' | 'out'
  items?: StockItem[]
  [key: string]: unknown
}

// 🔹 4 filas vacías por defecto
const EMPTY_ROWS: StockItem[] = [
  { productId: '', nombre: '', cantidad: 1 },
  { productId: '', nombre: '', cantidad: 1 },
  { productId: '', nombre: '', cantidad: 1 },
  { productId: '', nombre: '', cantidad: 1 },
]

export default function MovimientoStockCreate() {
  const { createMove } = useStockMovements()

  const [formKey, setFormKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [defaults, setDefaults] = useState<{
    moveType?: 'in' | 'out'
    items?: StockItem[]
  }>({
    moveType: undefined,
    items: EMPTY_ROWS, // 👈 comienza con 4 filas vacías
  })

  const [initPayload, setInitPayload] = useState<MovimientoInitPayload | null>(null)

  const hasInitData = useMemo(() => {
    if (!initPayload) return false
    return Boolean(
      initPayload.moveType ||
        (Array.isArray(initPayload.items) && initPayload.items.length > 0)
    )
  }, [initPayload])

  // Comunicación con ventana padre
  useEffect(() => {
    const origin = window.location.origin

    function handleMessage(event: MessageEvent) {
      if (event.origin !== origin) return
      if (event.data?.type !== 'INIT_DATA') return
      setInitPayload((event.data.payload as MovimientoInitPayload) ?? null)
    }

    window.addEventListener('message', handleMessage)

    // avisar que está lista
    try {
      window.opener?.postMessage({ type: 'READY' }, origin)
    } catch {}

    const unsubscribe = (window as any).windowApi?.onInitData?.((payload: any) => {
      setInitPayload((payload as MovimientoInitPayload) ?? null)
    })

    return () => {
      window.removeEventListener('message', handleMessage)
      unsubscribe?.()
    }
  }, [])

  // Aplicar defaults si hay INIT_DATA
  useEffect(() => {
    if (!hasInitData || !initPayload) return

    setDefaults({
      moveType: initPayload.moveType,
      items:
        initPayload.items && initPayload.items.length > 0
          ? initPayload.items
          : EMPTY_ROWS, // 👈 si no envían items, igual dejamos 4 filas vacías
    })

    setFormKey((k) => k + 1)
  }, [hasInitData, initPayload])

  // Proxy para tabla de items
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
        options: [
          { label: 'Entrada (+ stock)', value: 'in' },
          { label: 'Salida (- stock)', value: 'out' },
        ],
        value: defaults.moveType,
      },
      {
        name: 'items',
        label: 'Productos',
        type: 'component',
        Component: ItemsProxy,
        value: defaults.items,
      },
    ],
    [defaults, ItemsProxy]
  )

  // Guardar usando el hook
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSubmitting(true)

      const moveType = values.moveType as 'in' | 'out' | undefined
      const items: StockItem[] = values.items || []

      if (moveType !== 'in' && moveType !== 'out') {
        toast.error('Debes seleccionar un tipo de movimiento.')
        setSubmitting(false)
        return
      }

      const productosValidos = items.filter(
        (it) => it.productId && Number(it.cantidad) > 0
      )

      if (productosValidos.length === 0) {
        toast.error('Agrega al menos un producto.')
        setSubmitting(false)
        return
      }

      const movimiento = await createMove(moveType, items)

      toast.success(`Movimiento ${movimiento.movimientoId} creado con éxito`)

      // Reset form → vuelve a 4 filas vacías
      setDefaults({
        moveType: undefined,
        items: EMPTY_ROWS,
      })
      setFormKey((k) => k + 1)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? err?.message ?? 'Error al crear movimiento'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Main
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      className="flex flex-col gap-4 md:mt-auto text-white"
    >
      <div className="flex items-center justify-between">
        <Title className="text-white pb-2">Crear Movimiento de Stock</Title>
      </div>

      <DynamicForm
        key={formKey}
        inputs={inputs}
        onSubmit={handleSubmit}
        titleBtn={submitting ? 'Guardando...' : 'Guardar Movimiento'}
      />
    </Main>
  )
}
