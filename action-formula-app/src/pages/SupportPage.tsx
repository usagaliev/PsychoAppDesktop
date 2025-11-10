import { useEffect, useState } from 'react'

import { fetchSupportPlan, saveSupportPlan } from '../services/support'

const supportOptions = [
  { id: 'therapist', label: 'Психотерапевт' },
  { id: 'coach', label: 'Коуч / наставник' },
  { id: 'friend', label: 'Друг или партнёр' },
  { id: 'community', label: 'Онлайн-сообщество' },
  { id: 'group', label: 'Группа поддержки' },
]

const commitmentOptions = [
  'Финансовое обязательство (предоплата, абонемент)',
  'Публичное обещание (пост, чат друзей)',
  'Автоматизация (приложения, подписки, таймеры)',
  'Коммитмент с последствиями (пари, штрафы)',
  'Дедлайны с внешними последствиями',
]

export const SupportPage = () => {
  const [selectedSupport, setSelectedSupport] = useState<string[]>(['therapist', 'friend'])
  const [selectedCommitments, setSelectedCommitments] = useState<string[]>(['Публичное обещание (пост, чат друзей)'])
  const [notes, setNotes] = useState('Отчитываться каждую пятницу, договориться о совместной сессии каждые 2 недели.')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
  }, [])

  const handleSave = async () => {
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

  return (
    <div className="container">
      <section className="section" id="support">
        <h1 className="section-heading">Настройте систему поддержки</h1>
        <p className="section-subtitle">
          Чем выше нагрузка, тем важнее внешняя опора. Выберите, кто может «одолжить» вам веру и какие протезы саморегуляции помогут
          удерживать внимание на цели.
        </p>
        {isLoading && <p className="section-subtitle">Загружаем план поддержки...</p>}

        <div className="surface-panel surface-panel--accent">
          <h2 className="section-heading" style={{ marginTop: 0 }}>Кто может поддержать</h2>
          <div className="support-list">
            {supportOptions.map((option) => (
              <label key={option.id} className="support-item">
                <input
                  type="checkbox"
                  checked={selectedSupport.includes(option.id)}
                  onChange={() => toggleSupport(option.id)}
                  disabled={isLoading}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="surface-panel" style={{ marginTop: '32px' }}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>Выберите commitment devices</h2>
          <div className="support-list">
            {commitmentOptions.map((item) => (
              <label key={item} className="support-item">
                <input type="checkbox" checked={selectedCommitments.includes(item)} onChange={() => toggleCommitment(item)} disabled={isLoading} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="surface-panel" style={{ marginTop: '32px' }}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>Следующие договорённости</h2>
          <p className="section-subtitle">
            Опишите, что конкретно попросите у поддержки и какие правила помогут не сойти с дистанции.
          </p>
          <div className="form-field">
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
          </div>
          <div className="hero__actions">
            <button type="button" className="cta-button" onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Сохраняем...' : 'Сохранить план'}
            </button>
            {error && <span style={{ color: '#d14343' }}>{error}</span>}
            {message && <span style={{ color: 'var(--color-success)' }}>{message}</span>}
          </div>
        </div>
      </section>
    </div>
  )
}
