import dotenv from 'dotenv'
import path from 'node:path'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'

dotenv.config({ path: path.resolve(process.cwd(), envFile) })

type Env = {
  PORT: number
  DATABASE_URL?: string
  CLIENT_ORIGIN?: string
  NODE_ENV: 'development' | 'production' | 'test'
}

const raw = {
  PORT: process.env.PORT ?? '4000',
  DATABASE_URL: process.env.DATABASE_URL,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as Env['NODE_ENV'],
}

export const env: Env = {
  PORT: Number(raw.PORT) || 4000,
  NODE_ENV: raw.NODE_ENV,
  ...(raw.CLIENT_ORIGIN ? { CLIENT_ORIGIN: raw.CLIENT_ORIGIN } : {}),
  ...(raw.DATABASE_URL ? { DATABASE_URL: raw.DATABASE_URL } : {}),
}
