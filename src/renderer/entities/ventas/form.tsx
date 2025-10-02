// src/pages/PageVentas.tsx
import { useState, useMemo, useCallback } from 'react'
import { create } from '../../api/crud'
import ClienteSelectInput from '../clientes/ClienteSelectInput'
import type { FormInput } from '../../layout/DynamicForm'
import DynamicForm from '../../layout/DynamicForm'
import type { SaleItem } from '../item-venta/useSaleItems'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import { useProducts } from '../../hooks/useProducts'
import { toast } from 'react-toastify'
import type { PaymentItem } from '../metodo-pago/PaymentMethodsTable'
import ItemsVentaTable from '../item-venta/ItemsVentaTable'
import PaymentMethodsTable from '../metodo-pago/PaymentMethodsTable'
import bgUrl from '../../assets/fondo-w.png'
export default function FormVenta() {
  const { products } = useProducts()

  const [formKey, setFormKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // 👇 espejo local para poder calcular el total en tiempo real
  const [itemsMirror, setItemsMirror] = useState<SaleItem[]>([])

  // Proxy que intercepta onChange de ItemsVentaTable y actualiza el espejo
  const ItemsProxy = useCallback((
    { value, onChange }: { value?: SaleItem[]; onChange?: (v: SaleItem[]) => void }
  ) => (
    <ItemsVentaTable
      value={value}
      onChange={(v) => {
        onChange?.(v)
        setItemsMirror(v || [])
      }}
    />
  ), [])

  const makePaymentBase = (): PaymentItem =>
    ({ metodoId: '', monto: '', cuotas: '' } as unknown as PaymentItem)

  const defaultPayments = useMemo<PaymentItem[]>(
    () => [makePaymentBase(), makePaymentBase(), makePaymentBase()],
    []
  )

  // 👉 helper para total con descuentos (unitario con desc * cantidad)
  const calcTotalConDescuento = (items: SaleItem[]): number => {
    return (items ?? []).reduce((acc, it: any) => {
      const prod = products.find(p => p.id === it.productId)
      const base = Number(prod?.precio ?? 0)
      const desc = Number(it?.descuento ?? 0) // %
      const unit = typeof it?.precioFinal === 'number'
        ? it.precioFinal
        : base * (1 - (isNaN(desc) ? 0 : desc) / 100)
      const cant = Number(it?.cantidad || 0)
      return acc + unit * cant
    }, 0)
  }

  // 👇 total con descuentos en vivo (para PaymentMethodsTable)
  const totalConDescuento = useMemo(
    () => Number(calcTotalConDescuento(itemsMirror).toFixed(2)),
    [itemsMirror, products]
  )

  const inputsBase: FormInput[] = useMemo(() => [
    { name: 'clienteId', label: 'Cliente', type: 'component', Component: ClienteSelectInput },
    { name: 'items', label: 'Productos', type: 'component', Component: ItemsProxy },
    {
      name: 'pagos',
      label: 'Métodos de Pago',
      type: 'component',
      Component: PaymentMethodsTable,
      value: defaultPayments,
    },
  ], [defaultPayments, ItemsProxy])

  // 👇 misma lista, pero inyectando el total como prop (esto NO remonta)
  const inputsWithTotal: FormInput[] = useMemo(() => {
    return inputsBase.map(inp =>
      inp.name === 'pagos'
        ? { ...inp, componentProps: { ...(inp as any).componentProps, total: totalConDescuento } }
        : inp
    )
  }, [inputsBase, totalConDescuento])

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSubmitting(true)

      const items: SaleItem[] = values.items || []
      const pagos: PaymentItem[] = values.pagos || []

      // ✅ Usar el MISMO total que ve PaymentMethodsTable
      const totalCD = Number(totalConDescuento.toFixed(2))

      // Suma de pagos con el mismo redondeo
      const sumaPagos = Number(
        ((pagos ?? []).reduce((acc, p) => acc + (parseFloat((p as any).monto || '0') || 0), 0)).toFixed(2)
      )

      // Comparar con el mismo criterio de 2 decimales
      if (sumaPagos !== totalCD) {
        toast.error(`Los métodos de pago ($${sumaPagos.toFixed(2)}) no coinciden con el total con descuentos ($${totalCD.toFixed(2)}).`)
        setSubmitting(false)
        return
      }

      const detalles = items.map((item: any) => {
        const prod = products.find(p => p.id === item.productId)
        const base = Number(prod?.precio ?? 0)
        const descPct = Number(item?.descuento ?? 0)
        const precioFinalUnit = typeof item?.precioFinal === 'number'
          ? Number(item.precioFinal)
          : Number((base * (1 - (isNaN(descPct) ? 0 : descPct) / 100)).toFixed(2))

        return {
          productoId: item.productId,
          item: {
            nombre: prod?.nombre ?? '',
            descripcion: (prod as any)?.descripcion ?? '',
            precio: precioFinalUnit,
            cantidad: Number(item.cantidad || 0),
            descuento: isNaN(descPct) ? 0 : descPct, // %
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
      setFormKey(k => k + 1)
      setItemsMirror([]) // reset espejo
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Ocurrió un error al crear la venta'
      toast.error(`Error: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Main style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className="flex flex-col gap-4 md:mt-auto text-white">
      <div className="flex items-center justify-between">
        <Title className="text-white pb-2">Crear Venta</Title>
      </div>

      <DynamicForm
        key={formKey}
        inputs={inputsWithTotal}
        onSubmit={handleSubmit}
        titleBtn={submitting ? 'Guardando...' : 'Guardar Venta'}
      />
    </Main>
  )
}
