import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { SignInPrompt } from '../components/common/SignInPrompt'
import { useAuth } from '../contexts/AuthContext'
import { createDiagnostics, type FormulaComponent } from '../services/diagnostics'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { buildRevealMotion } from '../utils/motion'

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

const componentToKey: Record<FormulaComponent, ScoreKey> = {
  VALUE: 'value',
  PLAN: 'plan',
  SELF: 'self',
}

type RevealOptions = Parameters<typeof buildRevealMotion>[1]

const stepOrder: ScoreKey[] = ['value', 'plan', 'self']

const scoreInterpretation = {
  risk: { label: 'Зона риска (0–3)', color: '#d14343' },
  unstable: { label: 'Нестабильная опора (4–6)', color: '#e69c2b' },
  strong: { label: 'Сильная опора (7–10)', color: 'var(--color-success)' },
} as const

const scoreGuidance: Record<
  ScoreKey,
  {
    risk: string
    unstable: string
    strong: string
  }
> = {
  value: {
    risk: 'Связь с личным смыслом потеряна. Вернитесь к упражнениям «5 зачем» и эпитафии, чтобы оживить награду.',
    unstable: 'Ценность понятна, но колеблется. Уточните, какую именно жизнь вы хотите построить и кому это важно.',
    strong: 'Цель заряжает. Используйте эту энергию, чтобы поддержать план и веру в себя.',
  },
  plan: {
    risk: 'Плана почти нет. Начните с одного конкретного шага на 24 часа и соберите рабочие методы.',
    unstable: 'Шаги понятны частично. Уточните ресурсы, риски и точки контроля, чтобы доверие к плану выросло.',
    strong: 'Структура готова. Теперь важно не перегореть: разбивайте задачи на микро-шаги.',
  },
  self: {
    risk: 'Самоэффективность проседает. Попросите поддержки и начните с действий, где уверенность выше.',
    unstable: 'Уверенность колеблется. Добавьте протезы саморегуляции и отметьте прошлые победы.',
    strong: 'Вы верите в себя. Используйте это, чтобы поддержать ценность и план, делясь прогрессом с опорой.',
  },
}

