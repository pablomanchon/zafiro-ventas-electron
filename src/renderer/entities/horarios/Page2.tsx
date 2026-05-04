import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import PrimaryButton from '../../components/PrimaryButton'
import { useVendedores } from '../../hooks/useSellers'
import Wood from '../../layout/Steel'
import Title from '../../layout/Title'
import { useModal } from '../../providers/ModalProvider'
import HorarioVendedor from './HorarioVendedor'
import { useHorarios } from './useHorarios'
import Main from '../../layout/Main'
import Glass from '../../layout/Glass'
import LoadingState from '../../components/LoadingState'

function formatDateTimeLocal(value?: string | null) {
  const base = value ? new Date(value) : new Date()
  if (Number.isNaN(base.getTime())) return ''

  const year = base.getFullYear()
  const month = String(base.getMonth() + 1).padStart(2, '0')
  const day = String(base.getDate()).padStart(2, '0')
  const hours = String(base.getHours()).padStart(2, '0')
  const minutes = String(base.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function openDateTimePicker(input: HTMLInputElement) {
  input.showPicker?.()
}

export default function PageHorarios() {
  const { vendedores, loading: loadingVendedores, error } = useVendedores()
  const { openModal } = useModal()
  const {
    horarios,
    loading: loadingHorarios,
    fetchAll,
    marcarIngreso,
    marcarEgreso,
    getHorasDia,
    getHorasSemana,
    getHorasMes,
  } = useHorarios()

  const [ingresos, setIngresos] = useState<Record<number, string>>({})
  const [egresos, setEgresos] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const horariosAbiertosPorVendedor = useMemo(() => {
    const map = new Map<number, (typeof horarios)[number]>()

    for (const horario of horarios) {
      const vendedorId = horario.vendedor?.id
      if (!vendedorId || horario.horaEgreso) continue

      const prev = map.get(vendedorId)
      if (!prev || new Date(horario.horaIngreso).getTime() > new Date(prev.horaIngreso).getTime()) {
        map.set(vendedorId, horario)
      }
    }

    return map
  }, [horarios])

  useEffect(() => {
    const nextIngresos: Record<number, string> = {}
    const nextEgresos: Record<number, string> = {}

    vendedores.forEach((vendedor) => {
      const horarioAbierto = horariosAbiertosPorVendedor.get(vendedor.id)
      nextIngresos[vendedor.id] = formatDateTimeLocal(horarioAbierto?.horaIngreso)
      nextEgresos[vendedor.id] = formatDateTimeLocal()
    })

    setIngresos(nextIngresos)
    setEgresos(nextEgresos)
  }, [vendedores, horariosAbiertosPorVendedor])

  const handleVerHorarios = (id: number) => {
    openModal(<HorarioVendedor id={id} />)
  }

  const handleIngreso = async (vendedorId: number) => {
    try {
      const horaIngreso = ingresos[vendedorId]
      await marcarIngreso({ vendedorId, horaIngreso })
      await fetchAll()
    } catch (e) {
      console.error(e)
    }
  }

  const handleEgreso = async (vendedorId: number) => {
    try {
      const horaEgreso = egresos[vendedorId]
      await marcarEgreso(vendedorId, { horaEgreso })
      await fetchAll()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo registrar el egreso')
    }
  }

  if (loadingVendedores) return <LoadingState title="Cargando vendedores" message="Estamos preparando los horarios." className="m-3" />
  if (error) return <div>Error al cargar vendedores: {(error as Error).message}</div>

  return (
    <Main className="p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 p-2 text-center md:grid-cols-2 sm:p-4 xl:grid-cols-3">
        {vendedores.map((vendedor) => {
          const horarioAbierto = horariosAbiertosPorVendedor.get(vendedor.id) ?? null
          const estaAbierto = Boolean(horarioAbierto)

          return (
            <Wood key={vendedor.id} typeWood={3} className="text-white">
              <div className="bg-black/55 rounded p-3 flex flex-col gap-3">
                <Title>{vendedor.nombre}</Title>

                <h3 className="py-1 text-l font-bold text-center">ID: {vendedor.id}</h3>

                <Glass className="text-left">
                  <p>
                    Estado:{' '}
                    <span className={estaAbierto ? 'text-green-400' : 'text-red-400'}>
                      {estaAbierto ? 'Horario abierto' : 'Horario cerrado'}
                    </span>
                  </p>
                  <p className="mt-1 text-sm opacity-80">Horas hoy: {getHorasDia(new Date(), vendedor.id)}</p>
                  <p className="text-sm opacity-80">Horas semana: {getHorasSemana(new Date(), vendedor.id)}</p>
                  <p className="text-sm opacity-80">Horas mes: {getHorasMes(new Date(), vendedor.id)}</p>
                  {horarioAbierto && (
                    <p className="mt-1 text-sm opacity-80">
                      Ingreso actual: {new Date(horarioAbierto.horaIngreso).toLocaleString('es-AR')}
                    </p>
                  )}
                </Glass>

                <div className="flex flex-col gap-3 text-left">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/80">Hora de ingreso</span>
                    <input
                      type="datetime-local"
                      value={ingresos[vendedor.id] ?? ''}
                      onClick={(e) => openDateTimePicker(e.currentTarget)}
                      onChange={(e) =>
                        setIngresos((prev) => ({ ...prev, [vendedor.id]: e.target.value }))
                      }
                      className="datetime-dark rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </label>

                  <PrimaryButton
                    title={estaAbierto ? 'Actualizar ingreso sugerido' : 'Registrar ingreso'}
                    functionClick={() => handleIngreso(vendedor.id)}
                    disabled={loadingHorarios}
                  />

                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/80">Hora de egreso</span>
                    <input
                      type="datetime-local"
                      value={egresos[vendedor.id] ?? ''}
                      onClick={(e) => openDateTimePicker(e.currentTarget)}
                      onChange={(e) =>
                        setEgresos((prev) => ({ ...prev, [vendedor.id]: e.target.value }))
                      }
                      className="datetime-dark rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </label>

                  <PrimaryButton
                    title="Registrar egreso"
                    functionClick={() => handleEgreso(vendedor.id)}
                    disabled={loadingHorarios || !estaAbierto}
                  />

                  <PrimaryButton
                    title="Ver horarios"
                    functionClick={() => handleVerHorarios(vendedor.id)}
                  />
                </div>
              </div>
            </Wood>
          )
        })}
      </div>
    </Main>
  )
}
