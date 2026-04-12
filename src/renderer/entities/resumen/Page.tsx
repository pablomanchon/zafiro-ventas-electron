import { DateNavigator } from '../../hooks/useDate'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'
import useSales from '../../hooks/useSales'
import TableAndSearch from '../../components/TableAndSearch'
import ventasConfig from '../ventas/config'
import { toast } from 'sonner'
import { formatCurrencyARS } from '../../utils/utils'
import DashboardInsights from '../../components/DashboardInsights'

export default function PageResumen() {
  const { ventas, filter, setFilter, shift, goToday, label, error, totalGeneral, totales, loading } = useSales()

  if (error) toast.error(error);



  return (
    <Main className='flex flex-col min-h-0 p-3 sm:p-4 gap-4 outline-n text-white'>
      <div className="flex flex-col h-full min-h-0 outline-none focus:outline-none gap-4">
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
            datos={loading ? [] : ventas}
            encabezados={ventasConfig.columns}
            onDobleClickFila={() => null}
            onFilaSeleccionada={() => null}
            searchFilters={ventasConfig.searchFields}
          />
        </div>

        <div className="focus:outline-none grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {/* Tarjetas de totales */}
          {!loading && totales.map(p => (
            <Steel key={p.tipo} className='flex justify-between w-full min-w-0'>
              <p className='capitalize font-bold text-lg'>{p.tipo}</p>
              <p className='text-xl font-bold'>{formatCurrencyARS(p.total)}</p>
            </Steel>
          ))}
          <Steel className='flex justify-between w-full min-w-0'>
            <p className='capitalize font-bold text-lg'>Total</p>
            <p className='text-xl font-bold'>{!loading && formatCurrencyARS(totalGeneral)}</p>
          </Steel>
        </div>

        <DashboardInsights />
      </div>
    </Main>
  )
}

