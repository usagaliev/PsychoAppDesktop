import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../config/prisma'
import { requireUser } from '../../middleware/auth'

const supportRouter = Router()

const upsertSchema = z.object({
  supporters: z.array(z.string()),
  commitments: z.array(z.string()),
  notes: z.string().optional(),
})

supportRouter.use(requireUser)

supportRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const plan = await prisma.supportPlan.findFirst({
      where: { userId: req.userId! },
    })

    res.json({ item: plan })
  }),
)

supportRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const payload = upsertSchema.parse(req.body)

    const updateData = {
      supporters: payload.supporters,
      commitments: payload.commitments,
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    }

    const createData = {
      userId: req.userId!,
      supporters: payload.supporters,
      commitments: payload.commitments,
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    }

    const item = await prisma.supportPlan.upsert({
      where: { userId: req.userId! },
      update: updateData,
      create: createData,
    })

    res.json({ item })
  }),
)

export { supportRouter }
