import { defaultDailyPlan } from './defaultDailyPlan'
import { monthlyRoadmap } from './defaultContentLibrary'
import { defaultProfile } from './defaultProfile'

const intensityGuidance = {
  Light: {
    durationMonths: 12,
    taskStyle: 'Light practice day',
    weekFocus: 'Sustainable habit and review',
  },
  Standard: {
    durationMonths: 9,
    taskStyle: 'Balanced practice day',
    weekFocus: 'Balanced professional improvement',
  },
  Intensive: {
    durationMonths: 6,
    taskStyle: 'Intensive speaking and writing day',
    weekFocus: 'Faster professional improvement',
  },
  Sprint: {
    durationMonths: 3,
    taskStyle: 'Compressed work communication day',
    weekFocus: 'Fast improvement for meetings and work communication',
  },
}

const daySkillMap = {
  Saturday: ['Grammar', 'Listening', 'Speaking'],
  Sunday: ['Writing', 'Vocabulary', 'Pronunciation'],
  Monday: ['Meeting English', 'Speaking'],
  Tuesday: ['Grammar', 'Technical Speaking'],
  Wednesday: ['Listening', 'Writing', 'Speaking'],
  Thursday: ['Presentation', 'Pronunciation'],
  Friday: ['Review', 'Fluency'],
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getPlanTaskId(monthNumber, weekNumber, dayName, taskIndex) {
  return `m${monthNumber}-w${weekNumber}-${slug(dayName)}-task-${taskIndex + 1}`
}

export function getPlanTopicId(monthNumber, weekNumber, dayName, topicIndex) {
  return `m${monthNumber}-w${weekNumber}-${slug(dayName)}-topic-${topicIndex + 1}`
}

export function createPlanDaysFromDailyPlan(dailyPlan, monthNumber = 1, weekNumber = 1) {
  return dailyPlan.map((day) => ({
    id: `month-${monthNumber}-week-${weekNumber}-${slug(day.day)}`,
    dayName: day.day,
    focus: day.focus,
    tasks: day.tasks.map((task, index) => ({
      id: getPlanTaskId(monthNumber, weekNumber, day.day, index),
      legacyId: task.id,
      text: task.text,
      skill: daySkillMap[day.day]?.[index % daySkillMap[day.day].length] || 'Practice',
      estimatedMinutes: index === 0 ? 20 : 15,
    })),
    speakingTopics: day.speakingTopics.map((topic, index) => ({
      id: getPlanTopicId(monthNumber, weekNumber, day.day, index),
      legacyId: topic.id,
      text: topic.text,
    })),
  }))
}

function createPlaceholderDays(monthNumber, weekNumber, intensity) {
  const guidance = intensityGuidance[intensity] || intensityGuidance.Standard

  return defaultDailyPlan.map((day, dayIndex) => ({
    id: `month-${monthNumber}-week-${weekNumber}-${slug(day.day)}`,
    dayName: day.day,
    focus: `${guidance.taskStyle}: ${day.focus}`,
    tasks: [
      {
        id: getPlanTaskId(monthNumber, weekNumber, day.day, 0),
        text: `Review one ${daySkillMap[day.day]?.[0] || 'English'} point for your work context`,
        skill: daySkillMap[day.day]?.[0] || 'Practice',
        estimatedMinutes: intensity === 'Light' ? 15 : 20,
      },
      {
        id: getPlanTaskId(monthNumber, weekNumber, day.day, 1),
        text: `Complete a ${intensity.toLowerCase()} practice activity connected to ${day.topic || day.focus}`,
        skill: daySkillMap[day.day]?.[1] || 'Speaking',
        estimatedMinutes: intensity === 'Sprint' ? 30 : 20,
      },
      {
        id: getPlanTaskId(monthNumber, weekNumber, day.day, 2),
        text: 'Write or record a short reflection with corrections',
        skill: daySkillMap[day.day]?.[2] || 'Reflection',
        estimatedMinutes: intensity === 'Light' ? 10 : 15,
      },
    ].slice(0, intensity === 'Light' && dayIndex > 3 ? 1 : 3),
    speakingTopics: [
      {
        id: getPlanTopicId(monthNumber, weekNumber, day.day, 0),
        text: day.topic,
      },
    ],
  }))
}

export function createDefaultLearningPlan({
  durationMonths = defaultProfile.planDurationMonths,
  intensity = defaultProfile.planIntensity,
  dailyPlan = defaultDailyPlan,
} = {}) {
  const guidance = intensityGuidance[intensity] || intensityGuidance.Standard
  const monthCount = Number(durationMonths || guidance.durationMonths)

  return {
    durationMonths: monthCount,
    intensity,
    months: Array.from({ length: monthCount }, (_, monthIndex) => {
      const monthNumber = monthIndex + 1
      const roadmapItem = monthlyRoadmap[monthIndex] || {
        focus: `${intensity} development`,
        goal: `Build English confidence and consistency for month ${monthNumber}.`,
      }

      return {
        id: `month-${monthNumber}`,
        monthNumber,
        theme: roadmapItem.focus,
        goals: [roadmapItem.goal],
        weeks: Array.from({ length: 4 }, (_, weekIndex) => {
          const weekNumber = weekIndex + 1
          const isSeedWeek = monthNumber === 1 && weekNumber === 1

          return {
            id: `month-${monthNumber}-week-${weekNumber}`,
            weekNumber,
            focus: isSeedWeek ? 'Grammar foundation + speaking habit' : `${guidance.weekFocus} - week ${weekNumber}`,
            days: isSeedWeek
              ? createPlanDaysFromDailyPlan(dailyPlan, monthNumber, weekNumber)
              : createPlaceholderDays(monthNumber, weekNumber, intensity),
          }
        }),
      }
    }),
  }
}

export const defaultLearningPlan = createDefaultLearningPlan()
