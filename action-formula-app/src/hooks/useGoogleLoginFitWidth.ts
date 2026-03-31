import { type RefObject, useLayoutEffect, useState } from 'react'

type Options = {
  /** Минимальная ширина виджета (Google рекомендует не ниже ~200px для кнопки с текстом). */
  min?: number
  /** Верхняя граница, чтобы кнопка не растягивалась слишком широко. */
  max?: number
}

/**
 * Подстраивает ширину GoogleLogin под реальную ширину контейнера (без вылезания за край).
 */
export const useGoogleLoginFitWidth = (
  containerRef: RefObject<HTMLElement | null>,
  options: Options = {},
) => {
  const { min = 200, max = 320 } = options
  const [width, setWidth] = useState(() => Math.min(max, Math.max(min, 280)))

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) {
      return
    }

    const measure = () => {
      const raw = Math.floor(el.getBoundingClientRect().width)
      if (raw <= 0) {
        return
      }
      setWidth(Math.min(max, Math.max(min, raw)))
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, min, max])

  return width
}
