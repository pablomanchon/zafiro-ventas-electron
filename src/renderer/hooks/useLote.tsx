// hooks/useProduct.ts
import { useEffect, useState } from 'react'
import { getAllLotes } from '../api/db'
import {CreateLoteDto} from '../../main/lote/dto/create-lote.dto'
export function useLote() {
  const [lotes, setLotes] = useState<CreateLoteDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getAllLotes()
        setLotes(res)
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { lotes, loading, error }
}
