import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { create } from '../../api/crud'
import ClienteSelectInput from '../clientes/ClienteSelectInput'
import type { FormInput } from '../../layout/DynamicForm'
import DynamicForm from '../../layout/DynamicForm'
import type { SaleItem } from '../item-venta/useSaleItems'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import { useProducts } from '../../hooks/useProducts'
import { toast } from 'react-toastify'
import type { PaymentItem } from '../metodo-pago/PaymentMethodsTable'
import ItemsVentaTable from '../item-venta/ItemsVentaTable'
import PaymentMethodsTable from '../metodo-pago/PaymentMethodsTable'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchSaleById, makeSelectVentaById, needsRefresh } from '../../store/salesReduce'
import bgUrl from '../../assets/fondo-w.png'

type VentaInitPayload = {
  clienteId?: string | number
  items?: SaleItem[]
  pagos?: PaymentItem[]
  venta?: any
  [key: string]: unknown
}

const coerceId = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  return String(value)
}

const normalizeSaleItems = (raw?: unknown): SaleItem[] | undefined => {
  if (!Array.isArray(raw)) return undefined
  return raw
    .map((entry: any) => {
      const item = entry?.item ?? entry
      if (!item) return null
      const cantidad = Number(item.cantidad ?? entry?.cantidad ?? 0) || 0
      const descuento = Number(item.descuento ?? entry?.descuento ?? 0) || 0
      const precio = Number(item.precio ?? entry?.precio ?? 0) || 0
      const precioFinalRaw = Number(item.precioFinal ?? entry?.precioFinal)
      const precioFinal = Number.isFinite(precioFinalRaw)
        ? Number(precioFinalRaw)
        : Number((precio * cantidad * (1 - descuento / 100)).toFixed(2))

      return {
        productId: coerceId(entry?.productoId ?? entry?.productId ?? item.productId) ?? '',
        nombre: item.nombre ?? entry?.nombre ?? '',
        precio,
        cantidad,
        descuento,
        precioFinal,
      } as SaleItem
    })
    .filter((it): it is SaleItem => Boolean(it))
}

const normalizePayments = (raw?: unknown): PaymentItem[] | undefined => {
  if (!Array.isArray(raw)) return undefined
  return raw.map((entry: any) => ({
    metodoId: coerceId(entry?.metodoId ?? entry?.metodo?.id ?? entry?.id) ?? '',
    nombre: entry?.metodo?.nombre ?? entry?.nombre ?? '',
    monto: String(entry?.monto ?? ''),
    cuotas: entry?.cuotas !== undefined && entry?.cuotas !== null ? String(entry.cuotas) : '',
  }))
}

