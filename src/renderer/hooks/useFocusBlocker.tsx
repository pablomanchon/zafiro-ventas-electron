import { useEffect } from 'react'

type Options = {
  allowSelector?: string | null
}

export function useFocusBlocker(rootRef: React.RefObject<HTMLElement>, opts: Options = {}) {
  const { allowSelector = null } = opts

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let restoringFocus = false

    const isAllowed = (el: HTMLElement | null) =>
      !!(allowSelector && el?.closest(allowSelector))

    const focusRootSafely = () => {
      if (restoringFocus) return
      if (document.activeElement === root) return

      restoringFocus = true
      requestAnimationFrame(() => {
        root.focus?.()
        restoringFocus = false
      })
    }

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      if (t === root) return
      if (isAllowed(t)) return

      e.preventDefault()
      focusRootSafely()
    }

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      if (t === root) return
      if (isAllowed(t)) return

      t.blur?.()
      focusRootSafely()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (!root.contains(t)) return
      if (t === root) return
      if (isAllowed(t)) return

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
