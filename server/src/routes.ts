import { Router } from 'express'

import { diagnosticsRouter } from './modules/diagnostics/diagnostics.router'
import { journalRouter } from './modules/journal/journal.router'
import { supportRouter } from './modules/support/support.router'
import { goalsRouter } from './modules/goals/goals.router'

export const router = Router()

router.get('/', (_req, res) => {
  res.json({
    name: 'Action Formula API',
    version: '1.0.0',
    endpoints: ['/diagnostics', '/journal', '/support', '/goals'],
  })
})

router.use('/diagnostics', diagnosticsRouter)
router.use('/journal', journalRouter)
router.use('/support', supportRouter)
router.use('/goals', goalsRouter)
