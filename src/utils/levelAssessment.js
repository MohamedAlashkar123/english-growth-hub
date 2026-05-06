import { calculatePercentage, getEvaluationAverage, getEvaluationScore } from './progressCalculations'

export const levelSourceOptions = ['Manual', 'Teacher-assessed', 'App-suggested', 'Imported assessment']

const levelOrder = ['A1', 'A2', 'B1', 'B1+', 'B2', 'B2+', 'Strong B2', 'Early C1', 'C1', 'C2']

function clampLevelIndex(index) {
  return Math.min(Math.max(index, 0), levelOrder.length - 1)
}

function getNextLevel(level) {
  const index = levelOrder.findIndex((item) => String(level || '').includes(item))
  return levelOrder[clampLevelIndex((index >= 0 ? index : 3) + 1)]
}

function normalizeSkillName(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, '')
}

export function calculateSkillAverages(evaluations = [], evaluationSkills = []) {
  const sourceEvaluations = Array.isArray(evaluations) ? evaluations : []
  const averages = {}

  evaluationSkills.forEach((skill) => {
    const scores = sourceEvaluations
      .map((evaluation) => getEvaluationScore(evaluation, skill.id))
      .filter((score) => score > 0)
    averages[skill.id] = scores.length
      ? Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1))
      : 0
  })

  return averages
}

export function calculateSkillTrends(evaluations = [], evaluationSkills = []) {
  const sourceEvaluations = Array.isArray(evaluations) ? evaluations : []
  const trends = {}

  evaluationSkills.forEach((skill) => {
    const latestScore = sourceEvaluations[0] ? getEvaluationScore(sourceEvaluations[0], skill.id) : 0
    const olderScore = sourceEvaluations[1] ? getEvaluationScore(sourceEvaluations[1], skill.id) : latestScore
    if (!latestScore) {
      trends[skill.id] = 'Not assessed yet'
    } else if (latestScore > olderScore) {
      trends[skill.id] = 'Improving'
    } else if (latestScore < olderScore || latestScore < 3) {
      trends[skill.id] = 'Needs Focus'
    } else {
      trends[skill.id] = 'Stable'
    }
  })

  return trends
}

export function normalizeLevelProfile(levelProfile = {}, profile = {}, levelSummary = []) {
  const sourceLevelProfile = levelProfile && typeof levelProfile === 'object' ? levelProfile : {}
  const skillLevels = levelSummary.reduce((result, item) => {
    result[normalizeSkillName(item.skill)] = item.level || 'Not assessed yet'
    return result
  }, {})

  return {
    officialLevel: sourceLevelProfile.officialLevel || profile.currentLevel || 'B1+',
    targetLevel: sourceLevelProfile.targetLevel || profile.targetLevel || 'Strong B2',
    levelSource: levelSourceOptions.includes(sourceLevelProfile.levelSource) ? sourceLevelProfile.levelSource : 'Manual',
    lastUpdatedAt: sourceLevelProfile.lastUpdatedAt || new Date().toISOString(),
    suggestedLevel: sourceLevelProfile.suggestedLevel || profile.currentLevel || 'B1+',
    suggestedLevelConfidence: sourceLevelProfile.suggestedLevelConfidence || 'Low',
    suggestedLevelReason: sourceLevelProfile.suggestedLevelReason || 'No suggestion calculated yet.',
    teacherNote: sourceLevelProfile.teacherNote || '',
    userNote: sourceLevelProfile.userNote || '',
    skillLevels: {
      ...skillLevels,
      ...(sourceLevelProfile.skillLevels || {}),
    },
  }
}

