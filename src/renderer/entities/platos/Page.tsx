import PrimaryButton from '../../components/PrimaryButton';
import Wood from '../../layout/Steel';
import Plato from './components/Plato';
import usePlato from './usePlato';

export default function PagePlatos() {
  const { error, loading, platos, deletePlato, modifyPlato, createPlato } = usePlato();

  if (loading) return <div>Loading</div>
  if (error) return <div>Loading</div>

 
  return (
    <>
      <div className='grid sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4  gap-5 items-center justify-center h-full overflow-y-auto p-2 pb-20 p relative'>
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
        {platos.map(p => <Plato key={p.id} p={p} onModify={modifyPlato} onDelete={deletePlato} />)}
      </div>
      <Wood className='mt-auto h-16 m-2'><PrimaryButton title={"Crear"} functionClick={createPlato} /></Wood>
    </>
  )
  //return <CrudPage cols={2} config={config} />;
}
