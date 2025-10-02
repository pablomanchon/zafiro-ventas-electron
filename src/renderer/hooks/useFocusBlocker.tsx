// src/hooks/useFocusBlocker.ts
import { useEffect } from 'react'

type Options = {
  /** Selector para permitir foco en ciertos nodos (por si lo necesitás). Default: ninguno */
  allowSelector?: string | null
}

/**
 * Evita que cualquier elemento dentro de rootRef tome foco.
 * - Previene el focus en mousedown (sin impedir el click)
 * - Si algo llega a focusearse (focusin), lo blurrea y devuelve el foco al root
 * - Bloquea Enter/Espacio en <a>/<button> para que no se "clickéen" por estar enfocados
 */
export function useFocusBlocker(rootRef: React.RefObject<HTMLElement>, opts: Options = {}) {
  const { allowSelector = null } = opts

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const isAllowed = (el: HTMLElement | null) =>
      !!(allowSelector && el?.closest(allowSelector))

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      if (isAllowed(t)) return
      // Evita que el mousedown mueva el foco (el click igual se dispara)
      e.preventDefault()
      // Reafirmamos foco en el root para que las teclas sigan funcionando
      ;(root as HTMLElement).focus?.()
    }

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      if (isAllowed(t)) return
      // Si por cualquier motivo entró el foco, lo sacamos
      t.blur?.()
      ;(root as HTMLElement).focus?.()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      if (isAllowed(t)) return
      // Si por foco residual se presiona Enter/Espacio sobre botones/links, no dispares click
      if ((e.key === 'Enter' || e.key === ' ') && t.closest('a,button,[role="button"]')) {
        e.preventDefault()
      }
    }

    root.addEventListener('mousedown', onMouseDown, true)
    root.addEventListener('focusin', onFocusIn, true)
    root.addEventListener('keydown', onKeyDown, true)

    return () => {
      root.removeEventListener('mousedown', onMouseDown, true)
      root.removeEventListener('focusin', onFocusIn, true)
      root.removeEventListener('keydown', onKeyDown, true)
    }
  }, [rootRef, allowSelector])
}
