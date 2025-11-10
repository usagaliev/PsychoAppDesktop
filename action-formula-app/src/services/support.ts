import { http } from './http'

export type SupportPlan = {
  id: string
  supporters: string[]
  commitments: string[]
  notes?: string | null
  updatedAt: string
}

export type SupportPayload = {
  supporters: string[]
  commitments: string[]
  notes?: string
  userId?: string
}

export const fetchSupportPlan = (params?: { userId?: string }) =>
  http<{ item: SupportPlan | null }>(`/support${params?.userId ? `?userId=${params.userId}` : ''}`)

export const saveSupportPlan = (payload: SupportPayload) =>
  http<{ item: SupportPlan }>('/support', {
    method: 'PUT',
    body: payload,
  })
