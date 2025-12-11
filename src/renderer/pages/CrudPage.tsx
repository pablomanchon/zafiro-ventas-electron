// src/pages/CrudPage.tsx
/// <reference lib="dom" />
import { useEffect, useRef } from 'react'
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
import { toSingular } from '../utils/utils'
import { toast } from 'react-toastify'

function isEditableTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null
  if (!t) return false
  if (t.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return true
  // @ts-ignore — algunas libs marcan editable por API
  if ((t as any).isContentEditable) return true
  return false
}

export default function CrudPage<T extends { id: number | string }>({
  config,
  color
}: {
  config: CrudConfig
  color?: string
}) {
  const { entity, title, columns, formInputs, searchFields } = config
  const { items, selected, setSelected, handleDelete, fetchItems } = useCrud<T>(entity, formInputs)
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
        <Steel className='text-white w-96'>
          <Title>Crear {toSingular(config.title)}</Title>
          <DynamicForm
            inputs={config.formInputs}
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
        <Steel className='text-white w-96'>
          <Title>Editar {toSingular(config.title)}</Title>
          <DynamicForm
            inputs={inputsWithValues}
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
    <Main className={`flex flex-col h-screen w-full mt-8 md:mt-auto bg-stone-800 ${color ?? ''}`}>
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
            onDobleClickFila={(rowId) => openEditModal(rowId)} // editar en modal
          />
        </div>

        {/* Barra de acciones */}
        <Steel className="flex gap-2 items-center mt-auto bg-gray-800 p-2">
          <PrimaryButton
            title="Crear"
            functionClick={openCreateModal}
          />

          {selected != null && (
            <>
              <span
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
              >
                <SecondaryButton title="Modificar" functionClick={() => openEditModal(selected)} />
              </span>

              <span tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
                <DangerButton title="Eliminar" functionClick={()=>{handleDelete(`${toSingular(config.title)} eliminado con éxito!`)}} />
              </span>
            </>
          )}
        </Steel>
      </div>
    </Main>
  )
}
