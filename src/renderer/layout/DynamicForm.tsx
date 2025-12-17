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
  colSpan?: number
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
      Component: React.ComponentType<
        { value: any; onChange: (value: any) => void } & Record<string, any>
      >
      componentProps?: Record<string, any>
    })

export type FormInput = InputDef

interface DynamicFormProps {
  inputs: InputDef[]
  onSubmit: (formValues: Record<string, any>) => void | Promise<void>
  typeBtn?: 'primary' | 'secondary' | 'danger'
  titleBtn: string
  resetOn?: any
  disableWhileSubmitting?: boolean
  submittingText?: string
  columns?: 1 | 2 | 3 | 4
  compact?: boolean
}

/* =======================
   Build initial values
   Numbers se guardan como STRING
======================= */
const buildInitial = (inputs: InputDef[]) =>
  inputs.reduce((acc, input) => {
    if (input.type === 'checkbox') {
      acc[input.name] = input.value ?? false
    } else if (input.type === 'component') {
      acc[input.name] = input.value
    } else if (input.type === 'number') {
      acc[input.name] =
        input.value === undefined || input.value === null
          ? ''
          : String(input.value)
    } else {
      acc[input.name] = input.value ?? ''
    }
    return acc
  }, {} as Record<string, any>)

export default function DynamicForm({
  inputs,
  onSubmit,
  titleBtn = 'Button',
  resetOn,
  disableWhileSubmitting = true,
  submittingText = 'Guardando...',
  columns,
  compact = false,
}: DynamicFormProps) {
  const { openModal, closeModal, modalStack } = useModal()
  const openCount = modalStack.length

  const [initialValues, setInitialValues] = useState(() => buildInitial(inputs))
  const [formValues, setFormValues] = useState(() => buildInitial(inputs))
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* =======================
     Reset externo
  ======================= */
  useEffect(() => {
    if (resetOn === undefined) return
    const initial = buildInitial(inputs)
    setInitialValues(initial)
    setFormValues(initial)
  }, [resetOn, inputs])

  /* =======================
     Focus primer input
  ======================= */
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [inputs])

  /* =======================
     Dirty check
  ======================= */
  const isDirty = useMemo(() => {
    const keys = Object.keys({ ...initialValues, ...formValues })
    return keys.some(
      k => JSON.stringify(formValues[k]) !== JSON.stringify(initialValues[k])
    )
  }, [formValues, initialValues])

  const isDirtyRef = useRef(false)
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  /* =======================
     Close confirm modal
  ======================= */
  const doClose = () => window.close()
  const closeConfirmOpenRef = useRef(false)
  const pendingOpenCloseRef = useRef(false)

  function CloseConfirmWrapper({ children }: { children: React.ReactNode }) {
    useEffect(() => () => { closeConfirmOpenRef.current = false }, [])
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
      isDirtyRef.current ? openCloseConfirm() : doClose()
    }
    if (openCount === 0 && !pendingOpenCloseRef.current) {
      closeConfirmOpenRef.current = false
    }
  }, [openCount])

  /* =======================
     ESC global
  ======================= */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isSubmitting) return
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

      isDirtyRef.current ? openCloseConfirm() : doClose()
    }

    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [openCount, closeModal, isSubmitting])

  /* =======================
     Change handler
     Numbers → string
  ======================= */
  const handleChange = (name: string, value: any, type?: string) => {
    if (type === 'number') {
      const str = String(value ?? '')
      if (str === '' || /^[0-9]*([.,][0-9]*)?$/.test(str)) {
        setFormValues(prev => ({ ...prev, [name]: str }))
      }
      return
    }
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  /* =======================
     Submit
     Numbers → number | null
  ======================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      const payload: Record<string, any> = { ...formValues }

      for (const input of inputs) {
        if (input.type === 'number') {
          const raw = String(payload[input.name] ?? '').trim()
          if (raw === '') {
            payload[input.name] = null
          } else {
            const num = Number(raw.replace(',', '.'))
            payload[input.name] = Number.isFinite(num) ? num : null
          }
        }
      }

      await Promise.resolve(onSubmit(payload))
    } finally {
      setIsSubmitting(false)
    }
  }

  const disabledAll = disableWhileSubmitting && isSubmitting

  /* =======================
     Grid
  ======================= */
  const cols = columns ?? 1
  const gridColsClass =
    cols === 1 ? 'grid-cols-1'
    : cols === 2 ? 'grid-cols-2'
    : cols === 3 ? 'grid-cols-3'
    : 'grid-cols-4'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col py-2">
      <div className={`grid ${gridColsClass} ${compact ? 'gap-2' : 'gap-3'}`}>
        {inputs.map((input, idx) => {
          const span = Math.min(input.colSpan ?? 1, cols)
          const spanClass =
            span === 1 ? 'col-span-1'
            : span === 2 ? 'col-span-2'
            : span === 3 ? 'col-span-3'
            : 'col-span-4'

          const commonProps = {
            required: input.required,
            disabled: disabledAll,
            ref:
              idx === 0 && !input.hidden && input.type !== 'component'
                ? firstInputRef
                : undefined,
            className:
              'border rounded px-2 py-1 outline-none shadow-inner shadow-black border-black ' +
              'disabled:opacity-60 disabled:cursor-not-allowed',
          } as any

          return (
            <div
              key={input.name}
              className={`flex flex-col text-black ${input.hidden ? 'hidden' : ''} ${spanClass}`}
            >
              {input.label && (
                <label className="text-sm font-semibold mb-1 text-white">
                  {input.label}
                </label>
              )}

              {input.type === 'component' ? (
                <input.Component
                  value={formValues[input.name]}
                  onChange={val => handleChange(input.name, val, input.type)}
                  disabled={disabledAll}
                  {...(input.componentProps || {})}
                />
              ) : input.type === 'select' ? (
                <select
                  {...commonProps}
                  value={formValues[input.name]}
                  onChange={e =>
                    handleChange(input.name, e.target.value, input.type)
                  }
                >
                  {input.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : input.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={!!formValues[input.name]}
                  onChange={e =>
                    handleChange(input.name, e.target.checked, input.type)
                  }
                />
              ) : input.type === 'textarea' ? (
                <textarea
                  {...commonProps}
                  value={formValues[input.name]}
                  onChange={e =>
                    handleChange(input.name, e.target.value, input.type)
                  }
                />
              ) : input.type === 'number' ? (
                <input
                  {...commonProps}
                  type="text"
                  inputMode="decimal"
                  value={formValues[input.name]}
                  onChange={e =>
                    handleChange(input.name, e.target.value, input.type)
                  }
                />
              ) : (
                <input
                  {...commonProps}
                  type={input.type}
                  value={formValues[input.name]}
                  onChange={e =>
                    handleChange(input.name, e.target.value, input.type)
                  }
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <PrimaryButton
          type="submit"
          disabled={isSubmitting}
          functionClick={undefined}
          title={isSubmitting ? submittingText : titleBtn}
        />
      </div>
    </form>
  )
}
