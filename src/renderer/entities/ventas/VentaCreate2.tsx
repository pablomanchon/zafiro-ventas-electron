import { useEffect, useState } from 'react'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import VendedorSelectInput from '../sellers/VendedorSelectInput'
import ClienteSelectInput from '../clientes/ClienteSelectInput'

export default function VentaCreate2() {
  const [vendedorId, setVendedorId] = useState<number | null>(null)
  const [clienteId, setClienteId] = useState<number | null>(null)

  const handleVendedorChange = (value: number) => {
    setVendedorId(value)
  }
  const handleClienteChange = (value: number) => {
    setClienteId(value)
  }
  useEffect(() => {
    console.log(vendedorId);
  }, [vendedorId])


  return (
    <Main className="text-white">
      <div className='grid grid-cols-12 grid-rows-12'>
        <Title className='col-span-12'>Crear Venta 2</Title>
        <VendedorSelectInput
          className='col-start-6 col-span-6'
          value={vendedorId}
          onChange={handleVendedorChange} />
        <ClienteSelectInput
          className='col-start-6 col-span-6'
          value={clienteId}
          onChange={handleClienteChange} />
      </div>
    </Main>
  )
}
