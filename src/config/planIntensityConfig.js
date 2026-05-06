export const planIntensities = {
  Light: {
    durationLabel: '12 months',
    dailyStudyLabel: '30-45 minutes',
    studyDaysLabel: '4 days/week',
    focus: 'sustainable habit',
    recommendedSettings: {
      planDurationMonths: 12,
      dailyStudyMinutes: 40,
      studyDaysPerWeek: 4,
    },
  },
  Standard: {
    durationLabel: '9 months',
    dailyStudyLabel: '60-90 minutes',
    studyDaysLabel: '5-6 days/week',
    focus: 'balanced improvement',
    recommendedSettings: {
      planDurationMonths: 9,
      dailyStudyMinutes: 75,
      studyDaysPerWeek: 6,
    },
  },
  Intensive: {
    durationLabel: '6 months',
    dailyStudyLabel: '90-120 minutes',
    studyDaysLabel: '6 days/week',
    focus: 'faster professional improvement',
    recommendedSettings: {
      planDurationMonths: 6,
      dailyStudyMinutes: 105,
      studyDaysPerWeek: 6,
    },
  },
  Sprint: {
    durationLabel: '3 months',
    dailyStudyLabel: '120 minutes',
    studyDaysLabel: '6-7 days/week',
    focus: 'fast improvement for meetings and work communication, not full C1 mastery',
    warning: 'Sprint improves work communication quickly, but it may not be enough to reach full C1.',
    recommendedSettings: {
      planDurationMonths: 3,
      dailyStudyMinutes: 120,
      studyDaysPerWeek: 7,
    },
  },
}

export const planIntensityOptions = Object.keys(planIntensities)
