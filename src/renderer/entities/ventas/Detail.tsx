import { useParams } from "react-router-dom";
import { useSale } from "../../hooks/useSale";
import Main from "../../layout/Main";
import Title from "../../layout/Title";
import type { Cliente } from "../../hooks/useClients";
import type { SaleItem } from "../item-venta/useSaleItems";
import type { PaymentItem } from "../metodo-pago/PaymentMethodsTable";
import Table from "../../layout/Table";
import bgUrl from "../../assets/fondo-h.png"
export type TypeVenta = {
  id: number,
  fecha: Date,
  cliente: Cliente
  detalles: SaleItem[]
  pagos:PaymentItem[]
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

export default function SaleDetail() {
  // useParams siempre devuelve string | undefined
  const { id } = useParams<{ id: string }>();
  
  // solo invocamos el hook si hay id
  const { venta, loading } = useSale(id ?? "");

  if (!id) return <div>No se encontró el ID de la venta</div>;
  if (loading) return <div>Cargando venta...</div>;
  if (!venta) return <div>Venta no encontrada</div>;

  return (
    <Main style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className="text-white">
      <Title>Detalle Venta {venta.id}</Title>
      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-lg">Cliente: {venta.cliente.nombre} {venta.cliente.apellido}</h2>
        <h2 className="font-bold text-lg">Productos:</h2>
        <Table datos={venta.detalles} encabezados={itemsColumns} onDobleClickFila={()=>{}} onFilaSeleccionada={()=>{}} />

        <h2 className="font-bold text-lg mt-5">Metodos de Pago:</h2>
        <Table datos={venta.pagos} encabezados={salesColumns} onDobleClickFila={()=>{}} onFilaSeleccionada={()=>{}}/>
      </div>
    </Main>
  );
}
