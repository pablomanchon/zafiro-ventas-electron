import { useMemo } from 'react'
import { DateNavigator } from '../../hooks/useDate'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'
import useSales from '../../hooks/useSales'
import TableAndSearch from '../../components/TableAndSearch'
import ventasConfig from '../ventas/config'
import { toast } from 'react-toastify'
import { formatCurrencyARS } from '../../utils'

// 🔽 ajustá la ruta según dónde pegaste el componente del canvas
import Pie2DChart, { type PieDatum } from '../../components/Grafico'

export default function PageResumen() {
  const { ventas, filter, setFilter, shift, goToday, label, error, totalGeneral, totales } = useSales()

  if (error) toast.error(error);

  // Mapear tus totales -> PieDatum
  const pieData: PieDatum[] = useMemo(
    () =>
      (totales ?? [])
        .filter(t => Number.isFinite(t.total) && t.total > 0)
        .map((t) => ({
          name: t.tipo,
          value: t.total,
        })),
    [totales]
  )

  return (
    <Main className='flex flex-col h-screen p-4 gap-4 outline-n'>
      <div className="flex flex-col h-full min-h-0 outline-none focus:outline-none">
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

        {/* Resumen + Gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 focus:outline-none">
          {/* Gráfico de torta (donut) */}
          <Steel className="w-full">
            <Pie2DChart
              title="Ingresos por método de pago"
              data={pieData}
              innerRadius={60}          // si querés torta sólida, poné 0
              outerRadius="90%"
              showLegend={true}
              cornerRadius={8}
              height={320}
              valueFormatter={(n: string | number) => formatCurrencyARS(n)}
              onSliceClick={(item: { name: any; value: string | number }) => toast.info(`${item.name}: ${formatCurrencyARS(item.value)}`)}
            />
          </Steel>

          {/* Tarjetas de totales */}
          <div className='grid grid-cols-2 lg:grid-cols-2 gap-2 content-start'>
            {totales.map(p => (
              <Steel key={p.tipo} className='flex justify-between max-w-96 min-w-60'>
                <p className='capitalize font-bold text-lg'>{p.tipo}</p>
                <p className='text-xl font-bold'>{formatCurrencyARS(p.total)}</p>
              </Steel>
            ))}
            <Steel className='flex justify-between max-w-96 min-w-60'>
              <p className='capitalize font-bold text-lg'>Total</p>
              <p className='text-xl font-bold'>{formatCurrencyARS(totalGeneral)}</p>
            </Steel>
          </div>
        </div>
      </div>
    </Main>
  )
}
