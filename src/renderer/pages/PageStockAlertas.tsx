import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, LoaderCircle, PackageSearch, RefreshCcw } from 'lucide-react'
import Title from '../layout/Title'
import Glass from '../layout/Glass'
import {
  productosStockMinimosListar,
  productoStockMinimoGuardar,
  type ProductoStockMinimo,
} from '../api/stockAlertas'

export default function PageStockAlertas() {
  const [productos, setProductos] = useState<ProductoStockMinimo[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [localMinimos, setLocalMinimos] = useState<Record<number, string>>({})
  const initializedRef = useRef(false)

  async function cargar() {
    setLoading(true)
    try {
      const data = await productosStockMinimosListar()
      setProductos(data)
      if (!initializedRef.current) {
        const map: Record<number, string> = {}
        for (const p of data) map[p.id] = String(p.stockMinimo)
        setLocalMinimos(map)
        initializedRef.current = true
      }
    } catch {
      toast.error('No se pudo cargar el listado de productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  function handleMinimoChange(id: number, value: string) {
    if (value !== '' && (!/^\d+$/.test(value) || Number(value) < 0)) return
    setLocalMinimos((prev) => ({ ...prev, [id]: value }))
  }

  async function handleMinimoBlur(producto: ProductoStockMinimo) {
    const raw = localMinimos[producto.id] ?? ''
    const nuevo = raw === '' ? 0 : Number(raw)
    if (nuevo === producto.stockMinimo) return

    setSavingId(producto.id)
    try {
      await productoStockMinimoGuardar(producto.id, nuevo)
      setProductos((prev) =>
        prev.map((p) =>
          p.id === producto.id
            ? { ...p, stockMinimo: nuevo, bajoDemanda: nuevo > 0 && p.stock <= nuevo }
            : p,
        ),
      )
    } catch {
      toast.error(`No se pudo guardar el mínimo de ${producto.nombre}`)
      setLocalMinimos((prev) => ({ ...prev, [producto.id]: String(producto.stockMinimo) }))
    } finally {
      setSavingId(null)
    }
  }

  const bajoStock = productos.filter((p) => p.bajoDemanda)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Title>Alertas de stock</Title>
        <button
          type="button"
          disabled={loading}
          onClick={() => void cargar()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Glass className="flex items-center gap-3 p-4">
          <PackageSearch className="text-cyan-200" size={26} />
          <div>
            <p className="text-2xl font-bold">{productos.length}</p>
            <p className="text-xs text-white/55">productos totales</p>
          </div>
        </Glass>
        <Glass
          className={`flex items-center gap-3 p-4 ${bajoStock.length > 0 ? 'border border-amber-400/25' : ''}`}
        >
          <AlertTriangle
            className={bajoStock.length > 0 ? 'text-amber-300' : 'text-white/30'}
            size={26}
          />
          <div>
            <p className={`text-2xl font-bold ${bajoStock.length > 0 ? 'text-amber-300' : ''}`}>
              {bajoStock.length}
            </p>
            <p className="text-xs text-white/55">con stock bajo</p>
          </div>
        </Glass>
        <Glass className="flex items-center gap-3 p-4">
          <CheckCircle2 className="text-emerald-300" size={26} />
          <div>
            <p className="text-2xl font-bold text-emerald-300">
              {productos.length - bajoStock.length}
            </p>
            <p className="text-xs text-white/55">en orden</p>
          </div>
        </Glass>
      </div>

      <Glass className="overflow-hidden p-0">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-sm font-bold">Mínimos por producto</p>
          <p className="mt-0.5 text-xs text-white/50">
            Editá el mínimo de cada producto. Si el stock baja de ese valor, aparece en rojo. Poné
            0 para no monitorear ese producto.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/50">
            <LoaderCircle className="animate-spin" size={18} />
            Cargando productos...
          </div>
        ) : productos.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/40">No hay productos cargados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/45">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 text-right font-semibold">Stock actual</th>
                  <th className="px-4 py-3 text-right font-semibold">Mínimo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const esBajo = p.bajoDemanda
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-white/5 transition-colors last:border-0 ${esBajo ? 'bg-amber-900/15' : 'hover:bg-white/5'}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <span className={esBajo ? 'text-amber-200' : ''}>{p.nombre}</span>
                      </td>
                      <td className="px-4 py-3 text-white/50">{p.codigo ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold tabular-nums ${esBajo ? 'text-amber-300' : 'text-white/80'}`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-flex items-center">
                          <input
                            type="number"
                            min={0}
                            value={localMinimos[p.id] ?? String(p.stockMinimo)}
                            onChange={(e) => handleMinimoChange(p.id, e.target.value)}
                            onBlur={() => void handleMinimoBlur(p)}
                            className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-right tabular-nums text-white outline-none transition focus:border-cyan-300/60 focus:bg-black/50"
                          />
                          {savingId === p.id && (
                            <LoaderCircle
                              size={13}
                              className="absolute -right-5 animate-spin text-cyan-300"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.stockMinimo === 0 ? (
                          <span className="text-xs text-white/30">Sin monitoreo</span>
                        ) : esBajo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                            <AlertTriangle size={11} />
                            Stock bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                            <CheckCircle2 size={11} />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Glass>
    </div>
  )
}
