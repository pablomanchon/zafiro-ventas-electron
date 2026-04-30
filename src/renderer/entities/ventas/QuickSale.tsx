import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { create, getAll } from '../../api/crud'
import { useProducts } from '../../hooks/useProducts'
import { useClients } from '../../hooks/useClients'
import { useVendedores } from '../../hooks/useSellers'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'
import Title from '../../layout/Title'
import { centsToInput, cleanMoneyInput, formatCentsARS, formatCurrencyARS, toCents } from '../../utils/utils'

type ProductRow = {
  id: number
  codigo: string
  nombre: string
  precio: number
  cantidad: number
  descuentoPct: number | ''
  descuentoMonto: number | ''
}

type MetodoPago = {
  id: string
  nombre: string
  tipo: string
}

type QuickPayment = {
  metodoId: string
  monto: string
  cuotas: string
}

type QuickSaleDraft = {
  barcode: string
  items: ProductRow[]
  selectedSellerId: string
  selectedMethodId?: string
  payments: QuickPayment[]
}

const QUICK_SALE_DRAFT_KEY = 'quick-sale-draft'

const emptyPayment = (metodoId = '', monto = ''): QuickPayment => ({
  metodoId,
  monto,
  cuotas: '',
})

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function lineTotal(item: ProductRow) {
  const base = Number(item.precio || 0) * Number(item.cantidad || 0)
  const pct = clamp(Number(item.descuentoPct) || 0, 0, 100)
  const monto = Math.max(0, Number(item.descuentoMonto) || 0)
  return Math.max(0, Number((base * (1 - pct / 100) - monto).toFixed(2)))
}

