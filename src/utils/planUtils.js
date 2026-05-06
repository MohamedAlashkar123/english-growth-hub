import { createDefaultLearningPlan, createPlanDaysFromDailyPlan, defaultLearningPlan } from '../config'
import { cloneData } from './storage'

function clampIndex(value, length) {
  const numericValue = Number(value || 1)
  return Math.min(Math.max(numericValue, 1), Math.max(length, 1))
}

function normalizeTask(task, taskIndex, fallbackId) {
  return {
    id: task.id || fallbackId,
    legacyId: task.legacyId || '',
    text: task.text || '',
    skill: task.skill || 'Practice',
    estimatedMinutes: Number(task.estimatedMinutes || 15),
  }
}

function normalizeDay(day, dayIndex, fallbackDay) {
  const dayName = day.dayName || day.day || fallbackDay.dayName

  return {
    id: day.id || fallbackDay.id || `day-${dayIndex + 1}`,
    dayName,
    focus: day.focus || fallbackDay.focus,
    tasks: (Array.isArray(day.tasks) && day.tasks.length > 0 ? day.tasks : fallbackDay.tasks).map((task, taskIndex) =>
      normalizeTask(task, taskIndex, fallbackDay.tasks[taskIndex]?.id || `${dayName}-task-${taskIndex + 1}`),
    ),
    speakingTopics: (Array.isArray(day.speakingTopics) ? day.speakingTopics : fallbackDay.speakingTopics || []).map(
      (topic, topicIndex) => ({
        id: topic.id || fallbackDay.speakingTopics?.[topicIndex]?.id || `${dayName}-topic-${topicIndex + 1}`,
        legacyId: topic.legacyId || '',
        text: topic.text || topic.title || '',
      }),
    ),
  }
}

export function normalizeLearningPlan(plan, profile = {}, legacyDailyPlan = []) {
  const source =
    plan && typeof plan === 'object' && Array.isArray(plan.months) && plan.months.length > 0
      ? plan
      : createDefaultLearningPlan({
          durationMonths: profile.planDurationMonths,
          intensity: profile.planIntensity,
          dailyPlan: legacyDailyPlan.length ? legacyDailyPlan : undefined,
        })
  const fallback = createDefaultLearningPlan({
    durationMonths: source.durationMonths || profile.planDurationMonths,
    intensity: source.intensity || profile.planIntensity,
    dailyPlan: legacyDailyPlan.length ? legacyDailyPlan : undefined,
  })

  return {
    durationMonths: Number(source.durationMonths || profile.planDurationMonths || fallback.durationMonths),
    intensity: source.intensity || profile.planIntensity || fallback.intensity,
    months: source.months.map((month, monthIndex) => {
      const fallbackMonth = fallback.months[monthIndex] || fallback.months[0] || defaultLearningPlan.months[0]

      return {
        id: month.id || fallbackMonth.id || `month-${monthIndex + 1}`,
        monthNumber: Number(month.monthNumber || monthIndex + 1),
        theme: month.theme || fallbackMonth.theme,
        goals: Array.isArray(month.goals) && month.goals.length > 0 ? month.goals : fallbackMonth.goals,
        weeks: (Array.isArray(month.weeks) && month.weeks.length > 0 ? month.weeks : fallbackMonth.weeks).map(
          (week, weekIndex) => {
            const fallbackWeek = fallbackMonth.weeks[weekIndex] || fallbackMonth.weeks[0]

            return {
              id: week.id || fallbackWeek.id || `${month.id || fallbackMonth.id}-week-${weekIndex + 1}`,
              weekNumber: Number(week.weekNumber || weekIndex + 1),
              focus: week.focus || fallbackWeek.focus,
              days: (Array.isArray(week.days) && week.days.length > 0 ? week.days : fallbackWeek.days).map(
                (day, dayIndex) => normalizeDay(day, dayIndex, fallbackWeek.days[dayIndex] || fallbackWeek.days[0]),
              ),
            }
          },
        ),
      }
    }),
  }
}

