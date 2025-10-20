// src/pages/CrudFormPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { create, update, getById } from '../api/crud'
import { crudConfigs } from '../entities'
import type { CrudConfig } from '../entities/CrudConfig'
import type { FormInput } from '../layout/DynamicForm'
import DynamicForm from '../layout/DynamicForm'
import Title from '../layout/Title'
import Main from '../layout/Main'
import { useModal } from '../providers/ModalProvider'
import Confirmation from '../layout/Confirmation'
import bgUrl from '../../../public/fondo-w.png'
import { toSingular } from '../utils'

export default function CrudFormPage<T extends { id: number }>() {
  const { entity, mode, id } = useParams<{
    entity: string
    mode: 'create' | 'edit'
    id?: string
  }>()
  const { openModal, closeModal } = useModal()

  const config = crudConfigs[entity!] as CrudConfig
  const inputs = config.formInputs as FormInput[]

  const [initialValues, setInitialValues] = useState<Record<string, any>>({})
  const [ready, setReady] = useState(mode !== 'edit') // si es create, está listo; si es edit, esperamos fetch

  // si es modo edit, cargar datos
  useEffect(() => {
    let mounted = true
    if (mode === 'edit' && id) {
      setReady(false)
      getById<T>(entity!, id)
        .then(res => {
          if (!mounted) return
          setInitialValues(res as unknown as Record<string, any>)
          setReady(true)
        })
        .catch(() => setReady(true)) // aunque falle, permitimos editar vacío
    }
    return () => { mounted = false }
  }, [mode, id, entity])

  // 🧠 Memo: sólo cambia cuando cambian inputs base, el modo o los valores cargados
  const inputsWithValues: FormInput[] = useMemo(() => {
    return inputs.map(def => ({
      ...def,
      // en edit, llena con el valor del registro; en create, deja el value original (si lo hay)
      value: mode === 'edit'
        ? (initialValues as any)[def.name] ?? def.value
        : def.value,
    }))
  }, [inputs, mode, initialValues])

  // compara sólo las claves que vienen del formulario (values)
  const hasChanges = (values: Record<string, any>) => {
    for (const k of Object.keys(values)) {
      const a = values[k]
      const b = (initialValues as any)?.[k]
      if (JSON.stringify(a) !== JSON.stringify(b)) return true
    }
    return false
  }

  const performSubmit = async (values: Record<string, any>) => {
    if (mode === 'edit' && id) {
      await update(entity!, id, values)
    } else {
      await create(entity!, values)
    }
    const channel = new BroadcastChannel('crud-refresh')
    channel.postMessage({ entity })
    channel.close()
    window.close()
  }

  const handleSubmit = (values: Record<string, any>) => {
    // Sólo confirmamos si es edición y hubo cambios
    if (mode === 'edit' && hasChanges(values)) {
      const nombre =
        (entity === 'productos' && (initialValues as any)?.nombre)
          ? ` "${(initialValues as any).nombre}"`
          : ''
      const msg = `Vas a actualizar${nombre}. ¿Confirmás?`
      openModal(
        <Confirmation
          mensaje={msg}
          onConfirm={async () => {
            await performSubmit(values)
            closeModal()
          }}
        />
      )
      return
    }
    // Crear o editar sin cambios: envía directo
    void performSubmit(values)
  }

  return (
    <Main style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className="text-white rounded-md h-screen">
      <div className='bg-stone-900 bg-opacity-50 h-full rounded p-2 shadow-inner shadow-black'>
        <Title className='pb-2'>
          {mode === 'edit' ? 'Editar' : 'Crear'} {toSingular(config.title)}
        </Title>

        {mode === 'edit' && !ready ? (
          <div className="p-4 text-white/80">Cargando...</div>
        ) : (
          <DynamicForm
            resetOn={mode === 'edit' ? id : undefined}
            inputs={inputsWithValues}
            onSubmit={handleSubmit}
            titleBtn={mode === 'edit' ? 'Actualizar' : 'Crear'}
          />
        )}
      </div>
    </Main>
  )
}
