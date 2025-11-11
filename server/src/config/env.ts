import dotenv from 'dotenv'
import path from 'node:path'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'

dotenv.config({ path: path.resolve(process.cwd(), envFile) })

type NodeEnv = 'development' | 'production' | 'test'

type Env = {
  PORT: number
  DATABASE_URL: string
  CLIENT_ORIGIN?: string
  NODE_ENV: NodeEnv
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  SESSION_COOKIE_NAME: string
  ENABLE_DEV_MOCK_AUTH?: boolean
  DEV_MOCK_USER_ID?: string
  DEV_MOCK_USER_EMAIL?: string
  DEV_MOCK_USER_NAME?: string
}

const ensure = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const rawNodeEnv = (process.env.NODE_ENV ?? 'development') as NodeEnv

const clientOrigin = process.env.CLIENT_ORIGIN
const enableDevMockAuth = process.env.ENABLE_DEV_MOCK_AUTH === 'true'

export const env: Env = {
  PORT: Number(process.env.PORT ?? '4000') || 4000,
  NODE_ENV: rawNodeEnv,
  DATABASE_URL: ensure(process.env.DATABASE_URL, 'DATABASE_URL'),
  ...(clientOrigin ? { CLIENT_ORIGIN: clientOrigin } : {}),
  GOOGLE_CLIENT_ID: ensure(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: ensure(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET'),
  JWT_SECRET: ensure(process.env.JWT_SECRET, 'JWT_SECRET'),
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME ?? 'afc_session',
  ...(enableDevMockAuth
    ? {
        ENABLE_DEV_MOCK_AUTH: true,
        DEV_MOCK_USER_ID: ensure(process.env.DEV_MOCK_USER_ID, 'DEV_MOCK_USER_ID'),
        DEV_MOCK_USER_EMAIL: ensure(process.env.DEV_MOCK_USER_EMAIL, 'DEV_MOCK_USER_EMAIL'),
        DEV_MOCK_USER_NAME: process.env.DEV_MOCK_USER_NAME ?? 'Dev User',
      }
    : {}),
}
