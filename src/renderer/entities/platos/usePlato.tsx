import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { create, getAll, getById, remove, update } from '../../api/crud' // <-- getById
import type { CreatePlatoDto } from './types'
import Wood from '../../layout/Steel'
import Title from '../../layout/Title'
import DynamicForm from '../../layout/DynamicForm'
import config from './config'
import { useModal } from '../../providers/ModalProvider'
import { toSingular } from '../../utils/utils'
import Confirmation from '../../layout/Confirmation'
import type { FormInput } from '../../layout/DynamicForm'

export default function usePlato() {
  const [platos, setPlatos] = useState<CreatePlatoDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { openModal, closeModal } = useModal()

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getAll('platos')
      setError(false)
      setPlatos(data as CreatePlatoDto[])
    } catch (e) {
      setError(true)
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const buildInputsWithValues = (item: any | null): FormInput[] => {
    return config.formInputs.map(def => {
      const val = item ? item[def.name] : undefined

      if (def.type === 'component') {
        // para componentes, si no viene valor usá el default del config (ej: [])
        return {
          ...def,
          value: item ? (val ?? def.value ?? []) : (def.value ?? []),
        }
      }

      return {
        ...def,
        value: item ? (val ?? '') : undefined,
      }
    })
  }

  const createPlato = () => {
    openModal(
      <Wood className="max-h-svh overflow-y-auto text-white">
        <Title>Crear Plato</Title>
        <DynamicForm
          inputs={buildInputsWithValues(null)}
          onSubmit={async values => {
            try {
              await create('platos', values)
              closeModal()
              toast.success('¡Plato creado con éxito!')
              fetchData()
            } catch (e) {
              toast.error(String(e))
            }
          }}
          titleBtn="Crear Plato"
        />
      </Wood>,
    )
  }

  const modifyPlato = async (id: string) => {
    try {
      // ✅ Traer el plato completo con relaciones
      const full = await getById<any>('platos', id)

      openModal(
        <Wood className="max-h-svh overflow-y-auto text-white">
          <Title>Editar {toSingular(config.title)}</Title>
          <DynamicForm
            inputs={buildInputsWithValues(full)}
            columns={config.columns}
            onSubmit={async values => {
              try {
                await update(config.entity, id, values)
                toast.success(`${toSingular(config.title)} actualizado con éxito`)
                closeModal()
                fetchData()
              } catch (e) {
                toast.error(String(e))
              }
            }}
            titleBtn="Guardar cambios"
          />
        </Wood>,
      )
    } catch (e) {
      toast.error('No se pudo cargar el plato para editar')
      console.error(e)
    }
  }

  const deletePlato = async (id: string) => {
    openModal(
      <Confirmation
        mensaje="¿Eliminar registro?"
        onConfirm={async () => {
          try {
            await remove(config.entity, id)
            toast.success('Plato eliminado con éxito!')
            closeModal()
            fetchData()
          } catch (e) {
            toast.error(String(e))
          }
        }}
      />,
    )
  }

  return { platos, loading, error, createPlato, modifyPlato, deletePlato }
}
