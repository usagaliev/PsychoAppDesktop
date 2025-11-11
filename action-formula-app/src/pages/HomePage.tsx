import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { SignInPrompt } from '../components/common/SignInPrompt'
import { useAuth } from '../contexts/AuthContext'
import { fetchDiagnostics, type DiagnosticsResult } from '../services/diagnostics'
import {
  fetchCurrentGoal,
  logGoalDay,
  createMicroAction,
  deleteMicroAction,
  type GoalSnapshot,
} from '../services/goals'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { buildRevealMotion } from '../utils/motion'

type RevealOptions = Parameters<typeof buildRevealMotion>[1]

const theoryHighlights = [
  {
    title: 'Джулиан Роттер — поведенческий потенциал',
    description: 'Действие запускается, когда ценность награды и вера в успех одновременно высоки. Обнуляется один — обнуляется всё.',
  },
  {
    title: 'Альберт Бандура — самоэффективность',
    description: 'Нужно верить и в план, и в себя. Работаем с двумя “источниками уверенности” параллельно.',
  },
  {
    title: 'Виктор Врум — ожидания',
    description: 'Проверяем: приведут ли усилия к результату и действительно ли награда для вас важна.',
  },
]

const focusLabel: Record<DiagnosticsResult['weakestComponent'], string> = {
  VALUE: 'Ценность награды',
  PLAN: 'Вера в план',
  SELF: 'Вера в себя',
}

const focusQuery: Record<DiagnosticsResult['weakestComponent'], string> = {
  VALUE: 'value',
  PLAN: 'plan',
  SELF: 'self',
}

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—')

const formatCalendarTitle = (entry: GoalSnapshot['tracking']['calendar'][number]) =>
  entry.completed
    ? `Выполнено · ${formatDate(entry.date)}${entry.reflection ? `\n${entry.reflection}` : ''}`
    : `Без отметки · ${formatDate(entry.date)}`

type DailyMicroActionState = {
  id: string
  title: string
  description: string | null
  completedToday: boolean
}

