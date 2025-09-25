// 👇 fuerza a TypeScript a cargar la augmentación global del preload
import type {} from '../types/preload'  // <- SIN .d.ts y solo 'type' import

import { useEffect, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchProducts } from '../store/productsSlice'

const DEBOUNCE_MS = 200

export function useProducts() {
  const dispatch = useAppDispatch()
  const { items, loading, error } = useAppSelector(state => state.products)

  const timer = useRef<number | null>(null)
  const debouncedFetch = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      dispatch(fetchProducts())
      timer.current = null
    }, DEBOUNCE_MS)
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  useEffect(() => {
    if (!window?.entityEvents) return

    const unsub = window.entityEvents.on('productos:changed', () => {
      debouncedFetch()
    }) as (() => void) | void

    const onFocus = () => debouncedFetch()
    const onVis = () => { if (document.visibilityState === 'visible') debouncedFetch() }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      if (typeof unsub === 'function') unsub()
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [debouncedFetch])

  return { products: items, loading, error }
}
