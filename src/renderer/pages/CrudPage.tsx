// src/pages/CrudPage.tsx
/// <reference lib="dom" />
import { useEffect, useRef, type ReactNode } from 'react'
import { useCrud } from '../hooks/useCrud'
import TableAndSearch from '../components/TableAndSearch'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import DangerButton from '../components/DangerButton'
import Title from '../layout/Title'
import Steel from '../layout/Steel'
import Main from '../layout/Main'
import type { CrudConfig } from '../entities/CrudConfig'
import { useModal } from '../providers/ModalProvider'
import DynamicForm from '../layout/DynamicForm'
import { create, update } from '../api/crud'
import { toSingular, formatCurrencyARS } from '../utils/utils'
import { toast } from 'sonner'

function isEditableTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null
  if (!t) return false
  if (t.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return true
  // @ts-ignore — algunas libs marcan editable por API
  if ((t as any).isContentEditable) return true
  return false
}

function isLowStockProduct(item: Record<string, any>) {
  const stock = Number(item.stock ?? 0)
  const stockMinimo = Number(item.stock_minimo ?? item.stockMinimo ?? 0)
  return stockMinimo > 0 && stock <= stockMinimo
}

export default function CrudPage<T extends { id: number | string }>({
  config,
  color,
  cols = 1,
  renderSelectedActions,
}: {
  config: CrudConfig
  color?: string
  cols?: 1 | 2 | 3 | 4 | undefined
  renderSelectedActions?: (context: {
    selected: number | string
    selectedItem: T
    disabled: boolean
    refresh: () => void
  }) => ReactNode
}) {
  const { entity, title, columns, formInputs, searchFields, isProtected } = config
  const { items, selected, setSelected, handleDelete, fetchItems, loading } = useCrud<T>(entity, formInputs)

  const renderMobileItem = (item: T) => {
    const colsLC = columns.map((c: string) => c.toLowerCase())
    const primaryCol = colsLC.find((c: string) => c === 'nombre')
      ?? colsLC.find((c: string) => c !== 'id' && c !== 'descripcion' && c !== 'deleted')
      ?? colsLC[0]
    const secondaryCols = colsLC
      .filter((c: string) => c !== primaryCol && c !== 'id' && c !== 'descripcion' && c !== 'deleted')
      .slice(0, 2)
    const get = (key: string) => (item as any)[key] ?? (item as any)[key.toLowerCase()] ?? ''
    const isPriceField = (key: string) => key === 'precio' || key.includes('total') || key.includes('monto')
    const isStarsField = (key: string) => key.toLowerCase() === 'estrellas'
    const starsLabel = (n: number) => n === 0 ? '—' : '★'.repeat(n) + '☆'.repeat(5 - n)
    const lowStock = entity === 'productos' && isLowStockProduct(item as any)

    return (
      <div className={[
        'rounded-xl border p-2.5 text-white shadow shadow-black/40 active:bg-white/5 h-full flex flex-col gap-1',
        lowStock ? 'border-yellow-500/60 bg-yellow-900/30' : 'border-white/15 bg-slate-950/75',
      ].join(' ')}>
        <p className="text-[10px] text-white/35 leading-none">#{get('id')}</p>
        <p className="font-semibold text-sm leading-snug line-clamp-2">{get(primaryCol) || '—'}</p>
        {secondaryCols.map((col: string) => (
          <p key={col} className="text-xs mt-auto">
            {isStarsField(col) ? (
              <span style={{ color: '#facc15' }} className="tracking-wide">{starsLabel(Number(get(col)))}</span>
            ) : (
              <span className="text-white/55">
                <span className="text-white/30 capitalize">{col}: </span>
                {isPriceField(col) ? formatCurrencyARS(Number(get(col))) : String(get(col) || '—')}
              </span>
            )}
          </p>
        ))}
      </div>
    )
  }

  const selectedItem = selected != null ? items.find(i => i.id === selected) : null
  const selectedIsProtected = selectedItem != null && isProtected ? isProtected(selectedItem as any) : false
  const { openModal, closeModal, isModalOpen } = useModal()

  const scopeRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // Congelar tabla cuando hay modal abierto (bloquea foco y eventos)
  useEffect(() => {
    const el = tableRef.current
    if (!el) return
    // @ts-ignore — inert existe pero TS no lo tipa aún en todos los targets
    el.inert = isModalOpen
    return () => {
      // @ts-ignore
      el.inert = false
    }
  }, [isModalOpen])

  useEffect(() => {
    const root = scopeRef.current
    const table = tableRef.current
    if (!root || !table) return

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      // Permití comportamiento normal en inputs/selects/textarea
      // Evitá sólo clicks accidentales en links/botones cuando usás navegación con teclado
      if (t.closest('a,button,[role="button"]')) {
        e.preventDefault()
      }
    }

    const onKeyDownTable = (e: KeyboardEvent) => {
      // Si hay modal abierto o el foco está en un control editable (ej. buscador), no hacer nada
      if (isModalOpen || isEditableTarget(e.target)) return

      const t = e.target as HTMLElement
      if (!table.contains(t)) return

      // Si el foco quedó en un botón/link dentro de la tabla, bloqueá Enter/Espacio “click”
      if ((e.key === 'Enter' || e.key === ' ') && t.closest('a,button,[role="button"]')) {
        e.preventDefault()
        e.stopPropagation()
      }

      // ⬇️ Tus atajos de tabla (flechas, suprimir, etc.) irían acá si los tenés
    }

    root.addEventListener('mousedown', onMouseDown, true)
    table.addEventListener('keydown', onKeyDownTable, true)
    return () => {
      root.removeEventListener('mousedown', onMouseDown, true)
      table.removeEventListener('keydown', onKeyDownTable, true)
    }
  }, [isModalOpen])

  const openCreateModal = () => {
    openModal(
      <div tabIndex={-1} onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}>
        <Steel className='text-white max-h-[90vh] overflow-y-auto w-[min(96vw,900px)]'>
          <Title>Crear {toSingular(config.title)}</Title>
          <DynamicForm
            storageKey={`draft:crud-modal:${config.entity}:create`}
            inputs={config.formInputs}
            columns={cols}
            onSubmit={async (values) => {
              try {
                await create(config.entity, values)
                toast.success(`${toSingular(config.title)} creado con éxito`)
                closeModal()
                fetchItems()
                requestAnimationFrame(() => tableRef.current?.focus())
              } catch (error) {
                toast.error(String(error))
              }
            }}
            titleBtn={`Crear ${toSingular(config.title)}`}
          />
        </Steel>
      </div>
    )
  }

  const openEditModal = (rowId: number | string) => {
    const current = items.find(i => i.id === rowId)
    if (!current) return

    const inputsWithValues = formInputs.map(input => ({
      ...input,
      value: (current as any)[input.name] ?? input.value
    }))

    openModal(
      <div tabIndex={-1} onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}>
        <Steel className='text-white max-h-[90vh] overflow-y-auto w-[min(96vw,900px)]'>
          <Title>Editar {toSingular(config.title)}</Title>
          <DynamicForm
            storageKey={`draft:crud-modal:${config.entity}:edit:${rowId}`}
            inputs={inputsWithValues}
            columns={cols}
            onSubmit={async (values) => {
              try {
                await update(config.entity, rowId, values)
                toast.success(`${toSingular(config.title)} actualizado con éxito`)
                closeModal()
                fetchItems()
                requestAnimationFrame(() => tableRef.current?.focus())
              } catch (error) {
                toast.error(String(error))
              }
            }}
            titleBtn="Guardar cambios"
          />
        </Steel>
      </div>
    )
  }

  return (
    <Main className={`flex flex-col min-h-0 w-full bg-stone-800 p-3 sm:p-4 ${color ?? ''}`}>
      <div
        ref={scopeRef}
        tabIndex={-1} // no queremos que el root reciba foco
        className="flex flex-col h-full focus:outline-none focus-visible:outline-none"
      >
        <Title>{title}</Title>

        {/* Tabla y búsqueda */}
        <div
          ref={tableRef}
          tabIndex={0} // contenedor navegable si usás atajos
          className="flex-1 overflow-auto focus:outline-none focus-visible:outline-none"
        >
          <TableAndSearch
            datos={items}
            encabezados={columns}
            searchFilters={searchFields}
            onFilaSeleccionada={setSelected}
            onDobleClickFila={(rowId) => {
              const item = items.find(i => i.id === rowId)
              if (item && isProtected?.(item as any)) return
              openEditModal(rowId)
            }}
            renderMobileItem={renderMobileItem}
            onMobileItemClick={setSelected}
            mobileColumns={2}
            selectedId={selected}
            loading={loading}
            loadingTitle={`Cargando ${title.toLowerCase()}`}
            rowClassName={
              entity === 'productos'
                ? (item) =>
                    isLowStockProduct(item as Record<string, any>)
                      ? 'bg-yellow-600 text-gray-950 font-semibold hover:bg-yellow-500'
                      : ''
                : undefined
            }
          />
        </div>

        {/* Barra de acciones */}
        <Steel className="flex flex-row gap-1 items-stretch mt-auto bg-gray-800 p-1.5 sm:p-2 sticky bottom-0 z-10">
          <PrimaryButton
            className="flex-1 whitespace-nowrap !p-1.5 text-xs sm:flex-none sm:w-auto sm:!p-2 sm:text-base"
            title="Crear"
            functionClick={openCreateModal}
          />

          {selected != null && (
            <>
              <div
                className="flex-1 min-w-0 sm:flex-none sm:w-auto"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
              >
                <SecondaryButton
                  className="w-full whitespace-nowrap !p-1.5 text-xs sm:!p-2 sm:text-base"
                  title="Modificar"
                  disabled={selectedIsProtected}
                  functionClick={() => openEditModal(selected)}
                />
              </div>

              <div className="flex-1 min-w-0 sm:flex-none sm:w-auto" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
                <DangerButton
                  className="w-full whitespace-nowrap !p-1.5 text-xs sm:!p-2 sm:text-base"
                  title="Eliminar"
                  disabled={selectedIsProtected}
                  functionClick={() => {
                    const nombre = (selectedItem as any)?.nombre ?? (selectedItem as any)?.name ?? null
                    const entidad = toSingular(config.title).toLowerCase()
                    const confirmMsg = nombre
                      ? `¿Eliminar ${entidad} "${nombre}"? Esta acción no se puede deshacer.`
                      : `¿Eliminar este ${entidad}? Esta acción no se puede deshacer.`
                    handleDelete(`${toSingular(config.title)} eliminado con éxito.`, confirmMsg)
                  }}
                />
              </div>

              {selectedItem && renderSelectedActions?.({
                selected,
                selectedItem,
                disabled: selectedIsProtected,
                refresh: fetchItems,
              })}
            </>
          )}
        </Steel>
      </div>
    </Main>
  )
}