export default function QuickSale() {
  const { products, loading: loadingProducts } = useProducts()
  const { clients, loading: loadingClients, refetch: refetchClients } = useClients()
  const { vendedores, loading: loadingVendedores } = useVendedores()

  const [barcode, setBarcode] = useState('')
  const [items, setItems] = useState<ProductRow[]>([])
  const [methods, setMethods] = useState<MetodoPago[]>([])
  const [selectedSellerId, setSelectedSellerId] = useState<string>('')
  const [payments, setPayments] = useState<QuickPayment[]>([])
  const [paymentDraft, setPaymentDraft] = useState<QuickPayment>(() => emptyPayment())
  const [saving, setSaving] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const barcodeRef = useRef<HTMLInputElement>(null)
  const draftLoadedRef = useRef(false)
  const skipPersistOnUnmountRef = useRef(false)
  const latestDraftRef = useRef<QuickSaleDraft>({
    barcode: '',
    items: [],
    selectedSellerId: '',
    payments: [],
  })

  const persistDraft = (draft: QuickSaleDraft) => {
    window.localStorage.setItem(QUICK_SALE_DRAFT_KEY, JSON.stringify(draft))
  }

  const clearDraft = () => {
    window.localStorage.removeItem(QUICK_SALE_DRAFT_KEY)
  }

  const updateDraft = (patch: Partial<QuickSaleDraft>) => {
    const nextDraft: QuickSaleDraft = {
      ...latestDraftRef.current,
      ...patch,
    }
    latestDraftRef.current = nextDraft
    if (draftLoadedRef.current) {
      skipPersistOnUnmountRef.current = false
      persistDraft(nextDraft)
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(QUICK_SALE_DRAFT_KEY)
      if (!raw) {
        draftLoadedRef.current = true
        return
      }

      const draft = JSON.parse(raw) as Partial<QuickSaleDraft>
      const hydratedDraft: QuickSaleDraft = {
        barcode: typeof draft.barcode === 'string' ? draft.barcode : '',
        items: Array.isArray(draft.items) ? draft.items : [],
        selectedSellerId: typeof draft.selectedSellerId === 'string' ? draft.selectedSellerId : '',
        selectedMethodId: typeof draft.selectedMethodId === 'string' ? draft.selectedMethodId : '',
        payments: Array.isArray(draft.payments)
          ? draft.payments.map((payment) => ({
              metodoId: String(payment?.metodoId ?? ''),
              monto: cleanMoneyInput(String(payment?.monto ?? '')),
              cuotas: String(payment?.cuotas ?? ''),
            }))
          : typeof draft.selectedMethodId === 'string' && draft.selectedMethodId
          ? [emptyPayment(draft.selectedMethodId)]
          : [],
      }
      latestDraftRef.current = hydratedDraft
      setBarcode(hydratedDraft.barcode)
      setItems(hydratedDraft.items)
      setSelectedSellerId(hydratedDraft.selectedSellerId)
      setPayments(hydratedDraft.payments)
    } catch {
      window.localStorage.removeItem(QUICK_SALE_DRAFT_KEY)
    } finally {
      draftLoadedRef.current = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (!draftLoadedRef.current || skipPersistOnUnmountRef.current) return
      persistDraft(latestDraftRef.current)
    }
  }, [])

  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  useEffect(() => {
    getAll<MetodoPago>('metodo-pago')
      .then(setMethods)
      .catch((error) => toast.error(String(error)))
  }, [])

  useEffect(() => {
    const hasValidSeller = vendedores.some((seller) => String(seller.id) === selectedSellerId)
    if ((!selectedSellerId || !hasValidSeller) && vendedores.length > 0) {
      const nextSellerId = String(vendedores[0].id)
      setSelectedSellerId(nextSellerId)
      updateDraft({ selectedSellerId: nextSellerId })
    }
  }, [selectedSellerId, vendedores])

  useEffect(() => {
    if (!paymentDraft.metodoId && methods.length > 0) {
      const efectivo = methods.find((method) => normalizeText(method.tipo) === 'efectivo')
      setPaymentDraft((prev) => ({ ...prev, metodoId: efectivo?.id ?? methods[0].id }))
    }
  }, [methods, paymentDraft.metodoId])

  const consumidorFinal = useMemo(() => {
    return (
      clients.find((client) => normalizeText(client.nombre) === 'consumidor final') ??
      clients.find((client) => normalizeText(client.nombre).includes('consumidor')) ??
      null
    )
  }, [clients])

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + Number(item.precio) * Number(item.cantidad), 0)
    const total = items.reduce((acc, item) => acc + lineTotal(item), 0)
    const descuento = Math.max(0, subtotal - total)
    return {
      subtotal: Number(subtotal.toFixed(2)),
      descuento: Number(descuento.toFixed(2)),
      total: Number(total.toFixed(2)),
    }
  }, [items])

  const totalCents = Math.trunc(totals.total * 100)
  const paidCents = useMemo(
    () => payments.reduce((acc, payment) => acc + toCents(payment.monto), 0),
    [payments]
  )
  const remainingCents = Math.max(0, totalCents - paidCents)
  const excessCents = Math.max(0, paidCents - totalCents)

  const updatePayments = (updater: (prev: QuickPayment[]) => QuickPayment[]) => {
    setPayments((prev) => {
      const nextPayments = updater(prev)
      updateDraft({ payments: nextPayments })
      return nextPayments
    })
  }

  const addPaymentFromDraft = () => {
    const monto = paymentDraft.monto || (remainingCents ? centsToInput(remainingCents) : '')
    const montoCents = toCents(monto)

    if (!paymentDraft.metodoId) {
      toast.error('Selecciona un metodo de pago')
      return
    }

    if (montoCents <= 0) {
      toast.error('Ingresa un monto para el pago')
      return
    }

    updatePayments((prev) => [
      ...prev,
      {
        metodoId: paymentDraft.metodoId,
        monto,
        cuotas: paymentDraft.cuotas,
      },
    ])

    setPaymentDraft((prev) => ({
      metodoId: prev.metodoId,
      monto: '',
      cuotas: prev.cuotas,
    }))
  }

  const selectedPaymentMethods = payments
    .map((payment) => methods.find((method) => method.id === payment.metodoId)?.nombre)
    .filter(Boolean)
    .join(', ')

  const focusScanner = () => {
    requestAnimationFrame(() => {
      barcodeRef.current?.focus()
      barcodeRef.current?.select?.()
    })
  }

  const addProductFromScanner = (rawValue: string) => {
    const lookup = normalizeText(rawValue)
    if (!lookup) return

    const product =
      products.find((entry: any) => normalizeText(entry.codigo) === lookup) ??
      products.find((entry: any) => String(entry.id ?? '').trim() === rawValue.trim())

    if (!product) {
      toast.error(`No se encontro un producto para "${rawValue.trim()}"`)
      setBarcode('')
      updateDraft({ barcode: '' })
      focusScanner()
      return
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === Number(product.id))
      let nextItems: ProductRow[]
      if (existingIndex >= 0) {
        nextItems = [...prev]
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          cantidad: Number(nextItems[existingIndex].cantidad) + 1,
        }
      } else {
        nextItems = [
          {
            id: Number(product.id),
            codigo: String(product.codigo ?? ''),
            nombre: String(product.nombre ?? ''),
            precio: Number(product.precio ?? 0),
            cantidad: 1,
            descuentoPct: '',
            descuentoMonto: '',
          },
          ...prev,
        ]
      }
      updateDraft({ items: nextItems, barcode: '' })
      return nextItems
    })

    setBarcode('')
    focusScanner()
  }

  const updateItem = (id: number, patch: Partial<ProductRow>) => {
    setItems((prev) => {
      const nextItems = prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      updateDraft({ items: nextItems })
      return nextItems
    })
  }

  const removeItem = (id: number) => {
    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== id)
      updateDraft({ items: nextItems })
      return nextItems
    })
    focusScanner()
  }

  const clearSale = () => {
    const confirmed = window.confirm('¿Seguro que quieres limpiar la venta actual?')
    if (!confirmed) return

    skipPersistOnUnmountRef.current = true
    setItems([])
    setBarcode('')
    latestDraftRef.current = {
      barcode: '',
      items: [],
      selectedSellerId: '',
      payments: [],
    }
    clearDraft()
    focusScanner()
  }

  const ensureConsumidorFinal = async () => {
    if (consumidorFinal) return consumidorFinal

    const created = await create('clientes', {
      nombre: 'Consumidor Final',
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
    })

    await refetchClients()
    return created as any
  }

  const saveSale = async () => {
    if (!items.length) {
      toast.error('Agrega al menos un producto para guardar la venta')
      return
    }

    if (!selectedSellerId) {
      toast.error('Selecciona un vendedor para guardar la venta')
      return
    }

    const validPayments = payments
      .map((payment) => ({
        ...payment,
        montoCents: toCents(payment.monto),
      }))
      .filter((payment) => payment.metodoId && payment.montoCents > 0)

    if (validPayments.length === 0) {
      toast.error('Selecciona al menos un metodo de pago valido')
      return
    }

    const invalidMethod = validPayments.find(
      (payment) => !methods.some((method) => method.id === payment.metodoId)
    )
    if (invalidMethod) {
      toast.error('Hay un metodo de pago invalido')
      return
    }

    const validPaymentsTotalCents = validPayments.reduce(
      (acc, payment) => acc + payment.montoCents,
      0
    )
    if (validPaymentsTotalCents !== totalCents) {
      const diffCents = totalCents - validPaymentsTotalCents
      toast.error(
        diffCents > 0
          ? `La suma de pagos debe ser ${formatCentsARS(totalCents)}. Falta ${formatCentsARS(diffCents)}`
          : `La suma de pagos debe ser ${formatCentsARS(totalCents)}. Sobra ${formatCentsARS(Math.abs(diffCents))}`
      )
      return
    }

    try {
      setSaving(true)
      const clienteVenta = await ensureConsumidorFinal()

      const detalles = items.map((item) => {
        const totalLinea = lineTotal(item)
        const unitPrice = item.cantidad > 0 ? Number((totalLinea / item.cantidad).toFixed(2)) : 0

        return {
          productoId: item.id,
          item: {
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: '',
            precio: unitPrice,
            cantidad: item.cantidad,
            descuento: Number(item.descuentoPct) || 0,
          },
        }
      })

      const venta = await create('ventas', {
        clienteId: clienteVenta.id,
        vendedorId: Number(selectedSellerId),
        detalles,
        pagos: validPayments.map((payment) => ({
          metodoId: payment.metodoId,
          monto: payment.montoCents / 100,
          ...(payment.cuotas ? { cuotas: Number(payment.cuotas) || 0 } : {}),
        })),
        idempotencyKey,
      })

      const channel = new BroadcastChannel('ventas')
      channel.postMessage({ type: 'VENTA_CREADA', ventaId: (venta as any)?.id })
      channel.close()

      toast.success(`Venta ${(venta as any)?.id ?? ''} creada con exito`)
      setIdempotencyKey(crypto.randomUUID())
      clearSale()
    } catch (error) {
      toast.error(String(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Main className="flex flex-col gap-1.5 p-2 text-white">
      <div className="flex flex-col gap-1.5">
        <div className="rounded border border-white/12 bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-950 px-3 py-1.5 text-white shadow shadow-black">
          <div className="relative flex min-h-8 items-center justify-center">
            <p className="absolute left-0 top-0 text-[10px] uppercase tracking-[0.22em] text-white/60">
              Dashboard
            </p>
            <Title className="border-b-0 pb-0 text-center text-lg">Venta rapida</Title>
            <p className="absolute bottom-0 right-0 hidden text-xs text-white/68 lg:block">
              Escanea, ajusta y cobra.
            </p>
          </div>
        </div>

        <div className="rounded border border-white/12 bg-gradient-to-r from-zinc-950 via-slate-900 to-slate-950 px-2 py-1.5 text-white shadow shadow-black">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1.6fr_0.8fr_auto] xl:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/78">Lector / codigo</span>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  addProductFromScanner(barcode)
                }}
                className="flex gap-2"
              >
                <input
                  ref={barcodeRef}
                  value={barcode}
                  onChange={(e) => {
                    setBarcode(e.target.value)
                    updateDraft({ barcode: e.target.value })
                  }}
                  placeholder="Escanea o escribe un codigo"
                  className="w-full rounded-lg border border-white/20 bg-black/45 px-3 py-1.5 text-white placeholder:text-white/55 caret-white outline-none focus:border-cyan-400 focus:bg-black/55"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-black bg-cyan-800 px-4 py-1.5 font-semibold text-white shadow-inner shadow-black hover:bg-sky-600"
                  disabled={loadingProducts}
                >
                  Agregar
                </button>
              </form>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/78">Vendedor</span>
              <select
                value={selectedSellerId}
                onChange={(e) => {
                  setSelectedSellerId(e.target.value)
                  updateDraft({ selectedSellerId: e.target.value })
                }}
                className="rounded-lg border border-white/20 bg-black/45 px-3 py-1.5 text-white caret-white outline-none focus:border-cyan-400 focus:bg-black/55"
                disabled={loadingVendedores}
              >
                <option className="bg-slate-950 text-white" value="">Seleccionar</option>
                {vendedores.map((seller) => (
                  <option className="bg-slate-950 text-white" key={seller.id} value={seller.id}>
                    {seller.nombre}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={focusScanner}
              className="rounded-lg border border-white/20 bg-black/45 px-4 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/12"
            >
              Enfocar lector
            </button>
          </div>
        </div>

          <div className="grid grid-cols-2 gap-2 text-sm xl:grid-cols-4">
            <Steel typeWood={3} className="px-3 py-1">
              <p className="text-white/68 uppercase tracking-[0.16em] text-[11px]">Cliente</p>
              <p className="mt-0.5 font-semibold leading-tight">{consumidorFinal?.nombre ?? 'Consumidor Final no disponible'}</p>
            </Steel>
            <Steel typeWood={3} className="px-3 py-1">
              <p className="text-white/68 uppercase tracking-[0.16em] text-[11px]">Subtotal</p>
              <p className="mt-0.5 font-semibold leading-tight">{formatCurrencyARS(totals.subtotal)}</p>
            </Steel>
            <Steel typeWood={3} className="px-3 py-1">
              <p className="text-white/68 uppercase tracking-[0.16em] text-[11px]">Descuentos</p>
              <p className="mt-0.5 font-semibold leading-tight">{formatCurrencyARS(totals.descuento)}</p>
            </Steel>
            <Steel typeWood={3} className="px-3 py-1 border-cyan-400/50 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]">
              <p className="text-cyan-100/85 uppercase tracking-[0.16em] text-[11px]">Total a cobrar</p>
              <p className="mt-0.5 text-base font-bold leading-tight">{formatCurrencyARS(totals.total)}</p>
              {selectedPaymentMethods && (
                <p className="mt-0.5 truncate text-xs text-white/72">Pago: {selectedPaymentMethods}</p>
              )}
            </Steel>
          </div>

        <div className="rounded border border-white/12 bg-gradient-to-b from-slate-900 via-slate-950 to-zinc-950 px-2 py-1.5 text-white shadow shadow-black">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <table className="w-full text-sm">
                <thead className="border-b border-white/16 text-white/88">
                  <tr>
                    <th className="px-3 py-1 text-left"><span className="rounded-md bg-black/22 px-2 py-0.5">Codigo</span></th>
                    <th className="px-3 py-1 text-left"><span className="rounded-md bg-black/22 px-2 py-0.5">Producto</span></th>
                    <th className="px-3 py-1 text-right"><span className="rounded-md bg-black/22 px-2 py-0.5">Precio</span></th>
                    <th className="px-3 py-1 text-center"><span className="rounded-md bg-black/22 px-2 py-0.5">Cant.</span></th>
                    <th className="px-3 py-1 text-center"><span className="rounded-md bg-black/22 px-2 py-0.5">Desc. %</span></th>
                    <th className="px-3 py-1 text-right"><span className="rounded-md bg-black/22 px-2 py-0.5">Desc. $</span></th>
                    <th className="px-3 py-1 text-right"><span className="rounded-md bg-black/22 px-2 py-0.5">Total</span></th>
                    <th className="px-3 py-1 text-center"><span className="rounded-md bg-black/22 px-2 py-0.5">Accion</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center">
                        <div className="mx-auto inline-flex rounded-xl bg-black/35 px-4 py-2 text-white/88">
                          Aun no hay productos cargados. Escanea el primer codigo para empezar.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-b border-white/10 hover:bg-black/18">
                        <td className="px-3 py-2">{item.codigo}</td>
                        <td className="px-3 py-2 font-semibold text-white">{item.nombre}</td>
                        <td className="px-3 py-2 text-right">{formatCurrencyARS(item.precio)}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            value={item.cantidad}
                            onChange={(e) =>
                              updateItem(item.id, {
                                cantidad: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="w-20 rounded-lg border border-white/20 bg-slate-950 px-2 py-1.5 text-right !text-white caret-white [color-scheme:dark] outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.descuentoPct}
                            onChange={(e) =>
                              updateItem(item.id, {
                                descuentoPct:
                                  e.target.value === ''
                                    ? ''
                                    : clamp(Number(e.target.value) || 0, 0, 100),
                              })
                            }
                            className="w-20 rounded-lg border border-white/20 bg-slate-950 px-2 py-1.5 text-right !text-white caret-white [color-scheme:dark] outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.descuentoMonto}
                            onChange={(e) =>
                              updateItem(item.id, {
                                descuentoMonto: e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-28 rounded-lg border border-white/20 bg-slate-950 px-2 py-1.5 text-right !text-white caret-white [color-scheme:dark] outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrencyARS(lineTotal(item))}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-lg border border-black bg-red-900 px-3 py-1.5 font-semibold shadow-inner shadow-black hover:bg-orange-700"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded border border-white/12 bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-950 px-2 py-1.5 text-white shadow shadow-black">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Métodos de pago</h2>
              <p className="text-xs text-white/65">
                Pagado {formatCentsARS(paidCents)} · Restante {formatCentsARS(remainingCents)}
              </p>
            </div>
          </div>

          <div className="mt-1.5 grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-black/28 p-1.5 sm:grid-cols-[1fr_150px_74px_auto] sm:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/65">Método</span>
              <select
                value={paymentDraft.metodoId}
                onChange={(e) => {
                  const method = methods.find((entry) => entry.id === e.target.value)
                  setPaymentDraft((prev) => ({
                    ...prev,
                    metodoId: e.target.value,
                    cuotas: normalizeText(method?.tipo) === 'credito' ? prev.cuotas || '1' : '',
                  }))
                }}
                style={{ backgroundColor: '#020617', color: '#fff' }}
                className="rounded-lg border border-white/20 bg-slate-950 px-3 py-1.5 text-white [color-scheme:dark] outline-none focus:border-cyan-400"
              >
                <option className="bg-slate-950 text-white" value="">Seleccionar</option>
                {methods.map((entry) => (
                  <option className="bg-slate-950 text-white" key={entry.id} value={entry.id}>
                    {entry.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/65">Monto</span>
              <input
                inputMode="decimal"
                value={paymentDraft.monto}
                placeholder={remainingCents ? centsToInput(remainingCents) : '0'}
                onChange={(e) =>
                  setPaymentDraft((prev) => ({ ...prev, monto: cleanMoneyInput(e.target.value) }))
                }
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPaymentFromDraft() } }}
                style={{ backgroundColor: '#020617', color: '#fff' }}
                className="rounded-lg border border-white/20 bg-slate-950 px-3 py-1.5 text-right text-white placeholder:text-white/45 [color-scheme:dark] outline-none focus:border-cyan-400"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/65">Cuotas</span>
              <input
                inputMode="numeric"
                value={paymentDraft.cuotas}
                disabled={
                  normalizeText(methods.find((entry) => entry.id === paymentDraft.metodoId)?.tipo) !== 'credito'
                }
                onChange={(e) =>
                  setPaymentDraft((prev) => ({ ...prev, cuotas: e.target.value.replace(/\D/g, '') }))
                }
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPaymentFromDraft() } }}
                style={{ backgroundColor: '#020617', color: '#fff' }}
                className="rounded-lg border border-white/20 bg-slate-950 px-3 py-1.5 text-center text-white [color-scheme:dark] outline-none disabled:opacity-40 focus:border-cyan-400"
              />
            </label>

            <button
              type="button"
              onClick={addPaymentFromDraft}
              className="rounded-lg border border-black bg-cyan-800 px-4 py-1.5 font-semibold text-white shadow-inner shadow-black hover:bg-sky-600"
            >
              Agregar
            </button>
          </div>

          <div className="mt-1.5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-white/16 text-white/88">
                <tr>
                  <th className="px-3 py-1 text-left">Método</th>
                  <th className="px-3 py-1 text-right">Monto</th>
                  <th className="px-3 py-1 text-center">Cuotas</th>
                  <th className="px-3 py-1 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-center text-white/65">
                      Agrega al menos un método de pago.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => {
                    const method = methods.find((entry) => entry.id === payment.metodoId)

                    return (
                      <tr key={`${payment.metodoId}-${index}`} className="border-b border-white/10 hover:bg-black/18">
                        <td className="px-3 py-1 font-semibold text-white">
                          {method?.nombre ?? payment.metodoId}
                        </td>
                        <td className="px-3 py-1 text-right">{formatCentsARS(toCents(payment.monto))}</td>
                        <td className="px-3 py-1 text-center">{payment.cuotas || '-'}</td>
                        <td className="px-3 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => updatePayments((prev) => prev.filter((_, i) => i !== index))}
                            className="rounded-lg border border-black bg-red-900 px-3 py-1 font-semibold shadow-inner shadow-black hover:bg-orange-700"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded border border-white/12 bg-gradient-to-r from-slate-950 via-zinc-950 to-slate-900 p-1.5 shadow shadow-black sm:flex-row sm:items-center sm:justify-end">
            {(() => {
              const reason =
                !items.length ? 'Agrega al menos un producto' :
                !selectedSellerId ? 'Falta seleccionar vendedor' :
                !payments.some((p) => p.metodoId && toCents(p.monto) > 0) ? 'Agrega al menos un pago' :
                paidCents < totalCents ? `Faltan ${formatCentsARS(remainingCents)} por pagar` :
                paidCents > totalCents ? `Sobran ${formatCentsARS(excessCents)} en los pagos` :
                null
              return reason ? (
                <p className="text-xs text-amber-400/90 sm:mr-auto">{reason}</p>
              ) : null
            })()}
            <button
              type="button"
              onClick={clearSale}
              className="rounded-lg border border-white/20 bg-black/45 px-4 py-2 font-semibold text-white hover:bg-white/12"
              disabled={saving}
            >
              Limpiar venta
            </button>
            <button
              type="button"
              onClick={saveSale}
              className="rounded-lg border border-black bg-emerald-700 px-5 py-2 font-bold text-white shadow-inner shadow-black hover:bg-emerald-600 disabled:opacity-80 disabled:text-white/80"
              disabled={
                saving ||
                loadingClients ||
                loadingVendedores ||
                !items.length ||
                !selectedSellerId ||
                paidCents !== totalCents ||
                !payments.some((payment) => payment.metodoId && toCents(payment.monto) > 0)
              }
            >
              {saving ? 'Guardando...' : `Cobrar ${formatCurrencyARS(totals.total)}`}
            </button>
        </div>
      </div>
    </Main>
  )
}
