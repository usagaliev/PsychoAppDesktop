import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { buildRevealMotion } from '../utils/motion'

const exercises = [
  {
    id: 'five-whys',
    title: 'Метод «5 зачем»',
    focus: 'value',
    summary: 'Пять раз ответьте на вопрос «зачем», чтобы добраться до истинной мотивации и отделить чужие ожидания.',
    duration: '15 минут',
    reflection: 'Запишите, какие формулировки вызвали больше эмоций. Они пригодятся для карты ценностей и журналинга.',
  },
  {
    id: 'future-self',
    title: 'Встреча с собой через 10 лет',
    focus: 'value',
    summary: 'Опишите два сценария будущего — если цель достигнута и если нет. Зафиксируйте эмоции и последствия.',
    duration: '20 минут',
    reflection: 'Сопоставьте два сценария: что вы точно не хотите потерять? Это станет мотивационной фразой на каждый день.',
  },
  {
    id: 'decomposition',
    title: 'Декомпозиция цели',
    focus: 'plan',
    summary: 'Разбейте цель на этапы, задачи, ресурсы, препятствия и критерии успеха. Определите первый шаг.',
    duration: '30 минут',
    reflection: 'Определите три индикатора прогресса и людей, у которых можно попросить обратную связь.',
  },
  {
    id: 'research-map',
    title: 'Карта исследования',
    focus: 'plan',
    summary: 'Заполните шаблон: что нужно узнать, где искать информацию, у кого спросить советы и опыт.',
    duration: '25 минут',
    reflection: 'Зафиксируйте минимум один источник и дату, когда вы обратитесь к нему. Это увеличит доверие к плану.',
  },
  {
    id: 'borrowed-belief',
    title: 'Одолженная вера',
    focus: 'self',
    summary: 'Выберите человека или группу, которая поддержит и «одолжит» уверенность. Составьте договорённости.',
    duration: '20 минут',
    reflection: 'Опишите, какую поддержку вы запросите и как будете отчитываться. Согласуйте это с выбранным человеком.',
  },
  {
    id: 'micro-steps',
    title: 'Принцип микро-шага',
    focus: 'self',
    summary: 'Сформулируйте действие, которое можно выполнить за 5–10 минут и которое приближает к цели.',
    duration: '10 минут',
    reflection: 'Зафиксируйте настроение до и после. Даже +1 балл — это сигнал, что самоэффективность растёт.',
  },
]

const focusLabels: Record<string, string> = {
  value: 'Ценность награды',
  plan: 'Вера в план',
  self: 'Вера в себя',
}

const isFocusKey = (value: string | null): value is keyof typeof focusLabels =>
  value !== null && Object.prototype.hasOwnProperty.call(focusLabels, value)

const focusContext: Record<
  string,
  { headline: string; guidance: string; reminder: string }
> = {
  value: {
    headline: 'Усилите контакт с «зачем»',
    guidance:
      'Специалисты советуют возвращаться к вдумчивым вопросам и визуализации будущего. Сначала оживляем награду, потом переходим к плану.',
    reminder: 'После упражнения добавьте ключевые фразы в журнал — так мотивация не растворится.',
  },
  plan: {
    headline: 'Добавьте структуру и определённости',
    guidance:
      'Чем конкретнее шаги и ресурсы, тем выше вера в план. Соберите рабочие методы, уточните последовательность, найдите первых союзников.',
    reminder: 'Синхронизируйте план с системой поддержки — попросите обратную связь по этапам.',
  },
  self: {
    headline: 'Поддержите самоэффективность',
    guidance:
      'С точки зрения Бандуры важно «одолживать» уверенность и начинать с мини-действий. Подключите поддержку и подсчёт побед.',
    reminder: 'Отметьте, как поменялось состояние после упражнения. Это укрепляет веру в себя.',
  },
}

type RevealOptions = Parameters<typeof buildRevealMotion>[1]

