// src/hooks/useCrud.ts
import { useState, useEffect } from 'react'
import DynamicForm from '../layout/DynamicForm'
import type { FormInput } from '../layout/DynamicForm'
import { getAll, create, update, remove } from '../api/crud'
import { useModal } from '../providers/ModalProvider'
import Confirmation from '../layout/Confirmation'
import { toast } from 'sonner'

/**
 * Hook genérico para operaciones CRUD con modal de formulario.
 */
export function useCrud<T extends { id: number | string }>(
  entity: string,
  formInputs: FormInput[]
) {
  const [items, setItems] = useState<T[]>([])
  const [selected, setSelected] = useState<number | string | null>(null)
  const [editing, setEditing] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const { openModal, closeModal } = useModal()

  const fetchItems = async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await getAll<T>(entity)
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // carga inicial y cuando cambia la entidad
  useEffect(() => {
    fetchItems()
  }, [entity])

  // recarga cuando otra ventana publique un cambio para esta entidad
  useEffect(() => {
    const channel = new BroadcastChannel('crud-refresh')
    channel.onmessage = (ev: any) => {
      if (ev.data?.entity === entity) {
        fetchItems()
      }
    }
    return () => {
      channel.close()
    }
  }, [entity])

  const showForm = (item: T | null = null): void => {
    setEditing(item)
    const inputsWithValues = formInputs.map(def => ({
      ...def,
      value: item ? (item as any)[def.name] ?? '' : undefined,
    }))
    openModal(
      <DynamicForm
        inputs={inputsWithValues}
        onSubmit={async values => {
          if (editing) await update(entity, editing.id, values)
          else await create(entity, values)
          fetchItems()
          closeModal()
        }}
        titleBtn={editing ? 'Actualizar' : 'Crear'}
      />
    )
  }

  const handleDelete = (message = '¡Eliminado con éxito!', confirmMessage = '¿Eliminar este registro?'): void => {
    if (selected == null) return
    openModal(
      <Confirmation
        mensaje={confirmMessage}
        onConfirm={async () => {
          await remove(entity, selected)
          setSelected(null)
          fetchItems()
          toast.success(message)
        }}
      />
    )
  }

  return { items, selected, setSelected, showForm, handleDelete, fetchItems, loading }
}

