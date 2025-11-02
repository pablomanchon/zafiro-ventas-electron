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
    console.log(u)
    const venc = new Date(u.vencDate)
    return venc.getTime() < Date.now()
  }

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUser('9baebbad-9edc-4520-8bda-7ea3fba88174')
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
