import { calculatePercentage, getEvaluationScore } from './progressCalculations'

function getScoreBySkillName(evaluation, skills, skillName, normalizeEvaluationSkills) {
  if (!evaluation) return null

  const skill = normalizeEvaluationSkills(skills).find(
    (item) => item.name.toLowerCase() === skillName.toLowerCase(),
  )

  if (!skill) return null
  const score = getEvaluationScore(evaluation, skill.id)
  return score || null
}

export function buildSmartRecommendation({
  latestEvaluation,
  evaluationSkills,
  weakestSkill,
  weeklyCompletion,
  completedSpeakingTopics,
  totalSpeakingTopics,
  normalizeEvaluationSkills,
}) {
  if (!latestEvaluation) {
    return {
      title: 'Start with your daily plan and first evaluation',
      reason: 'No evaluations are saved yet, so the app needs a baseline before it can identify weak skills.',
      action: 'Complete today’s daily plan, then save your first weekly evaluation.',
      time: '45-60 minutes',
    }
  }

  const grammarScore = getScoreBySkillName(latestEvaluation, evaluationSkills, 'Grammar', normalizeEvaluationSkills)
  const pronunciationScore = getScoreBySkillName(latestEvaluation, evaluationSkills, 'Pronunciation', normalizeEvaluationSkills)
  const speakingCompletion = calculatePercentage(completedSpeakingTopics, totalSpeakingTopics)
  const normalizedWeakestSkill = weakestSkill.toLowerCase()

  if (weeklyCompletion < 50) {
    return {
      title: 'Light recovery plan',
      reason: `Weekly progress is ${weeklyCompletion}%, so the best next step is to rebuild momentum without overload.`,
      action: 'Choose one short daily task, review one phrase, and do a 3-minute speaking practice.',
      time: '25-35 minutes',
    }
  }

  if (grammarScore !== null && grammarScore <= 2) {
    return {
      title: 'Practice grammar with work-related sentences',
      reason: `Your latest Grammar score is ${grammarScore}/5.`,
      action: 'Practice articles and prepositions using 10 work-related sentences.',
      time: '30 minutes',
    }
  }

  if (pronunciationScore !== null && pronunciationScore <= 2) {
    return {
      title: 'Slow pronunciation practice',
      reason: `Your latest Pronunciation score is ${pronunciationScore}/5.`,
      action: 'Practice 5 meeting sentences slowly and clearly, then record one version.',
      time: '20 minutes',
    }
  }

  if (speakingCompletion < 35) {
    return {
      title: 'Increase speaking practice',
      reason: `Only ${speakingCompletion}% of speaking topics are completed.`,
      action: 'Record yourself explaining the current project status for 3 minutes.',
      time: '15-20 minutes',
    }
  }

  if (normalizedWeakestSkill.includes('grammar')) {
    return {
      title: 'Strengthen grammar accuracy',
      reason: 'Grammar is the weakest skill in your latest evaluation.',
      action: 'Practice articles and prepositions using 10 work-related sentences.',
      time: '30 minutes',
    }
  }

  if (normalizedWeakestSkill.includes('speaking') || normalizedWeakestSkill.includes('fluency')) {
    return {
      title: 'Record a structured speaking update',
      reason: `${weakestSkill} is the weakest skill in your latest evaluation.`,
      action: 'Record yourself explaining the current project status for 3 minutes.',
      time: '15 minutes',
    }
  }

  if (normalizedWeakestSkill.includes('pronunciation')) {
    return {
      title: 'Improve pronunciation clarity',
      reason: 'Pronunciation is the weakest skill in your latest evaluation.',
      action: 'Practice 5 meeting sentences slowly and clearly.',
      time: '20 minutes',
    }
  }

  return {
    title: `${weakestSkill} focused practice`,
    reason: `${weakestSkill} is the weakest skill in your latest evaluation.`,
    action: `Choose one ${weakestSkill.toLowerCase()} task from your plan and complete it with notes.`,
    time: '25-30 minutes',
  }
}