export default function VentaCreate() {
  const { products } = useProducts()
  const params = useParams<{ idVenta?: string }>()
  const dispatch = useAppDispatch()

  const selectVentaById = useMemo(() => makeSelectVentaById(), [])
  const ventaDesdeStore = useAppSelector((state) =>
    params.idVenta ? selectVentaById(state, params.idVenta) : null
  )
  const ventaNecesitaFetch = useAppSelector((state) =>
    params.idVenta ? needsRefresh(state, params.idVenta) : false
  )

  const [formKey, setFormKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [itemsMirror, setItemsMirror] = useState<SaleItem[]>([])
  const [defaults, setDefaults] = useState<{ clienteId?: string; items?: SaleItem[]; pagos?: PaymentItem[] }>({})
  const [initPayload, setInitPayload] = useState<VentaInitPayload | null>(null)

  const hasInitData = useMemo(() => {
    if (!initPayload) return false
    return Boolean(
      initPayload.venta ||
      (Array.isArray(initPayload.items) && initPayload.items.length > 0) ||
      (Array.isArray(initPayload.pagos) && initPayload.pagos.length > 0) ||
      initPayload.clienteId !== undefined
    )
  }, [initPayload])

  useEffect(() => {
    const origin = window.location.origin

    function handleMessage(event: MessageEvent) {
      if (event.origin !== origin) return
      if (event.data?.type !== 'INIT_DATA') return
      setInitPayload(event.data.payload as VentaInitPayload ?? null)
    }

    window.addEventListener('message', handleMessage)

    try {
      window.opener?.postMessage({ type: 'READY' }, origin)
    } catch {}

    const unsubscribe = window.windowApi?.onInitData?.((payload) => {
      setInitPayload(payload as VentaInitPayload ?? null)
    })

    return () => {
      window.removeEventListener('message', handleMessage)
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    if (!params.idVenta) return
    if (hasInitData) return
    if (!ventaDesdeStore || ventaNecesitaFetch) {
      dispatch(fetchSaleById(params.idVenta))
    }
  }, [params.idVenta, hasInitData, ventaDesdeStore, ventaNecesitaFetch, dispatch])

  useEffect(() => {
    if (!hasInitData || !initPayload) return
    const payloadVenta = initPayload.venta ?? {}
    const normalizedItems = normalizeSaleItems(initPayload.items ?? payloadVenta.detalles)
    const normalizedPagos = normalizePayments(initPayload.pagos ?? payloadVenta.pagos)

    setDefaults({
      clienteId: coerceId(initPayload.clienteId ?? payloadVenta.clienteId ?? payloadVenta.cliente?.id),
      items: normalizedItems,
      pagos: normalizedPagos,
    })
    setItemsMirror(normalizedItems ?? [])
    setFormKey(k => k + 1)
  }, [hasInitData, initPayload])

  useEffect(() => {
    if (!params.idVenta) return
    if (hasInitData) return
    if (!ventaDesdeStore) return

    const normalizedItems = normalizeSaleItems(ventaDesdeStore.detalles)
    const normalizedPagos = normalizePayments(ventaDesdeStore.pagos)

    setDefaults({
      clienteId: coerceId(ventaDesdeStore.clienteId ?? ventaDesdeStore.cliente?.id),
      items: normalizedItems,
      pagos: normalizedPagos,
    })
    setItemsMirror(normalizedItems ?? [])
    setFormKey(k => k + 1)
  }, [params.idVenta, hasInitData, ventaDesdeStore])

  // Proxy que intercepta onChange de ItemsVentaTable y actualiza el espejo
  const ItemsProxy = useCallback((
    { value, onChange }: { value?: SaleItem[]; onChange?: (v: SaleItem[]) => void }
  ) => (
    <ItemsVentaTable
      value={value}
      onChange={(v) => {
        onChange?.(v)
        setItemsMirror(v || [])
      }}
    />
  ), [])

  const calcTotalConDescuento = (items: SaleItem[]): number => {
    return (items ?? []).reduce((acc, it: any) => {
      const prod = products.find(p => p.id === it.productId)
      const base = Number(prod?.precio ?? it?.precio ?? 0)
      const desc = Number(it?.descuento ?? 0)
      const unit = typeof it?.precioFinal === 'number'
        ? it.precioFinal
        : base * (1 - (isNaN(desc) ? 0 : desc) / 100)
      const cant = Number(it?.cantidad || 0)
      return acc + unit * cant
    }, 0)
  }

  const totalConDescuento = useMemo(
    () => Number(calcTotalConDescuento(itemsMirror).toFixed(2)),
    [itemsMirror, products]
  )

  const inputsBase: FormInput[] = useMemo(() => [
    {
      name: 'clienteId',
      label: 'Cliente',
      type: 'component',
      Component: ClienteSelectInput,
      value: defaults.clienteId,
    },
    {
      name: 'items',
      label: 'Productos',
      type: 'component',
      Component: ItemsProxy,
      value: defaults.items,
    },
    {
      name: 'pagos',
      label: 'Métodos de Pago',
      type: 'component',
      Component: PaymentMethodsTable,
      value: defaults.pagos,
    },
  ], [defaults, ItemsProxy])

  const inputsWithTotal: FormInput[] = useMemo(() => {
    return inputsBase.map(inp =>
      inp.name === 'pagos'
        ? { ...inp, componentProps: { ...(inp as any).componentProps, total: totalConDescuento } }
        : inp
    )
  }, [inputsBase, totalConDescuento])

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSubmitting(true)

      const items: SaleItem[] = values.items || []
      const pagos: PaymentItem[] = values.pagos || []

      const totalCD = Number(totalConDescuento.toFixed(2))

      const sumaPagos = Number(
        ((pagos ?? []).reduce((acc, p) => acc + (parseFloat((p as any).monto || '0') || 0), 0)).toFixed(2)
      )

      if (sumaPagos !== totalCD) {
        toast.error(`Los métodos de pago ($${sumaPagos.toFixed(2)}) no coinciden con el total con descuentos ($${totalCD.toFixed(2)}).`)
        setSubmitting(false)
        return
      }

      const detalles = items.map((item: any) => {
        const prod = products.find(p => p.id === item.productId)
        const base = Number(prod?.precio ?? item?.precio ?? 0)
        const descPct = Number(item?.descuento ?? 0)
        const precioFinalUnit = typeof item?.precioFinal === 'number'
          ? Number(item.precioFinal)
          : Number((base * (1 - (isNaN(descPct) ? 0 : descPct) / 100)).toFixed(2))

        return {
          productoId: item.productId,
          item: {
            nombre: prod?.nombre ?? item?.nombre ?? '',
            descripcion: (prod as any)?.descripcion ?? '',
            precio: precioFinalUnit,
            cantidad: Number(item.cantidad || 0),
            descuento: isNaN(descPct) ? 0 : descPct,
          }
        }
      })

      const pagosPayload = pagos.map(p => {
        const dto: Record<string, any> = {
          metodoId: p.metodoId,
          monto: Number((p as any).monto || 0),
        }
        if ((p as any).cuotas != null && (p as any).cuotas !== '') dto.cuotas = Number((p as any).cuotas)
        return dto
      })

      const venta = await create('ventas', {
        clienteId: values.clienteId ?? null,
        detalles,
        pagos: pagosPayload,
      })

      toast.success(`Venta ${venta.id} creada con éxito`)
      setFormKey(k => k + 1)
      setItemsMirror([])
      setDefaults({})
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Ocurrió un error al crear la venta'
      toast.error(`Error: ${msg}`)
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
        <Title className="text-white pb-2">{params.idVenta ? `Venta ${params.idVenta}` : 'Crear Venta'}</Title>
      </div>

      <DynamicForm
        key={formKey}
        inputs={inputsWithTotal}
        onSubmit={handleSubmit}
        titleBtn={submitting ? 'Guardando...' : 'Guardar Venta'}
      />
    </Main>
  )
}
