import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { SignInPrompt } from '../components/common/SignInPrompt'
import { useAuth } from '../contexts/AuthContext'
import { fetchSupportPlan, saveSupportPlan } from '../services/support'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { buildRevealMotion } from '../utils/motion'

const supportOptions = [
  { id: 'therapist', label: 'Психотерапевт', description: 'Поможет отследить эмоциональные триггеры и построить план безопасности.' },
  { id: 'coach', label: 'Коуч / наставник', description: 'Даст внешнюю структуру и регулярную отчётность.' },
  { id: 'friend', label: 'Друг или партнёр', description: 'Мягкая поддержка и совместные договорённости.' },
  { id: 'community', label: 'Онлайн-сообщество', description: 'Опора на людей с похожими целями, быстрый обмен опытом.' },
  { id: 'group', label: 'Группа поддержки', description: 'Совместные встречи, чтобы «одолживать» уверенность и удерживать фокус.' },
]

const commitmentOptions = [
  'Финансовое обязательство (предоплата, абонемент)',
  'Публичное обещание (пост, чат друзей)',
  'Автоматизация (приложения, подписки, таймеры)',
  'Коммитмент с последствиями (пари, штрафы)',
  'Дедлайны с внешними последствиями',
]

const pairings = [
  {
    title: 'Эмоциональная поддержка + структура',
    combination: ['therapist', 'coach', 'friend'],
    note: 'Чередуйте сессии со специалистом и короткие отчёты другу. Так вы закрываете и эмоциональную, и стратегическую часть формулы.',
  },
  {
    title: 'Сообщество + протезы саморегуляции',
    combination: ['community', 'group'],
    note: 'Регулярные встречи и коллективные дедлайны помогают поддерживать веру в себя, когда энергия проседает.',
  },
  {
    title: 'Минимальный набор поддержки',
    combination: ['friend'],
    note: 'Даже один человек, которому вы пишете отчёт раз в неделю, заметно повышает ответственность и связь с целью.',
  },
]

type RevealOptions = Parameters<typeof buildRevealMotion>[1]

