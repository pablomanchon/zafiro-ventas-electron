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
      } & Record<string, any>>
      componentProps?: Record<string, any>
    })

export type FormInput = InputDef

interface DynamicFormProps {
  inputs: InputDef[]
  onSubmit: (formValues: Record<string, any>) => void | Promise<void>
  typeBtn?: 'primary' | 'secondary' | 'danger'
  titleBtn: string
  resetOn?: any
  /** Deshabilitar inputs mientras envía (default: true) */
  disableWhileSubmitting?: boolean
  /** Texto del botón durante el envío (default: "Guardando...") */
  submittingText?: string
}

const buildInitial = (inputs: InputDef[]) =>
  inputs.reduce((acc, input) => {
    if (input.type === 'checkbox') {
      acc[input.name] = input.value ?? false
    } else if (input.type === 'component') {
      acc[input.name] = input.value
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
  disableWhileSubmitting = true,
  submittingText = 'Guardando...',
}: DynamicFormProps) {
  const { openModal, closeModal, modalStack } = useModal()
  const openCount = modalStack.length

  const [initialValues, setInitialValues] = useState<Record<string, any>>(() =>
    buildInitial(inputs)
  )
  const [formValues, setFormValues] = useState<Record<string, any>>(() =>
    buildInitial(inputs)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  useEffect(() => {
    if (pendingOpenCloseRef.current && openCount === 0) {
      pendingOpenCloseRef.current = false
      if (isDirtyRef.current) openCloseConfirm()
      else doClose()
    }
    if (openCount === 0 && !pendingOpenCloseRef.current) {
      closeConfirmOpenRef.current = false
    }
  }, [openCount])

  // ESC global: si está enviando, ignoramos ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isSubmitting) return
      e.preventDefault()
      e.stopPropagation()

      if (closeConfirmOpenRef.current) {
        closeConfirmOpenRef.current = false
        closeModal()
        return
      }

      if (openCount > 0) {
        pendingOpenCloseRef.current = true
        closeModal()
        return
      }

      if (isDirtyRef.current) {
        openCloseConfirm()
      } else {
        doClose()
      }
    }

    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [openCount, closeModal, openModal, isSubmitting])

  const handleChange = (name: string, value: any, type?: string) => {
    if (type === 'number') value = value === '' ? '' : parseFloat(value)
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      await Promise.resolve(onSubmit(formValues))
    } finally {
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  const disabledAll = disableWhileSubmitting && isSubmitting

  // === Paraguas anti-Enter fantasma: ignora Enter durante ~150ms tras montar ===
  const openedAtRef = useRef<number>(0)
  useEffect(() => { openedAtRef.current = performance.now() }, [])
  const swallowFirstEnter = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    const dt = performance.now() - openedAtRef.current
    if (dt < 150) { // 150–200ms suele ser suficiente
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDownCapture={swallowFirstEnter} // ⬅️ bloquea Enter “que llega tarde”
      className="space-y-4 flex flex-col py-2"
    >
      {inputs.map((input, idx) => {
        const commonProps = {
          required: input.required,
          value: (formValues as any)[input.name],
          onChange: (e: any) => handleChange(input.name, e.target?.value ?? e, input.type),
          className:
            'border rounded px-2 py-1 outline-none shadow-inner shadow-black border-black disabled:opacity-60 disabled:cursor-not-allowed',
          ref:
            idx === 0 && !input.hidden && input.type !== 'component'
              ? firstInputRef
              : undefined,
          disabled: disabledAll,
        } as any

        return (
          <div key={input.name} className={`flex flex-col text-black ${input.hidden && 'hidden'}`}>
            {input.label && (
              <label className="text-sm font-semibold mb-1 text-white">{input.label}</label>
            )}

            {input.type === 'component' ? (
              <input.Component
                value={(formValues as any)[input.name]}
                onChange={val => handleChange(input.name, val, input.type)}
                disabled={disabledAll}
                {...(input.componentProps || {})}
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
                checked={!!(formValues as any)[input.name]}
                onChange={e => handleChange(input.name, e.target.checked, input.type)}
                className="h-5 w-5 outline-none shadow-inner shadow-black border-black disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={disabledAll}
              />
            ) : input.type === 'textarea' ? (
              <textarea {...commonProps} />
            ) : (
              <input {...commonProps} type={input.type} />
            )}
          </div>
        )
      })}

      {/* Botón submit (explícito) */}
      {typeBtn === 'primary' ? (
        <PrimaryButton
          type="submit"                              // ⬅️ EXPLÍCITO
          disabled={isSubmitting}                    // ⬅️ corregido el typo
          functionClick={undefined}
          title={isSubmitting ? submittingText : titleBtn}
        />
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? submittingText : titleBtn}
        </button>
      )}
    </form>
  )
}
