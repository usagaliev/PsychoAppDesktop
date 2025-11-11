import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { SignInPrompt } from '../components/common/SignInPrompt'
import { useAuth } from '../contexts/AuthContext'
import { fetchDiagnostics, type DiagnosticsResult } from '../services/diagnostics'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { buildRevealMotion } from '../utils/motion'

type RevealOptions = Parameters<typeof buildRevealMotion>[1]

const formulaCards = [
  {
    id: 'value',
    title: 'Ценность награды',
    description:
      'Верните контакт с настоящим «зачем». Используйте метод «5 зачем», эпитафию и визуализацию будущего, чтобы усилить внутреннюю мотивацию.',
  },
  {
    id: 'plan',
    title: 'Вера в план',
    description:
      'Декомпозируйте цель, соберите рабочие методы, составьте план исследования. Чем конкретнее шаги — тем выше доверие к плану.',
  },
  {
    id: 'self',
    title: 'Вера в себя',
    description:
      'Опирайтесь на прошлые успехи, ищите поддержку, создавайте «протезы саморегуляции» и начинайте с действий, в которые уже можете поверить.',
  },
]

const quickActions = [
  {
    title: 'Шаг 1. Обновить ценность',
    items: ['Выберите цель, которая волнует именно вас', 'Ответьте на 3–5 вопросов из чек-листа ценностей', 'Зафиксируйте ключевые инсайты в журнале'],
  },
  {
    title: 'Шаг 2. Уточнить план',
    items: ['Декомпозируйте цель на этапы', 'Определите ресурсы и возможные препятствия', 'Запланируйте первое действие на ближайшие 24 часа'],
  },
  {
    title: 'Шаг 3. Поддержать веру в себя',
    items: ['Выберите человека или сервис для внешней поддержки', 'Настройте напоминания и отчётность', 'Празднуйте каждый маленький прогресс'],
  },
]

const readinessChecklist = [
  'Я спал(а) не меньше 6–7 часов и чувствую базовую энергию',
  'Мне безопасно проходить упражнения без риска ухудшения состояния',
  'Я готов(а) при необходимости обратиться за помощью к специалисту',
]

const riskSignals = [
  'тяжёлое выгорание, эпизоды депрессии или тревожные расстройства',
  'диагностированное СДВГ без поддержки специалиста',
  'острые соматические состояния, из-за которых сложно выполнять план',
]

const theoryHighlights = [
  {
    title: 'Джулиан Роттер — поведенческий потенциал',
    description: 'Действие запускается только если одновременно высокая ценность награды и вера в успех. Обнуление одного фактора гасит мотивацию.',
  },
  {
    title: 'Альберт Бандура — самоэффективность',
    description: 'Нужно верить и в сам план, и в собственную способность его выполнить. Отдельно поддерживаем оба этих источника уверенности.',
  },
  {
    title: 'Виктор Врум — ожидания и валентность',
    description: 'Проверяем: приведёт ли результат к желаемой награде и насколько лично она для вас ценна.',
  },
]

const componentToFocus: Record<DiagnosticsResult['weakestComponent'], string> = {
  VALUE: 'value',
  PLAN: 'plan',
  SELF: 'self',
}

const componentLabel = (component: DiagnosticsResult['weakestComponent']) => {
  switch (component) {
    case 'PLAN':
      return 'Вера в план'
    case 'SELF':
      return 'Вера в себя'
    default:
      return 'Ценность награды'
  }
}

