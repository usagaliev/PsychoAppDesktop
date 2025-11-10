import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'

import { SignInPrompt } from '../components/common/SignInPrompt'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
  type JournalEntry,
} from '../services/journal'

const templates: Record<string, { title: string; content: string }> = {
  'five-whys': {
    title: '5 зачем — выводы',
    content: 'Цель:\nЗачем 1:\nЗачем 2:\nЗачем 3:\nЗачем 4:\nЗачем 5:\nГлавный инсайт:',
  },
  'decomposition': {
    title: 'Декомпозиция цели',
    content: 'Этапы:\n1.\n2.\n3.\nРесурсы:\nПрепятствия:\nПервый шаг на 24 часа:\n',
  },
  'borrowed-belief': {
    title: 'План поддержки',
    content: 'Кого привлекаю:\nКакую помощь прошу:\nЧастота контакта:\nЧто делаю при откате:\n',
  },
}

export const JournalPage = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

  const templateKey = searchParams.get('template')

  useEffect(() => {
    if (!templateKey) return
    const template = templates[templateKey]
    if (template) {
      setTitle(template.title)
      setContent(template.content)
    }
  }, [templateKey])

  useEffect(() => {
    const loadEntries = async () => {
      if (!user) {
        setEntries([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetchJournalEntries()
        setEntries(response.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заметки')
      } finally {
        setIsLoading(false)
      }
    }

    void loadEntries()
  }, [user])

  const orderedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [entries])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title || !content) return
    if (!user) {
      setError('Чтобы сохранять заметки, войдите через Google.')
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      const response = await createJournalEntry({
        title,
        content,
        ...(templateKey ? { templateKey } : {}),
      })

      setEntries((prev) => [response.item, ...prev])
      setTitle('')
      setContent('')
      if (templateKey) {
        searchParams.delete('template')
        setSearchParams(searchParams, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить заметку')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) {
      setError('Войдите через Google, чтобы управлять заметками.')
      return
    }

    try {
      setPendingDelete(id)
      await deleteJournalEntry(id)
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить заметку')
    } finally {
      setPendingDelete(null)
    }
  }

  if (authLoading) {
    return (
      <div className="container">
        <section className="section">
          <h1 className="section-heading">Журнал превращения знаний в действия</h1>
          <p className="section-subtitle">Загружаем данные профиля...</p>
        </section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <section className="section surface-panel surface-panel--accent">
          <h1 className="section-heading">Журнал превращения знаний в действия</h1>
          <p className="section-subtitle">
            Войдите через Google, чтобы сохранять заметки, шаблоны и отслеживать прогресс.
          </p>
          <SignInPrompt
            title="Войдите, чтобы вести журнал"
            description="После входа все записи сохранятся в вашем профиле, и вы сможете к ним возвращаться с любого устройства."
          />
        </section>
      </div>
    )
  }

  return (
    <div className="container">
      <section className="section" id="journal">
        <h1 className="section-heading">Журнал превращения знаний в действия</h1>
        <p className="section-subtitle">
          Записывайте выводы после диагностики, упражнения и договорённости. Шаблоны заполнения помогут ничего не забыть.
        </p>

        <form className="surface-panel" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-field">
            <label htmlFor="entry-title">Название заметки</label>
            <input
              id="entry-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например: План на следующую неделю"
              disabled={isLoading}
            />
          </div>
          <div className="form-field">
            <label htmlFor="entry-content">Содержание</label>
            <textarea
              id="entry-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Запишите выводы, шаги и договорённости..."
              disabled={isLoading}
            />
          </div>
          <div className="hero__actions">
            <button type="submit" className="cta-button" style={{ alignSelf: 'flex-start' }} disabled={isSaving || isLoading}>
              {isSaving ? 'Сохраняем...' : 'Сохранить заметку'}
            </button>
            {error && <span style={{ color: '#d14343' }}>{error}</span>}
          </div>
        </form>

        {isLoading ? (
          <p className="section-subtitle" style={{ textAlign: 'center', marginTop: '32px' }}>
            Загружаем заметки...
          </p>
        ) : orderedEntries.length > 0 ? (
          <div className="section" style={{ padding: 0 }}>
            <h2 className="section-heading">Последние заметки</h2>
            <div className="card-grid">
              {orderedEntries.map((entry) => (
                <article key={entry.id} className="card">
                  <span className="card__tag">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  <h3 className="card__title">{entry.title}</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--color-text-secondary)' }}>
                    {entry.content}
                  </pre>
                  <button
                    type="button"
                    className="cta-button cta-button--ghost"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => handleDelete(entry.id)}
                    disabled={pendingDelete === entry.id}
                  >
                    {pendingDelete === entry.id ? 'Удаляем...' : 'Удалить'}
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="section-subtitle" style={{ textAlign: 'center', marginTop: '32px' }}>
            Пока заметок нет. Заполните упражнение или добавьте результат диагностики, чтобы запустить журнал.
          </p>
        )}
      </section>
    </div>
  )
}
