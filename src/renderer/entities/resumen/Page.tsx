import { DateNavigator } from '../../hooks/useDate'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'
import useSales from '../../hooks/useSales'
import { toast } from 'sonner'
import { formatCurrencyARS } from '../../utils/utils'
import DashboardInsights from '../../components/DashboardInsights'

export default function PageResumen() {
  const { filter, setFilter, shift, goToday, label, error, totalGeneral, totales, loading } = useSales()

  if (error) toast.error(error);



  return (
    <Main className='flex flex-col min-h-0 p-2 sm:p-3 gap-2 outline-n text-white'>
      <div className="flex flex-col min-h-max outline-none focus:outline-none gap-2 md:h-full md:min-h-0">
        <DateNavigator
          filter={filter}
          setFilter={setFilter}
          shift={shift}
          goToday={goToday}
          label={label}
        />

        {/* 👇 clave: min-h-0 para que el scroll funcione */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-1.5">
          {loading ? (
            <>
              <Steel className="h-9 loading-shimmer bg-white/10" />
              <Steel className="h-9 loading-shimmer bg-white/10" />
              <Steel className="h-9 loading-shimmer bg-white/10" />
            </>
          ) : totales.map(p => (
            <Steel key={p.tipo} className='flex justify-between items-center w-full min-w-0 px-3 py-2'>
              <p className='capitalize font-bold text-base'>{p.tipo}</p>
              <p className='text-lg font-bold'>{formatCurrencyARS(p.total)}</p>
            </Steel>
          ))}
          <Steel className='flex justify-between items-center w-full min-w-0 px-3 py-2'>
            <p className='capitalize font-bold text-base'>Total</p>
            <p className='text-lg font-bold'>{loading ? '...' : formatCurrencyARS(totalGeneral)}</p>
          </Steel>
        </div>

        <DashboardInsights />
      </div>
    </Main>
  )
}