const getScoreBand = (score: number) => {
  if (score <= 3) return 'risk'
  if (score <= 6) return 'unstable'
  return 'strong'
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
  const [currentStep, setCurrentStep] = useState(0)

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

  const goNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, stepOrder.length - 1))
  }

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const activeKey = stepOrder[currentStep]
  const activeBand = getScoreBand(scores[activeKey])
  const activeInterpretation = scoreInterpretation[activeBand]
  const activeGuidance = scoreGuidance[activeKey][activeBand]

  const { user, loading: authLoading } = useAuth()
  const prefersReducedMotion = usePrefersReducedMotion()
  const reveal = (delay = 0, options?: RevealOptions) =>
    buildRevealMotion(prefersReducedMotion, { delay, ...(options ?? {}) })
  const hoverLift = prefersReducedMotion
    ? undefined
    : { y: -6, boxShadow: '0 22px 48px rgba(28, 33, 64, 0.16)' }

  const handleSubmit = async () => {
    if (!user) {
      setError('Чтобы сохранить результат, выполните вход через Google.')
      return
    }

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

  if (authLoading) {
    return (
      <div className="container">
        <motion.section className="section surface-panel" {...reveal(0, { distance: 24 })}>
          <h1 className="section-heading">Быстрая диагностика формулы действия</h1>
          <p className="section-subtitle">Подготавливаем все данные...</p>
        </motion.section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <motion.section className="section surface-panel surface-panel--accent" {...reveal(0, { distance: 24 })}>
          <h1 className="section-heading">Быстрая диагностика формулы действия</h1>
          <p className="section-subtitle">
            Войдите через Google, чтобы сохранять результаты и отслеживать динамику по каждому компоненту формулы.
          </p>
          <SignInPrompt
            title="Войдите, чтобы сохранить диагностику"
            description="После входа вы сможете возвращаться к истории оценок и видеть динамику."
          />
        </motion.section>
      </div>
    )
  }

  return (
    <div className="container">
      <motion.section className="section surface-panel" id="diagnostics" {...reveal(0, { distance: 28 })}>
        <motion.h1 className="section-heading" {...reveal(0.02, { distance: 12 })}>
          Быстрая диагностика формулы действия
        </motion.h1>
        <motion.p className="section-subtitle" {...reveal(0.04, { distance: 12 })}>
          Оцените каждый компонент по шкале от 0 до 10. Это поможет понять, где именно теряется энергия и с чего начать работу.
        </motion.p>

        <motion.form
          className="form-grid"
          {...reveal(0.08, { distance: 18 })}
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <motion.div className="form-field" style={{ gridColumn: '1 / -1' }} {...reveal(0.1, { distance: 12 })}>
            <label htmlFor="goal">Моя цель</label>
            <input
              id="goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Опишите цель, которую давно откладываете"
              required
            />
          </motion.div>

          <motion.div
            className="surface-panel surface-panel--accent"
            style={{ gridColumn: '1 / -1', display: 'grid', gap: '16px' }}
            {...reveal(0.12, { distance: 20 })}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="card__tag">Шаг {currentStep + 1} из {stepOrder.length}</span>
                <h2 className="section-heading" style={{ marginBottom: 0 }}>{labels[activeKey]}</h2>
              </div>
              <div className="chip">{scores[activeKey]} / 10</div>
            </header>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              {activeKey === 'value' && 'Сколько смысла и внутренней мотивации вы чувствуете по отношению к цели прямо сейчас.'}
              {activeKey === 'plan' && 'Насколько чётко вы видите путь? Есть ли последовательность, ресурсы и критерии успеха.'}
              {activeKey === 'self' && 'Насколько вы верите, что справитесь лично вы, с учётом настроения, энергии и поддержки.'}
            </p>
            <div className="range-input">
              <input id={activeKey} type="range" min={0} max={10} step={1} value={scores[activeKey]} onChange={handleRangeChange(activeKey)} />
              <span className="range-input__value">{scores[activeKey]} / 10</span>
            </div>
            <div className="surface-panel" style={{ margin: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border-muted)' }}>
              <p className="card__description" style={{ color: activeInterpretation.color, fontWeight: 600, marginBottom: '8px' }}>
                {activeInterpretation.label}
              </p>
              <p className="card__description" style={{ margin: 0 }}>{activeGuidance}</p>
            </div>
            <footer style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="cta-button cta-button--ghost"
                onClick={goPrev}
                disabled={currentStep === 0}
                style={{ minWidth: '160px' }}
              >
                Назад
              </button>
              {currentStep < stepOrder.length - 1 ? (
                <button type="button" className="cta-button" onClick={goNext} style={{ minWidth: '220px' }}>
                  К следующему компоненту
                </button>
              ) : (
                <button type="submit" className="cta-button" disabled={isSaving} style={{ minWidth: '220px' }}>
                  {isSaving ? 'Сохраняем...' : 'Сохранить результат'}
                </button>
              )}
            </footer>
          </motion.div>
        </motion.form>

        <motion.div className="surface-panel surface-panel--accent" style={{ marginTop: '32px' }} {...reveal(0.18, { distance: 18 })}>
          {error ? (
            <motion.p className="section-subtitle" style={{ color: '#d14343', marginTop: 0 }} {...reveal(0.2, { distance: 8 })}>
              {error}
            </motion.p>
          ) : (
            <motion.div className="hero__actions" style={{ marginBottom: '16px' }} {...reveal(0.2, { distance: 8 })}>
              <LinkButton to={`/exercises?focus=${weakest}`} variant="ghost">
                Подобрать практики
              </LinkButton>
              <LinkButton to="/support" variant="ghost">
                Настроить поддержку
              </LinkButton>
              <LinkButton to="/journal" variant="ghost">
                Зафиксировать инсайты
              </LinkButton>
            </motion.div>
          )}

          {lastResult && (
            <motion.div
              className="surface-panel"
              style={{ background: 'var(--color-surface)', margin: 0 }}
              {...reveal(0.22, { distance: 12 })}
              whileHover={hoverLift}
            >
              <p className="section-subtitle" style={{ color: 'var(--color-success)', marginTop: 0 }}>
                Последнее сохранение: индекс {lastResult.motivationIndex}% · слабое звено — {componentLabel(lastResult.weakest)}
              </p>
              <p className="card__description" style={{ marginTop: '12px' }}>
                {recommendations[componentToKey[lastResult.weakest]]}
              </p>
            </motion.div>
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
        </motion.div>
      </motion.section>
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
