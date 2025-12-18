import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { create, getAll, getById, remove, update } from '../../api/crud'
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

  // ✅ build inputs y opcionalmente ocultar "id" en create
  const buildInputsWithValues = (item: any | null): FormInput[] => {
    return config.formInputs
      .map((def: any) => {
        const val = item ? item[def.name] : undefined

        // ✅ si es CREATE, ocultamos id (si existe en config)
        if (!item && def.name === 'id') {
          return { ...def, hidden: true } // tu DynamicForm ya soporta "hidden"
        }

        if (def.type === 'component') {
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

  // ✅ helper: limpiar payload antes de mandar
  const sanitizePayload = (values: Record<string, any>) => {
    const payload = { ...values }

    // ✅ nunca mandar id en create (igual lo sacamos por seguridad)
    delete (payload as any).id

    // ✅ codigo obligatorio y sin espacios (ajustá si querés permitir espacios)
    if (payload.codigo != null) payload.codigo = String(payload.codigo).trim()

    return payload
  }

  const createPlato = () => {
    openModal(
      <Wood className="max-h-svh overflow-y-auto text-white">
        <Title>Crear Plato</Title>
        <DynamicForm
          inputs={buildInputsWithValues(null)}
          onSubmit={async (values) => {
            try {
              const payload = sanitizePayload(values)

              if (!payload.codigo) {
                toast.error('El código es obligatorio')
                return
              }

              await create('platos', payload)
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
      const full = await getById<any>('platos', id)

      openModal(
        <Wood className="max-h-svh overflow-y-auto text-white">
          <Title>Editar {toSingular(config.title)}</Title>
          <DynamicForm
            inputs={buildInputsWithValues(full)}
            columns={config.columns}
            onSubmit={async (values) => {
              try {
                // ✅ en update NO usamos values.id; usamos el id del registro
                const payload = { ...values }
                if (payload.codigo != null) payload.codigo = String(payload.codigo).trim()
                delete (payload as any).id

                await update(config.entity, id, payload)

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
