// src/hooks/useAuth.ts
import { useEffect, useState } from "react"

export function useAuth() {
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const t = localStorage.getItem("token")
        setToken(t)
        setLoading(false)
    }, [])

    const isLogged = !!token

    return { token, isLogged, loading }
}
