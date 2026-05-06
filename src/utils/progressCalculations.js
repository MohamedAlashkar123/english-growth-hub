export function calculatePercentage(completed, total) {
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

export function countCompletedDailyTasks(plan, completedMap) {
  return plan.reduce(
    (total, day) => total + day.tasks.filter((task) => Boolean(completedMap[task.id])).length,
    0,
  )
}

export function getTotalDailyTasks(plan) {
  return plan.reduce((total, day) => total + day.tasks.length, 0)
}

export function formatPlanDuration(profileSettings) {
  return `${profileSettings.planDurationMonths} months`
}

export function formatDailyTarget(profileSettings) {
  return `${profileSettings.dailyStudyMinutes} minutes`
}

export function getPlanIntensityConfig(profileSettings, planIntensities) {
  return planIntensities[profileSettings.planIntensity] || planIntensities.Standard
}

export function getEvaluationScore(evaluation, skillId) {
  if (evaluation.scores && evaluation.scores[skillId] !== undefined) {
    return Number(evaluation.scores[skillId] || 0)
  }

  return Number(evaluation[skillId] || 0)
}

export function getEvaluationAverage(evaluation, skills, normalizeEvaluationSkills) {
  const activeSkills = normalizeEvaluationSkills(skills)
  const totals = activeSkills.reduce(
    (result, skill) => {
      const score = getEvaluationScore(evaluation, skill.id)
      if (!score) return result

      return {
        weightedScore: result.weightedScore + score * skill.weight,
        weight: result.weight + skill.weight,
      }
    },
    { weightedScore: 0, weight: 0 },
  )

  if (!totals.weight) return 0
  return Number((totals.weightedScore / totals.weight).toFixed(1))
}

export function getWeakestSkill(evaluation, skills, normalizeEvaluationSkills) {
  if (!evaluation) return 'No evaluation yet'

  const readableSkills = normalizeEvaluationSkills(skills).filter((skill) => getEvaluationScore(evaluation, skill.id) > 0)
  if (readableSkills.length === 0) return 'No score yet'

  const weakest = readableSkills.reduce((currentWeakest, skill) =>
    getEvaluationScore(evaluation, skill.id) < getEvaluationScore(evaluation, currentWeakest.id)
      ? skill
      : currentWeakest,
  )

  return weakest.name
}

export function getEvaluationSkillsForEvaluation(evaluation, configuredSkills, legacyEvaluationSkillIds, normalizeEvaluationSkills) {
  const normalizedSkills = normalizeEvaluationSkills(configuredSkills)
  const knownSkillIds = new Set(normalizedSkills.map((skill) => skill.id))
  const legacySkills = legacyEvaluationSkillIds
    .filter((skillId) => evaluation[skillId] !== undefined && !knownSkillIds.has(skillId))
    .map((skillId) => ({ id: skillId, name: skillId.charAt(0).toUpperCase() + skillId.slice(1), weight: 1 }))

  return [...normalizedSkills, ...legacySkills]
}
