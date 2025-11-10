import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../config/prisma'

const supportRouter = Router()

const upsertSchema = z.object({
  supporters: z.array(z.string()),
  commitments: z.array(z.string()),
  notes: z.string().optional(),
  userId: z.string().optional(),
})

supportRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.query.userId?.toString()

    const plan = await prisma.supportPlan.findFirst({
      ...(userId ? { where: { userId } } : {}),
    })

    res.json({ item: plan })
  }),
)

supportRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const payload = upsertSchema.parse(req.body)

    const where = payload.userId ? { userId: payload.userId } : { id: 'default-plan' }

    const updateData = {
      supporters: payload.supporters,
      commitments: payload.commitments,
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    }

    const createData = {
      supporters: payload.supporters,
      commitments: payload.commitments,
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.userId ? { userId: payload.userId } : { id: 'default-plan' }),
    }

    const item = await prisma.supportPlan.upsert({
      where,
      update: updateData,
      create: createData,
    })

    res.json({ item })
  }),
)

export { supportRouter }
