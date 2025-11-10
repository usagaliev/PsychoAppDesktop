import { createApp } from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`Action Formula API is running on port ${env.PORT}`)
})

const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Closing server...`)
  server.close(async () => {
    await prisma.$disconnect()
    console.log('Server closed gracefully.')
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
