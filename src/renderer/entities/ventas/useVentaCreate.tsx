import { useState, useMemo, useCallback, useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { create } from '../../api/crud'
import { facturarVenta } from '../../api/facturacion'
import { useProducts } from '../../hooks/useProducts'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchSaleById, makeSelectVentaById, needsRefresh } from '../../store/salesReduce'
import { toCents, formatCentsARS } from '../../utils/utils'
import { getInitPayload } from '../../utils/init-data'
import type { SaleItem } from '../item-venta/useSaleItems'
import type { PaymentItem } from '../metodo-pago/PaymentMethodsTable'

type VentaInitPayload = {
  clienteId?: string | number
  vendedorId?: string | number
  items?: SaleItem[]
  pagos?: PaymentItem[]
  venta?: any
  [key: string]: unknown
}

export type TotalDiscount = { pct: number | ''; monto: number | '' }

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
        Number(
          item.descuentoPct ??
            item.descuento ??
            entry?.descuentoPct ??
            entry?.descuento ??
            0
        ) || 0
      const descuentoMonto = Number(item.descuentoMonto ?? entry?.descuentoMonto ?? 0) || 0
      const precio = Number(item.precio ?? entry?.precio ?? 0) || 0

      const precioFinalRaw = Number(item.precioFinal ?? entry?.precioFinal)
      const precioFinal = Number.isFinite(precioFinalRaw)
        ? Number(precioFinalRaw)
        : Number(
            Math.max(0, precio * cantidad * (1 - descuentoPct / 100) - descuentoMonto).toFixed(2)
          )

      const codigo = String(
        item.codigo ?? entry?.codigo ?? entry?.productoCodigo ?? entry?.productId ?? ''
      )

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
    cuotas:
      entry?.cuotas !== undefined && entry?.cuotas !== null ? String(entry.cuotas) : '',
  }))
}

