import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  isPasswordRecovery: boolean
  refreshProfile: () => Promise<AppProfile | null>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const initializedRef = useRef(false)
  const authUserRef = useRef<User | null>(null)
  const profileRef = useRef<AppProfile | null>(null)

  useEffect(() => {
    authUserRef.current = authUser
  }, [authUser])

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

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
        initializedRef.current = true
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
        setSession(nextSession ?? null)
        setAuthUser(nextSession?.user ?? null)
        initializedRef.current = true
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false)
      }

      setSession(nextSession ?? null)
      setAuthUser(nextSession?.user ?? null)

      if (!nextSession?.user) {
        setProfile(null)
        initializedRef.current = true
        setLoading(false)
        return
      }

      // Después de la carga inicial, no bloquees toda la app por eventos de sesión
      // del mismo usuario (ej. refresh de token al volver foco).
      if (
        initializedRef.current &&
        authUserRef.current?.id === nextSession.user.id
      ) {
        if (!profileRef.current) {
          void fetchProfileWithRetry(nextSession.user.id)
            .then((nextProfile) => {
              setProfile(nextProfile)
              setError(null)
            })
            .catch((e) => {
              setError(e)
            })
        }
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
          initializedRef.current = true
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

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authUser,
      profile,
      loading,
      error,
      isAuthenticated: Boolean(session?.user),
      isPasswordRecovery,
      refreshProfile,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
    }),
    [authUser, error, isPasswordRecovery, loading, profile, refreshProfile, resetPassword, session, signIn, signOut, signUp, updatePassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
