import { useEffect, useState } from 'react'
import DangerBtn from '../../components/DangerButton'
import SecondaryBtn from '../../components/SecondaryButton'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'
import Title from '../../layout/Title'
import { getAllSaldos } from '../../api/db'
import { formatCurrencyARS } from '../../utils/utils'
import { useModal } from '../../providers/ModalProvider'
import MoneyMove from './MoneyMove'
import { toast } from 'react-toastify'
import PrimaryButton from '../../components/PrimaryButton'
import MoneyMoves from './MoneyMoves'
type salesType = {
  pesos: number,
  usd: number
}
export default function PageCaja() {
  const [sales, setSales] = useState<salesType>({ pesos: 0, usd: 0 })
  const { openModal } = useModal()
  const getData = async () => {
    const res = await getAllSaldos()
    console.log(res)
    setSales(res)
  }
  useEffect(() => {
    getData()
  }, [])

  const handleOpenMove = (moveType: 'in' | 'out') => {
    openModal(<MoneyMove moveType={moveType} handleEndMove={handleEndMove} />)
  }

  const handleEndMove = (moveType: 'in' | 'out') => {
    getData()
    toast.info(`¡${moveType == 'in' ? 'Ingreso: ' : 'Egreso: '} de dinero creado con éxito!`)
  }

  const handleShowMoveDetails = () => {
    openModal(<MoneyMoves />)
  }

  return (
    <Main>
      <Title>Caja</Title>
      <div className='flex flex-col items-center gap-5 h-full '>
        <div className='mt-auto flex gap-2 w-1/2 ml-auto'>
          <Steel className='w-full text-xl font-bold flex'><h3 className='mr-auto'>Pesos:</h3>{formatCurrencyARS(sales.pesos)}</Steel>
          <Steel className='w-full text-xl font-bold flex'><h3 className='mr-auto'>USD:</h3>{formatCurrencyARS(sales.usd)}</Steel>
        </div>
        <Steel className='w-full flex gap-2'>
          <PrimaryButton functionClick={handleShowMoveDetails} title={"Movimientos de Dinero"} />
          <SecondaryBtn functionClick={() => { handleOpenMove("in") }} title={"Ingreso de Dinero"} />
          <DangerBtn functionClick={() => { handleOpenMove("out") }} title={"Egreso de Dinero"} />
        </Steel>
      </div>
    </Main>
  )
}
