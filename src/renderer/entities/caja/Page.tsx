import DangerBtn from '../../components/DangerButton'
import SecondaryBtn from '../../components/SecondaryButton'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'
import Title from '../../layout/Title'

export default function PageCaja() {
    
  return (
    <Main>
        <Title>Caja</Title>
        <div className='flex flex-col items-center h-full '>

        <Steel className='mt-auto w-full flex gap-2'>
            <SecondaryBtn functionClick={()=>{}} title={"Ingreso de Dinero"}/>
            <DangerBtn functionClick={()=>{}} title={"Egreso de Dinero"}/>
        </Steel>
        </div>
    </Main>
  )
}
