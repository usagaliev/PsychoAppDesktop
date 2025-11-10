import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../config/prisma'

const goalsRouter = Router()

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  targetDate: z.coerce.date().optional(),
  userId: z.string().optional(),
})

const updateSchema = createSchema.partial()

goalsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.query.userId?.toString()

    const items = await prisma.goal.findMany({
      ...(userId ? { where: { userId } } : {}),
      orderBy: { createdAt: 'desc' },
    })

    res.json({ items, meta: { count: items.length } })
  }),
)

const buildGoalCreateData = (payload: z.infer<typeof createSchema>) => ({
  title: payload.title,
  status: payload.status ?? 'PLANNED',
  ...(payload.description !== undefined ? { description: payload.description } : {}),
  ...(payload.targetDate !== undefined ? { targetDate: payload.targetDate } : {}),
  ...(payload.userId !== undefined ? { userId: payload.userId } : {}),
})

goalsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body)

    const item = await prisma.goal.create({
      data: buildGoalCreateData(payload),
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

    const existing = await prisma.goal.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ message: 'Goal not found' })
    }

    const data = {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.targetDate !== undefined ? { targetDate: payload.targetDate } : {}),
      ...(payload.userId !== undefined ? { userId: payload.userId } : {}),
    }

    const item = await prisma.goal.update({
      where: { id },
      data,
    })

    res.json({ item })
  }),
)

export { goalsRouter }
