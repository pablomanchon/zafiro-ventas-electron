// src/layout/DynamicForm.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import PrimaryButton from '../components/PrimaryButton'
import { useModal } from '../providers/ModalProvider'
import Confirmation from './Confirmation'

interface InputDefBase {
  name: string
  label?: string
  required?: boolean
  value?: any
  hidden?: boolean
}

type InputDef =
  | (InputDefBase & {
      type:
        | 'text'
        | 'number'
        | 'email'
        | 'date'
        | 'password'
        | 'checkbox'
        | 'select'
        | 'textarea'
      options?: { label: string; value: string }[]
    })
  | (InputDefBase & {
      type: 'component'
      Component: React.ComponentType<{
        value: any
        onChange: (value: any) => void
      }>
    })

export type FormInput = InputDef

interface DynamicFormProps {
  inputs: InputDef[]
  onSubmit: (formValues: Record<string, any>) => void | Promise<void>
  typeBtn?: 'primary' | 'secondary' | 'danger'
  titleBtn: string
  /** Opcional: si querés resetear desde el padre, cambiá este valor */
  resetOn?: any
}

const buildInitial = (inputs: InputDef[]) =>
  inputs.reduce((acc, input) => {
    if (input.type === 'checkbox') {
      acc[input.name] = input.value ?? false
    } else if (input.type === 'component') {
      acc[input.name] = input.value // puede ser undefined y está OK
    } else {
      acc[input.name] = input.value ?? ''
    }
    return acc
  }, {} as Record<string, any>)

export default function DynamicForm({
  inputs,
  onSubmit,
  typeBtn = 'primary',
  titleBtn = 'Button',
  resetOn,
}: DynamicFormProps) {
  // 👇 Usamos modalStack para saber si hay modales abiertos
  const { openModal, closeModal, modalStack } = useModal()
  const openCount = modalStack.length

  const [initialValues, setInitialValues] = useState<Record<string, any>>(() =>
    buildInitial(inputs)
  )
  const [formValues, setFormValues] = useState<Record<string, any>>(() =>
    buildInitial(inputs)
  )

  // Reset controlado desde el padre
  useEffect(() => {
    if (resetOn === undefined) return
    const initial = buildInitial(inputs)
    setInitialValues(initial)
    setFormValues(initial)
  }, [resetOn, inputs])

  // Focus al primer input visible
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [inputs])

  // Dirty check
  const isDirty = useMemo(() => {
    const keys = Object.keys({ ...initialValues, ...formValues })
    return keys.some(k => JSON.stringify(formValues[k]) !== JSON.stringify(initialValues[k]))
  }, [formValues, initialValues])

  const isDirtyRef = useRef(false)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  const doClose = () => window.close()

  // ====== Control del modal de “Cerrar” + encadenado con otros modales ======
  const closeConfirmOpenRef = useRef(false)
  const pendingOpenCloseRef = useRef(false)

  // Wrapper para resetear flag cuando nuestro modal se desmonte
  function CloseConfirmWrapper({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      return () => { closeConfirmOpenRef.current = false }
    }, [])
    return <>{children}</>
  }

  const openCloseConfirm = () => {
    if (closeConfirmOpenRef.current) return
    closeConfirmOpenRef.current = true
    openModal(
      <CloseConfirmWrapper>
        <Confirmation
          mensaje="Hay cambios sin guardar. ¿Seguro que querés salir?"
          onConfirm={doClose}
        />
      </CloseConfirmWrapper>
    )
  }

  // Cuando se cierran otros modales y la pila queda vacía, accionamos
  useEffect(() => {
    if (pendingOpenCloseRef.current && openCount === 0) {
      pendingOpenCloseRef.current = false
      if (isDirtyRef.current) openCloseConfirm()
      else doClose()
    }
    if (openCount === 0 && !pendingOpenCloseRef.current) {
      // aseguro flag en falso si no hay modales
      closeConfirmOpenRef.current = false
    }
  }, [openCount])

  // ESC global con la secuencia pedida
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()

      // Si nuestro modal de “Cerrar” está abierto, lo cierro y no hago más
      if (closeConfirmOpenRef.current) {
        closeConfirmOpenRef.current = false
        closeModal()
        return
      }

      // Si hay cualquier otro modal abierto, lo cierro primero y encadeno
      if (openCount > 0) {
        pendingOpenCloseRef.current = true
        closeModal()
        return
      }

      // Sin modales abiertos: confirmo cierre si hay cambios; si no, cierro directo
      if (isDirtyRef.current) {
        openCloseConfirm()
      } else {
        doClose()
      }
    }

    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [openCount, closeModal, openModal])

  const handleChange = (name: string, value: any, type?: string) => {
    if (type === 'number') value = value === '' ? '' : parseFloat(value)
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formValues)
  }

  return (
    <form  onSubmit={handleSubmit} className="space-y-4 flex flex-col py-2">
      {inputs.map((input, idx) => {
        const commonProps = {
          required: input.required,
          value: formValues[input.name],
          onChange: (e: any) => handleChange(input.name, e.target?.value ?? e, input.type),
          className:
            'border rounded px-2 py-1 outline-none shadow-inner shadow-black border-black',
          ref:
            idx === 0 && !input.hidden && input.type !== 'component'
              ? firstInputRef
              : undefined,
        } as any

        return (
          <div key={input.name} className={`flex flex-col text-black ${input.hidden && 'hidden'}`}>
            {input.label && (
              <label className="text-sm font-semibold mb-1 text-white">{input.label}</label>
            )}

            {input.type === 'component' ? (
              <input.Component
                value={formValues[input.name]}
                onChange={val => handleChange(input.name, val, input.type)}
              />
            ) : input.type === 'select' ? (
              <select {...commonProps}>
                {input.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : input.type === 'checkbox' ? (
              <input
                required={input.required}
                type="checkbox"
                checked={!!formValues[input.name]}
                onChange={e => handleChange(input.name, e.target.checked, input.type)}
                className="h-5 w-5 outline-none shadow-inner shadow-black border-black"
              />
            ) : input.type === 'textarea' ? (
              <textarea {...commonProps} />
            ) : (
              <input {...commonProps} type={input.type} />
            )}
          </div>
        )
      })}

      {typeBtn === 'primary' ? (
        <PrimaryButton functionClick={null} title={titleBtn} />
      ) : (
        <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white">
          {titleBtn}
        </button>
      )}
    </form>
  )
}
