import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../config/prisma'
import { requireUser } from '../../middleware/auth'

const diagnosticsRouter = Router()

const createSchema = z.object({
  goalSummary: z.string().min(1),
  valueScore: z.number().min(0).max(10),
  planScore: z.number().min(0).max(10),
  selfScore: z.number().min(0).max(10),
  goalId: z.string().optional(),
})

diagnosticsRouter.use(requireUser)

diagnosticsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.diagnosticsResult.findMany({
      where: { userId: req.userId! },
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

    if (payload.goalId) {
      const goal = await prisma.goal.findFirst({
        where: {
          id: payload.goalId,
          userId: req.userId!,
        },
        select: { id: true },
      })

      if (!goal) {
        return res.status(400).json({ message: 'Goal reference is invalid' })
      }
    }

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
        userId: req.userId!,
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
