import { useParams } from 'react-router-dom'
import { useSale } from '../../hooks/useSale'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import type { Cliente } from '../../hooks/useClients'
import type { SaleItem } from '../item-venta/useSaleItems'
import type { PaymentItem } from '../metodo-pago/PaymentMethodsTable'
import Table from '../../layout/Table'
import bgUrl from '../../assets/fondo-h.webp'
import type { Vendedor } from '../../hooks/useSellers'

export type TypeVenta = {
  id: number
  fecha: Date
  cliente: Cliente
  vendedor: Vendedor
  detalles: SaleItem[]
  pagos: PaymentItem[]
}

const itemsColumns = [
  { titulo: 'Nombre', clave: 'item.nombre' },
  { titulo: 'Precio', clave: 'item.precio' },
  { titulo: 'Cantidad', clave: 'item.cantidad' },
]

const salesColumns = [
  { titulo: '', clave: 'metodo.id' },
  { titulo: 'Nombre', clave: 'metodo.nombre' },
  { titulo: 'Cuotas', clave: 'cuotas' },
  { titulo: 'Valor Cuota', clave: 'monto' },
  { titulo: 'Total', clave: 'monto' },
]

export default function SaleDetail({ idVenta: idProp }: { idVenta?: string }) {
  const { idVenta: idParam } = useParams<{ idVenta: string }>()
  const id = idProp ?? idParam ?? ''
  const { venta, loading } = useSale(id)

  if (!id) return <div>No se encontró el ID de la venta</div>
  if (loading) return <div className="p-6 text-white">Cargando venta...</div>
  if (!venta) return <div className="p-6 text-white">Venta no encontrada</div>

  const content = (
    <div className="w-full text-white flex flex-col gap-4">
      <Title>Detalle Venta {venta.id}</Title>

      <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
        <p className="text-base"><span className="font-bold text-white/60">Cliente:</span> {venta.cliente.nombre} {venta.cliente.apellido}</p>
        <p className="text-base"><span className="font-bold text-white/60">Vendedor:</span> {venta.vendedor.nombre}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-white/60 uppercase text-xs tracking-widest">Productos</h2>
        <Table
          datos={venta.detalles}
          encabezados={itemsColumns}
          onDobleClickFila={() => {}}
          onFilaSeleccionada={() => {}}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-white/60 uppercase text-xs tracking-widest">Métodos de Pago</h2>
        <Table
          datos={venta.pagos}
          encabezados={salesColumns}
          onDobleClickFila={() => {}}
          onFilaSeleccionada={() => {}}
        />
      </div>
    </div>
  )

  // Ruta directa: envuelve en el fondo de madera
  if (!idProp) {
    return (
      <Main
        style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        className="flex items-start justify-center min-h-screen p-6"
      >
        <div className="w-full max-w-2xl bg-black/70 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black border border-white/10 p-6">
          {content}
        </div>
      </Main>
    )
  }

  // Dentro de un modal: sin fondo propio
  return <div className="w-[min(96vw,640px)] p-2">{content}</div>
}
