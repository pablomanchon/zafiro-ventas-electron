import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../api/supabase'

export type AppProfile = {
  id: string
  name: string
  email: string
  authId: string
  paymenthDate?: string | null
  vencDate?: string | null
  kioscoId?: string | null
  kioscoNombre?: string | null
}

type SignUpInput = {
  email: string
  password: string
  nombre: string
  kioscoNombre: string
}

type AuthContextValue = {
  session: Session | null
  authUser: User | null
  profile: AppProfile | null
  loading: boolean
  error: unknown
  isAuthenticated: boolean
  refreshProfile: () => Promise<AppProfile | null>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeProfile(data: any): AppProfile | null {
  if (!data) return null
  return {
    id: String(data.id),
    name: data.name ?? '',
    email: data.email ?? '',
    authId: data.authId ?? data.auth_id ?? '',
    paymenthDate: data.paymenthDate ?? data.paymenth_date ?? null,
    vencDate: data.vencDate ?? data.venc_date ?? null,
    kioscoId: data.kioscoId ?? data.kiosco_id ?? null,
    kioscoNombre:
      data.kioscoNombre ??
      data.kiosco_nombre ??
      data.kiosco?.nombre ??
      data.kioscoNombre ??
      null,
  }
}

async function fetchProfileWithRetry(authUserId: string): Promise<AppProfile | null> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase.rpc('mi_perfil')
    if (error) {
      if (attempt === 5) throw error
    } else {
      const normalized = normalizeProfile(data)
      if (normalized?.authId === authUserId) return normalized
      if (normalized) return normalized
    }

    await new Promise((resolve) => window.setTimeout(resolve, 350))
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const refreshProfile = useCallback(async () => {
    const currentUser = authUser
    if (!currentUser) {
      setProfile(null)
      return null
    }

    try {
      const nextProfile = await fetchProfileWithRetry(currentUser.id)
      setProfile(nextProfile)
      setError(null)
      return nextProfile
    } catch (e) {
      setError(e)
      setProfile(null)
      return null
    }
  }, [authUser])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!mounted) return

      if (sessionError) {
        setError(sessionError)
      }

      const currentSession = data.session ?? null
      setSession(currentSession)
      setAuthUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        try {
          const nextProfile = await fetchProfileWithRetry(currentSession.user.id)
          if (!mounted) return
          setProfile(nextProfile)
        } catch (e) {
          if (!mounted) return
          setError(e)
        }
      }

      if (mounted) {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setAuthUser(nextSession?.user ?? null)

      if (!nextSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      void fetchProfileWithRetry(nextSession.user.id)
        .then((nextProfile) => {
          setProfile(nextProfile)
          setError(null)
        })
        .catch((e) => {
          setProfile(null)
          setError(e)
        })
        .finally(() => {
          setLoading(false)
        })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async ({ email, password, nombre, kioscoNombre }: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          kiosco_nombre: kioscoNombre,
        },
      },
    })

    if (error) throw error

    return {
      needsEmailConfirmation: !data.session,
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authUser,
      profile,
      loading,
      error,
      isAuthenticated: Boolean(session?.user),
      refreshProfile,
      signIn,
      signUp,
      signOut,
    }),
    [authUser, error, loading, profile, refreshProfile, session, signIn, signOut, signUp]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
