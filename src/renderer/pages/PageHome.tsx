import { useLote } from '../hooks/useLote';

export default function PageHome() {
  const { lotes, loading, error } = useLote();

  if (loading) return <div>loading</div>
  if (error) return <div>error</div>
  return (
    <div className='w-full grid grid-cols-3 gap-2'>
      {
        lotes.map(lote =>
          <div className='p-2 rounded bg-green-700 shadow-inner shadow-black border-2 border-black' key={lote.nombre}>
            {lote.nombre}
          </div>)
      }
    </div>
  )
}
