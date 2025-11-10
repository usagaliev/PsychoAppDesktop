import { useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { createDiagnostics, type FormulaComponent } from '../services/diagnostics'

const initialScores = {
  value: 6,
  plan: 4,
  self: 5,
}

type ScoreKey = keyof typeof initialScores

const labels: Record<ScoreKey, string> = {
  value: 'Ценность награды',
  plan: 'Вера в план',
  self: 'Вера в себя',
}

const recommendations: Record<ScoreKey, string> = {
  value: 'Вернитесь к вопросам «зачем», проведите упражнение «5 зачем» и обновите карту ценностей.',
  plan: 'Декомпозируйте цель, соберите методы, уточните последовательность действий и критерии прогресса.',
  self: 'Подключите поддержку, активируйте «протезы саморегуляции» и начните с шага, в который верите.',
}

export const DiagnosticsPage = () => {
  const [goal, setGoal] = useState('Запустить авторский блог про психологию действий')
  const [scores, setScores] = useState(initialScores)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{
    motivationIndex: number
    weakest: FormulaComponent
    createdAt: string
  } | null>(null)

  const weakest = useMemo(() => {
    return (Object.keys(scores) as ScoreKey[]).reduce((acc, key) => (scores[key] < scores[acc] ? key : acc), 'plan')
  }, [scores])

  const motivationIndex = useMemo(() => {
    const { value, plan, self } = scores
    return Math.round((value * plan * self) / 10)
  }, [scores])

  const handleRangeChange = (key: ScoreKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value)
    setScores((prev) => ({ ...prev, [key]: nextValue }))
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await createDiagnostics({
        goalSummary: goal,
        valueScore: scores.value,
        planScore: scores.plan,
        selfScore: scores.self,
      })
      setLastResult({
        motivationIndex: response.motivationIndex,
        weakest: response.weakest,
        createdAt: response.item.createdAt,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить результат')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container">
      <section className="section surface-panel" id="diagnostics">
        <h1 className="section-heading">Быстрая диагностика формулы действия</h1>
        <p className="section-subtitle">
          Оцените каждый компонент по шкале от 0 до 10. Это поможет понять, где именно теряется энергия и с чего начать работу.
        </p>

        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="goal">Моя цель</label>
            <input
              id="goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Опишите цель, которую давно откладываете"
              required
            />
          </div>

          {(Object.keys(scores) as ScoreKey[]).map((key) => (
            <div key={key} className="form-field">
              <label htmlFor={key}>{labels[key]}</label>
              <div className="range-input">
                <input
                  id={key}
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={scores[key]}
                  onChange={handleRangeChange(key)}
                />
                <span className="range-input__value">{scores[key]} / 10</span>
              </div>
              <p className="card__description" style={{ margin: 0 }}>
                {key === 'value' && 'Сколько смысла и внутренней мотивации вы чувствуете?'}
                {key === 'plan' && 'Насколько вы уверены, что понимаете шаги, последовательность и ресурсы?'}
                {key === 'self' && 'Верите ли вы, что сможете выполнить план без откатов?'}
              </p>
            </div>
          ))}
        </form>

        <div className="surface-panel surface-panel--accent" style={{ marginTop: '32px' }}>
          <div className="hero__actions" style={{ marginBottom: '16px' }}>
            <button type="button" className="cta-button" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Сохраняем...' : 'Сохранить результат'}
            </button>
            <LinkButton to={`/exercises?focus=${weakest}`} variant="ghost">
              Подобрать практики
            </LinkButton>
            <LinkButton to="/support" variant="ghost">
              Настроить поддержку
            </LinkButton>
          </div>

          {error && (
            <p className="section-subtitle" style={{ color: '#d14343', marginTop: 0 }}>
              {error}
            </p>
          )}

          {lastResult && (
            <p className="section-subtitle" style={{ color: 'var(--color-success)', marginTop: 0 }}>
              Последнее сохранение: индекс {lastResult.motivationIndex}% · слабое звено —{' '}
              {componentLabel(lastResult.weakest)}
            </p>
          )}

          <div className="metrics-bar">
            <div className="metric">
              <span className="metric__label">Цель</span>
              <p className="metric__value" style={{ fontSize: 'var(--font-size-base)' }}>
                {goal || '—'}
              </p>
            </div>
            <div className="metric">
              <span className="metric__label">Индекс действия</span>
              <p className="metric__value">{motivationIndex}%</p>
            </div>
            <div className="metric">
              <span className="metric__label">Слабое звено</span>
              <p className="metric__value">{labels[weakest]}</p>
            </div>
          </div>
          <p className="section-subtitle" style={{ marginTop: '24px' }}>
            {recommendations[weakest]}
          </p>
        </div>
      </section>
    </div>
  )
}

type LinkButtonProps = {
  to: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
}

const LinkButton = ({ to, children, variant = 'primary' }: LinkButtonProps) => {
  return (
    <Link
      to={to}
      className={['cta-button', variant === 'ghost' ? 'cta-button--ghost' : ''].filter(Boolean).join(' ')}
    >
      {children}
    </Link>
  )
}

const componentLabel = (component: FormulaComponent) => {
  switch (component) {
    case 'PLAN':
      return 'Вера в план'
    case 'SELF':
      return 'Вера в себя'
    default:
      return 'Ценность награды'
  }
}
