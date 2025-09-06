import { DateNavigator } from '../../hooks/useDate'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'
import useSales from '../../hooks/useSales'
import TableAndSearch from '../../components/TableAndSearch'
import ventasConfig from '../ventas/config'
import { toast } from 'react-toastify'

export default function PageResumen() {
  const { ventas, filter, setFilter, shift, goToday, label, error, totalGeneral, totales } = useSales()

  if (error) toast.error(error);

  return (
    <Main className='flex flex-col h-screen p-4 gap-4'>
      <div
        className="flex flex-col h-full min-h-0 outline-none focus:outline-none"
      >
        <DateNavigator
          filter={filter}
          setFilter={setFilter}
          shift={shift}
          goToday={goToday}
          label={label}
        />

        {/* 👇 clave: min-h-0 para que el scroll funcione */}
        <div className="flex-1 min-h-0 overflow-auto">
          <TableAndSearch
            datos={ventas}
            encabezados={ventasConfig.columns}
            onDobleClickFila={() => null}
            onFilaSeleccionada={() => null}
            searchFilters={ventasConfig.searchFields}
          />
        </div>

        {/* sin h-full para no forzar altura */}
        <div className='grid grid-cols-2 lg:grid-cols-3 gap-2 justify-center items-center'>
          {totales.map(p => (
            <Steel key={p.tipo} className='flex justify-between max-w-96 min-w-60'>
              <p className='capitalize font-bold text-lg'>{p.tipo}</p>
              <p className='text-xl font-bold'>${p.total}</p>
            </Steel>
          ))}
          <Steel className='flex justify-between max-w-96 min-w-60'>
            <p className='capitalize font-bold text-lg'>Total</p>
            <p className='text-xl font-bold'>${totalGeneral}</p>
          </Steel>
        </div>
      </div>
    </Main>
  )
}
