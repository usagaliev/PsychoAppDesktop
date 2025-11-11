import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../config/prisma'
import { requireUser } from '../../middleware/auth'

const goalsRouter = Router()

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_TIMEZONE = 'UTC'

const createSchema = z.object({
  title: z.string().min(1, 'Название цели обязательно'),
  description: z.string().trim().optional(),
  targetDate: z.coerce.date().optional(),
  timezone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
})

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().trim().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  targetDate: z.coerce.date().optional().nullable(),
})

const dayLogSchema = z.object({
  date: z.coerce.date().optional(),
  completed: z.boolean().optional(),
  reflection: z.string().trim().max(2000).optional(),
  journalEntry: z
    .object({
      title: z.string().min(1),
      content: z.string().min(1),
      templateKey: z.string().trim().optional(),
    })
    .optional(),
  microActions: z
    .array(
      z.object({
        id: z.string().min(1),
        completed: z.boolean(),
      }),
    )
    .optional(),
})

const microActionCreateSchema = z.object({
  title: z.string().min(1, 'Название микро-действия обязательно'),
  description: z.string().trim().optional(),
  orderIndex: z.number().int().min(0).optional(),
})

const microActionUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
})

goalsRouter.use(requireUser)

const getSafeTimezone = (value?: string) => {
  if (!value) return DEFAULT_TIMEZONE
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return DEFAULT_TIMEZONE
  }
}

const startOfDayInTimezone = (date: Date, timezone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const lookup: Record<string, string> = {}
  for (const part of parts) {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      lookup[part.type] = part.value
    }
  }
  const year = Number(lookup.year)
  const month = Number(lookup.month)
  const day = Number(lookup.day)
  return new Date(Date.UTC(year, month - 1, day))
}

const addDays = (date: Date, amount: number) => new Date(date.getTime() + amount * DAY_MS)

const differenceInDays = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY_MS)

const normalizeDate = (value: Date) => {
  const normalized = new Date(value)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

const calculateStreaks = (logs: Array<{ date: Date; completed: boolean }>, today: Date) => {
  const sortedAsc = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime())
  const sortedDesc = [...logs].sort((a, b) => b.date.getTime() - a.date.getTime())

  let longest = 0
  let running = 0
  let prev: Date | null = null

  for (const log of sortedAsc) {
    if (!log.completed) {
      running = 0
      prev = null
      continue
    }

    if (!prev) {
      running = 1
    } else {
      const diff = differenceInDays(log.date, prev)
      running = diff === 1 ? running + 1 : 1
    }

    if (running > longest) {
      longest = running
    }
    prev = log.date
  }

  let currentStreak = 0
  let expected = normalizeDate(today)

  for (const log of sortedDesc) {
    if (!log.completed) {
      break
    }

    const diff = differenceInDays(expected, log.date)

    if (diff === 0) {
      currentStreak += 1
      expected = addDays(expected, -1)
      continue
    }

    if (diff === 1) {
      currentStreak += 1
      expected = addDays(log.date, -1)
      continue
    }

    break
  }

  return { currentStreak, longestStreak: Math.max(longest, currentStreak) }
}

const buildCalendarDays = (
  startDate: Date,
  today: Date,
  logs: Array<{ date: Date; completed: boolean; reflection: string | null; journalEntryId: string | null }>,
) => {
  const normalizedLogs = logs.map((log) => ({
    ...log,
    date: normalizeDate(log.date),
  }))
  const map = new Map<number, (typeof normalizedLogs)[number]>()
  normalizedLogs.forEach((log) => {
    map.set(log.date.getTime(), log)
  })

  const calendar: Array<{
    date: string
    completed: boolean
    reflection: string | null
    journalEntryId: string | null
  }> = []

  const totalDays = Math.max(1, differenceInDays(today, startDate) + 1)
  for (let i = 0; i < totalDays; i += 1) {
    const current = addDays(startDate, i)
    const key = current.getTime()
    const log = map.get(key)
    calendar.push({
      date: current.toISOString(),
      completed: log?.completed ?? false,
      reflection: log?.reflection ?? null,
      journalEntryId: log?.journalEntryId ?? null,
    })
  }

  return calendar
}

