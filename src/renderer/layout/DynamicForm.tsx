import { useEffect, useState } from 'react'
import PrimaryButton from '../components/PrimaryButton'

interface InputDefBase {
    name: string
    label?: string
    required?: boolean
    value?: any
    hidden?: boolean
}

type InputDef =
    | (InputDefBase & {
        type: 'text' | 'number' | 'email' | 'date' | 'password' | 'checkbox' | 'select' | 'textarea'
        options?: { label: string; value: string }[]
    })
    | (InputDefBase & {
        type: 'component'
        Component: React.ComponentType<{
            value: any
            onChange: (value: any) => void
        }>
    })

interface DynamicFormProps {
    inputs: InputDef[]
    onSubmit: (formValues: Record<string, any>) => void
    typeBtn?: 'primary' | 'secondary' | 'danger'
    titleBtn: string
}

export default function DynamicForm({ inputs, onSubmit, typeBtn = 'primary', titleBtn = 'Button' }: DynamicFormProps) {
    const [formValues, setFormValues] = useState(() =>
        inputs.reduce((acc, input) => {
            acc[input.name] = input.value ?? (input.type === 'checkbox' ? false : '')
            return acc
        }, {} as Record<string, any>)
    )

    useEffect(() => {
        console.log('formValues', formValues)
    }, [formValues])

    const handleChange = (name: string, value: any, type?: string) => {
        if (type === 'number') {
            value = value === '' ? '' : parseFloat(value)
        }
        setFormValues(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formValues)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col py-2">
            {inputs.map(input => (
                <div key={input.name} className={`flex flex-col text-black ${input.hidden && 'hidden'}`}>
                    {input.label && <label className="text-sm font-semibold mb-1 text-white">{input.label}</label>}
                    {
                        input.type === 'component' ? (
                            <input.Component
                                value={formValues[input.name]}
                                onChange={(val) => handleChange(input.name, val, input.type)}
                            />
                        ) : input.type === 'select' ? (
                            <select
                                required={input.required}
                                value={formValues[input.name]}
                                onChange={e => handleChange(input.name, e.target.value, input.type)}
                                className="border rounded px-2 py-1 outline-none shadow-inner shadow-black border-black"
                            >
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
                                checked={formValues[input.name]}
                                onChange={e => handleChange(input.name, e.target.checked, input.type)}
                                className="h-5 w-5 outline-none shadow-inner shadow-black border-black"
                            />
                        ) : input.type === 'textarea' ? (
                            <textarea
                                required={input.required}
                                value={formValues[input.name]}
                                onChange={e => handleChange(input.name, e.target.value, input.type)}
                                className="border rounded px-2 py-1 outline-none shadow-inner shadow-black border-black min-h-[100px]"
                            />
                        ) : (
                            <input
                                required={input.required}
                                type={input.type}
                                value={formValues[input.name]}
                                onChange={e => handleChange(input.name, e.target.value, input.type)}
                                className="border rounded px-2 py-1 outline-none shadow-inner shadow-black border-black"
                            />
                        )}
                </div>
            ))}

            {typeBtn === 'primary' && <PrimaryButton functionClick={null} title={titleBtn} />}
        </form>
    )
}
