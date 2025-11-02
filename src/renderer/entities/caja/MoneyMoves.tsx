import { useEffect, useState, useCallback } from 'react'
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

    // Cargar movimientos
    useEffect(() => {
        const fetchMoves = async () => {
            try {
                const data = await getMoves()
                setMoves(data)
                // 👇 arrancamos desde el último movimiento
                if (Array.isArray(data) && data.length > 0) {
                    setIndex(data.length - 1)
                }
            } catch (err) {
                setError(true)
            }
        }
        fetchMoves()
    }, [])

    // Navegación con flechas del teclado
    const handleKey = useCallback(
        (e: KeyboardEvent) => {
            if (moves.length === 0) return
            if (e.key === 'ArrowLeft') {
                // Ir hacia atrás en la lista
                setIndex(i => (i > 0 ? i - 1 : i))
            } else if (e.key === 'ArrowRight') {
                // Ir hacia adelante en la lista
                setIndex(i => (i + 1 < moves.length ? i + 1 : i))
            }
        },
        [moves]
    )

    useEffect(() => {
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [handleKey])

    const move = moves[index]

    return (
        <Steel className='text-white'>
            <Title>Movimiento de Caja</Title>
            {error && <p style={{ color: 'red' }}>Error al cargar movimientos</p>}
            {!moves.length ? (
                <p>No hay movimientos registrados.</p>
            ) : (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Glass>
                    <Title>
                        Movimiento {move.id}
                    </Title>
                        <h4>Moneda: {move.moneda.toUpperCase()}</h4>
                        <h4>Monto: {formatCurrencyARS(move.monto)}</h4>
                        <h4>Fecha y hora: {formatDate(move.createdAt)}</h4>
                        <h4>{move.moveType === 'in' ? 'Entrada' : 'Salida'} de dinero</h4>
                    </Glass>
                    <div className='mt-4 text-lg font-bold'>
                        <button
                            onClick={() => setIndex(i => (i > 0 ? i - 1 : i))}
                            disabled={index === 0}
                        >
                            ⬅ Anterior
                        </button>
                        <button
                            onClick={() => setIndex(i => (i + 1 < moves.length ? i + 1 : i))}
                            disabled={index === moves.length - 1}
                            style={{ marginLeft: '1rem' }}
                        >
                            Siguiente ➡
                        </button>
                    </div>
                </div>
            )}
        </Steel>
    )
}