const fetchCurrentGoalSnapshot = async (userId: string) => {
  const goal = await prisma.goal.findFirst({
    where: {
      userId,
      status: { in: ['IN_PROGRESS', 'PLANNED'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      tracking: {
        include: {
          dayLogs: {
            orderBy: { date: 'asc' },
            include: {
              microActionCompletions: { select: { microActionId: true } },
            },
          },
          microActions: {
            orderBy: { orderIndex: 'asc' },
            include: {
              completions: {
                include: {
                  dayLog: { select: { date: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!goal) return null

  if (!goal.tracking) {
    const timezone = DEFAULT_TIMEZONE
    const startDate = startOfDayInTimezone(new Date(), timezone)
    const tracking = await prisma.goalTracking.create({
      data: {
        goalId: goal.id,
        userId,
        timezone,
        startDate,
      },
    })

    await prisma.goalDayLog.create({
      data: {
        trackingId: tracking.id,
        date: startDate,
      },
    })

    return fetchCurrentGoalSnapshot(userId)
  }

  const timezone = goal.tracking.timezone ?? DEFAULT_TIMEZONE
  const startDate = normalizeDate(goal.tracking.startDate)
  const today = startOfDayInTimezone(new Date(), timezone)

  const logs = goal.tracking.dayLogs.map((log) => ({
    id: log.id,
    date: normalizeDate(log.date),
    completed: log.completed,
    reflection: log.reflection ?? null,
    journalEntryId: log.journalEntryId ?? null,
  }))

  const { currentStreak, longestStreak } = calculateStreaks(logs, today)
  const completedDays = logs.filter((log) => log.completed).length
  const totalDays = Math.max(1, differenceInDays(today, startDate) + 1)
  const completionRate = Math.round((completedDays / totalDays) * 100)
  const lastCompletedAt =
    logs
      .filter((log) => log.completed)
      .map((log) => log.date)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

  await prisma.goalTracking.update({
    where: { id: goal.tracking.id },
    data: {
      currentStreak,
      longestStreak,
      lastCompletedAt,
    },
  })

  const calendar = buildCalendarDays(startDate, today, logs)

  const microActions = goal.tracking.microActions
    .filter((action) => action.isActive)
    .map((action) => {
      const completionDates = action.completions
        .map((completion) => completion.dayLog?.date)
        .filter((date): date is Date => Boolean(date))
        .map((date) => normalizeDate(date))

      const completionCount = completionDates.length
      const lastCompletedAtDate =
        completionDates.length > 0
          ? [...completionDates].sort((a, b) => b.getTime() - a.getTime())[0]
          : null
      const completedToday = completionDates.some(
        (completion) => differenceInDays(today, completion) === 0,
      )

      return {
        id: action.id,
        title: action.title,
        description: action.description,
        orderIndex: action.orderIndex,
        completionCount,
        completedToday,
        lastCompletedAt: lastCompletedAtDate ? lastCompletedAtDate.toISOString() : null,
      }
    })

  return {
    goal: {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      targetDate: goal.targetDate,
      createdAt: goal.createdAt,
    },
    tracking: {
      id: goal.tracking.id,
      timezone,
      startDate: startDate.toISOString(),
      currentStreak,
      longestStreak,
      completedDays,
      totalDays,
      completionRate,
      lastCompletedAt: lastCompletedAt ? lastCompletedAt.toISOString() : null,
      calendar,
      microActions,
    },
  }
}

const buildGoalCreateData = (payload: z.infer<typeof createSchema>, userId: string) => ({
  title: payload.title,
  status: 'IN_PROGRESS' as const,
  description: payload.description ?? null,
  targetDate: payload.targetDate ?? null,
  userId,
})

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

goalsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body)

    const goal = await prisma.goal.create({
      data: buildGoalCreateData(payload, req.userId!),
    })

    const timezone = getSafeTimezone(payload.timezone)
    const startDate = startOfDayInTimezone(new Date(), timezone)

    const tracking = await prisma.goalTracking.create({
      data: {
        goalId: goal.id,
        userId: req.userId!,
        timezone,
        startDate,
      },
    })

    await prisma.goalDayLog.create({
      data: {
        trackingId: tracking.id,
        date: startDate,
      },
    })

    const snapshot = await fetchCurrentGoalSnapshot(req.userId!)

    res.status(201).json({ item: snapshot })
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

    const data: Record<string, unknown> = {}

    if (payload.title !== undefined) {
      data.title = payload.title
    }
    if (payload.description !== undefined) {
      data.description = payload.description
    }
    if (payload.status !== undefined) {
      data.status = payload.status
    }
    if (payload.targetDate !== undefined) {
      data.targetDate = payload.targetDate ?? null
    }

    const item = await prisma.goal.update({
      where: { id },
      data,
    })

    res.json({ item })
  }),
)

goalsRouter.get(
  '/current',
  asyncHandler(async (req, res) => {
    const snapshot = await fetchCurrentGoalSnapshot(req.userId!)
    res.json({ item: snapshot })
  }),
)

goalsRouter.post(
  '/:id/day-log',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ message: 'Goal id is required' })
    }

    const payload = dayLogSchema.parse(req.body)

    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
      include: {
        tracking: true,
      },
    })

    if (!goal) {
      return res.status(404).json({ message: 'Goal не найден' })
    }

    if (!goal.tracking) {
      await fetchCurrentGoalSnapshot(req.userId!)
    }

    const tracking = await prisma.goalTracking.findFirst({
      where: { goalId: id, userId: req.userId! },
    })

    if (!tracking) {
      return res.status(404).json({ message: 'Трекинг цели не найден' })
    }

    const timezone = tracking.timezone ?? DEFAULT_TIMEZONE
    const targetDate = payload.date
      ? startOfDayInTimezone(payload.date, timezone)
      : startOfDayInTimezone(new Date(), timezone)

    const existingLog = await prisma.goalDayLog.findUnique({
      where: {
        trackingId_date: {
          trackingId: tracking.id,
          date: targetDate,
        },
      },
      include: {
        journalEntry: true,
      },
    })

    let journalEntryId = existingLog?.journalEntryId ?? null

    if (payload.journalEntry) {
      if (journalEntryId) {
        await prisma.journalEntry.update({
          where: { id: journalEntryId },
          data: {
            title: payload.journalEntry.title,
            content: payload.journalEntry.content,
            templateKey: payload.journalEntry.templateKey ?? null,
          },
        })
      } else {
        const newEntry = await prisma.journalEntry.create({
          data: {
            userId: req.userId!,
            title: payload.journalEntry.title,
            content: payload.journalEntry.content,
            templateKey: payload.journalEntry.templateKey ?? null,
          },
        })
        journalEntryId = newEntry.id
      }
    }

    const dayLog = await prisma.goalDayLog.upsert({
      where: {
        trackingId_date: {
          trackingId: tracking.id,
          date: targetDate,
        },
      },
      create: {
        trackingId: tracking.id,
        date: targetDate,
        completed: payload.completed ?? true,
        reflection: payload.reflection ?? null,
        journalEntryId: journalEntryId ?? null,
      },
      update: {
        ...(payload.completed !== undefined ? { completed: payload.completed } : {}),
        ...(payload.reflection !== undefined ? { reflection: payload.reflection ?? null } : {}),
        ...(journalEntryId ? { journalEntryId } : {}),
      },
    })

    if (payload.microActions && payload.microActions.length > 0) {
      const microActionIds = payload.microActions.map((item) => item.id)
      const ownedMicroActions = await prisma.microAction.findMany({
        where: {
          id: { in: microActionIds },
          goalTrackingId: tracking.id,
          tracking: { userId: req.userId! },
        },
        select: { id: true },
      })
      const ownedSet = new Set(ownedMicroActions.map((item) => item.id))

      await Promise.all(
        payload.microActions.map(async (item) => {
          if (!ownedSet.has(item.id)) return
          if (item.completed) {
            await prisma.microActionCompletion.upsert({
              where: {
                microActionId_dayLogId: {
                  microActionId: item.id,
                  dayLogId: dayLog.id,
                },
              },
              update: {
                completed: true,
              },
              create: {
                microActionId: item.id,
                dayLogId: dayLog.id,
                completed: true,
              },
            })
          } else {
            await prisma.microActionCompletion.deleteMany({
              where: {
                microActionId: item.id,
                dayLogId: dayLog.id,
              },
            })
          }
        }),
      )
    }

    const snapshot = await fetchCurrentGoalSnapshot(req.userId!)

    res.status(200).json({ item: snapshot })
  }),
)

goalsRouter.post(
  '/:id/micro-actions',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ message: 'Goal id is required' })
    }

    const payload = microActionCreateSchema.parse(req.body)

    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
      include: {
        tracking: true,
      },
    })

    if (!goal) {
      return res.status(404).json({ message: 'Goal не найдена' })
    }

    let tracking = goal.tracking

    if (!tracking) {
      await fetchCurrentGoalSnapshot(req.userId!)
      tracking = await prisma.goalTracking.findFirst({
        where: { goalId: id, userId: req.userId! },
      })
    }

    if (!tracking) {
      return res.status(404).json({ message: 'Трекинг цели не найден' })
    }

    const nextOrder =
      payload.orderIndex ??
      (await prisma.microAction.count({
        where: { goalTrackingId: tracking.id },
      }))

    await prisma.microAction.create({
      data: {
        goalTrackingId: tracking.id,
        title: payload.title,
        description: payload.description ?? null,
        orderIndex: nextOrder,
      },
    })

    const snapshot = await fetchCurrentGoalSnapshot(req.userId!)
    res.status(201).json({ item: snapshot })
  }),
)

