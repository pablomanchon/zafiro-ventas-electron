import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getAll } from '../../api/crud'
import LoadingState from '../../components/LoadingState'
import SecondaryButton from '../../components/SecondaryButton'
import Steel from '../../layout/Steel'
import Title from '../../layout/Title'
import { formatCurrencyARS } from '../../utils/utils'
import SaleDetail from '../ventas/Detail'
import type { Cliente } from '../../hooks/useClients'

type VentaCliente = {
  id: number | string
  fecha?: string
  total?: number
  clienteId?: number | string
  detalles?: any[]
}

function formatSaleDate(raw: unknown) {
  if (!raw) return '-'
  const date = new Date(raw as string)
  if (Number.isNaN(date.getTime())) return String(raw)
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getProductSummary(venta: VentaCliente) {
  const detalles = venta.detalles ?? []
  if (detalles.length === 0) return 'Sin productos'

  const names = detalles
    .map((detalle: any) => detalle?.item?.nombre ?? detalle?.nombre)
    .filter(Boolean)

  if (names.length === 0) return `${detalles.length} producto(s)`
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} y ${names.length - 2} mas`
}

export default function ClientPurchases({ cliente }: { cliente: Cliente }) {
  const [ventas, setVentas] = useState<VentaCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSaleId, setSelectedSaleId] = useState<number | string | null>(null)

  const loadPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAll<VentaCliente>('ventas', { clienteId: cliente.id })
      setVentas(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [cliente.id])

  useEffect(() => {
    void loadPurchases()
  }, [loadPurchases])

  const totalComprado = useMemo(
    () => ventas.reduce((acc, venta) => acc + Number(venta.total ?? 0), 0),
    [ventas],
  )

  if (selectedSaleId != null) {
    return (
      <div className="w-[min(96vw,820px)] p-2 text-white">
        <div className="mb-3">
          <SecondaryButton title="Volver a compras" functionClick={() => setSelectedSaleId(null)} />
        </div>
        <SaleDetail idVenta={String(selectedSaleId)} />
      </div>
    )
  }

  return (
    <div className="w-[min(96vw,900px)] p-2 text-white">
      <Title>
        Compras de {cliente.nombre} {cliente.apellido ?? ''}
      </Title>

      {loading ? (
        <LoadingState title="Cargando compras" message="Estamos buscando el historial del cliente." className="m-3" />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Steel className="bg-slate-900/80 border border-slate-700">
              <p className="text-sm text-white/70">Cantidad de compras</p>
              <p className="text-2xl font-bold">{ventas.length}</p>
            </Steel>
            <Steel className="bg-slate-900/80 border border-slate-700">
              <p className="text-sm text-white/70">Total comprado</p>
              <p className="text-2xl font-bold text-emerald-100">{formatCurrencyARS(totalComprado)}</p>
            </Steel>
          </div>

          <Steel className="p-3 bg-slate-900/80 border border-slate-700">
            <div className="overflow-auto">
              <table className="w-full min-w-[620px] text-sm border border-slate-700">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Venta</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Productos</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-white/60">
                        Este cliente todavia no tiene compras registradas.
                      </td>
                    </tr>
                  ) : ventas.map((venta) => (
                    <tr
                      key={venta.id}
                      onDoubleClick={() => setSelectedSaleId(venta.id)}
                      className="cursor-pointer border-t border-slate-700 odd:bg-slate-900/80 even:bg-slate-950/80 hover:bg-cyan-900/70"
                      title="Doble click para ver el detalle"
                    >
                      <td className="px-3 py-2 font-semibold">#{venta.id}</td>
                      <td className="px-3 py-2">{formatSaleDate(venta.fecha)}</td>
                      <td className="px-3 py-2">{getProductSummary(venta)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatCurrencyARS(venta.total ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ventas.length > 0 && (
              <p className="mt-2 text-xs text-white/55">Doble click sobre una compra para abrir el detalle.</p>
            )}
          </Steel>
        </div>
      )}
    </div>
  )
}
