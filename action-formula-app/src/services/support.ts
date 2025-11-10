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
}

export const fetchSupportPlan = () => http<{ item: SupportPlan | null }>('/support')

export const saveSupportPlan = (payload: SupportPayload) =>
  http<{ item: SupportPlan }>('/support', {
    method: 'PUT',
    body: payload,
  })