export const HomePage = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult[]>([])
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(true)
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null)
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

  return (
    <div className="container" id="materials">
      <motion.section className="section hero" {...reveal(0, { distance: 40, once: true })}>
        <motion.div className="hero__content" {...reveal(0.05, { distance: 28, once: true })}>
          <span className="card__tag">Формула действия</span>
          <h1 className="hero__title">Превратите знание в устойчивое действие</h1>
          <p className="hero__subtitle">
            Структурированная система, основанная на работах Роттера, Врума и Бандуры. Усильте ценность, уточните план и поддержите
            веру в себя — действие станет неизбежным.
          </p>
          <div className="hero__actions">
            <Link to="/diagnostics" className="cta-button">
              Пройти диагностику
            </Link>
            <Link to="/exercises" className="cta-button cta-button--ghost">
              Посмотреть упражнения
            </Link>
          </div>
        </motion.div>
        <motion.div className="hero__visual" {...reveal(0.12, { distance: 24, once: true })}>
          <div className="hero__visual-content">
            <h3 className="section-heading" style={{ margin: 0 }}>Формула</h3>
            <p className="section-subtitle" style={{ margin: 0 }}>
              Вероятность действия = Ценность × Вера в план × Вера в себя
            </p>
            <div className="metrics-bar" style={{ marginTop: '16px' }}>
              <div className="metric">
                <span className="metric__label">{user ? 'Текущая цель' : 'Цель'}</span>
                <p className="metric__value">
                  {user && insights ? insights.latest.goalSummary : 'Личная эффективность'}
                </p>
              </div>
              <div className="metric">
                <span className="metric__label">{user ? 'Средний индекс действия' : 'Прогресс'}</span>
                <p className="metric__value">
                  {user && insights ? `${insights.avgIndex}%` : '+32%'}
                </p>
              </div>
            </div>
            <p className="section-subtitle" style={{ marginTop: '16px' }}>
              Проведите диагностику и узнайте, какой компонент формулы проседает именно у вас.
            </p>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        className="section surface-panel surface-panel--accent"
        id="readiness"
        {...reveal(0.18, { distance: 24 })}
      >
        <motion.div style={{ display: 'grid', gap: '24px' }} {...reveal(0.2, { distance: 16 })}>
          <motion.div {...reveal(0.22, { distance: 12 })}>
            <h2 className="section-heading" style={{ marginBottom: '8px' }}>
              Сначала проверьте ресурсное состояние
            </h2>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              Формула работает мягко, но не заменяет терапию. Если вы в сложном состоянии, добавьте больше поддержки из списка ниже.
            </p>
          </motion.div>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <motion.article
              className="card"
              style={{ boxShadow: 'none', background: 'var(--color-surface)' }}
              {...reveal(0.24, { distance: 18 })}
              whileHover={hoverLift}
            >
              <h3 className="card__title" style={{ marginBottom: '12px' }}>Мини-чек-лист готовности</h3>
              <ul style={{ color: 'var(--color-text-secondary)', paddingInlineStart: '18px', margin: 0, display: 'grid', gap: '8px' }}>
                {readinessChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </motion.article>
            <motion.article
              className="card"
              style={{ boxShadow: 'none', background: 'var(--color-surface)' }}
              {...reveal(0.28, { distance: 18 })}
              whileHover={hoverLift}
            >
              <h3 className="card__title" style={{ marginBottom: '12px' }}>Когда лучше обратиться к специалисту</h3>
              <ul style={{ color: 'var(--color-text-secondary)', paddingInlineStart: '18px', margin: 0, display: 'grid', gap: '8px' }}>
                {riskSignals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="section-subtitle" style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
                Нагрузка на исполнительные функции — важная часть лекции Алмары Кулеевой. Если распознаёте себя — начните с внешней поддержки.
              </p>
            </motion.article>
          </div>
        </motion.div>
      </motion.section>

      <motion.section className="section" id="checklists" {...reveal(0.32, { distance: 24 })}>
        <motion.h2 className="section-heading" {...reveal(0.34, { distance: 12 })}>
          Три компонента, которые двигают вперёд
        </motion.h2>
        <motion.p className="section-subtitle" {...reveal(0.36, { distance: 12 })}>
          Собрали лучшие упражнения и чек-листы для каждой части формулы.
        </motion.p>
        <div className="card-grid">
          {formulaCards.map((card, index) => (
            <motion.article
              key={card.id}
              className="card"
              {...reveal(0.38 + index * 0.06, { distance: 18 })}
              whileHover={hoverLift}
            >
              <span className="card__tag">Компонент</span>
              <h3 className="card__title">{card.title}</h3>
              <p className="card__description">{card.description}</p>
              <Link to={`/exercises?focus=${card.id}`} className="cta-button cta-button--ghost" style={{ alignSelf: 'flex-start' }}>
                Перейти к упражнениям
              </Link>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="section surface-panel surface-panel--accent"
        id="exercises"
        {...reveal(0.44, { distance: 24 })}
      >
        <motion.h2 className="section-heading" {...reveal(0.46, { distance: 12 })}>
          Как начать уже сегодня
        </motion.h2>
        <motion.p className="section-subtitle" {...reveal(0.48, { distance: 12 })}>
          Пройдите три коротких шага и задайте направление изменениям.
        </motion.p>
        <div className="card-grid">
          {quickActions.map((block, index) => (
            <motion.div
              key={block.title}
              className="card"
              style={{ boxShadow: 'none', background: 'transparent' }}
              {...reveal(0.5 + index * 0.06, { distance: 16 })}
            >
              <h3 className="card__title">{block.title}</h3>
              <ul>
                {block.items.map((item) => (
                  <li key={item} style={{ color: 'var(--color-text-secondary)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section className="section surface-panel" id="diagnostics-history" {...reveal(0.56, { distance: 24 })}>
        <motion.div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
          {...reveal(0.58, { distance: 12 })}
        >
          <div>
            <h2 className="section-heading">Последние результаты диагностики</h2>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              Отслеживайте динамику формулы, чтобы понимать, какой компонент проседает чаще всего.
            </p>
          </div>
          <Link to="/diagnostics" className="cta-button cta-button--ghost">
            Перейти к диагностике
          </Link>
        </motion.div>

        {authLoading ? (
          <motion.p className="section-subtitle" style={{ marginTop: '24px' }} {...reveal(0.6, { distance: 10 })}>
            Проверяем ваш профиль...
          </motion.p>
        ) : !user ? (
          <motion.div style={{ marginTop: '24px' }} {...reveal(0.6, { distance: 10 })}>
            <SignInPrompt
              title="Сохраните свои результаты в личном кабинете"
              description="Войдите через Google, и мы сохраним историю диагностик, журнал и план поддержки."
            />
          </motion.div>
        ) : isLoadingDiagnostics ? (
          <motion.p className="section-subtitle" style={{ marginTop: '24px' }} {...reveal(0.6, { distance: 10 })}>
            Загружаем последние результаты...
          </motion.p>
        ) : diagnosticsError ? (
          <motion.p
            className="section-subtitle"
            style={{ color: '#d14343', marginTop: '24px' }}
            {...reveal(0.6, { distance: 10 })}
          >
            {diagnosticsError}
          </motion.p>
        ) : latestDiagnostics.length === 0 ? (
          <motion.p className="section-subtitle" style={{ marginTop: '24px' }} {...reveal(0.6, { distance: 10 })}>
            Пока нет сохранённых диагностик. Пройдите оценку и сохраните результат, чтобы отслеживать прогресс.
          </motion.p>
        ) : (
          <div className="card-grid" style={{ marginTop: '24px' }}>
            {latestDiagnostics.map((item, index) => (
              <motion.article
                key={item.id}
                className="card"
                {...reveal(0.62 + index * 0.05, { distance: 18 })}
                whileHover={hoverLift}
              >
                <span className="card__tag">{new Date(item.createdAt).toLocaleDateString()}</span>
                <h3 className="card__title">{item.goalSummary}</h3>
                <p className="card__description">Индекс действия: {item.motivationIndex}%</p>
                <p className="card__description">
                  Ценность — {item.valueScore}/10 · План — {item.planScore}/10 · Вера в себя — {item.selfScore}/10
                </p>
                <p className="card__description" style={{ fontWeight: 600 }}>
                  Слабое звено: {componentLabel(item.weakestComponent)}
                </p>
              </motion.article>
            ))}
          </div>
        )}
      </motion.section>

      {user && !authLoading && insights && (
        <motion.section
          className="section surface-panel surface-panel--accent"
          id="insights"
          {...reveal(0.7, { distance: 24 })}
        >
          <motion.div
            style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}
            {...reveal(0.72, { distance: 12 })}
          >
            <div>
              <h2 className="section-heading" style={{ marginBottom: '8px' }}>
                Ваши актуальные акценты
              </h2>
              <p className="section-subtitle" style={{ margin: 0 }}>
                Средний индекс действия — {insights.avgIndex}%.{' '}
                {insights.trend === null
                  ? 'Продолжайте фиксировать результаты, чтобы увидеть динамику.'
                  : insights.trend > 0
                    ? `Прогресс растёт на ${insights.trend} п.п. по сравнению с прошлой оценкой.`
                    : insights.trend < 0
                      ? `Есть просадка на ${Math.abs(insights.trend)} п.п. Посмотрите, что изменилось во внешних условиях.`
                      : 'Показатель держится на прежнем уровне — хорошо сохранить стабильность.'}
              </p>
            </div>
            <Link
              to={`/exercises?focus=${componentToFocus[insights.dominantWeakest]}`}
              className="cta-button"
              style={{ alignSelf: 'flex-start' }}
            >
              Укрепить «{componentLabel(insights.dominantWeakest)}»
            </Link>
          </motion.div>

          <div className="card-grid" style={{ marginTop: '24px' }}>
            <motion.article className="card" {...reveal(0.74, { distance: 18 })} whileHover={hoverLift}>
              <span className="card__tag">Следующий шаг</span>
              <h3 className="card__title">Запишите план микро-действий</h3>
              <p className="card__description">
                Зафиксируйте три ближайших шага в журнале и поделитесь ими с опорой. Это помогает укрепить веру в себя,
                даже если мотивация плавает.
              </p>
              <Link to="/journal" className="cta-button cta-button--ghost" style={{ alignSelf: 'flex-start' }}>
                Перейти в журнал
              </Link>
            </motion.article>
            <motion.article className="card" {...reveal(0.78, { distance: 18 })} whileHover={hoverLift}>
              <span className="card__tag">Поддержка</span>
              <h3 className="card__title">Обновите договорённости</h3>
              <p className="card__description">
                Проверьте, есть ли у вас план B на случай отката. Добавьте новые протезы саморегуляции или человека,
                который «одолжит» уверенность.
              </p>
              <Link to="/support" className="cta-button cta-button--ghost" style={{ alignSelf: 'flex-start' }}>
                Настроить поддержку
              </Link>
            </motion.article>
            <motion.article className="card" {...reveal(0.82, { distance: 18 })} whileHover={hoverLift}>
              <span className="card__tag">История</span>
              <h3 className="card__title">Как менялась формула</h3>
              <p className="card__description">
                Последняя диагностика от {new Date(insights.latest.createdAt).toLocaleDateString()} · индекс{' '}
                {insights.latest.motivationIndex}% · слабое звено — {componentLabel(insights.latest.weakestComponent)}.
              </p>
              {insights.previous && (
                <p className="card__description" style={{ marginTop: '12px' }}>
                  Предыдущий результат: {insights.previous.motivationIndex}% (
                  {componentLabel(insights.previous.weakestComponent)}). Сравните заметки за эти две даты.
                </p>
              )}
            </motion.article>
          </div>
        </motion.section>
      )}

      <motion.section className="section surface-panel" id="science-base" {...reveal(0.86, { distance: 24 })}>
        <motion.h2 className="section-heading" {...reveal(0.88, { distance: 12 })}>
          Почему эта формула работает
        </motion.h2>
        <motion.p className="section-subtitle" {...reveal(0.9, { distance: 12 })}>
          Мы опираемся на лекцию «Как превратить знание в действие» и исследования мотивации. Коротко про ключевые идеи и ссылки на оригинальные теории.
        </motion.p>
        <div className="card-grid">
          {theoryHighlights.map((item, index) => (
            <motion.article
              key={item.title}
              className="card"
              {...reveal(0.92 + index * 0.05, { distance: 18 })}
              whileHover={hoverLift}
            >
              <span className="card__tag">Теория</span>
              <h3 className="card__title">{item.title}</h3>
              <p className="card__description">{item.description}</p>
            </motion.article>
          ))}
        </div>
        <motion.p className="section-subtitle" style={{ marginTop: '24px' }} {...reveal(1.02, { distance: 12 })}>
          Хотите глубже? Откройте конспект лекции и блоки упражнений в разделе «Материалы» — вы найдёте цитаты, вопросы и шаблоны прямо из выступления.
        </motion.p>
      </motion.section>
    </div>
  )
}
