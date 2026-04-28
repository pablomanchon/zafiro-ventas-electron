import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { create, getAll } from '../../api/crud'
import { useProducts } from '../../hooks/useProducts'
import { useClients } from '../../hooks/useClients'
import { useVendedores } from '../../hooks/useSellers'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'
import Title from '../../layout/Title'
import { formatCurrencyARS } from '../../utils/utils'

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

type QuickSaleDraft = {
  barcode: string
  items: ProductRow[]
  selectedSellerId: string
  selectedMethodId: string
}

const QUICK_SALE_DRAFT_KEY = 'quick-sale-draft'

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
  const [selectedMethodId, setSelectedMethodId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const barcodeRef = useRef<HTMLInputElement>(null)
  const draftLoadedRef = useRef(false)
  const skipPersistOnUnmountRef = useRef(false)
  const latestDraftRef = useRef<QuickSaleDraft>({
    barcode: '',
    items: [],
    selectedSellerId: '',
    selectedMethodId: '',
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
      }
      latestDraftRef.current = hydratedDraft
      setBarcode(hydratedDraft.barcode)
      setItems(hydratedDraft.items)
      setSelectedSellerId(hydratedDraft.selectedSellerId)
      setSelectedMethodId(hydratedDraft.selectedMethodId)
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
    const hasValidMethod = methods.some((method) => method.id === selectedMethodId)
    if ((!selectedMethodId || !hasValidMethod) && methods.length > 0) {
      const efectivo = methods.find((method) => normalizeText(method.tipo) === 'efectivo')
      const nextMethodId = efectivo?.id ?? methods[0].id
      setSelectedMethodId(nextMethodId)
      updateDraft({ selectedMethodId: nextMethodId })
    }
  }, [selectedMethodId, methods])

  const consumidorFinal = useMemo(() => {
    return (
      clients.find((client) => normalizeText(client.nombre) === 'consumidor final') ??
      clients.find((client) => normalizeText(client.nombre).includes('consumidor')) ??
      null
    )
  }, [clients])

  const selectedMethod = useMemo(
    () => methods.find((method) => method.id === selectedMethodId) ?? null,
    [methods, selectedMethodId]
  )

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
      selectedMethodId: '',
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

    const metodoPagoId = methods.some((method) => method.id === selectedMethodId)
      ? selectedMethodId
      : selectedMethod?.id ?? ''

    if (!metodoPagoId) {
      toast.error('Selecciona un metodo de pago valido')
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
        pagos: [
          {
            metodoId: metodoPagoId,
            monto: totals.total,
          },
        ],
      })

      const channel = new BroadcastChannel('ventas')
      channel.postMessage({ type: 'VENTA_CREADA', ventaId: (venta as any)?.id })
      channel.close()

      toast.success(`Venta ${(venta as any)?.id ?? ''} creada con exito`)
      clearSale()
    } catch (error) {
      toast.error(String(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Main className="flex flex-col gap-4 p-3 sm:p-4 text-white">
      <Steel className="flex flex-col gap-4 text-white">
        <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Dashboard</p>
            <Title className="border-b-0 pb-0 text-left">Venta rapida</Title>
            <p className="inline-flex w-fit rounded-lg bg-black/26 px-3 py-2 text-sm text-white/88">
              Escanea un codigo y el producto se agrega solo. Puedes ajustar cantidad,
              descuentos y eliminar lineas antes de guardar.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.8fr_0.8fr_auto] gap-3 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-white/78">Lector / codigo</span>
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
                  className="w-full rounded-xl border border-white/20 bg-black/45 px-4 py-3 text-white placeholder:text-white/55 caret-white outline-none focus:border-cyan-400 focus:bg-black/55"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-black bg-cyan-800 px-4 py-3 font-semibold text-white shadow-inner shadow-black hover:bg-sky-600"
                  disabled={loadingProducts}
                >
                  Agregar
                </button>
              </form>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-white/78">Vendedor</span>
              <select
                value={selectedSellerId}
                onChange={(e) => {
                  setSelectedSellerId(e.target.value)
                  updateDraft({ selectedSellerId: e.target.value })
                }}
                className="rounded-xl border border-white/20 bg-black/45 px-4 py-3 text-white caret-white outline-none focus:border-cyan-400 focus:bg-black/55"
                disabled={loadingVendedores}
              >
                <option value="">Seleccionar</option>
                {vendedores.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-white/78">Pago</span>
              <select
                value={selectedMethodId}
                onChange={(e) => {
                  setSelectedMethodId(e.target.value)
                  updateDraft({ selectedMethodId: e.target.value })
                }}
                className="rounded-xl border border-white/20 bg-black/45 px-4 py-3 text-white caret-white outline-none focus:border-cyan-400 focus:bg-black/55"
              >
                <option value="">Seleccionar</option>
                {methods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.nombre}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={focusScanner}
              className="rounded-xl border border-white/20 bg-black/45 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/12"
            >
              Enfocar lector
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 text-sm">
            <div className="rounded-xl border border-white/16 bg-black/36 px-4 py-3">
              <p className="text-white/68 uppercase tracking-[0.16em] text-[11px]">Cliente</p>
              <p className="mt-1 font-semibold">{consumidorFinal?.nombre ?? 'Consumidor Final no disponible'}</p>
            </div>
            <div className="rounded-xl border border-white/16 bg-black/36 px-4 py-3">
              <p className="text-white/68 uppercase tracking-[0.16em] text-[11px]">Subtotal</p>
              <p className="mt-1 font-semibold">{formatCurrencyARS(totals.subtotal)}</p>
            </div>
            <div className="rounded-xl border border-white/16 bg-black/36 px-4 py-3">
              <p className="text-white/68 uppercase tracking-[0.16em] text-[11px]">Descuentos</p>
              <p className="mt-1 font-semibold">{formatCurrencyARS(totals.descuento)}</p>
            </div>
            <div className="rounded-xl border border-cyan-400/50 bg-black/52 px-4 py-3 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]">
              <p className="text-cyan-100/85 uppercase tracking-[0.16em] text-[11px]">Total a cobrar</p>
              <p className="mt-1 text-xl font-bold">{formatCurrencyARS(totals.total)}</p>
              {selectedMethod && (
                <p className="mt-1 text-xs text-white/72">Se cargara completo en {selectedMethod.nombre}</p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border-t border-white/10 pt-3">
            <div className="min-w-[900px]">
              <table className="w-full text-sm">
                <thead className="border-b border-white/16 text-white/88">
                  <tr>
                    <th className="px-3 py-2 text-left"><span className="rounded-md bg-black/22 px-2 py-1">Codigo</span></th>
                    <th className="px-3 py-2 text-left"><span className="rounded-md bg-black/22 px-2 py-1">Producto</span></th>
                    <th className="px-3 py-2 text-right"><span className="rounded-md bg-black/22 px-2 py-1">Precio</span></th>
                    <th className="px-3 py-2 text-center"><span className="rounded-md bg-black/22 px-2 py-1">Cant.</span></th>
                    <th className="px-3 py-2 text-center"><span className="rounded-md bg-black/22 px-2 py-1">Desc. %</span></th>
                    <th className="px-3 py-2 text-right"><span className="rounded-md bg-black/22 px-2 py-1">Desc. $</span></th>
                    <th className="px-3 py-2 text-right"><span className="rounded-md bg-black/22 px-2 py-1">Total</span></th>
                    <th className="px-3 py-2 text-center"><span className="rounded-md bg-black/22 px-2 py-1">Accion</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <div className="mx-auto inline-flex rounded-xl bg-black/35 px-4 py-2 text-white/88">
                          Aun no hay productos cargados. Escanea el primer codigo para empezar.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-b border-white/10 hover:bg-black/18">
                        <td className="px-3 py-3">{item.codigo}</td>
                        <td className="px-3 py-3 font-semibold text-white">{item.nombre}</td>
                        <td className="px-3 py-3 text-right">{formatCurrencyARS(item.precio)}</td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min={1}
                            value={item.cantidad}
                            onChange={(e) =>
                              updateItem(item.id, {
                                cantidad: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="w-20 rounded-lg border border-white/18 bg-black/42 px-2 py-2 text-right !text-white caret-white [color-scheme:dark] outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="px-3 py-3">
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
                            className="w-20 rounded-lg border border-white/18 bg-black/42 px-2 py-2 text-right !text-white caret-white [color-scheme:dark] outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="px-3 py-3">
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
                            className="w-28 rounded-lg border border-white/18 bg-black/42 px-2 py-2 text-right !text-white caret-white [color-scheme:dark] outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">{formatCurrencyARS(lineTotal(item))}</td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-lg border border-black bg-red-900 px-3 py-2 font-semibold shadow-inner shadow-black hover:bg-orange-700"
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

          <div className="flex flex-col sm:flex-row gap-2 justify-end border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={clearSale}
              className="rounded-xl border border-white/18 bg-black/45 px-4 py-3 font-semibold text-white hover:bg-white/12"
              disabled={saving}
            >
              Limpiar venta
            </button>
            <button
              type="button"
              onClick={saveSale}
              className="rounded-xl border border-black bg-emerald-700 px-5 py-3 font-bold text-white shadow-inner shadow-black hover:bg-emerald-600 disabled:opacity-80 disabled:text-white/80"
              disabled={
                saving ||
                loadingClients ||
                loadingVendedores ||
                !items.length ||
                !selectedSellerId ||
                !selectedMethodId
              }
            >
              {saving ? 'Guardando...' : `Cobrar ${formatCurrencyARS(totals.total)}`}
            </button>
          </div>
        </div>
      </Steel>
    </Main>
  )
}