export function createLearningPlanFromLegacyDailyPlan(dailyPlan, profile = {}) {
  const plan = createDefaultLearningPlan({
    durationMonths: profile.planDurationMonths,
    intensity: profile.planIntensity,
  })

  return {
    ...plan,
    months: plan.months.map((month) =>
      month.monthNumber === 1
        ? {
            ...month,
            weeks: month.weeks.map((week) =>
              week.weekNumber === 1 ? { ...week, days: createPlanDaysFromDailyPlan(dailyPlan, 1, 1) } : week,
            ),
          }
        : month,
    ),
  }
}

export function getCurrentPlanPosition(profile, learningPlan, savedPosition = {}) {
  const monthNumber = clampIndex(savedPosition.selectedMonth || 1, learningPlan.months.length)
  const month = learningPlan.months[monthNumber - 1]
  const weekNumber = clampIndex(savedPosition.selectedWeek || 1, month.weeks.length)
  const week = month.weeks[weekNumber - 1]
  const selectedDay = savedPosition.selectedDay || savedPosition.selectedPlanDay || 'Saturday'
  const day = week.days.find((item) => item.dayName === selectedDay) || week.days[0]

  return {
    durationMonths: Number(profile.planDurationMonths || learningPlan.durationMonths),
    intensity: profile.planIntensity || learningPlan.intensity,
    monthNumber,
    weekNumber,
    dayName: day.dayName,
  }
}

export function getCurrentMonth(learningPlan, currentDateOrPosition = {}) {
  const monthNumber = clampIndex(currentDateOrPosition.selectedMonth || currentDateOrPosition.monthNumber || 1, learningPlan.months.length)
  return learningPlan.months[monthNumber - 1]
}

export function getCurrentWeek(learningPlan, currentDateOrPosition = {}) {
  const month = getCurrentMonth(learningPlan, currentDateOrPosition)
  const weekNumber = clampIndex(currentDateOrPosition.selectedWeek || currentDateOrPosition.weekNumber || 1, month.weeks.length)
  return month.weeks[weekNumber - 1]
}

export function getTodayPlan(learningPlan, currentDateOrPosition = {}) {
  const week = getCurrentWeek(learningPlan, currentDateOrPosition)
  const dayName = currentDateOrPosition.selectedDay || currentDateOrPosition.dayName || 'Saturday'
  return week.days.find((day) => day.dayName === dayName) || week.days[0]
}

export function flattenPlanTasks(learningPlan) {
  return learningPlan.months.flatMap((month) =>
    month.weeks.flatMap((week) =>
      week.days.flatMap((day) =>
        day.tasks.map((task) => ({
          ...task,
          monthId: month.id,
          weekId: week.id,
          dayId: day.id,
          dayName: day.dayName,
        })),
      ),
    ),
  )
}

export function calculatePlanProgress(learningPlan, completedTasks = {}) {
  const tasks = flattenPlanTasks(learningPlan)
  const completed = tasks.filter((task) => completedTasks[task.id] || (task.legacyId && completedTasks[task.legacyId])).length

  return {
    total: tasks.length,
    completed,
    percentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  }
}

export function getDayProgress(day, completedTasks = {}) {
  const total = day.tasks.length
  const completed = day.tasks.filter((task) => completedTasks[task.id] || (task.legacyId && completedTasks[task.legacyId])).length

  return {
    total,
    completed,
    percentage: total ? Math.round((completed / total) * 100) : 0,
  }
}

export function migrateCompletedDailyTasksToPlan(learningPlan, completedDailyTasks = {}, completedPlanTasks = {}) {
  const migrated = { ...completedPlanTasks }

  flattenPlanTasks(learningPlan).forEach((task) => {
    if (completedDailyTasks[task.id] || (task.legacyId && completedDailyTasks[task.legacyId])) {
      migrated[task.id] = true
    }
  })

  return migrated
}

export function updateLearningPlanDay(learningPlan, position, updater) {
  const nextPlan = cloneData(learningPlan)
  const month = nextPlan.months[position.monthNumber - 1]
  const week = month.weeks[position.weekNumber - 1]
  const dayIndex = week.days.findIndex((day) => day.dayName === position.dayName)
  const resolvedDayIndex = dayIndex >= 0 ? dayIndex : 0
  week.days[resolvedDayIndex] = updater(week.days[resolvedDayIndex])
  return nextPlan
}
