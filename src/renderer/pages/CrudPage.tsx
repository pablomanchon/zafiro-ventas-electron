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

export default function CrudPage<T extends { id: number }>({
  config,
  color
}: {
  config: CrudConfig
  color?: string
}) {
  const { entity, title, columns, formInputs, searchFields } = config
  const { items, selected, setSelected, handleDelete } = useCrud<T>(entity, formInputs)

  const scopeRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scopeRef.current
    if (!root) return

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      // Evitá que cualquier control tome foco al click
      if (t.closest('a,button,[role="button"],input,select,textarea')) {
        e.preventDefault()
        root.focus()
      }
    }

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      if (t !== root) {
        t.blur?.()
        root.focus()
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      // Si por foco residual hay un link/botón activo, evitá que Enter/Espacio lo clickée
      if ((e.key === 'Enter' || e.key === ' ') && t.closest('a,button,[role="button"]')) {
        e.preventDefault()
        e.stopPropagation() // ← clave para que la tabla no lo reciba duplicado
      }
      // 👇 IMPORTANTE: NO abrir acá la edición.
      // Dejá que TableAndSearch maneje Enter y llame a onDobleClickFila una sola vez.
    }

    root.addEventListener('mousedown', onMouseDown, true)
    root.addEventListener('focusin', onFocusIn, true)
    root.addEventListener('keydown', onKeyDown, true)
    return () => {
      root.removeEventListener('mousedown', onMouseDown, true)
      root.removeEventListener('focusin', onFocusIn, true)
      root.removeEventListener('keydown', onKeyDown, true)
    }
  }, [])

  return (
    <Main className={`flex flex-col h-screen p-2 w-full mt-8 md:mt-auto ${color ?? ''}`}>
      <div
        ref={scopeRef}
        tabIndex={0}
        className="flex flex-col h-full outline-none focus:outline-none"
      >
        <Title>{title}</Title>

        {/* Tabla y búsqueda */}
        <div ref={tableRef} tabIndex={-1} className="flex-1 overflow-auto">
          <TableAndSearch
            datos={items}
            encabezados={columns}
            searchFilters={searchFields}
            onFilaSeleccionada={setSelected}
            onDobleClickFila={rowId => window.open(`#/crud/${entity}/edit/${rowId}`, '_blank')}
          />
        </div>

        {/* Barra de acciones */}
        <Steel className="flex gap-2 items-center mt-auto bg-gray-800 p-2">
          {/* Crear en nueva ventana (sin tomar foco) */}
          <a
            href={`#/crud/${entity}/create`}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}               // evita foco
            onClick={(e) => {
              // usar click manual y devolver foco a la tabla
              // (opcional; si preferís, dejá que el href abra)
              e.preventDefault()
              window.open(`#/crud/${entity}/create`, '_blank')
              requestAnimationFrame(() => tableRef.current?.focus())
            }}
          >
            <PrimaryButton title="Crear" functionClick={() => { }} />
          </a>

          {selected != null && (
            <>
              <a
                href={`#/crud/${entity}/edit/${selected}`}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault()
                  window.open(`#/crud/${entity}/edit/${selected}`, '_blank')
                  requestAnimationFrame(() => tableRef.current?.focus())
                }}
              >
                <SecondaryButton title="Modificar" functionClick={() => { }} />
              </a>

              <span tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
                <DangerButton title="Eliminar" functionClick={handleDelete} />
              </span>
            </>
          )}
        </Steel>
      </div>
    </Main>
  )
}
