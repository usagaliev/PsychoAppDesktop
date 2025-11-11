import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { transitionElegant } from '../utils/motion'

export const AppLayout = () => {
  const location = useLocation()
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <AnimatePresence mode="wait">
          {prefersReducedMotion ? (
            <div key={location.pathname} className="app-page">
              <Outlet />
            </div>
          ) : (
            <motion.div
              key={location.pathname}
              className="app-page"
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -36 }}
              transition={{ ...transitionElegant, duration: 0.75 }}
            >
              <Outlet />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
