// src/pages/PageVentas.tsx
import { useState, useMemo } from 'react'
import { create } from '../../api/crud'
import ClienteSelectInput from '../clientes/ClienteSelectInput'
import type { FormInput } from '../../layout/DynamicForm'
import PaymentMethodsTable, { type PaymentItem } from '../clientes/PaymentMethodsTable'
import DynamicForm from '../../layout/DynamicForm'
import ItemsVentaTable from '../../components/ItemsVentaTable'
import type { SaleItem } from '../item-venta/useSaleItems'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import { useProducts } from '../../hooks/useProducts'
import { toast } from 'react-toastify'

export default function FormVenta() {
  const { products } = useProducts()

  // 👇 clave para forzar re-montaje (reset) del formulario
  const [formKey, setFormKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // 👇 helper: base de un método de pago vacío
  const makePaymentBase = (): PaymentItem => ({
    // ajustá los campos si tu PaymentItem tiene otros nombres
    metodoId: '',
    monto: '',
    cuotas: '', // si tu tabla no usa cuotas, podés quitar esto
  } as unknown as PaymentItem)

  // 👇 3 métodos de pago por defecto (referencia estable)
  const defaultPayments = useMemo<PaymentItem[]>(
    () => [makePaymentBase(), makePaymentBase(), makePaymentBase()],
    []
  )

  const inputs: FormInput[] = useMemo(() => [
    { name: 'clienteId', label: 'Cliente', type: 'component', Component: ClienteSelectInput },
    { name: 'items',     label: 'Productos', type: 'component', Component: ItemsVentaTable },
    // 👇 le pasamos `value` con 3 filas iniciales
    { name: 'pagos',     label: 'Métodos de Pago', type: 'component', Component: PaymentMethodsTable, value: defaultPayments },
  ], [defaultPayments])

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSubmitting(true)

      const items: SaleItem[] = values.items || []
      const pagos: PaymentItem[] = values.pagos || []

      const detalles = items.map(item => {
        const prod = products.find(p => p.id === item.productId)
        return {
          productoId: item.productId,
          item: {
            nombre:       prod?.nombre ?? '',
            descripcion:  (prod as any)?.descripcion ?? '',
            precio:       Number(prod?.precio ?? 0),
            cantidad:     Number(item.cantidad || 0),
          }
        }
      })

      const pagosPayload = pagos.map(p => {
        const dto: Record<string, any> = {
          metodoId: p.metodoId,
          monto: Number((p as any).monto || 0),
        }
        if ((p as any).cuotas != null && (p as any).cuotas !== '') dto.cuotas = Number((p as any).cuotas)
        return dto
      })

      const venta = await create('ventas', {
        clienteId: values.clienteId ?? null,
        detalles,
        pagos: pagosPayload,
      })

      toast.success(`Venta ${venta.id} creada con éxito`)
      setFormKey(k => k + 1) // reset duro solo en éxito
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Ocurrió un error al crear la venta'
      toast.error(`Error: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Main className="flex flex-col gap-4 md:mt-auto">
      <div className="flex items-center justify-between">
        <Title className="text-white pb-2">Crear Venta</Title>
      </div>

      <DynamicForm
        key={formKey}
        inputs={inputs}
        onSubmit={handleSubmit}
        titleBtn={submitting ? 'Guardando...' : 'Guardar Venta'}
      />
    </Main>
  )
}
