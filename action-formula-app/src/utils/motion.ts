import type { MotionProps } from 'framer-motion'

type RevealDirection = 'up' | 'down' | 'left' | 'right'

type RevealOptions = {
  delay?: number
  distance?: number
  direction?: RevealDirection
  once?: boolean
}

const easeElegant = [0.22, 1, 0.36, 1] as const

const createOffset = (direction: RevealDirection, distance: number) => {
  switch (direction) {
    case 'down':
      return { y: -distance }
    case 'left':
      return { x: distance }
    case 'right':
      return { x: -distance }
    case 'up':
    default:
      return { y: distance }
  }
}

export const buildRevealMotion = (
  prefersReducedMotion: boolean,
  { delay = 0, distance = 32, direction = 'up', once = false }: RevealOptions = {},
): MotionProps => {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1, x: 0, y: 0 },
      whileInView: { opacity: 1, x: 0, y: 0 },
    }
  }

  const offset = createOffset(direction, distance)

  return {
    initial: { opacity: 0, ...offset },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: { once, margin: '-15% 0px' },
    transition: {
      duration: 0.9,
      ease: easeElegant,
      delay,
    },
  }
}

export const buildFadeMotion = (prefersReducedMotion: boolean, delay = 0): MotionProps => {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
    }
  }

  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: 0.6,
      delay,
      ease: easeElegant,
    },
  }
}

export const transitionElegant = {
  duration: 0.6,
  ease: easeElegant,
}


