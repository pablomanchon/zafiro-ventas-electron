import PrimaryButton from '../../components/PrimaryButton'
import Wood from '../../layout/Steel'
import Steel from '../../layout/Steel'
import LoadingState from '../../components/LoadingState'
import Plato from './components/Plato'
import usePlato from './usePlato'

export default function PagePlatos() {
  const { error, loading, platos, deletePlato, modifyPlato, createPlato } = usePlato()

  if (loading) return <LoadingState title="Cargando platos" message="Estamos preparando la carta." className="m-3" />
  if (error) return <div>Error al cargar platos: {error}</div>

  return (
    <>
      <div className="flex-1 overflow-y-auto p-2 pb-20">
        {platos.length === 0 ? (
          <Steel className="text-white text-center p-6">
            No hay platos cargados todavia.
          </Steel>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 items-start justify-center">
            {platos.map((p) => (
              <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />
            ))}
          </div>
        )}
      </div>
      <Wood className="mt-auto m-2 p-2">
        <PrimaryButton title="Crear" functionClick={createPlato} />
      </Wood>
    </>
  )
}
