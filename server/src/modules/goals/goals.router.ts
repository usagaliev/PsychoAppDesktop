import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../config/prisma'
import { requireUser } from '../../middleware/auth'

const goalsRouter = Router()

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  targetDate: z.coerce.date().optional(),
})

const updateSchema = createSchema.partial()

goalsRouter.use(requireUser)

goalsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.goal.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ items, meta: { count: items.length } })
  }),
)

const buildGoalCreateData = (payload: z.infer<typeof createSchema>, userId: string) => ({
  title: payload.title,
  status: payload.status ?? 'PLANNED',
  ...(payload.description !== undefined ? { description: payload.description } : {}),
  ...(payload.targetDate !== undefined ? { targetDate: payload.targetDate } : {}),
  userId,
})

goalsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body)

    const item = await prisma.goal.create({
      data: buildGoalCreateData(payload, req.userId!),
    })

    res.status(201).json({ item })
  }),
)

goalsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ message: 'Goal id is required' })
    }

    const payload = updateSchema.parse(req.body)

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
    })
    if (!existing) {
      return res.status(404).json({ message: 'Goal not found' })
    }

    const data = {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.targetDate !== undefined ? { targetDate: payload.targetDate } : {}),
    }

    const item = await prisma.goal.update({
      where: { id },
      data,
    })

    res.json({ item })
  }),
)

export { goalsRouter }
