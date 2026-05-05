import { useCallback, useMemo } from 'react'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import DynamicForm from '../../layout/DynamicForm'
import bgUrl from '../../assets/fondo-w.webp'
import SecondaryBtn from '../../components/SecondaryButton'

import type { FormInput } from '../../layout/DynamicForm'

import type { SaleItem } from '../item-venta/useSaleItems'
import ItemsVentaTable from '../item-venta/ItemsVentaTable'

import PaymentMethodsTable from '../metodo-pago/PaymentMethodsTable'
import type { PaymentItem } from '../metodo-pago/PaymentMethodsTable'

import VendedorSelectInput from '../sellers/VendedorSelectInput'
import ClienteSelectInput from '../clientes/ClienteSelectInput'
import { useVentaCreateLogic, type TotalDiscount } from './useVentaCreate'

type VentaCreateProps = {
  embedded?: boolean
  onSaved?: (venta: any) => void
  onCancel?: () => void
}

export default function VentaCreate({
  embedded = false,
  onSaved,
  onCancel,
}: VentaCreateProps) {
  const {
    formKey,
    submitting,
    defaults,
    totalConDescuento,
    tipoCambioUsd,
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
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
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
      colSpan: 1,
    },
    {
      name: 'clienteId',
      label: 'Cliente',
      type: 'component',
      Component: ClienteSelectInput,
      value: defaults.clienteId,
      colSpan: 1,
    },
    {
      name: 'items',
      label: 'Productos',
      type: 'component',
      Component: ItemsProxy,
      value: defaults.items,
      colSpan: 2, // para que arranque debajo ocupando toda la fila
    },
    {
      name: 'descuentoTotal',
      label: 'Descuento Total',
      type: 'component',
      Component: TotalDiscountProxy,
      value: defaults.descuentoTotal ?? { pct: '', monto: '' },
      colSpan: 2,
    },
    {
      name: 'pagos',
      label: 'Métodos de Pago',
      type: 'component',
      Component: PaymentMethodsTable as any,
      value: defaults.pagos as PaymentItem[] | undefined,
      componentProps: { total: totalConDescuento, tipoCambioUsd },
      colSpan: 2,
    },
  ],
  [defaults, ItemsProxy, TotalDiscountProxy, totalConDescuento]
)

  const content = (
    <div className={embedded ? 'venta-create-modal' : ''}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          {embedded && (
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">
              Punto de venta
            </p>
          )}
          <Title className={embedded ? 'text-white pb-1 border-white/10 text-left' : 'text-white pb-2'}>
            {embedded ? 'Nueva Venta' : 'Crear Venta'}
          </Title>
          {embedded && (
            <p className="text-sm text-white/65 mt-2">
              Carga cliente, productos y pagos en una sola vista, sin salir del listado.
            </p>
          )}
        </div>
        {embedded && onCancel && (
          <SecondaryBtn functionClick={onCancel} title="Cerrar" />
        )}
      </div>

      <DynamicForm
        key={formKey}
        storageKey={embedded ? 'draft:venta-create:embedded' : 'draft:venta-create:page'}
        columns={2}
        compact={embedded}
        inputs={inputs}
        onRequestClose={onCancel}
        onSubmit={async (values) => {
          const venta = await handleSubmit(values)
          if (venta) {
            onSaved?.(venta)
          }
        }}
        titleBtn={submitting ? 'Guardando...' : 'Guardar Venta'}
      />
    </div>
  )

  if (embedded) {
    return (
      <div
        className="w-[min(1120px,95vw)] max-h-[90vh] overflow-y-auto text-white"
      >
        <div className="p-3 sm:p-5 rounded-2xl border border-white/10 shadow-2xl bg-[#11161c]">
          {content}
        </div>
      </div>
    )
  }

  return (
    <Main
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      className="flex flex-col gap-4 text-white"
    >
      {content}
    </Main>
  )
}