goalsRouter.patch(
  '/micro-actions/:microActionId',
  asyncHandler(async (req, res) => {
    const { microActionId } = req.params
    if (!microActionId) {
      return res.status(400).json({ message: 'Micro action id is required' })
    }

    const payload = microActionUpdateSchema.parse(req.body)

    const microAction = await prisma.microAction.findFirst({
      where: {
        id: microActionId,
        tracking: { userId: req.userId! },
      },
      include: {
        tracking: true,
      },
    })

    if (!microAction) {
      return res.status(404).json({ message: 'Микро-действие не найдено' })
    }

    const data: Record<string, unknown> = {}

    if (payload.title !== undefined) {
      data.title = payload.title
    }
    if (payload.description !== undefined) {
      data.description = payload.description ?? null
    }
    if (payload.isActive !== undefined) {
      data.isActive = payload.isActive
    }
    if (payload.orderIndex !== undefined) {
      data.orderIndex = payload.orderIndex
    }

    if (Object.keys(data).length > 0) {
      await prisma.microAction.update({
        where: { id: microAction.id },
        data,
      })
    }

    const snapshot = await fetchCurrentGoalSnapshot(req.userId!)
    res.json({ item: snapshot })
  }),
)

goalsRouter.delete(
  '/micro-actions/:microActionId',
  asyncHandler(async (req, res) => {
    const { microActionId } = req.params
    if (!microActionId) {
      return res.status(400).json({ message: 'Micro action id is required' })
    }

    const microAction = await prisma.microAction.findFirst({
      where: {
        id: microActionId,
        tracking: { userId: req.userId! },
      },
      include: {
        tracking: true,
      },
    })

    if (!microAction) {
      return res.status(404).json({ message: 'Микро-действие не найдено' })
    }

    await prisma.microActionCompletion.deleteMany({
      where: { microActionId },
    })

    await prisma.microAction.update({
      where: { id: microActionId },
      data: { isActive: false },
    })

    const snapshot = await fetchCurrentGoalSnapshot(req.userId!)
    res.json({ item: snapshot })
  }),
)

export { goalsRouter }
