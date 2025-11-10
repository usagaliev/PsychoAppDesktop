import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import { fetchDiagnostics, type DiagnosticsResult } from '../services/diagnostics'

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

  useEffect(() => {
    const loadDiagnostics = async () => {
      try {
        setIsLoadingDiagnostics(true)
        const response = await fetchDiagnostics()
        setDiagnostics(response.items)
      } catch (err) {
        setDiagnosticsError(err instanceof Error ? err.message : 'Не удалось загрузить результаты диагностики')
      } finally {
        setIsLoadingDiagnostics(false)
      }
    }

    void loadDiagnostics()
  }, [])

  const latestDiagnostics = useMemo(() => diagnostics.slice(0, 3), [diagnostics])

  return (
    <div className="container" id="materials">
      <section className="section hero">
        <div className="hero__content">
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
        </div>
        <div className="hero__visual">
          <div className="hero__visual-content">
            <h3 className="section-heading" style={{ margin: 0 }}>Формула</h3>
            <p className="section-subtitle" style={{ margin: 0 }}>
              Вероятность действия = Ценность × Вера в план × Вера в себя
            </p>
            <div className="metrics-bar" style={{ marginTop: '16px' }}>
              <div className="metric">
                <span className="metric__label">Цель</span>
                <p className="metric__value">Личная эффективность</p>
              </div>
              <div className="metric">
                <span className="metric__label">Прогресс</span>
                <p className="metric__value">+32%</p>
              </div>
            </div>
            <p className="section-subtitle" style={{ marginTop: '16px' }}>
              Проведите диагностику и узнайте, какой компонент формулы проседает именно у вас.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="checklists">
        <h2 className="section-heading">Три компонента, которые двигают вперёд</h2>
        <p className="section-subtitle">Собрали лучшие упражнения и чек-листы для каждой части формулы.</p>
        <div className="card-grid">
          {formulaCards.map((card) => (
            <article key={card.id} className="card">
              <span className="card__tag">Компонент</span>
              <h3 className="card__title">{card.title}</h3>
              <p className="card__description">{card.description}</p>
              <Link to={`/exercises?focus=${card.id}`} className="cta-button cta-button--ghost" style={{ alignSelf: 'flex-start' }}>
                Перейти к упражнениям
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section surface-panel surface-panel--accent" id="exercises">
        <h2 className="section-heading">Как начать уже сегодня</h2>
        <p className="section-subtitle">Пройдите три коротких шага и задайте направление изменениям.</p>
        <div className="card-grid">
          {quickActions.map((block) => (
            <div key={block.title} className="card" style={{ boxShadow: 'none', background: 'transparent' }}>
              <h3 className="card__title">{block.title}</h3>
              <ul>
                {block.items.map((item) => (
                  <li key={item} style={{ color: 'var(--color-text-secondary)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="section surface-panel" id="diagnostics-history">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 className="section-heading">Последние результаты диагностики</h2>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              Отслеживайте динамику формулы, чтобы понимать, какой компонент проседает чаще всего.
            </p>
          </div>
          <Link to="/diagnostics" className="cta-button cta-button--ghost">
            Перейти к диагностике
          </Link>
        </div>

        {isLoadingDiagnostics ? (
          <p className="section-subtitle" style={{ marginTop: '24px' }}>
            Загружаем последние результаты...
          </p>
        ) : diagnosticsError ? (
          <p className="section-subtitle" style={{ color: '#d14343', marginTop: '24px' }}>{diagnosticsError}</p>
        ) : latestDiagnostics.length === 0 ? (
          <p className="section-subtitle" style={{ marginTop: '24px' }}>
            Пока нет сохранённых диагностик. Пройдите оценку и сохраните результат, чтобы отслеживать прогресс.
          </p>
        ) : (
          <div className="card-grid" style={{ marginTop: '24px' }}>
            {latestDiagnostics.map((item) => (
              <article key={item.id} className="card">
                <span className="card__tag">{new Date(item.createdAt).toLocaleDateString()}</span>
                <h3 className="card__title">{item.goalSummary}</h3>
                <p className="card__description">Индекс действия: {item.motivationIndex}%</p>
                <p className="card__description">
                  Ценность — {item.valueScore}/10 · План — {item.planScore}/10 · Вера в себя — {item.selfScore}/10
                </p>
                <p className="card__description" style={{ fontWeight: 600 }}>
                  Слабое звено: {componentLabel(item.weakestComponent)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
