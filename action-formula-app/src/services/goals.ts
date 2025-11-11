import { http } from './http'

export type GoalSnapshot = {
  goal: {
    id: string
    title: string
    description: string | null
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
    targetDate: string | null
    createdAt: string
  }
  tracking: {
    id: string
    timezone: string
    startDate: string
    currentStreak: number
    longestStreak: number
    completedDays: number
    totalDays: number
    completionRate: number
    lastCompletedAt: string | null
    calendar: Array<{
      date: string
      completed: boolean
      reflection: string | null
      journalEntryId: string | null
    }>
    microActions: Array<{
      id: string
      title: string
      description: string | null
      orderIndex: number
      completionCount: number
      completedToday: boolean
      lastCompletedAt: string | null
    }>
  }
}

export type CreateGoalPayload = {
  title: string
  description?: string
  targetDate?: string
  timezone?: string
}

export type DayLogPayload = {
  date?: string
  completed?: boolean
  reflection?: string
  journalEntry?: {
    title: string
    content: string
    templateKey?: string
  }
  microActions?: Array<{
    id: string
    completed: boolean
  }>
}

export const fetchCurrentGoal = () =>
  http<{ item: GoalSnapshot | null }>('/goals/current')

export const createGoal = (payload: CreateGoalPayload) =>
  http<{ item: GoalSnapshot | null }>('/goals', {
    method: 'POST',
    body: payload,
  })

export const logGoalDay = (goalId: string, payload: DayLogPayload) =>
  http<{ item: GoalSnapshot | null }>(`/goals/${goalId}/day-log`, {
    method: 'POST',
    body: payload,
  })

export type MicroActionCreatePayload = {
  title: string
  description?: string
  orderIndex?: number
}

export type MicroActionUpdatePayload = {
  title?: string
  description?: string
  isActive?: boolean
  orderIndex?: number
}

export const createMicroAction = (goalId: string, payload: MicroActionCreatePayload) =>
  http<{ item: GoalSnapshot | null }>(`/goals/${goalId}/micro-actions`, {
    method: 'POST',
    body: payload,
  })

export const updateMicroAction = (microActionId: string, payload: MicroActionUpdatePayload) =>
  http<{ item: GoalSnapshot | null }>(`/goals/micro-actions/${microActionId}`, {
    method: 'PATCH',
    body: payload,
  })

export const deleteMicroAction = (microActionId: string) =>
  http<{ item: GoalSnapshot | null }>(`/goals/micro-actions/${microActionId}`, {
    method: 'DELETE',
  })


