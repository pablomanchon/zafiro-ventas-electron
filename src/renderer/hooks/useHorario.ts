import { useEffect, useState } from 'react'

export default function useHorario({ idVendedor }: { idVendedor: number }): { horarios: any; setHorarios: (horarios: any) => void; loading: boolean; error: null | Error } {
    const [horarios, setHorarios] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<null | Error>(null)

    useEffect(() => {
       const fetchHorarios = async () => {
            setLoading(true)
            try {
                const response = await fetch(`http://localhost:3000/horarios/vendedor/${idVendedor}`)
                if (!response.ok) throw new Error('Error al cargar horarios')
                const data = await response.json()
                setHorarios(data)
            } catch (e) {
                setError(e instanceof Error ? e : new Error(String(e)))
            } finally {
                setLoading(false)
            }
            fetchHorarios()
        }
    }, [])

  return {
    horarios,
    setHorarios,
    loading,
    error
  }
}
