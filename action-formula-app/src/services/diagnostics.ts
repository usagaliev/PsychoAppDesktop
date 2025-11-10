import { http } from './http'

export type FormulaComponent = 'VALUE' | 'PLAN' | 'SELF'

export type DiagnosticsPayload = {
  goalSummary: string
  valueScore: number
  planScore: number
  selfScore: number
  goalId?: string
}

export type DiagnosticsResult = {
  id: string
  goalSummary: string
  valueScore: number
  planScore: number
  selfScore: number
  motivationIndex: number
  weakestComponent: FormulaComponent
  goalId?: string | null
  createdAt: string
}

export const fetchDiagnostics = () => http<{ items: DiagnosticsResult[] }>('/diagnostics')

export const createDiagnostics = (payload: DiagnosticsPayload) =>
  http<{ item: DiagnosticsResult; motivationIndex: number; weakest: FormulaComponent }>('/diagnostics', {
    method: 'POST',
    body: payload,
  })