export function useVentaCreateLogic() {
  const { products } = useProducts()
  const params = useParams<{ idVenta?: string }>()
  const location = useLocation()
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
  const [totalDiscountMirror, setTotalDiscountMirror] = useState<TotalDiscount>({
    pct: '',
    monto: '',
  })

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

  useEffect(() => {
    const fromLocation = getInitPayload<VentaInitPayload>(location.state)
    if (fromLocation) {
      setInitPayload(fromLocation)
    }
  }, [location.state])

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
      vendedorId: coerceId(
        initPayload.vendedorId ?? payloadVenta.vendedorId ?? payloadVenta.vendedor?.id
      ),
      clienteId: coerceId(
        initPayload.clienteId ?? payloadVenta.clienteId ?? payloadVenta.cliente?.id
      ),
      items: normalizedItems,
      pagos: normalizedPagos,
      descuentoTotal: { pct: '', monto: '' },
    })

    setItemsMirror(normalizedItems ?? [])
    setTotalDiscountMirror({ pct: '', monto: '' })
    setFormKey((k) => k + 1)
  }, [hasInitData, initPayload])

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
      descuentoTotal: { pct: '', monto: '' },
    })

    setItemsMirror(normalizedItems ?? [])
    setTotalDiscountMirror({ pct: '', monto: '' })
    setFormKey((k) => k + 1)
  }, [params.idVenta, hasInitData, ventaDesdeStore])

  const findProductByCode = useCallback(
    (value: unknown) => {
      const codigo = String(value ?? '').trim().toLowerCase()
      if (!codigo) return null
      return (
        products.find((p: any) => String(p.codigo ?? '').trim().toLowerCase() === codigo) ??
        null
      )
    },
    [products]
  )

  const calcSubtotalItems = useCallback(
    (items: SaleItem[]): number => {
      return (items ?? []).reduce((acc, it: any) => {
        const prod = findProductByCode(it.productId)
        const precio = Number(prod?.precio ?? it?.precio ?? 0)
        const cant = Number(it?.cantidad || 0)

        const pct = Math.max(0, Math.min(100, Number(it?.descuentoPct ?? 0) || 0))
        const monto = Math.max(0, Number(it?.descuentoMonto ?? 0) || 0)

        const base = precio * cant
        const line = Math.max(0, base * (1 - pct / 100) - monto)

        return acc + line
      }, 0)
    },
    [findProductByCode]
  )

  const totalConDescuento = useMemo(() => {
    const subtotal = calcSubtotalItems(itemsMirror)
    const pct = Math.max(0, Math.min(100, Number(totalDiscountMirror.pct) || 0))
    const monto = Math.max(0, Number(totalDiscountMirror.monto) || 0)
    const total = Math.max(0, subtotal * (1 - pct / 100) - monto)
    return Number(total.toFixed(2))
  }, [itemsMirror, totalDiscountMirror, calcSubtotalItems])

  const resetForm = useCallback(() => {
    setFormKey((k) => k + 1)
    setItemsMirror([])
    setTotalDiscountMirror({ pct: '', monto: '' })
    setDefaults({})
  }, [])

  const handleSubmit = useCallback(
    async (values: Record<string, any>) => {
      try {
        setSubmitting(true)

        if (!values.vendedorId) return toast.error('Debe seleccionar un vendedor')
        if (!values.clienteId) return toast.error('Debe seleccionar un cliente')

        const itemsRaw: SaleItem[] = values.items || []
        const items = itemsRaw.filter((it) => String(it.productId ?? '').trim() !== '')
        const pagos: PaymentItem[] = values.pagos || []

        if (!items.length) return toast.error('Debe incluir al menos un producto (código)')

        const totalCDCents = Math.round((totalConDescuento ?? 0) * 100)
        const sumaPagosCents = (pagos ?? [])
          .filter((p) => p?.metodoId)
          .reduce((acc, p) => acc + toCents((p as any).monto), 0)

        if (sumaPagosCents !== totalCDCents) {
          return toast.error(
            `Los métodos de pago (${formatCentsARS(
              sumaPagosCents
            )}) no coinciden con el total (${formatCentsARS(totalCDCents)}).`
          )
        }

        const descuentoTotal: TotalDiscount = values.descuentoTotal ?? totalDiscountMirror
        const gpct = Math.max(0, Math.min(100, Number(descuentoTotal?.pct) || 0))
        const gmonto = Math.max(0, Number(descuentoTotal?.monto) || 0)

        const enriched = items.map((item: any) => {
          const codigo = String(item.productId ?? '').trim()
          const prod: any = findProductByCode(codigo)
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
              descuento: Number.isFinite(pct) ? pct : 0,
            },
          }
        })

        const pagosPayload = (pagos ?? [])
          .filter((p) => p?.metodoId)
          .map((p) => {
            const cents = toCents((p as any).monto)
            const dto: Record<string, any> = { metodoId: p.metodoId, monto: cents / 100 }
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

        const channel = new BroadcastChannel('ventas')
        channel.postMessage({ type: 'VENTA_CREADA', ventaId: venta.id })
        channel.close()

        toast.success(`Venta ${venta.id} creada con éxito!`)
        try {
          const facturacion = await facturarVenta({
            ventaId: Number(venta.id),
            trigger: 'automatic',
          })
          if (facturacion?.authorized) {
            toast.success(`Factura autorizada. CAE ${facturacion.invoice?.cae ?? ''}`.trim())
          }
        } catch (facturaError) {
          const message =
            facturaError instanceof Error
              ? facturaError.message
              : 'No se pudo autorizar la factura'
          toast.error(`Venta guardada, pero ARCA respondio: ${message}`)
        }
        resetForm()
        return venta
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ?? err?.message ?? 'Ocurrió un error al crear la venta'
        toast.error(`Error: ${msg}`)
      } finally {
        setSubmitting(false)
      }
    },
    [findProductByCode, totalConDescuento, totalDiscountMirror, resetForm]
  )

  return {
    params,
    formKey,
    submitting,
    defaults,
    totalConDescuento,
    setItemsMirror,
    setTotalDiscountMirror,
    handleSubmit,
  }
}

