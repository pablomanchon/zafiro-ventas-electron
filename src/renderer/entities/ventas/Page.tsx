// src/pages/PageVentas.tsx
import { create } from '../../api/crud'
import { useNavigate } from 'react-router-dom'
import ClienteSelectInput from '../clientes/ClienteSelectInput'
import type { FormInput } from '../../layout/DynamicForm'
import PaymentMethodsTable, { type PaymentItem } from '../clientes/PaymentMethodsTable'
import DynamicForm from '../../layout/DynamicForm'
import ItemsVentaTable from '../../components/ItemsVentaTable'
import type { SaleItem } from '../item-venta/useSaleItems'
import Main from '../../layout/Main'

export default function PageVentas() {
  const navigate = useNavigate()

  const inputs: FormInput[] = [
    {
      name: 'clienteId',
      label: 'Cliente',
      type: 'component',
      Component: ClienteSelectInput,
    },
    {
      name: 'items',
      label: 'Productos',
      type: 'component',
      Component: ItemsVentaTable,
    },
    {
      name: 'pagos',
      label: 'Métodos de Pago',
      type: 'component',
      Component: PaymentMethodsTable,
    },
  ]

  const handleSubmit = async (values: Record<string, any>) => {
    const items: SaleItem[] = values.items || []
    const detalles = items.map(item => ({
      productoId: item.productId,
      item: { cantidad: item.cantidad, descuento: item.descuento },
    }))

    const pagos: PaymentItem[] = values.pagos || []
    const pagosPayload = pagos.map(p => {
      const dto: Record<string, any> = { metodoId: p.metodoId, monto: p.monto }
      if (p.cuotas != null) dto.cuotas = p.cuotas
      return dto
    })

    await create('ventas', {
      clienteId: values.clienteId,
      detalles,
      pagos: pagosPayload,
    })
    navigate(-1)
  }

  return (
    <Main className="flex flex-col gap-4 mt-16 md:mt-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Crear Venta</h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 text-white"
        >
          Cancelar
        </button>
      </div>
      <DynamicForm
        inputs={inputs}
        onSubmit={handleSubmit}
        titleBtn="Guardar Venta"
      />
    </Main>
  )
}
