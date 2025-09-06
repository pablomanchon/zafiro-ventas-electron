import { useEffect, useState } from 'react'
import { DateNavigator, useDateRange } from '../../hooks/useDate'
import { getAll } from '../../api/crud'
import Main from '../../layout/Main'
import Steel from '../../layout/Steel'

export default function PageResumen() {
    const { range, filter, setFilter, shift, goToday, label } = useDateRange('day')
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        getAll('ventas/totales/tipos', range).then(res => setData(res))
    }, [range])

    return (
        <Main>
            <DateNavigator
                filter={filter}
                setFilter={setFilter}
                shift={shift}
                goToday={goToday}
                label={label}
            />
            <div className='grid grid-cols-2 lg:grid-cols-3 gap-2 justify-center items-center h-full'>
                {data.map(p => (
                    <Steel key={p} className='flex justify-between max-w-96 min-w-60'>
                        <p className='capitalize font-bold text-lg'>{p.tipo}</p>
                        <p className='text-xl font-bold'>${p.total}</p>
                    </Steel>
                ))}
            </div>
        </Main>
    )
}
