import type { Request, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '../config/env'

type TokenPayload = {
  userId: string
  iat: number
  exp: number
}

const extractToken = (req: Request): string | undefined => {
  const cookieName = env.SESSION_COOKIE_NAME
  return req.cookies?.[cookieName]
}

export const optionalUser: RequestHandler = (req, _res, next) => {
  const token = extractToken(req)

  if (!token) {
    if (req.userId) {
      delete req.userId
    }
    return next()
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload
    req.userId = payload.userId
  } catch {
    if (req.userId) {
      delete req.userId
    }
  }

  return next()
}

export const requireUser: RequestHandler = (req, res, next) => {
  if (!req.userId) {
    const token = extractToken(req)
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload
      req.userId = payload.userId
    } catch {
      if (req.userId) {
        delete req.userId
      }
      return res.status(401).json({ message: 'Unauthorized' })
    }
  }

  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  return next()
}

