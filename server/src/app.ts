import express from 'express'
import cors from 'cors'

import { env } from './config/env'
import { router } from './routes'

export const createApp = () => {
  const app = express()

  app.use(
    cors({
      origin: env.NODE_ENV === 'production' ? env.CLIENT_ORIGIN ?? false : true,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api', router)

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[UnhandledError]', err)
    res.status(500).json({ message: 'Internal Server Error' })
  })

  return app
}
