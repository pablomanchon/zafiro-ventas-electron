// src/pages/CrudFormPage.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAll, create, update } from '../api/crud'
import { crudConfigs } from '../entities'
import type { CrudConfig } from '../entities/CrudConfig'
import type { FormInput } from '../layout/DynamicForm'
import DynamicForm from '../layout/DynamicForm'
import Title from '../layout/Title'
import Main from '../layout/Main'

export default function CrudFormPage<T extends { id: number }>() {
  const { entity, mode, id } = useParams<{
    entity: string
    mode: 'create' | 'edit'
    id?: string
  }>()

  const config = crudConfigs[entity!] as CrudConfig
  const inputs = config.formInputs as FormInput[]
  const [initialValues, setInitialValues] = useState<Record<string, any>>({})

  // si es modo edit, cargar datos
  useEffect(() => {
    if (mode === 'edit' && id) {
      getAll<T>(entity!).then(all => {
        const item = all.find(i => i.id === Number(id))
        setInitialValues(item ?? {})
      })
    }
  }, [mode, id, entity])

  const inputsWithValues: FormInput[] = inputs.map(def => ({
    ...def,
    value: mode === 'edit' ? (initialValues as any)[def.name] ?? '' : undefined,
  }))

  const handleSubmit = async (values: Record<string, any>) => {
    if (mode === 'edit' && id) {
      await update(entity!, Number(id), values)
    } else {
      await create(entity!, values)
    }
    // notificar a la ventana principal que recargue
    const channel = new BroadcastChannel('crud-refresh')
    channel.postMessage({ entity })
    channel.close()
    // cerrar esta ventana
    window.close()
  }

  return (
    <Main className="text-white p-1">
        <Title className='pb-2'>
          {mode === 'edit' ? 'Editar' : 'Crear'} {config.title}
        </Title>
        <DynamicForm
          inputs={inputsWithValues}
          onSubmit={handleSubmit}
          titleBtn={mode === 'edit' ? 'Actualizar' : 'Crear'}
        />
    </Main>
  )
}
