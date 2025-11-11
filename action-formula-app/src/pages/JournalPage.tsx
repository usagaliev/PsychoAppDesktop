import { motion } from 'framer-motion'
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
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { buildRevealMotion } from '../utils/motion'

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

const templatePrompts: Record<
  string,
  { steps: string[]; reminder: string }
> = {
  'five-whys': {
    steps: [
      'Пишите без цензуры — чем эмоциональнее, тем точнее попадание в ценности.',
      'Сравните ответы с текущей целью: что совпадает, что нет?',
      'Выделите фразу, которая вызывает максимальный отклик — это будущий девиз.',
    ],
    reminder: 'Вернитесь к этой записи, когда мотивация проседает. Она поможет восстановить ценность награды.',
  },
  decomposition: {
    steps: [
      'Сначала перечислите этапы, а уже потом детали — так мозгу проще воспринимать план.',
      'Добавьте метки «ресурсы», «риски», «первый шаг». Это снизит сопротивление перед стартом.',
      'Отметьте людей, у кого можно попросить обратную связь по каждому этапу.',
    ],
    reminder: 'Эта запись — черновик плана. Перенесите ключевые действия в календарь или трекер задач.',
  },
  'borrowed-belief': {
    steps: [
      'Запишите, кого именно вы просите об опоре и почему этот человек подходит.',
      'Сформулируйте конкретный запрос: формат отчётности, частота, допустимые напоминания.',
      'Пропишите протокол на случай отката — это снижает тревогу и повышает контроль.',
    ],
    reminder: 'Дайте доступ к записи выбранному человеку. Совместные договорённости повышают самоэффективность.',
  },
}

type RevealOptions = Parameters<typeof buildRevealMotion>[1]

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
  const prefersReducedMotion = usePrefersReducedMotion()
  const reveal = (delay = 0, options?: RevealOptions) =>
    buildRevealMotion(prefersReducedMotion, { delay, ...(options ?? {}) })
  const hoverLift = prefersReducedMotion
    ? undefined
    : { y: -6, boxShadow: '0 22px 48px rgba(28, 33, 64, 0.16)' }

  const templateKey = searchParams.get('template')
  const templateMeta = templateKey && templates[templateKey] ? templates[templateKey] : null
  const selectedTemplateGuide =
    templateKey && templatePrompts[templateKey] ? templatePrompts[templateKey] : null

  useEffect(() => {
    if (!templateKey || !templates[templateKey]) return
    const template = templates[templateKey]
    setTitle(template.title)
    setContent(template.content)
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
        <motion.section className="section" {...reveal(0, { distance: 24 })}>
          <h1 className="section-heading">Журнал превращения знаний в действия</h1>
          <p className="section-subtitle">Загружаем данные профиля...</p>
        </motion.section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <motion.section className="section surface-panel surface-panel--accent" {...reveal(0, { distance: 24 })}>
          <h1 className="section-heading">Журнал превращения знаний в действия</h1>
          <p className="section-subtitle">
            Войдите через Google, чтобы сохранять заметки, шаблоны и отслеживать прогресс.
          </p>
          <SignInPrompt
            title="Войдите, чтобы вести журнал"
            description="После входа все записи сохранятся в вашем профиле, и вы сможете к ним возвращаться с любого устройства."
          />
        </motion.section>
      </div>
    )
  }

  return (
    <div className="container">
      <motion.section className="section" id="journal" {...reveal(0, { distance: 28 })}>
        <motion.h1 className="section-heading" {...reveal(0.02, { distance: 12 })}>
          Журнал превращения знаний в действия
        </motion.h1>
        <motion.p className="section-subtitle" {...reveal(0.04, { distance: 12 })}>
          Записывайте выводы после диагностики, упражнения и договорённости. Шаблоны заполнения помогут ничего не забыть.
        </motion.p>

        {selectedTemplateGuide && templateMeta && (
          <motion.div
            className="surface-panel surface-panel--accent"
            style={{ marginBottom: '24px' }}
            {...reveal(0.06, { distance: 16 })}
          >
            <span className="card__tag">Шаги заполнения</span>
            <h2 className="section-heading" style={{ marginBottom: '12px' }}>{templateMeta.title}</h2>
            <ul style={{ display: 'grid', gap: '8px', paddingInlineStart: '18px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              {selectedTemplateGuide.steps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="card__description" style={{ margin: 0 }}>{selectedTemplateGuide.reminder}</p>
          </motion.div>
        )}

        <motion.form
          className="surface-panel"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          {...reveal(0.08, { distance: 18 })}
        >
          <motion.div className="form-field" {...reveal(0.1, { distance: 12 })}>
            <label htmlFor="entry-title">Название заметки</label>
            <input
              id="entry-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например: План на следующую неделю"
              disabled={isLoading}
            />
          </motion.div>
          <motion.div className="form-field" {...reveal(0.12, { distance: 12 })}>
            <label htmlFor="entry-content">Содержание</label>
            <textarea
              id="entry-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Запишите выводы, шаги и договорённости..."
              disabled={isLoading}
            />
          </motion.div>
          <motion.div className="hero__actions" {...reveal(0.14, { distance: 12 })}>
            <button type="submit" className="cta-button" style={{ alignSelf: 'flex-start' }} disabled={isSaving || isLoading}>
              {isSaving ? 'Сохраняем...' : 'Сохранить заметку'}
            </button>
            {error && <span style={{ color: '#d14343' }}>{error}</span>}
          </motion.div>
        </motion.form>

        <motion.div className="surface-panel" style={{ marginTop: '32px' }} {...reveal(0.18, { distance: 18 })}>
          <h2 className="section-heading" style={{ marginBottom: '12px' }}>Как вести записи, чтобы они работали</h2>
          <ul style={{ display: 'grid', gap: '8px', paddingInlineStart: '18px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            <li>Добавляйте теги прямо в тексте: <code>[ценность]</code>, <code>[план]</code>, <code>[вера]</code> — так проще возвращаться к нужным записям.</li>
            <li>Фиксируйте настроение до и после записи по шкале 1–5. Это укрепляет связь между действиями и эмоциями.</li>
            <li>В конце заметки напишите «следующий микро-шаг» — по лекции это поддерживает самоэффективность.</li>
          </ul>
          <p className="card__description" style={{ margin: 0 }}>
            Раз в неделю просматривайте три последние записи и отмечайте, где формула проседает. Сравнивайте с диагностикой, чтобы видеть, что меняется.
          </p>
        </motion.div>

        {isLoading ? (
          <motion.p className="section-subtitle" style={{ textAlign: 'center', marginTop: '32px' }} {...reveal(0.22, { distance: 10 })}>
            Загружаем заметки...
          </motion.p>
        ) : orderedEntries.length > 0 ? (
          <motion.div className="section" style={{ padding: 0 }} {...reveal(0.24, { distance: 18 })}>
            <h2 className="section-heading">Последние заметки</h2>
            <div className="card-grid">
              {orderedEntries.map((entry, index) => (
                <motion.article
                  key={entry.id}
                  className="card"
                  {...reveal(0.26 + index * 0.05, { distance: 16 })}
                  whileHover={hoverLift}
                >
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
                </motion.article>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.p className="section-subtitle" style={{ textAlign: 'center', marginTop: '32px' }} {...reveal(0.24, { distance: 10 })}>
            Пока заметок нет. Заполните упражнение или добавьте результат диагностики, чтобы запустить журнал.
          </motion.p>
        )}
      </motion.section>
    </div>
  )
}
