import PrimaryButton from '../../components/PrimaryButton'
import { useVendedores } from '../../hooks/useSellers'
import Wood from '../../layout/Steel'
import Title from '../../layout/Title'
import { useModal } from '../../providers/ModalProvider'
import HorarioVendedor from './HorarioVendedor'

export default function PageHorarios() {
    const { vendedores, loading, error } = useVendedores()
    const { openModal } = useModal()

    const handleClick = (id: number) => {
        openModal(<HorarioVendedor id={id} />)
    }

    if (loading) return <div>Cargando vendedores...</div>
    if (error) return <div>Error al cargar vendedores: {(error as Error).message}</div>

    return (
        <div className='grid grid-cols-3 text-center gap-3 p-5'>{vendedores.map(vendedor =>
            <Wood className="font-bold" key={vendedor.id}>
                <Title >Vendedor {vendedor.id}</Title>
                <h3 className='text-l py-2'>{vendedor.nombre}</h3>
                <PrimaryButton title={"Ver Horarios"} functionClick={()=>handleClick(vendedor.id)} />
            </Wood>
        )}</div>
    )
}
