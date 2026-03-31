import { useEffect, useState } from 'react'

/**
 * Subscribes to a CSS media query. Safe for SSR / tests (returns `false` until mounted).
 */
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(query)

    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches)
    }

    update(mediaQuery)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }

    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [query])

  return matches
}
