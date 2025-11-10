import { Router } from 'express'

import { diagnosticsRouter } from './modules/diagnostics/diagnostics.router'
import { journalRouter } from './modules/journal/journal.router'
import { supportRouter } from './modules/support/support.router'
import { goalsRouter } from './modules/goals/goals.router'
import { authRouter } from './modules/auth/auth.router'

export const router = Router()

router.get('/', (_req, res) => {
  res.json({
    name: 'Action Formula API',
    version: '1.0.0',
    endpoints: ['/auth', '/diagnostics', '/journal', '/support', '/goals'],
  })
})

router.use('/auth', authRouter)
router.use('/diagnostics', diagnosticsRouter)
router.use('/journal', journalRouter)
router.use('/support', supportRouter)
router.use('/goals', goalsRouter)
