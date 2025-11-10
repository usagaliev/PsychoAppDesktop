import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../config/prisma'

const diagnosticsRouter = Router()

const createSchema = z.object({
  goalSummary: z.string().min(1),
  valueScore: z.number().min(0).max(10),
  planScore: z.number().min(0).max(10),
  selfScore: z.number().min(0).max(10),
  userId: z.string().optional(),
  goalId: z.string().optional(),
})

diagnosticsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.diagnosticsResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        goal: true,
      },
    })

    res.json({
      items,
      meta: { count: items.length },
    })
  }),
)

diagnosticsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body)

    const motivationIndex = computeMotivationIndex(payload)
    const weakest = weakestComponent(payload)

    const item = await prisma.diagnosticsResult.create({
      data: {
        goalSummary: payload.goalSummary,
        valueScore: payload.valueScore,
        planScore: payload.planScore,
        selfScore: payload.selfScore,
        motivationIndex,
        weakestComponent: weakest,
        ...(payload.userId ? { userId: payload.userId } : {}),
        ...(payload.goalId ? { goalId: payload.goalId } : {}),
      },
    })

    res.status(201).json({ item, motivationIndex, weakest })
  }),
)

const computeMotivationIndex = (data: {
  valueScore: number
  planScore: number
  selfScore: number
}) => {
  const { valueScore, planScore, selfScore } = data
  return Math.round((valueScore * planScore * selfScore) / 10)
}

const weakestComponent = (data: {
  valueScore: number
  planScore: number
  selfScore: number
}): 'VALUE' | 'PLAN' | 'SELF' => {
  const scores = {
    VALUE: data.valueScore,
    PLAN: data.planScore,
    SELF: data.selfScore,
  }
  return (Object.keys(scores) as Array<'VALUE' | 'PLAN' | 'SELF'>).reduce((acc, key) =>
    scores[key] < scores[acc] ? key : acc,
  )
}

export { diagnosticsRouter }
