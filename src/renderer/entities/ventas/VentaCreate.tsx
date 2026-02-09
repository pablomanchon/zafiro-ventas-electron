import { useCallback, useMemo } from 'react'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import DynamicForm from '../../layout/DynamicForm'
import bgUrl from '../../assets/fondo-w.png'

import type { FormInput } from '../../layout/DynamicForm'

import type { SaleItem } from '../item-venta/useSaleItems'
import ItemsVentaTable from '../item-venta/ItemsVentaTable'

import PaymentMethodsTable from '../metodo-pago/PaymentMethodsTable'
import type { PaymentItem } from '../metodo-pago/PaymentMethodsTable'

import VendedorSelectInput from '../sellers/VendedorSelectInput'
import ClienteSelectInput from '../clientes/ClienteSelectInput'
import { useVentaCreateLogic, type TotalDiscount } from './useVentaCreate'

export default function VentaCreate() {
  const {
    formKey,
    submitting,
    defaults,
    totalConDescuento,
    setItemsMirror,
    setTotalDiscountMirror,
    handleSubmit,
  } = useVentaCreateLogic()

  const ItemsProxy = useCallback(
    ({ value, onChange }: { value?: SaleItem[]; onChange?: (v: SaleItem[]) => void }) => (
      <ItemsVentaTable
        value={value}
        onChange={(v) => {
          onChange?.(v)
          setItemsMirror(v || [])
        }}
      />
    ),
    [setItemsMirror]
  )

  const TotalDiscountProxy = useCallback(
    ({ value, onChange }: { value?: TotalDiscount; onChange?: (v: TotalDiscount) => void }) => {
      const pct: TotalDiscount['pct'] = value?.pct ?? ''
      const monto: TotalDiscount['monto'] = value?.monto ?? ''

      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-white">Descuento total (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                className="w-28 bg-inherit outline-none text-white px-2 py-1 border border-white/20 rounded"
                value={pct === '' ? '' : Number(pct) === 0 ? '' : pct}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const nextPct: TotalDiscount['pct'] = e.target.value === '' ? '' : Number(e.target.value)
                  const next: TotalDiscount = { pct: nextPct, monto }
                  onChange?.(next)
                  setTotalDiscountMirror(next)
                }}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-white">Descuento total ($)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-40 bg-inherit outline-none text-white px-2 py-1 border border-white/20 rounded text-right"
                value={monto === '' ? '' : Number(monto) === 0 ? '' : monto}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const nextMonto: TotalDiscount['monto'] = e.target.value === '' ? '' : Number(e.target.value)
                  const next: TotalDiscount = { pct, monto: nextMonto }
                  onChange?.(next)
                  setTotalDiscountMirror(next)
                }}
              />
            </label>
          </div>
        </div>
      )
    },
    [setTotalDiscountMirror]
  )

  const inputs: FormInput[] = useMemo(
    () => [
      {
        name: 'vendedorId',
        label: 'Vendedor',
        type: 'component',
        Component: VendedorSelectInput,
        value: defaults.vendedorId,
      },
      {
        name: 'clienteId',
        label: 'Cliente',
        type: 'component',
        Component: ClienteSelectInput,
        value: defaults.clienteId,
      },
      {
        name: 'items',
        label: 'Productos',
        type: 'component',
        Component: ItemsProxy,
        value: defaults.items,
      },
      {
        name: 'descuentoTotal',
        label: 'Descuento Total',
        type: 'component',
        Component: TotalDiscountProxy,
        value: defaults.descuentoTotal ?? { pct: '', monto: '' },
      },
      {
        name: 'pagos',
        label: 'Métodos de Pago',
        type: 'component',
        Component: PaymentMethodsTable as any,
        value: defaults.pagos as PaymentItem[] | undefined,
        componentProps: { total: totalConDescuento },
      },
    ],
    [defaults, ItemsProxy, TotalDiscountProxy, totalConDescuento]
  )

  return (
    <Main
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      className="flex flex-col gap-4 md:mt-auto text-white"
    >
      <div className="flex items-center justify-between">
        <Title className="text-white pb-2">Crear Venta</Title>
      </div>

      <DynamicForm
        key={formKey}
        inputs={inputs}
        onSubmit={async (values) => {
          await handleSubmit(values)
        }}
        titleBtn={submitting ? 'Guardando...' : 'Guardar Venta'}
      />
    </Main>
  )
}
