import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FileCheck2, LoaderCircle } from 'lucide-react'
import { facturarVenta } from '../../api/facturacion'
import { useSale } from '../../hooks/useSale'
import { useAppDispatch } from '../../store/hooks'
import { fetchSaleById } from '../../store/salesReduce'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import Steel from '../../layout/Steel'
import type { Cliente } from '../../hooks/useClients'
import type { SaleItem } from '../item-venta/useSaleItems'
import type { PaymentItem } from '../metodo-pago/PaymentMethodsTable'
import bgUrl from '../../assets/fondo-h.webp'
import type { Vendedor } from '../../hooks/useSellers'
import { formatCurrencyARS } from '../../utils/utils'
import LoadingState from '../../components/LoadingState'

export type TypeVenta = {
  id: number
  fecha: Date
  total?: number
  cliente: Cliente
  vendedor: Vendedor
  detalles: SaleItem[]
  pagos: PaymentItem[]
}

export default function SaleDetail({ idVenta: idProp }: { idVenta?: string }) {
  const { idVenta: idParam } = useParams<{ idVenta: string }>()
  const id = idProp ?? idParam ?? ''
  const dispatch = useAppDispatch()
  const [facturando, setFacturando] = useState(false)
  const { venta, loading } = useSale(id)

  if (!id) return <div>No se encontró el ID de la venta</div>
  if (loading) return <LoadingState title="Cargando venta" message="Estamos buscando el detalle de la operación." className="m-3" />
  if (!venta) return <div className="p-6 text-white">Venta no encontrada</div>

  const fechaVenta = venta.fecha ? new Date(venta.fecha).toLocaleString('es-AR') : ''
  const totalVenta =
    venta.total ??
    venta.pagos?.reduce((acc: number, pago: any) => acc + Number(pago.monto ?? 0), 0)

  const handleFacturar = async () => {
    setFacturando(true)
    try {
      const result = await facturarVenta({
        ventaId: Number(venta.id),
        trigger: 'manual',
        force: true,
      })
      if (result?.authorized) {
        toast.success(`Factura autorizada. CAE ${result.invoice?.cae ?? ''}`.trim())
      } else {
        toast.success(result?.message ?? 'Factura procesada')
      }
      dispatch(fetchSaleById(id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo facturar la venta')
    } finally {
      setFacturando(false)
    }
  }

  const content = (
    <div className="w-full text-white flex flex-col gap-3">
      <Title>Detalle Venta #{venta.id}</Title>

      <Steel typeWood={2} className="p-3 bg-slate-900/80 border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <div className="space-y-1 text-sm text-white">
            <div>
              <span className="font-semibold text-white">Cliente:</span>{' '}
              {venta.cliente.nombre} {venta.cliente.apellido}
            </div>
            <div>
              <span className="font-semibold text-white">Vendedor:</span>{' '}
              {venta.vendedor.nombre}
            </div>
            {fechaVenta && (
              <div>
                <span className="font-semibold text-white">Fecha:</span> {fechaVenta}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:self-center">
            <span className="text-sm text-white/80">Total:</span>
            <span className="px-3 py-1 rounded-full text-sm font-semibold border border-emerald-400 bg-emerald-900/70 text-emerald-100">
              {formatCurrencyARS(totalVenta)}
            </span>
            <button
              type="button"
              onClick={() => void handleFacturar()}
              disabled={facturando}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/25 bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white shadow shadow-black transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {facturando ? <LoaderCircle className="animate-spin" size={16} /> : <FileCheck2 size={16} />}
              Facturar
            </button>
          </div>
        </div>
      </Steel>

      <Steel typeWood={2} className="p-3 bg-slate-900/80 border border-slate-700">
        <h2 className="text-sm font-semibold text-white mb-2">Productos</h2>

        <div className="overflow-auto text-white">
          <table className="w-full min-w-[480px] text-xs md:text-sm border border-slate-700 rounded-md overflow-hidden">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-right">Precio</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-center text-slate-400">
                    Esta venta no tiene productos asociados.
                  </td>
                </tr>
              )}

              {venta.detalles.map((detalle: any, index: number) => {
                const item = detalle.item ?? detalle
                const precio = Number(item.precio ?? detalle.precio ?? 0)
                const cantidad = Number(item.cantidad ?? detalle.cantidad ?? 0)

                return (
                  <tr
                    key={detalle.id ?? index}
                    className="border-t border-slate-700 odd:bg-slate-900/80 even:bg-slate-950/80"
                  >
                    <td className="px-3 py-2 text-slate-100">
                      {item.nombre || <span className="text-slate-500">Sin nombre</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-100">
                      {formatCurrencyARS(precio)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-100">
                      {cantidad}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-100">
                      {formatCurrencyARS(precio * cantidad)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Steel>

      <Steel typeWood={2} className="p-3 bg-slate-900/80 border border-slate-700">
        <h2 className="text-sm font-semibold text-white mb-2">Métodos de pago</h2>

        <div className="overflow-auto text-white">
          <table className="w-full min-w-[520px] text-xs md:text-sm border border-slate-700 rounded-md overflow-hidden">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-right">Cuotas</th>
                <th className="px-3 py-2 text-right">Valor cuota</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {venta.pagos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-center text-slate-400">
                    Esta venta no tiene pagos asociados.
                  </td>
                </tr>
              )}

              {venta.pagos.map((pago: any, index: number) => {
                const monto = Number(pago.monto ?? 0)

                return (
                  <tr
                    key={pago.id ?? index}
                    className="border-t border-slate-700 odd:bg-slate-900/80 even:bg-slate-950/80"
                  >
                    <td className="px-3 py-2 text-slate-100">
                      {pago.metodo?.id ?? '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-100">
                      {pago.metodo?.nombre ?? 'Sin método'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-100">
                      {pago.cuotas ?? '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-100">
                      {formatCurrencyARS(monto)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-100">
                      {formatCurrencyARS(monto)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Steel>
    </div>
  )

  if (!idProp) {
    return (
      <Main
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="flex items-start justify-center min-h-screen p-6"
      >
        <div className="w-full max-w-3xl bg-black/70 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black border border-white/10 p-5">
          {content}
        </div>
      </Main>
    )
  }

  return <div className="w-[min(96vw,760px)] p-2">{content}</div>
}
