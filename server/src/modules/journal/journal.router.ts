import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../config/prisma'

const journalRouter = Router()

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  templateKey: z.string().optional(),
  userId: z.string().optional(),
})

const updateSchema = createSchema.partial()

journalRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.journalEntry.findMany({
      orderBy: { createdAt: 'desc' },
    })

    res.json({ items, meta: { count: items.length } })
  }),
)

journalRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body)

    const item = await prisma.journalEntry.create({
      data: {
        title: payload.title,
        content: payload.content,
        ...(payload.templateKey !== undefined ? { templateKey: payload.templateKey } : {}),
        ...(payload.userId !== undefined ? { userId: payload.userId } : {}),
      },
    })

    res.status(201).json({ item })
  }),
)

journalRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ message: 'Entry id is required' })
    }

    const payload = updateSchema.parse(req.body)

    const existing = await prisma.journalEntry.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ message: 'Entry not found' })
    }

    const data = {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.content !== undefined ? { content: payload.content } : {}),
      ...(payload.templateKey !== undefined ? { templateKey: payload.templateKey } : {}),
      ...(payload.userId !== undefined ? { userId: payload.userId } : {}),
    }

    const item = await prisma.journalEntry.update({
      where: { id },
      data,
    })

    res.json({ item })
  }),
)

journalRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ message: 'Entry id is required' })
    }

    const existing = await prisma.journalEntry.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ message: 'Entry not found' })
    }

    await prisma.journalEntry.delete({ where: { id } })

    res.json({ item: existing })
  }),
)

export { journalRouter }
