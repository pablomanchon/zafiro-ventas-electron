import { useCallback, useEffect, useState } from 'react'
import { getUser } from '../api/db'

export default function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [expired, setExpired] = useState(false)

  const normalizeUser = (data: any) => ({
    ...data,
    paymenthDate: data?.paymenthDate ?? data?.paymenth_date,
    vencDate: data?.vencDate ?? data?.venc_date,
  })

  const computeExpired = (u: any) => {
    const vencDate = u?.vencDate ?? u?.venc_date
    if (!vencDate) return false
    const venc = new Date(vencDate)
    return venc.getTime() < Date.now()
  }

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUser('9baebbad-9edc-4520-8bda-7ea3fba88174')
      if (!data) throw new Error('Usuario no encontrado')

      const normalizedUser = normalizeUser(data)
      const isExpired = computeExpired(normalizedUser)

      setUser(normalizedUser)
      setExpired(isExpired)
      setError(null)

      return { user: normalizedUser, expired: isExpired } as const
    } catch (e) {
      setError(e)
      return { user: null, expired: true } as const
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { user, loading, error, expired, refetch }
}