export const ExercisesPage = () => {
  const [searchParams] = useSearchParams()
  const focusParam = searchParams.get('focus')
  const focus = isFocusKey(focusParam) ? focusParam : null
  const prefersReducedMotion = usePrefersReducedMotion()
  const reveal = (delay = 0, options?: RevealOptions) =>
    buildRevealMotion(prefersReducedMotion, { delay, ...(options ?? {}) })
  const hoverLift = prefersReducedMotion
    ? undefined
    : { y: -6, boxShadow: '0 22px 48px rgba(28, 33, 64, 0.16)' }

  const filteredExercises = useMemo(() => {
    if (!focus) return exercises
    return exercises.filter((exercise) => exercise.focus === focus)
  }, [focus])

  const focusInsight = focus ? focusContext[focus] : null
  const focusLabel = focus ? focusLabels[focus] : null

  return (
    <div className="container">
      <motion.section className="section" id="exercises-list" {...reveal(0, { distance: 28 })}>
        <motion.h1 className="section-heading" {...reveal(0.02, { distance: 12 })}>
          Подборка упражнений и практик
        </motion.h1>
        <motion.p className="section-subtitle" {...reveal(0.04, { distance: 12 })}>
          Фильтруйте упражнения по компоненту формулы или проходите их последовательно — от ценности к плану и вере в себя.
        </motion.p>

        <motion.div className="hero__actions" style={{ marginBottom: '24px' }} {...reveal(0.06, { distance: 12 })}>
          <FilterChip to="/exercises" active={!focus} label="Все" />
          {Object.entries(focusLabels).map(([key, label]) => (
            <FilterChip key={key} to={`/exercises?focus=${key}`} active={focus === key} label={label} />
          ))}
        </motion.div>

        {focusInsight && focusLabel && (
          <motion.div
            className="surface-panel surface-panel--accent"
            style={{ marginBottom: '24px' }}
            {...reveal(0.08, { distance: 16 })}
          >
            <span className="card__tag">{focusLabel}</span>
            <h2 className="section-heading" style={{ marginBottom: '8px' }}>{focusInsight.headline}</h2>
            <p className="section-subtitle" style={{ marginBottom: '16px' }}>{focusInsight.guidance}</p>
            <p className="card__description" style={{ margin: 0 }}>{focusInsight.reminder}</p>
          </motion.div>
        )}

        <div className="card-grid">
          {filteredExercises.map((exercise, index) => (
            <motion.article
              key={exercise.id}
              className="card"
              {...reveal(0.1 + index * 0.05, { distance: 18 })}
              whileHover={hoverLift}
            >
              <span className="card__tag">{focusLabels[exercise.focus]}</span>
              <h2 className="card__title">{exercise.title}</h2>
              <p className="card__description">{exercise.summary}</p>
              <p className="card__description" style={{ fontWeight: 500 }}>Время: {exercise.duration}</p>
              <p className="card__description" style={{ marginTop: '12px' }}>
                Что записать после: {exercise.reflection}
              </p>
              <Link to={`/journal?template=${exercise.id}`} className="cta-button cta-button--ghost" style={{ alignSelf: 'flex-start' }}>
                Заполнить шаблон
              </Link>
            </motion.article>
          ))}
        </div>

        <motion.div className="surface-panel" style={{ marginTop: '32px' }} {...reveal(0.2, { distance: 18 })}>
          <h2 className="section-heading" style={{ marginBottom: '8px' }}>После упражнения</h2>
          <p className="section-subtitle" style={{ marginBottom: '12px' }}>
            Зафиксируйте настроение по шкале 1–5 и отметьте, что помогло улучшить состояние. Это создаёт положительное подкрепление и растит самоэффективность.
          </p>
          <p className="card__description" style={{ margin: 0 }}>
            Ориентируйтесь на лекцию: действие легче, когда вы видите, как практика влияет на эмоции и контроль над ситуацией.
          </p>
        </motion.div>
      </motion.section>
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
