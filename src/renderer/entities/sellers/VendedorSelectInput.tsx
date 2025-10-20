// src/entities/clientes/ClienteSelectInput.tsx
import { useEffect, useState } from 'react'
import { useModal } from '../../providers/ModalProvider'
import EntitySearchModal from '../../components/EntitySearchModal'
import { useVendedores } from '../../hooks/useSellers'

interface Props {
  value: number | null
  onChange: (value: number) => void
  label?: string
}

export default function VendedorSelectInput({ value, onChange, label }: Props) {
  const { openModal } = useModal()
  const { vendedores, getById, loading } = useVendedores()
  const [selected, setSelected] = useState(getById(value))

  useEffect(() => {
    setSelected(getById(value))
  }, [value, vendedores, getById])

  const handleSelect = (id: number) => onChange(id)

  const openSearch = () => {
    openModal(
      <EntitySearchModal
        entity="vendedores"
        columns={['ID', 'Nombre']}
        searchFilters={['id', 'nombre']}
        onSelect={handleSelect}
      />
    )
  }

  return (
    <div className="flex items-center gap-2">
      {label && <span className="font-semibold">{label}:</span>}
      <input
        readOnly
        value={selected ? `${selected.id} - ${selected.nombre}` : ''}
        placeholder={loading ? 'Cargando clientes...' : 'Seleccione cliente'}
        className="flex-1 border rounded px-2 py-1 bg-gray-700 text-white cursor-pointer"
        onClick={openSearch}
      />
      <button
        type="button"
        onClick={openSearch}
        className="p-1 bg-cyan-600 rounded hover:bg-cyan-500 text-white"
      >
        Buscar
      </button>
    </div>
  )
}
