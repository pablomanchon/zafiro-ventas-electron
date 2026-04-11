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

type PlatoFormValues = Record<string, any>

function normalizeNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function validatePlatoPayload(payload: PlatoFormValues) {
  if (!String(payload.codigo ?? '').trim()) {
    throw new Error('El codigo es obligatorio')
  }

  if (!String(payload.nombre ?? '').trim()) {
    throw new Error('El nombre es obligatorio')
  }

  const ingredientes = Array.isArray(payload.ingredientes) ? payload.ingredientes : []
  if (ingredientes.length === 0) {
    throw new Error('Debes cargar al menos un ingrediente')
  }

  for (const ingrediente of ingredientes) {
    if (!ingrediente?.ingredienteId) {
      throw new Error('Todos los ingredientes deben tener un item seleccionado')
    }
    if (normalizeNumber(ingrediente.cantidadUsada) <= 0) {
      throw new Error('La cantidad usada de cada ingrediente debe ser mayor a 0')
    }
  }

  const subplatos = Array.isArray(payload.subplatos) ? payload.subplatos : []
  for (const subplato of subplatos) {
    if (!subplato?.platoHijoId) {
      throw new Error('Todos los subplatos deben tener un item seleccionado')
    }
    if (normalizeNumber(subplato.cantidadUsada) <= 0) {
      throw new Error('La cantidad usada de cada subplato debe ser mayor a 0')
    }
  }
}

export default function usePlato() {
  const [platos, setPlatos] = useState<CreatePlatoDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { openModal, closeModal } = useModal()

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getAll('platos')
      setError(null)
      setPlatos(data as CreatePlatoDto[])
    } catch (e) {
      const message = String(e)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const buildInputsWithValues = (item: any | null): FormInput[] => {
    return config.formInputs.map((def: any) => {
      const val = item ? item[def.name] : undefined

      if (!item && def.name === 'id') {
        return { ...def, hidden: true }
      }

      if (def.type === 'component') {
        return {
          ...def,
          value: item ? val ?? def.value ?? [] : def.value ?? [],
        }
      }

      return {
        ...def,
        value: item ? val ?? '' : undefined,
      }
    })
  }

  const sanitizePayload = (values: PlatoFormValues) => {
    const payload = { ...values }

    delete payload.id

    if (payload.codigo != null) payload.codigo = String(payload.codigo).trim()
    if (payload.nombre != null) payload.nombre = String(payload.nombre).trim()
    if (payload.descripcion != null) payload.descripcion = String(payload.descripcion).trim()

    payload.precio = normalizeNumber(payload.precio)
    payload.stock = Math.max(0, Math.trunc(normalizeNumber(payload.stock)))

    payload.ingredientes = (Array.isArray(payload.ingredientes) ? payload.ingredientes : [])
      .map((item: any) => ({
        ingredienteId: String(item.ingredienteId ?? ''),
        cantidadUsada: normalizeNumber(item.cantidadUsada),
      }))
      .filter((item: any) => item.ingredienteId)

    payload.subplatos = (Array.isArray(payload.subplatos) ? payload.subplatos : [])
      .map((item: any) => ({
        platoHijoId: String(item.platoHijoId ?? ''),
        cantidadUsada: normalizeNumber(item.cantidadUsada),
      }))
      .filter((item: any) => item.platoHijoId)

    validatePlatoPayload(payload)

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
              await create('platos', payload)
              closeModal()
              toast.success('Plato creado con exito')
              fetchData()
            } catch (e) {
              toast.error(String(e))
            }
          }}
          titleBtn="Crear Plato"
        />
      </Wood>
    )
  }

  const modifyPlato = async (id: string | number) => {
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
                const payload = sanitizePayload(values)
                await update(config.entity, id, payload)
                toast.success(`${toSingular(config.title)} actualizado con exito`)
                closeModal()
                fetchData()
              } catch (e) {
                toast.error(String(e))
              }
            }}
            titleBtn="Guardar cambios"
          />
        </Wood>
      )
    } catch (e) {
      toast.error('No se pudo cargar el plato para editar')
      console.error(e)
    }
  }

  const deletePlato = async (id: string | number) => {
    openModal(
      <Confirmation
        mensaje="¿Eliminar registro?"
        onConfirm={async () => {
          try {
            await remove(config.entity, id)
            toast.success('Plato eliminado con exito')
            closeModal()
            fetchData()
          } catch (e) {
            toast.error(String(e))
          }
        }}
      />
    )
  }

  return { platos, loading, error, createPlato, modifyPlato, deletePlato }
}
