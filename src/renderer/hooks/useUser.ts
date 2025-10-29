// hooks/useUser.ts
import { useCallback, useEffect, useState } from 'react'
import { getUser } from '../api/db'

export default function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [expired, setExpired] = useState(false)

  const computeExpired = (u: any) => {
    if (!u?.vencDate) return false
    const venc = new Date(u.vencDate)
    return venc.getTime() < Date.now()
  }

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUser('9ad47eb2-fb5f-438b-b239-a36c7ec8aa0e')
      if (!data) throw new Error('Usuario no encontrado')
      setUser(data)
      const isExpired = computeExpired(data)
      setExpired(isExpired)
      setError(null)
      return { user: data, expired: isExpired } as const   // ⬅️ devolvemos el estado actualizado
    } catch (e) {
      setError(e)
      return { user: null, expired: true } as const
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { user, loading, error, expired, refetch }
}