export const SupportPage = () => {
  const [selectedSupport, setSelectedSupport] = useState<string[]>(['therapist', 'friend'])
  const [selectedCommitments, setSelectedCommitments] = useState<string[]>(['Публичное обещание (пост, чат друзей)'])
  const [notes, setNotes] = useState('Отчитываться каждую пятницу, договориться о совместной сессии каждые 2 недели.')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const prefersReducedMotion = usePrefersReducedMotion()
  const reveal = (delay = 0, options?: RevealOptions) =>
    buildRevealMotion(prefersReducedMotion, { delay, ...(options ?? {}) })
  const hoverLift = prefersReducedMotion
    ? undefined
    : { y: -6, boxShadow: '0 22px 48px rgba(28, 33, 64, 0.16)' }

  const toggleSupport = (id: string) => {
    setMessage(null)
    setError(null)
    setSelectedSupport((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleCommitment = (item: string) => {
    setMessage(null)
    setError(null)
    setSelectedCommitments((prev) => (prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]))
  }

  const loadPlan = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetchSupportPlan()
      const plan = response.item
      if (plan) {
        setSelectedSupport(plan.supporters)
        setSelectedCommitments(plan.commitments)
        setNotes(plan.notes ?? '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить план поддержки')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPlan()
  }, [user])

  const handleSave = async () => {
    if (!user) {
      setError('Сначала войдите через Google, чтобы сохранить план поддержки.')
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)
    try {
      await saveSupportPlan({
        supporters: selectedSupport,
        commitments: selectedCommitments,
        notes,
      })
      setMessage('Настройки поддержки сохранены')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить план поддержки')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="container">
        <motion.section className="section" {...reveal(0, { distance: 24 })}>
          <h1 className="section-heading">Настройте систему поддержки</h1>
          <p className="section-subtitle">Загружаем данные профиля...</p>
        </motion.section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <motion.section className="section surface-panel surface-panel--accent" {...reveal(0, { distance: 24 })}>
          <h1 className="section-heading">Настройте систему поддержки</h1>
          <p className="section-subtitle">
            Войдите через Google, чтобы сохранять ваш план поддержки и быстро к нему возвращаться.
          </p>
          <SignInPrompt
            title="Войдите, чтобы сохранять план поддержки"
            description="Персональный план поможет не терять фокус. Авторизуйтесь, чтобы мы сохранили ваши настройки."
          />
        </motion.section>
      </div>
    )
  }

  return (
    <div className="container">
      <motion.section className="section" id="support" {...reveal(0, { distance: 28 })}>
        <motion.h1 className="section-heading" {...reveal(0.02, { distance: 12 })}>
          Настройте систему поддержки
        </motion.h1>
        <motion.p className="section-subtitle" {...reveal(0.04, { distance: 12 })}>
          Чем выше нагрузка, тем важнее внешняя опора. Выберите, кто может «одолжить» вам веру и какие протезы саморегуляции помогут
          удерживать внимание на цели.
        </motion.p>
        <motion.p className="card__description" style={{ marginBottom: '24px' }} {...reveal(0.06, { distance: 10 })}>
          Специалисты подчеркивают: вера в себя растёт быстрее, когда мы опираемся на людей и механизмы, которые уже доказали свою эффективность.
        </motion.p>
        {isLoading && (
          <motion.p className="section-subtitle" {...reveal(0.08, { distance: 10 })}>
            Загружаем план поддержки...
          </motion.p>
        )}

        <motion.div className="surface-panel surface-panel--accent" {...reveal(0.1, { distance: 18 })}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>Кто может поддержать</h2>
          <div className="support-list">
            {supportOptions.map((option, index) => (
              <motion.label
                key={option.id}
                className="support-item"
                {...reveal(0.12 + index * 0.05, { distance: 16 })}
                whileHover={hoverLift}
              >
                <input
                  type="checkbox"
                  checked={selectedSupport.includes(option.id)}
                  onChange={() => toggleSupport(option.id)}
                  disabled={isLoading}
                />
                <div>
                  <span style={{ display: 'block', fontWeight: 600 }}>{option.label}</span>
                  <span style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    {option.description}
                  </span>
                </div>
              </motion.label>
            ))}
          </div>
        </motion.div>

        <motion.div className="surface-panel" style={{ marginTop: '24px' }} {...reveal(0.2, { distance: 18 })}>
          <h3 className="section-heading" style={{ marginTop: 0, marginBottom: '12px' }}>Популярные сочетания опоры</h3>
          <div className="card-grid" style={{ marginTop: 0 }}>
            {pairings.map((item, index) => (
              <motion.article
                key={item.title}
                className="card"
                style={{ boxShadow: 'none', background: 'var(--color-surface)' }}
                {...reveal(0.22 + index * 0.05, { distance: 16 })}
                whileHover={hoverLift}
              >
                <span className="card__tag">Комбинация</span>
                <h4 className="card__title">{item.title}</h4>
                <p className="card__description">
                  {item.combination.map((id) => supportOptions.find((option) => option.id === id)?.label).join(' · ')}
                </p>
                <p className="card__description" style={{ marginTop: '12px' }}>{item.note}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>

        <motion.div className="surface-panel" style={{ marginTop: '32px' }} {...reveal(0.3, { distance: 18 })}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>Выберите commitment devices</h2>
          <div className="support-list">
            {commitmentOptions.map((item, index) => (
              <motion.label
                key={item}
                className="support-item"
                {...reveal(0.32 + index * 0.04, { distance: 14 })}
                whileHover={hoverLift}
              >
                <input type="checkbox" checked={selectedCommitments.includes(item)} onChange={() => toggleCommitment(item)} disabled={isLoading} />
                <span>{item}</span>
              </motion.label>
            ))}
          </div>
        </motion.div>

        <motion.div className="surface-panel" style={{ marginTop: '32px' }} {...reveal(0.4, { distance: 18 })}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>Следующие договорённости</h2>
          <p className="section-subtitle">
            Опишите, что конкретно попросите у поддержки и какие правила помогут не сойти с дистанции.
          </p>
          <motion.div className="form-field" {...reveal(0.42, { distance: 12 })}>
            <label htmlFor="notes">Мои договорённости</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => {
                setMessage(null)
                setError(null)
                setNotes(event.target.value)
              }}
              placeholder="Например: созвон с наставником по понедельникам, отчет в чате каждое воскресенье..."
              disabled={isLoading}
            />
          </motion.div>
          <motion.div className="hero__actions" {...reveal(0.44, { distance: 12 })}>
            <button type="button" className="cta-button" onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Сохраняем...' : 'Сохранить план'}
            </button>
            {error && <span style={{ color: '#d14343' }}>{error}</span>}
            {message && <span style={{ color: 'var(--color-success)' }}>{message}</span>}
          </motion.div>
        </motion.div>

        <motion.div className="surface-panel surface-panel--accent" style={{ marginTop: '32px' }} {...reveal(0.5, { distance: 18 })}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>Как усилить эффект</h2>
          <ul style={{ color: 'var(--color-text-secondary)', display: 'grid', gap: '8px', paddingInlineStart: '18px', margin: 0 }}>
            <li>Назначьте дату первой встречи или отчёта уже сейчас — короткий шаг снижает прокрастинацию.</li>
            <li>Поделитесь с выбранной опорой формулой действия и объясните, какая часть у вас проседает.</li>
            <li>Перенесите ключевые договорённости в календарь или Notion — мозгу так проще доверять плану.</li>
          </ul>
        </motion.div>
      </motion.section>
    </div>
  )
}
