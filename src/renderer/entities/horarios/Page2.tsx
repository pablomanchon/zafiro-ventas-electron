import { useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import PrimaryButton from '../../components/PrimaryButton'
import { useVendedores } from '../../hooks/useSellers'
import Wood from '../../layout/Steel'
import Title from '../../layout/Title'
import { useModal } from '../../providers/ModalProvider'
import HorarioVendedor from './HorarioVendedor'
import { useHorarios } from './useHorarios'
import Main from '../../layout/Main'
import Glass from '../../layout/Glass'
import Confirmation from '../../layout/Confirmation'

export default function PageHorarios() {
    const { vendedores, loading: loadingVendedores, error } = useVendedores()
    const { openModal, closeModal } = useModal()

    const {
        horarios,
        loading: loadingHorarios,
        fetchAll,
        marcarIngreso,
        marcarEgreso,
    } = useHorarios()

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const horariosAbiertosPorVendedor = useMemo(() => {
        const map = new Map<number, boolean>()

        for (const horario of horarios) {
            const vendedorId = horario.vendedor?.id
            if (!vendedorId) continue

            if (!horario.horaEgreso) {
                map.set(vendedorId, true)
            }
        }

        return map
    }, [horarios])

    const handleVerHorarios = (id: number) => {
        openModal(<HorarioVendedor id={id} />)
    }

    const ejecutarToggleHorario = async (vendedorId: number) => {
        try {
            const estaAbierto = horariosAbiertosPorVendedor.get(vendedorId)

            if (estaAbierto) {
                await marcarEgreso(vendedorId)
            } else {
                await marcarIngreso({ vendedorId })
            }

            closeModal()
        } catch (e) {
            console.error(e)
            toast.error('No se pudo actualizar el horario')
        }
    }

    const handleToggleHorario = (vendedorId: number, nombre: string) => {
        const estaAbierto = horariosAbiertosPorVendedor.get(vendedorId) ?? false

        openModal(
            <Confirmation
                onConfirm={() => ejecutarToggleHorario(vendedorId)}
                mensaje={estaAbierto
                    ? `¿Seguro que quieres cerrar el horario de ${nombre}?`
                    : `¿Seguro que quieres abrir el horario de ${nombre}?`}
            />
        )
    }

    if (loadingVendedores) return <div>Cargando vendedores...</div>
    if (error) return <div>Error al cargar vendedores: {(error as Error).message}</div>

    return (
        <Main>
            <div className="grid grid-cols-3 gap-3 p-5 text-center">
                {vendedores.map((vendedor) => {
                    const estaAbierto = horariosAbiertosPorVendedor.get(vendedor.id) ?? false

                    return (
                        <Wood className="font-bold" key={vendedor.id}>
                            <Title>{vendedor.nombre}</Title>

                            <h3 className="py-2 text-l">ID: {vendedor.id}</h3>

                            <Glass className="my-2">
                                <p>
                                    Estado:{' '}
                                    <span className={estaAbierto ? 'text-green-600' : 'text-red-600'}>
                                        {estaAbierto ? 'Horario abierto' : 'Horario cerrado'}
                                    </span>
                                </p>
                            </Glass>

                            <div className="flex flex-col gap-2">
                                <PrimaryButton
                                    title="Ver Horarios"
                                    functionClick={() => handleVerHorarios(vendedor.id)}
                                />

                                <PrimaryButton
                                    title={estaAbierto ? 'Cerrar Horario' : 'Abrir Horario'}
                                    functionClick={() => handleToggleHorario(vendedor.id, vendedor.nombre)}
                                    disabled={loadingHorarios}
                                />
                            </div>
                        </Wood>
                    )
                })}
            </div>
        </Main>
    )
}