const normalizeDate = (value: Date) => {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

const differenceInDays = (a: Date, b: Date) =>
  Math.round((normalizeDate(a).getTime() - normalizeDate(b).getTime()) / (24 * 60 * 60 * 1000))

type SuggestionTone = 'default' | 'warning' | 'positive'

type Suggestion = {
  id: string
  title: string
  description: string
  cta: { label: string; to: string }
  tone?: SuggestionTone
}

export const HomePage = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult[]>([])
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(true)
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null)

  const [goalSnapshot, setGoalSnapshot] = useState<GoalSnapshot | null>(null)
  const [goalLoading, setGoalLoading] = useState(true)
  const [goalError, setGoalError] = useState<string | null>(null)
  const [reflectionDraft, setReflectionDraft] = useState('')
  const [microActionsState, setMicroActionsState] = useState<DailyMicroActionState[]>([])
  const [microActionDraftTitle, setMicroActionDraftTitle] = useState('')
  const [microActionDraftDescription, setMicroActionDraftDescription] = useState('')
  const [isSavingDay, setIsSavingDay] = useState(false)
  const [isCreatingMicroAction, setIsCreatingMicroAction] = useState(false)

  const { user, loading: authLoading } = useAuth()
  const prefersReducedMotion = usePrefersReducedMotion()

  const reveal = (delay = 0, options?: RevealOptions) =>
    buildRevealMotion(prefersReducedMotion, { delay, ...(options ?? {}) })
  const hoverLift = prefersReducedMotion
    ? undefined
    : { y: -8, boxShadow: '0 28px 56px rgba(28, 33, 64, 0.18)' }

  useEffect(() => {
    const loadDiagnostics = async () => {
      if (!user) {
        setDiagnostics([])
        setDiagnosticsError(null)
        setIsLoadingDiagnostics(false)
        return
      }

      try {
        setIsLoadingDiagnostics(true)
        const response = await fetchDiagnostics()
        setDiagnostics(response.items)
        setDiagnosticsError(null)
      } catch (err) {
        setDiagnosticsError(err instanceof Error ? err.message : 'Не удалось загрузить результаты диагностики')
      } finally {
        setIsLoadingDiagnostics(false)
      }
    }

    void loadDiagnostics()
  }, [user])

  useEffect(() => {
    const loadGoal = async () => {
      if (!user) {
        setGoalSnapshot(null)
        setGoalError(null)
        setGoalLoading(false)
        return
      }

      try {
        setGoalLoading(true)
        const response = await fetchCurrentGoal()
        setGoalSnapshot(response.item ?? null)
        setGoalError(null)
      } catch (error) {
        console.error('Failed to load goal snapshot', error)
        setGoalError('Не удалось загрузить текущую цель. Попробуйте позже.')
      } finally {
        setGoalLoading(false)
      }
    }

    void loadGoal()
  }, [user])

  useEffect(() => {
    if (!goalSnapshot) {
      setReflectionDraft('')
      setMicroActionsState([])
      return
    }

    const todayEntry = goalSnapshot.tracking.calendar.at(-1)
    setReflectionDraft(todayEntry?.reflection ?? '')
    setMicroActionsState(
      goalSnapshot.tracking.microActions.map((action) => ({
        id: action.id,
        title: action.title,
        description: action.description,
        completedToday: action.completedToday,
      })),
    )
  }, [goalSnapshot])

  const { latestDiagnostics, insights } = useMemo(() => {
    if (diagnostics.length === 0) {
      return { latestDiagnostics: [] as DiagnosticsResult[], insights: null }
    }

    const ordered = [...diagnostics].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    const [latest, previous] = ordered
    const trend = previous ? latest.motivationIndex - previous.motivationIndex : null
    const avgIndex =
      ordered.reduce((acc, item) => acc + item.motivationIndex, 0) / ordered.length

    const weakestDistribution = ordered.reduce<Record<DiagnosticsResult['weakestComponent'], number>>(
      (acc, item) => {
        acc[item.weakestComponent] = (acc[item.weakestComponent] ?? 0) + 1
        return acc
      },
      { VALUE: 0, PLAN: 0, SELF: 0 },
    )

    const dominantWeakest = (Object.entries(weakestDistribution) as Array<
      [DiagnosticsResult['weakestComponent'], number]
    >).reduce((best, current) => (current[1] > best[1] ? current : best))[0]

    return {
      latestDiagnostics: ordered.slice(0, 3),
      insights: {
        latest,
        previous,
        trend,
        avgIndex: Math.round(avgIndex),
        dominantWeakest,
      },
    }
  }, [diagnostics])

  const todayEntry = goalSnapshot?.tracking.calendar.at(-1)
  const isTodayCompleted = todayEntry?.completed ?? false
  const streakSummary = goalSnapshot
    ? {
        current: goalSnapshot.tracking.currentStreak,
        best: goalSnapshot.tracking.longestStreak,
        completionRate: goalSnapshot.tracking.completionRate,
        totalDays: goalSnapshot.tracking.totalDays,
        completedDays: goalSnapshot.tracking.completedDays,
      }
    : null

  const suggestions = useMemo(() => {
    const items: Suggestion[] = []
    const today = normalizeDate(new Date())

    if (!goalSnapshot) {
      if (user && diagnostics.length > 0) {
        items.push({
          id: 'create-goal',
          title: 'Задайте цель после диагностики',
          description:
            'Диагностика уже пройдена — выберите цель по формуле, чтобы мы построили календарь и персональные подсказки.',
          cta: { label: 'Создать цель', to: '/diagnostics' },
          tone: 'positive',
        })
      }
      return items
    }

    const lastCompletedAt = goalSnapshot.tracking.lastCompletedAt
      ? new Date(goalSnapshot.tracking.lastCompletedAt)
      : null
    const daysSinceLastCompletion =
      lastCompletedAt !== null ? differenceInDays(today, lastCompletedAt) : Infinity

    if (!isTodayCompleted && daysSinceLastCompletion >= 2) {
      items.push({
        id: 'return-to-ritual',
        title: 'Вернитесь в ритм через короткое упражнение',
        description:
          'Последняя отметка была несколько дней назад. Попробуйте мягкое упражнение, чтобы снова включить исполнительные функции.',
        cta: { label: 'Открыть упражнения', to: '/exercises?focus=plan' },
        tone: 'warning',
      })
    }

    if (goalSnapshot.tracking.microActions.length === 0) {
      items.push({
        id: 'add-micro-action',
        title: 'Добавьте микро-действие на автомате',
        description:
          'Микро-действие — маленький шаг, который запускает большую цель. Пусть это будет действие на 1–2 минуты.',
        cta: { label: 'Добавить микро-действие', to: '#micro-actions' },
      })
    }

    if (goalSnapshot.tracking.completionRate < 60 && goalSnapshot.tracking.totalDays >= 5) {
      items.push({
        id: 'review-support',
        title: 'Проверьте систему поддержки',
        description:
          'Выполнение держится ниже 60%. Время усилить внешние опоры: договорённости, напоминания, партнёра по отчётности.',
        cta: { label: 'Настроить поддержку', to: '/support' },
        tone: 'warning',
      })
    }

    if (insights) {
      items.push({
        id: `focus-${insights.dominantWeakest}`,
        title: `Укрепите компонент «${focusLabel[insights.dominantWeakest]}»`,
        description:
          'Этот компонент чаще всего проседает в диагностике. Выберите упражнение, чтобы подтянуть слабое звено формулы.',
        cta: {
          label: 'Перейти к упражнениям',
          to: `/exercises?focus=${focusQuery[insights.dominantWeakest]}`,
        },
        tone: 'positive',
      })

      if (insights.trend !== null && insights.trend < 0) {
        items.push({
          id: 'negative-trend',
          title: 'Зафиксируйте контекст в журнале',
          description:
            'Индекс действия снизился. Запишите, что изменилось в условиях и настроении — это поможет скорректировать план.',
          cta: { label: 'Открыть журнал', to: '/journal' },
        })
      }
    }

    return items
  }, [diagnostics.length, goalSnapshot, insights, isTodayCompleted, user])

  const buildMicroActionsPayload = () =>
    microActionsState.length > 0
      ? microActionsState.map((action) => ({
          id: action.id,
          completed: action.completedToday,
        }))
      : undefined

  const handleCompleteToday = async () => {
    if (!goalSnapshot) return
    try {
      setIsSavingDay(true)
      const response = await logGoalDay(goalSnapshot.goal.id, {
        completed: true,
        reflection: reflectionDraft.trim().length > 0 ? reflectionDraft.trim() : undefined,
        microActions: buildMicroActionsPayload(),
        journalEntry:
          reflectionDraft.trim().length > 0
            ? {
                title: `День ${goalSnapshot.tracking.totalDays} — ${goalSnapshot.goal.title}`,
                content: reflectionDraft.trim(),
                templateKey: 'daily-reflection',
              }
            : undefined,
      })
      setGoalSnapshot(response.item ?? null)
      setGoalError(null)
    } catch (error) {
      console.error('Failed to update day log', error)
      setGoalError('Не получилось сохранить прогресс. Попробуйте ещё раз.')
    } finally {
      setIsSavingDay(false)
    }
  }

  const handleUndoToday = async () => {
    if (!goalSnapshot) return
    try {
      setIsSavingDay(true)
      setMicroActionsState((prev) => prev.map((action) => ({ ...action, completedToday: false })))
      const response = await logGoalDay(goalSnapshot.goal.id, {
        completed: false,
        reflection: reflectionDraft.trim().length > 0 ? reflectionDraft.trim() : undefined,
        microActions:
          microActionsState.length > 0
            ? microActionsState.map((action) => ({ id: action.id, completed: false }))
            : undefined,
      })
      setGoalSnapshot(response.item ?? null)
      setGoalError(null)
    } catch (error) {
      console.error('Failed to revert day log', error)
      setGoalError('Не получилось обновить отметку. Попробуйте позже.')
    } finally {
      setIsSavingDay(false)
    }
  }

  const handleToggleMicroAction = (id: string) => {
    setMicroActionsState((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, completedToday: !action.completedToday } : action,
      ),
    )
  }

  const handleCreateMicroAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!goalSnapshot) return
    if (!microActionDraftTitle.trim()) return

    try {
      setIsCreatingMicroAction(true)
      const response = await createMicroAction(goalSnapshot.goal.id, {
        title: microActionDraftTitle.trim(),
        description: microActionDraftDescription.trim() || undefined,
      })
      setGoalSnapshot(response.item ?? null)
      setGoalError(null)
      setMicroActionDraftTitle('')
      setMicroActionDraftDescription('')
    } catch (error) {
      console.error('Failed to create micro action', error)
      setGoalError('Не удалось добавить микро-действие. Попробуйте позже.')
    } finally {
      setIsCreatingMicroAction(false)
    }
  }

  const handleDeleteMicroAction = async (microActionId: string) => {
    if (!goalSnapshot) return
    try {
      const response = await deleteMicroAction(microActionId)
      setGoalSnapshot(response.item ?? null)
      setGoalError(null)
    } catch (error) {
      console.error('Failed to delete micro action', error)
      setGoalError('Не удалось удалить микро-действие. Попробуйте позже.')
    }
  }

  return (
    <div className="container" id="materials">
      <motion.section className="section hero" {...reveal(0, { distance: 40, once: true })}>
        <motion.div className="hero__content" {...reveal(0.05, { distance: 28, once: true })}>
          <span className="card__tag">Личный кабинет</span>
          <h1 className="hero__title">
            {goalSnapshot
              ? `Цель: ${goalSnapshot.goal.title}`
              : 'Превратите знание в устойчивое действие'}
          </h1>
          <p className="hero__subtitle">
            {goalLoading
              ? 'Обновляем прогресс...'
              : 'Диагностика подсказывает слабое звено формулы, календарь фиксирует микро‑шаги, а журнал сохраняет инсайты.'}
          </p>
          {user ? (
            <div className="hero__actions">
              <Link to="/diagnostics" className="cta-button">
                Обновить диагностику
              </Link>
              <Link to="/journal" className="cta-button cta-button--ghost">
                Открыть журнал
              </Link>
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              <SignInPrompt
                title="Войдите, чтобы сохранить прогресс"
                description="После диагностики автоматически создадим цель, календарь и личный журнал."
              />
            </div>
          )}
        </motion.div>
        <motion.div className="hero__visual" {...reveal(0.12, { distance: 24, once: true })}>
          <div className="hero__visual-content">
            <h3 className="section-heading" style={{ margin: 0 }}>Быстрый обзор</h3>
            <div className="metrics-bar" style={{ marginTop: '8px' }}>
              <div className="metric">
                <span className="metric__label">Старт</span>
                <p className="metric__value">{formatDate(goalSnapshot?.tracking.startDate)}</p>
              </div>
              <div className="metric">
                <span className="metric__label">Последняя отметка</span>
                <p className="metric__value">{formatDate(goalSnapshot?.tracking.lastCompletedAt)}</p>
              </div>
              <div className="metric">
                <span className="metric__label">Streak</span>
                <p className="metric__value">
                  {streakSummary ? `${streakSummary.current} дн.` : user ? '0 дн.' : '—'}
                </p>
              </div>
            </div>
            <p className="section-subtitle" style={{ marginTop: '16px' }}>
              {goalSnapshot
                ? 'Продолжайте отмечать дни и пополнять журнал — streak растёт, вера в себя усиливается.'
                : 'Пройдите диагностику, чтобы мы создали первую цель и расписание шагов.'}
            </p>
          </div>
        </motion.div>
      </motion.section>

      {goalError && (
        <motion.section className="section surface-panel surface-panel--accent" {...reveal(0.14, { distance: 16 })}>
          <p className="section-subtitle" style={{ color: '#d14343', margin: 0 }}>{goalError}</p>
        </motion.section>
      )}

      {goalSnapshot && (
        <motion.section className="section surface-panel" {...reveal(0.18, { distance: 20 })}>
          <div className="daily-checkin">
            <div className="daily-checkin__summary">
              <span className="card__tag">Ежедневная отметка</span>
              <h2 className="section-heading" style={{ marginBottom: '8px' }}>
                {isTodayCompleted ? 'День закрыт — отлично!' : 'Микро-цель на сегодня'}
              </h2>
              <p className="card__description">
                Запишите одно-два предложения о том, что сработало. Даже короткая мысль усиливает самоэффективность и помогает мозгу возвращаться к действию.
              </p>
              <div className="daily-checkin__streak">
                <div>
                  <span className="metric__label">Текущий streak</span>
                  <p className="metric__value">{streakSummary?.current ?? 0} дн.</p>
                </div>
                <div>
                  <span className="metric__label">Лучший streak</span>
                  <p className="metric__value">{streakSummary?.best ?? 0} дн.</p>
                </div>
                <div>
                  <span className="metric__label">Выполнено</span>
                  <p className="metric__value">{streakSummary?.completionRate ?? 0}%</p>
                </div>
              </div>
              <div className="daily-checkin__micro-actions" id="micro-actions">
                <span className="metric__label">Микро-действия (по желанию)</span>
                {microActionsState.length > 0 ? (
                  <div className="daily-checkin__micro-actions-list">
                    {microActionsState.map((action) => (
                      <label key={action.id}>
                        <input
                          type="checkbox"
                          checked={action.completedToday}
                          onChange={() => handleToggleMicroAction(action.id)}
                        />
                        <div className="daily-checkin__micro-action-body">
                          <span>{action.title}</span>
                          {action.description && <small>{action.description}</small>}
                          <button
                            type="button"
                            className="micro-action-remove"
                            onClick={() => handleDeleteMicroAction(action.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="card__description">
                    Добавьте один-два маленьких шага, которые поддержат вашу цель (например: «выпить стакан воды вместо кофе»).
                  </p>
                )}
                <form className="daily-checkin__micro-actions-form" onSubmit={handleCreateMicroAction}>
                  <input
                    value={microActionDraftTitle}
                    onChange={(event) => setMicroActionDraftTitle(event.target.value)}
                    placeholder="Новое микро-действие"
                    required
                  />
                  <input
                    value={microActionDraftDescription}
                    onChange={(event) => setMicroActionDraftDescription(event.target.value)}
                    placeholder="Короткое описание (необязательно)"
                  />
                  <button type="submit" className="cta-button cta-button--ghost" disabled={isCreatingMicroAction}>
                    {isCreatingMicroAction ? 'Добавляем...' : 'Добавить действие'}
                  </button>
                </form>
              </div>
            </div>
            <div className="daily-checkin__form">
              <label htmlFor="reflection" className="metric__label">
                Заметка за сегодня
              </label>
              <textarea
                id="reflection"
                value={reflectionDraft}
                onChange={(event) => setReflectionDraft(event.target.value)}
                placeholder="Что помогло сегодня удержаться на курсе? Что хочется повторить завтра?"
                rows={6}
              />
              <div className="daily-checkin__actions">
                {isTodayCompleted ? (
                  <button
                    type="button"
                    className="cta-button cta-button--ghost"
                    onClick={handleUndoToday}
                    disabled={isSavingDay}
                  >
                    {isSavingDay ? 'Обновляем...' : 'Отменить отметку'}
                  </button>
                ) : (
                  <button type="button" className="cta-button" onClick={handleCompleteToday} disabled={isSavingDay}>
                    {isSavingDay ? 'Сохраняем...' : 'Отметить день выполненным'}
                  </button>
                )}
                <Link to="/journal" className="cta-button cta-button--ghost">
                  Все заметки
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {goalSnapshot && suggestions.length > 0 && (
        <motion.section className="section surface-panel" {...reveal(0.22, { distance: 20 })}>
          <h2 className="section-heading" style={{ marginBottom: '12px' }}>Рекомендации на сегодня</h2>
          <p className="section-subtitle" style={{ marginBottom: '24px' }}>
            Подсказки учитывают ваши последние результаты. Выберите то, что ощущается посильным сегодня.
          </p>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {suggestions.map((item, index) => (
              <motion.article
                key={item.id}
                className={[
                  'card suggestion-card',
                  item.tone ? `suggestion-card--${item.tone}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                {...reveal(0.24 + index * 0.05, { distance: 16 })}
                whileHover={hoverLift}
              >
                <span className="card__tag">Совет</span>
                <h3 className="card__title">{item.title}</h3>
                <p className="card__description">{item.description}</p>
                {item.cta.to.startsWith('#') ? (
                  <a href={item.cta.to} className="cta-button cta-button--ghost">
                    {item.cta.label}
                  </a>
                ) : (
                  <Link to={item.cta.to} className="cta-button cta-button--ghost">
                    {item.cta.label}
                  </Link>
                )}
              </motion.article>
            ))}
          </div>
        </motion.section>
      )}

      {goalSnapshot && (
        <motion.section className="section surface-panel surface-panel--accent" {...reveal(0.24, { distance: 20 })}>
          <h2 className="section-heading" style={{ marginBottom: '12px' }}>Календарь прогресса</h2>
          <p className="section-subtitle" style={{ marginBottom: '24px' }}>
            Кликните на день, чтобы открыть связанную заметку. Чем плотнее заполнен календарь, тем устойчивее новая привычка.
          </p>
          <div className="calendar-grid">
            {goalSnapshot.tracking.calendar.map((day) => (
              <Link
                key={day.date}
                to={day.journalEntryId ? `/journal#${day.journalEntryId}` : '/journal'}
                className={[
                  'calendar-cell',
                  day.completed ? 'calendar-cell--done' : 'calendar-cell--pending',
                  todayEntry?.date === day.date ? 'calendar-cell--today' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={formatCalendarTitle(day)}
              >
                <span>{new Date(day.date).getDate()}</span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section className="section surface-panel" {...reveal(0.32, { distance: 24 })}>
        <h2 className="section-heading">Диагностика и аналитика</h2>
        <p className="section-subtitle">
          Отслеживайте, какой компонент формулы чаще всего проседает. Эти данные помогают выбирать упражнения и поддержку.
        </p>

        {authLoading ? (
          <p className="section-subtitle">Проверяем ваш профиль...</p>
        ) : !user ? (
          <SignInPrompt
            title="Войдите, чтобы сохранить диагностику"
            description="История оценок, календарь и журнал станут доступны после авторизации."
          />
        ) : isLoadingDiagnostics ? (
          <p className="section-subtitle">Загружаем последние результаты...</p>
        ) : diagnosticsError ? (
          <p className="section-subtitle" style={{ color: '#d14343' }}>
            {diagnosticsError}
          </p>
        ) : latestDiagnostics.length === 0 ? (
          <p className="section-subtitle">
            Пока нет сохранённых диагностик. Пройдите оценку и сохраните результат, чтобы отслеживать прогресс.
          </p>
        ) : (
          <>
            <div className="card-grid" style={{ marginTop: '24px' }}>
              {latestDiagnostics.map((item) => (
                <motion.article key={item.id} className="card" whileHover={hoverLift}>
                  <span className="card__tag">{formatDate(item.createdAt)}</span>
                  <h3 className="card__title">{item.goalSummary}</h3>
                  <p className="card__description">Индекс действия: {item.motivationIndex}%</p>
                  <p className="card__description">
                    Ценность — {item.valueScore}/10 · План — {item.planScore}/10 · Вера в себя — {item.selfScore}/10
                  </p>
                  <p className="card__description" style={{ fontWeight: 600 }}>
                    Слабое звено: {focusLabel[item.weakestComponent]}
                  </p>
                </motion.article>
              ))}
            </div>

            {insights && (
              <div className="insight-section">
                <div>
                  <span className="metric__label">Средний индекс</span>
                  <p className="metric__value">{insights.avgIndex}%</p>
                </div>
                <div>
                  <span className="metric__label">Динамика</span>
                  <p className="metric__value">
                    {insights.trend === null
                      ? 'н/д'
                      : `${insights.trend > 0 ? '+' : ''}${insights.trend} п.п.`}
                  </p>
                </div>
                <div>
                  <span className="metric__label">Частый провал</span>
                  <p className="metric__value">{focusLabel[insights.dominantWeakest]}</p>
                </div>
                <Link
                  to={`/exercises?focus=${focusQuery[insights.dominantWeakest]}`}
                  className="cta-button cta-button--ghost"
                >
                  Подобрать упражнения
                </Link>
              </div>
            )}
          </>
        )}
      </motion.section>

      <motion.section className="section surface-panel surface-panel--accent" {...reveal(0.44, { distance: 24 })}>
        <h2 className="section-heading">Подборка упражнений</h2>
        <p className="section-subtitle">
          Регулярно напоминаем о техниках, чтобы поддерживать мотивацию, план и самоэффективность.
        </p>
        <div className="card-grid">
          <motion.article className="card" whileHover={hoverLift}>
            <span className="card__tag">Ценность</span>
            <h3 className="card__title">Метод «5 зачем»</h3>
            <p className="card__description">
              Вернитесь к истинной мотивации. Подряд задавайте себе «зачем?» и фиксируйте отклики — это восстановит эмоциональную связь с целью.
            </p>
            <Link to="/exercises?focus=value" className="cta-button cta-button--ghost">
              Начать упражнение
            </Link>
          </motion.article>
          <motion.article className="card" whileHover={hoverLift}>
            <span className="card__tag">План</span>
            <h3 className="card__title">Декомпозиция цели</h3>
            <p className="card__description">
              Разбейте цель на понятные этапы, определите риски и первый шаг на 24 часа. Чем яснее план, тем выше вероятность действия.
            </p>
            <Link to="/exercises?focus=plan" className="cta-button cta-button--ghost">
              Расписать шаги
            </Link>
          </motion.article>
          <motion.article className="card" whileHover={hoverLift}>
            <span className="card__tag">Вера в себя</span>
            <h3 className="card__title">Одолженная вера</h3>
            <p className="card__description">
              Подключите поддержку — человека или сообщество. Обсудите формат отчётности, чтобы удерживать фокус и не срываться.
            </p>
            <Link to="/support" className="cta-button cta-button--ghost">
              Настроить поддержку
            </Link>
          </motion.article>
        </div>
      </motion.section>

      <motion.section className="section surface-panel" {...reveal(0.56, { distance: 24 })}>
        <h2 className="section-heading">Почему это работает</h2>
        <p className="section-subtitle">
          Приложение собрано на основе лекции «Как превратить знание в действие» и исследований мотивации. Вот короткие справки по ключевым теориям.
        </p>
        <div className="card-grid">
          {theoryHighlights.map((item) => (
            <motion.article key={item.title} className="card" whileHover={hoverLift}>
              <span className="card__tag">Теория</span>
              <h3 className="card__title">{item.title}</h3>
              <p className="card__description">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
