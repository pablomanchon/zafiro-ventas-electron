import { useEffect, useState } from 'react'
import { getHorarios } from '../api/db'

export default function useHorario({
  idVendedor,
}: {
  idVendedor: number
}): {
  horarios: any[]
  setHorarios: (horarios: any[]) => void
  loading: boolean
  error: null | Error
} {
  const [horarios, setHorarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | Error>(null)

  useEffect(() => {
    const fetchHorarios = async () => {
      setLoading(true)
      try {
        const data = await getHorarios()
        setHorarios((data ?? []).filter((horario: any) => horario?.vendedor?.id === idVendedor))
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        setLoading(false)
      }
    }

    fetchHorarios()
  }, [idVendedor])

  return {
    horarios,
    setHorarios,
    loading,
    error,
  }
}
