import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { create } from '../../api/crud'
import type { SaleItem } from '../item-venta/useSaleItems'
import ItemsVentaTable from '../item-venta/ItemsVentaTable'
import PaymentMethodsTable from '../metodo-pago/PaymentMethodsTable'
import type { PaymentItem } from '../metodo-pago/PaymentMethodsTable'
import { useProducts } from '../../hooks/useProducts'
import { toast } from 'react-toastify'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchSaleById, makeSelectVentaById, needsRefresh } from '../../store/salesReduce'
import { toCents, formatCentsARS } from '../../utils/utils'
import VendedorSelectInput from '../sellers/VendedorSelectInput'
import ClienteSelectInput from '../clientes/ClienteSelectInput'
import type { FormInput } from '../../layout/DynamicForm'

type VentaInitPayload = {
  clienteId?: string | number
  vendedorId?: string | number
  items?: SaleItem[]
  pagos?: PaymentItem[]
  venta?: any
  [key: string]: unknown
}

type TotalDiscount = {
  pct: number | ''
  monto: number | ''
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
      const descuentoPct =
        Number(item.descuentoPct ?? item.descuento ?? entry?.descuentoPct ?? entry?.descuento ?? 0) || 0
      const descuentoMonto = Number(item.descuentoMonto ?? entry?.descuentoMonto ?? 0) || 0
      const precio = Number(item.precio ?? entry?.precio ?? 0) || 0

      const precioFinalRaw = Number(item.precioFinal ?? entry?.precioFinal)
      const precioFinal = Number.isFinite(precioFinalRaw)
        ? Number(precioFinalRaw)
        : Number(Math.max(0, precio * cantidad * (1 - descuentoPct / 100) - descuentoMonto).toFixed(2))

      const codigo = String(item.codigo ?? entry?.codigo ?? entry?.productoCodigo ?? entry?.productId ?? '')

      return {
        productId: codigo,
        nombre: item.nombre ?? entry?.nombre ?? '',
        precio,
        cantidad,
        descuentoPct,
        descuentoMonto,
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

export function useVentaCreate() {
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

  // mirrors (para calcular total)
  const [itemsMirror, setItemsMirror] = useState<SaleItem[]>([])
  const [totalDiscountMirror, setTotalDiscountMirror] = useState<TotalDiscount>({ pct: '', monto: '' })

  const [defaults, setDefaults] = useState<{
    vendedorId?: string
    clienteId?: string
    items?: SaleItem[]
    pagos?: PaymentItem[]
    descuentoTotal?: TotalDiscount
  }>({})

  const [initPayload, setInitPayload] = useState<VentaInitPayload | null>(null)

  const hasInitData = useMemo(() => {
    if (!initPayload) return false
    return Boolean(
      initPayload.venta ||
      (Array.isArray(initPayload.items) && initPayload.items.length > 0) ||
      (Array.isArray(initPayload.pagos) && initPayload.pagos.length > 0) ||
      initPayload.clienteId !== undefined ||
      initPayload.vendedorId !== undefined
    )
  }, [initPayload])

  // Recibe INIT_DATA (popup / windowApi)
  useEffect(() => {
    const origin = window.location.origin

    function handleMessage(event: MessageEvent) {
      if (event.origin !== origin) return
      if (event.data?.type !== 'INIT_DATA') return
      setInitPayload((event.data.payload as VentaInitPayload) ?? null)
    }

    window.addEventListener('message', handleMessage)

    try {
      window.opener?.postMessage({ type: 'READY' }, origin)
    } catch { }

    const unsubscribe = (window as any).windowApi?.onInitData?.((payload: any) => {
      setInitPayload((payload as VentaInitPayload) ?? null)
    })

    return () => {
      window.removeEventListener('message', handleMessage)
      unsubscribe?.()
    }
  }, [])

  // Si estamos editando (sin initData), traer desde store
  useEffect(() => {
    if (!params.idVenta) return
    if (hasInitData) return
    if (!ventaDesdeStore || ventaNecesitaFetch) {
      dispatch(fetchSaleById(params.idVenta))
    }
  }, [params.idVenta, hasInitData, ventaDesdeStore, ventaNecesitaFetch, dispatch])

  // Defaults desde initPayload
  useEffect(() => {
    if (!hasInitData || !initPayload) return
    const payloadVenta = initPayload.venta ?? {}

    const normalizedItems = normalizeSaleItems(initPayload.items ?? payloadVenta.detalles)
    const normalizedPagos = normalizePayments(initPayload.pagos ?? payloadVenta.pagos)

    setDefaults({
      vendedorId: coerceId(initPayload.vendedorId ?? payloadVenta.vendedorId ?? payloadVenta.vendedor?.id),
      clienteId: coerceId(initPayload.clienteId ?? payloadVenta.clienteId ?? payloadVenta.cliente?.id),
      items: normalizedItems,
      pagos: normalizedPagos,
      // ✅ vacío (no 0)
      descuentoTotal: { pct: '', monto: '' },
    })
    setItemsMirror(normalizedItems ?? [])
    setTotalDiscountMirror({ pct: '', monto: '' })
    setFormKey((k) => k + 1)
  }, [hasInitData, initPayload])

  // Defaults desde store (edición)
  useEffect(() => {
    if (!params.idVenta) return
    if (hasInitData) return
    if (!ventaDesdeStore) return

    const normalizedItems = normalizeSaleItems(ventaDesdeStore.detalles)
    const normalizedPagos = normalizePayments(ventaDesdeStore.pagos)

    setDefaults({
      vendedorId: coerceId(ventaDesdeStore.vendedorId ?? ventaDesdeStore.vendedor?.id),
      clienteId: coerceId(ventaDesdeStore.clienteId ?? ventaDesdeStore.cliente?.id),
      items: normalizedItems,
      pagos: normalizedPagos,
      // ✅ vacío (no 0)
      descuentoTotal: { pct: '', monto: '' },
    })
    setItemsMirror(normalizedItems ?? [])
    setTotalDiscountMirror({ pct: '', monto: '' })
    setFormKey((k) => k + 1)
  }, [params.idVenta, hasInitData, ventaDesdeStore])

  // ───────────────── Proxies ─────────────────

  const ItemsProxy = useCallback(
    ({ value, onChange }: { value?: SaleItem[]; onChange?: (v: SaleItem[]) => void }) => (
      <ItemsVentaTable
        value={value}
        onChange={(v) => {
          onChange?.(v)
          setItemsMirror(v || [])
        }}
      />
    ),
    []
  )

  const TotalDiscountProxy = useCallback(
    ({ value, onChange }: { value?: TotalDiscount; onChange?: (v: TotalDiscount) => void }) => {
      // ✅ clave: tipado literal (evita string | number)
      const pct: TotalDiscount['pct'] = value?.pct ?? ''
      const monto: TotalDiscount['monto'] = value?.monto ?? ''

      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-white">Descuento total (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                className="w-28 bg-inherit outline-none text-white px-2 py-1 border border-white/20 rounded"
                value={pct === '' ? '' : Number(pct) === 0 ? '' : pct}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const nextPct: TotalDiscount['pct'] =
                    e.target.value === '' ? '' : Number(e.target.value)
                  const next: TotalDiscount = { pct: nextPct, monto }
                  onChange?.(next)
                  setTotalDiscountMirror(next)
                }}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-white">Descuento total ($)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-40 bg-inherit outline-none text-white px-2 py-1 border border-white/20 rounded text-right"
                value={monto === '' ? '' : Number(monto) === 0 ? '' : monto}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const nextMonto: TotalDiscount['monto'] =
                    e.target.value === '' ? '' : Number(e.target.value)
                  const next: TotalDiscount = { pct, monto: nextMonto }
                  onChange?.(next)
                  setTotalDiscountMirror(next)
                }}
              />
            </label>
          </div>
        </div>
      )
    },
    []
  )

  // ───────────────── Totales ─────────────────

  const calcSubtotalItems = useCallback(
    (items: SaleItem[]): number => {
      return (items ?? []).reduce((acc, it: any) => {
        const prod = products.find((p: any) => String(p.codigo) === String(it.productId))
        const precio = Number(prod?.precio ?? it?.precio ?? 0)
        const cant = Number(it?.cantidad || 0)

        const pct = Math.max(0, Math.min(100, Number(it?.descuentoPct ?? 0) || 0))
        const monto = Math.max(0, Number(it?.descuentoMonto ?? 0) || 0)

        const base = precio * cant
        const line = Math.max(0, base * (1 - pct / 100) - monto)

        return acc + line
      }, 0)
    },
    [products]
  )

  const totalConDescuento = useMemo(() => {
    const subtotal = calcSubtotalItems(itemsMirror)

    const pct = Math.max(0, Math.min(100, Number(totalDiscountMirror.pct) || 0))
    const monto = Math.max(0, Number(totalDiscountMirror.monto) || 0)

    const total = Math.max(0, subtotal * (1 - pct / 100) - monto)
    return Number(total.toFixed(2))
  }, [itemsMirror, totalDiscountMirror, calcSubtotalItems])

  // ───────────────── Inputs del DynamicForm ─────────────────

  const inputsBase: FormInput[] = useMemo(
    () => [
      {
        name: 'vendedorId',
        label: 'Vendedor',
        type: 'component',
        Component: VendedorSelectInput,
        value: defaults.vendedorId,
      },
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
        name: 'descuentoTotal',
        label: 'Descuento Total',
        type: 'component',
        Component: TotalDiscountProxy,
        // ✅ vacío (no 0)
        value: defaults.descuentoTotal ?? { pct: '', monto: '' },
      },
      {
        name: 'pagos',
        label: 'Métodos de Pago',
        type: 'component',
        Component: PaymentMethodsTable,
        value: defaults.pagos,
      },
    ],
    [defaults, ItemsProxy, TotalDiscountProxy]
  )

  // pasamos total al PaymentMethodsTable
  const inputsWithTotal: FormInput[] = useMemo(() => {
    return inputsBase.map((inp) =>
      inp.name === 'pagos'
        ? ({ ...inp, componentProps: { ...(inp as any).componentProps, total: totalConDescuento } } as any)
        : inp
    )
  }, [inputsBase, totalConDescuento])

  // ───────────────── Submit ─────────────────

  const handleSubmit = useCallback(
    async (values: Record<string, any>) => {
      try {
        setSubmitting(true)

        if (!values.vendedorId) {
          toast.error('Debe seleccionar un vendedor')
          return
        }
        if (!values.clienteId) {
          toast.error('Debe seleccionar un cliente')
          return
        }

        const itemsRaw: SaleItem[] = values.items || []
        const items = itemsRaw.filter((it) => String(it.productId ?? '').trim() !== '')
        const pagos: PaymentItem[] = values.pagos || []

        if (!items.length) {
          toast.error('Debe incluir al menos un producto (código)')
          return
        }

        // valida pagos contra el total con descuento
        const totalCDCents = Math.round((totalConDescuento ?? 0) * 100)
        const sumaPagosCents = (pagos ?? [])
          .filter((p) => p?.metodoId)
          .reduce((acc, p) => acc + toCents((p as any).monto), 0)

        if (sumaPagosCents !== totalCDCents) {
          toast.error(
            `Los métodos de pago (${formatCentsARS(sumaPagosCents)}) no coinciden con el total (${formatCentsARS(
              totalCDCents
            )}).`
          )
          return
        }

        const descuentoTotal: TotalDiscount = values.descuentoTotal ?? totalDiscountMirror
        const gpct = Math.max(0, Math.min(100, Number(descuentoTotal?.pct) || 0))
        const gmonto = Math.max(0, Number(descuentoTotal?.monto) || 0)

        // 1) subtotal luego de descuentos por ítem
        const enriched = items.map((item: any) => {
          const codigo = String(item.productId ?? '').trim()
          const prod: any = products.find((p: any) => String(p.codigo) === codigo)
          if (!prod) throw new Error(`Producto código "${codigo}" no encontrado`)

          const qty = Number(item.cantidad || 0)
          const baseUnit = Number(prod?.precio ?? item?.precio ?? 0)

          const pct = Math.max(0, Math.min(100, Number(item?.descuentoPct ?? 0) || 0))
          const monto = Math.max(0, Number(item?.descuentoMonto ?? 0) || 0)

          const baseLine = baseUnit * qty
          const lineAfterItem = Math.max(0, baseLine * (1 - pct / 100) - monto)

          return { item, prod, qty, pct, lineAfterItem }
        })

        const subtotal = enriched.reduce((acc, it) => acc + it.lineAfterItem, 0)
        const totalFinal = Math.max(0, subtotal * (1 - gpct / 100) - gmonto)
        const globalDiscountAbs = Math.max(0, subtotal - totalFinal)

        // 2) distribuir el descuento global proporcionalmente
        const detalles = enriched.map(({ item, prod, qty, pct, lineAfterItem }) => {
          const share = subtotal > 0 ? lineAfterItem / subtotal : 0
          const lineAfterAll = Math.max(0, lineAfterItem - globalDiscountAbs * share)

          const unitFinal = qty > 0 ? lineAfterAll / qty : 0
          const unitFinal2 = Number(unitFinal.toFixed(2))

          return {
            productoId: Number(prod.id),
            item: {
              codigo: String(prod.codigo ?? ''),
              nombre: prod.nombre ?? item?.nombre ?? '',
              descripcion: prod.descripcion ?? '',
              precio: unitFinal2,
              cantidad: qty,
              // guardamos el % del ítem (el descuento monto y el global quedan reflejados en el precio final)
              descuento: Number.isFinite(pct) ? pct : 0,
            },
          }
        })

        const pagosPayload = (pagos ?? [])
          .filter((p) => p?.metodoId)
          .map((p) => {
            const cents = toCents((p as any).monto)
            const dto: Record<string, any> = {
              metodoId: p.metodoId,
              monto: cents / 100,
            }
            if ((p as any).cuotas != null && (p as any).cuotas !== '') {
              dto.cuotas = Number((p as any).cuotas) || 0
            }
            return dto
          })

        const venta = await create('ventas', {
          vendedorId: values.vendedorId ?? null,
          clienteId: values.clienteId ?? null,
          detalles,
          pagos: pagosPayload,
        })

        toast.success(`Venta ${venta.id} creada con éxito`)
        setFormKey((k) => k + 1)
        setItemsMirror([])
        setTotalDiscountMirror({ pct: '', monto: '' })
        setDefaults({})
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? err?.message ?? 'Ocurrió un error al crear la venta'
        toast.error(`Error: ${msg}`)
      } finally {
        setSubmitting(false)
      }
    },
    [products, totalConDescuento, totalDiscountMirror]
  )

  return {
    params,
    formKey,
    submitting,
    inputsWithTotal,
    handleSubmit,
  }
}
