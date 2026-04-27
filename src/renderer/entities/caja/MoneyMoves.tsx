import { useEffect, useState, useRef } from 'react'
import Steel from '../../layout/Steel'
import Title from '../../layout/Title'
import { getMoves } from '../../api/db'
import { formatCurrencyARS, formatDate } from '../../utils/utils'
import Glass from '../../layout/Glass'

type CajaMoveDetailDto = {
    id: number;
    monto: string;
    moneda: 'pesos' | 'usd';
    moveType: 'in' | 'out'
    createdAt: Date;
    updatedAt: Date;
}

export default function MoneyMoves() {
    const [moves, setMoves] = useState<CajaMoveDetailDto[]>([])
    const [index, setIndex] = useState(0)
    const [error, setError] = useState(false)
    const movesRef = useRef(moves)
    movesRef.current = moves

    useEffect(() => {
        const fetchMoves = async () => {
            try {
                const data = await getMoves()
                setMoves(data)
            } catch (err) {
                setError(true)
            }
        }
        fetchMoves()
    }, [])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setIndex(i => (i + 1 < movesRef.current.length ? i + 1 : i))
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                setIndex(i => (i > 0 ? i - 1 : i))
            }
        }
        window.addEventListener('keydown', handleKey, true)
        return () => window.removeEventListener('keydown', handleKey, true)
    }, [])

    const move = moves[index]

    return (
        <Steel className='text-white'>
            <Title>Movimiento de Caja</Title>
            {error && <p style={{ color: 'red' }}>Error al cargar movimientos</p>}
            {!moves.length ? (
                <p>No hay movimientos registrados.</p>
            ) : (
                <div className='flex items-center justify-center gap-4 mt-4'>
                    <button
                        onClick={() => setIndex(i => (i + 1 < moves.length ? i + 1 : i))}
                        disabled={index === moves.length - 1}
                        className='text-3xl px-3 py-1 disabled:opacity-20'
                    >
                        ◀
                    </button>
                    <Glass>
                        <Title>Movimiento {move.id}</Title>
                        <h4>Moneda: {move.moneda.toUpperCase()}</h4>
                        <h4>Monto: {formatCurrencyARS(move.monto)}</h4>
                        <h4>Fecha y hora: {formatDate(move.createdAt)}</h4>
                        <h4>{move.moveType === 'in' ? 'Entrada' : 'Salida'} de dinero</h4>
                    </Glass>
                    <button
                        onClick={() => setIndex(i => (i > 0 ? i - 1 : i))}
                        disabled={index === 0}
                        className='text-3xl px-3 py-1 disabled:opacity-20'
                    >
                        ▶
                    </button>
                </div>
            )}
        </Steel>
    )
}
