import { useCallback } from 'react'
import { useAuth } from './useAuth'

export default function useUser() {
  const { profile, loading, error, refreshProfile } = useAuth()

  const computeExpired = (u: any) => {
    const vencDate = u?.vencDate ?? u?.venc_date
    if (!vencDate) return false
    const venc = new Date(vencDate)
    return venc.getTime() < Date.now()
  }

  const refetch = useCallback(async () => {
    const user = await refreshProfile()
    return { user, expired: computeExpired(user) } as const
  }, [refreshProfile])

  return { user: profile, loading, error, expired: computeExpired(profile), refetch }
}