export function getLevelEvidence({
  profile = {},
  evaluations = [],
  evaluationSkills = [],
  mistakes = [],
  speakingTopicProgress = {},
  contentLibrary = {},
} = {}) {
  const latestEvaluation = evaluations[0]
  const skillAverages = calculateSkillAverages(evaluations, evaluationSkills)
  const scoredSkills = evaluationSkills
    .map((skill) => ({ skill, average: skillAverages[skill.id] || 0, latest: latestEvaluation ? getEvaluationScore(latestEvaluation, skill.id) : 0 }))
    .filter((item) => item.average > 0)
  const weakest = scoredSkills.length ? [...scoredSkills].sort((a, b) => a.average - b.average)[0] : null
  const strongest = scoredSkills.length ? [...scoredSkills].sort((a, b) => b.average - a.average)[0] : null
  const activeMistakes = Array.isArray(mistakes) ? mistakes.filter((mistake) => mistake.status !== 'Fixed') : []
  const fixedMistakes = Array.isArray(mistakes) ? mistakes.filter((mistake) => mistake.status === 'Fixed') : []
  const speakingProgressValues = Object.values(speakingTopicProgress || {})
  const speakingCompleted = speakingProgressValues.filter((item) => item.completed).length
  const grammarTopics = contentLibrary.grammarTopics || []
  const completedGrammar = grammarTopics.filter((topic) => topic.completed).length

  return {
    latestEvaluationAverage: latestEvaluation ? getEvaluationAverage(latestEvaluation, evaluationSkills, (skills) => skills) : 0,
    overallAverage: scoredSkills.length
      ? Number((scoredSkills.reduce((total, item) => total + item.average, 0) / scoredSkills.length).toFixed(1))
      : 0,
    weakestSkill: weakest?.skill?.name || 'Not assessed yet',
    weakestScore: weakest?.average || 0,
    strongestSkill: strongest?.skill?.name || 'Not assessed yet',
    strongestScore: strongest?.average || 0,
    activeMistakesCount: activeMistakes.length,
    fixedMistakesCount: fixedMistakes.length,
    speakingCompleted,
    grammarCompletion: calculatePercentage(completedGrammar, grammarTopics.length),
    officialLevel: profile.currentLevel || 'B1+',
  }
}

export function suggestOverallLevel({
  profile = {},
  evaluations = [],
  evaluationSkills = [],
  mistakes = [],
  speakingTopicProgress = {},
  contentLibrary = {},
} = {}) {
  const evidence = getLevelEvidence({ profile, evaluations, evaluationSkills, mistakes, speakingTopicProgress, contentLibrary })
  const officialLevel = profile.currentLevel || 'B1+'
  const lowSkillCount = Object.values(calculateSkillAverages(evaluations, evaluationSkills)).filter((score) => score > 0 && score < 3).length
  const evidenceBullets = [
    evaluations.length ? `Latest evaluation average is ${evidence.latestEvaluationAverage}/5.` : 'No evaluation history is available yet.',
    `Active mistakes: ${evidence.activeMistakesCount}. Fixed mistakes: ${evidence.fixedMistakesCount}.`,
    `Weakest skill: ${evidence.weakestSkill}${evidence.weakestScore ? ` (${evidence.weakestScore}/5 average)` : ''}.`,
    `Completed speaking topics: ${evidence.speakingCompleted}.`,
  ]

  if (!evaluations.length) {
    return {
      suggestedLevel: officialLevel,
      confidence: 'Low',
      reason: 'No evaluation history is available yet.',
      evidence: evidenceBullets,
    }
  }

  if (evidence.overallAverage >= 4 && lowSkillCount === 0 && evidence.activeMistakesCount <= 3) {
    return {
      suggestedLevel: getNextLevel(officialLevel),
      confidence: evidence.activeMistakesCount === 0 ? 'High' : 'Medium',
      reason: 'Average evaluation scores are strong and active mistakes are low, so a cautious level upgrade may be reasonable.',
      evidence: evidenceBullets,
    }
  }

  if (lowSkillCount >= 2 || evidence.overallAverage < 3) {
    return {
      suggestedLevel: officialLevel,
      confidence: 'Medium',
      reason: 'Several skills are below 3/5, so it is safer to keep the current level and focus on weak areas.',
      evidence: evidenceBullets,
    }
  }

  return {
    suggestedLevel: officialLevel,
    confidence: evidence.activeMistakesCount > 6 ? 'Low' : 'Medium',
    reason: 'Average scores are in the 3-4 range, so the current official level still looks appropriate.',
    evidence: evidenceBullets,
  }
}

export function createLevelHistoryEntry({ oldLevel, newLevel, source, reason, note }) {
  return {
    id: `level-history-${Date.now()}`,
    date: new Date().toISOString(),
    oldLevel,
    newLevel,
    source,
    reason,
    note: note || '',
  }
}
