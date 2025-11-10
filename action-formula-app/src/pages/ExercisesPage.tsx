import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const exercises = [
  {
    id: 'five-whys',
    title: 'Метод «5 зачем»',
    focus: 'value',
    summary: 'Пять раз ответьте на вопрос «зачем», чтобы добраться до истинной мотивации и отделить чужие ожидания.',
    duration: '15 минут',
  },
  {
    id: 'future-self',
    title: 'Встреча с собой через 10 лет',
    focus: 'value',
    summary: 'Опишите два сценария будущего — если цель достигнута и если нет. Зафиксируйте эмоции и последствия.',
    duration: '20 минут',
  },
  {
    id: 'decomposition',
    title: 'Декомпозиция цели',
    focus: 'plan',
    summary: 'Разбейте цель на этапы, задачи, ресурсы, препятствия и критерии успеха. Определите первый шаг.',
    duration: '30 минут',
  },
  {
    id: 'research-map',
    title: 'Карта исследования',
    focus: 'plan',
    summary: 'Заполните шаблон: что нужно узнать, где искать информацию, у кого спросить советы и опыт.',
    duration: '25 минут',
  },
  {
    id: 'borrowed-belief',
    title: 'Одолженная вера',
    focus: 'self',
    summary: 'Выберите человека или группу, которая поддержит и «одолжит» уверенность. Составьте договорённости.',
    duration: '20 минут',
  },
  {
    id: 'micro-steps',
    title: 'Принцип микро-шага',
    focus: 'self',
    summary: 'Сформулируйте действие, которое можно выполнить за 5–10 минут и которое приближает к цели.',
    duration: '10 минут',
  },
]

const focusLabels: Record<string, string> = {
  value: 'Ценность награды',
  plan: 'Вера в план',
  self: 'Вера в себя',
}

export const ExercisesPage = () => {
  const [searchParams] = useSearchParams()
  const focus = searchParams.get('focus')

  const filteredExercises = useMemo(() => {
    if (!focus) return exercises
    return exercises.filter((exercise) => exercise.focus === focus)
  }, [focus])

  return (
    <div className="container">
      <section className="section" id="exercises-list">
        <h1 className="section-heading">Подборка упражнений и практик</h1>
        <p className="section-subtitle">
          Фильтруйте упражнения по компоненту формулы или проходите их последовательно — от ценности к плану и вере в себя.
        </p>

        <div className="hero__actions" style={{ marginBottom: '24px' }}>
          <FilterChip to="/exercises" active={!focus} label="Все" />
          {Object.entries(focusLabels).map(([key, label]) => (
            <FilterChip key={key} to={`/exercises?focus=${key}`} active={focus === key} label={label} />
          ))}
        </div>

        <div className="card-grid">
          {filteredExercises.map((exercise) => (
            <article key={exercise.id} className="card">
              <span className="card__tag">{focusLabels[exercise.focus]}</span>
              <h2 className="card__title">{exercise.title}</h2>
              <p className="card__description">{exercise.summary}</p>
              <p className="card__description" style={{ fontWeight: 500 }}>Время: {exercise.duration}</p>
              <Link to={`/journal?template=${exercise.id}`} className="cta-button cta-button--ghost" style={{ alignSelf: 'flex-start' }}>
                Заполнить шаблон
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

type FilterChipProps = {
  to: string
  label: string
  active: boolean
}

const FilterChip = ({ to, label, active }: FilterChipProps) => (
  <Link to={to} className={['chip', active ? 'chip--active' : ''].filter(Boolean).join(' ')}>
    {label}
  </Link>
)
