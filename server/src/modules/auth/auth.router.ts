import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

import { env } from '../../config/env'
import { prisma } from '../../config/prisma'
import { asyncHandler } from '../../utils/asyncHandler'
import { optionalUser, requireUser } from '../../middleware/auth'

const authRouter = Router()

const googleClient = new OAuth2Client({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
})

const googlePayloadSchema = z.object({
  idToken: z.string().min(1, 'Missing Google id token'),
})

const serializeUser = (user: {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
})

authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { idToken } = googlePayloadSchema.parse(req.body)

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (!payload?.sub || !payload.email) {
      return res.status(400).json({ message: 'Unable to verify Google credentials' })
    }

    const user = await prisma.user.upsert({
      where: { googleId: payload.sub },
      update: {
        email: payload.email,
        name: payload.name ?? null,
        avatarUrl: payload.picture ?? null,
      },
      create: {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? null,
        avatarUrl: payload.picture ?? null,
      },
    })

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' })

    const isProduction = env.NODE_ENV === 'production'

    res
      .cookie(env.SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ user: serializeUser(user) })
  }),
)

authRouter.get(
  '/me',
  optionalUser,
  asyncHandler(async (req, res) => {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    })

    if (!user) {
      res.clearCookie(env.SESSION_COOKIE_NAME)
      return res.status(401).json({ message: 'Unauthorized' })
    }

    res.json({ user: serializeUser(user) })
  }),
)

authRouter.post(
  '/logout',
  requireUser,
  asyncHandler(async (req, res) => {
    const isProduction = env.NODE_ENV === 'production'

    res.clearCookie(env.SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    })

    res.json({ success: true })
  }),
)

export { authRouter }

