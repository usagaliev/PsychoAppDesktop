import { http } from './http'

export type JournalEntry = {
  id: string
  title: string
  content: string
  templateKey?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateJournalEntryPayload = {
  title: string
  content: string
  templateKey?: string
  userId?: string
}

export const fetchJournalEntries = () => http<{ items: JournalEntry[] }>('/journal')

export const createJournalEntry = (payload: CreateJournalEntryPayload) =>
  http<{ item: JournalEntry }>('/journal', {
    method: 'POST',
    body: payload,
  })

export const updateJournalEntry = (id: string, payload: Partial<CreateJournalEntryPayload>) =>
  http<{ item: JournalEntry }>(`/journal/${id}`, {
    method: 'PUT',
    body: payload,
  })

export const deleteJournalEntry = (id: string) =>
  http<{ item: JournalEntry }>(`/journal/${id}`, {
    method: 'DELETE',
  })
