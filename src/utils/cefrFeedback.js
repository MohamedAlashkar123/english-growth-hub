const rubricScoreLabels = {
  1: 'Needs Focus',
  2: 'Developing',
  3: 'Meets Level',
  4: 'Strong for Level',
  5: 'Above Level',
}

export const feedbackLoopStatuses = ['Open', 'Practicing', 'Improved', 'Closed']
export const feedbackSources = ['Self-review', 'Teacher', 'App-guided', 'Imported feedback']
export const relatedPracticeTypes = ['Speaking topic', 'Writing entry', 'Listening entry', 'Pronunciation entry', 'Mistake', 'Manual note']

function normalizeScore(value, fallback = 3) {
  const score = Number(value)
  if (!Number.isFinite(score)) return fallback
  return Math.min(5, Math.max(1, score))
}

function average(scores = []) {
  const validScores = scores.map(Number).filter((score) => Number.isFinite(score) && score > 0)
  return validScores.length ? Number((validScores.reduce((total, score) => total + score, 0) / validScores.length).toFixed(1)) : 0
}

function getRubricSkill(cefrRubrics = {}, skillId = '') {
  return cefrRubrics.skills?.find((skill) => skill.id === skillId) || cefrRubrics.skills?.[0] || null
}

export function getRubricScoreLabel(score) {
  return rubricScoreLabels[Number(score)] || 'Not scored'
}

export function buildEmptyRubricAssessment(cefrRubrics = {}) {
  const skill = getRubricSkill(cefrRubrics)

  return {
    date: new Date().toISOString().slice(0, 10),
    skillId: skill?.id || '',
    skillName: skill?.name || '',
    assessedLevel: cefrRubrics.levels?.[0] || 'B1',
    practiceType: 'Self-assessment',
    relatedEntryId: '',
    criteriaScores: {},
    overallScore: 3,
    evidenceNotes: '',
    teacherFeedback: '',
    learnerReflection: '',
    nextAction: '',
  }
}

export function normalizeRubricAssessment(assessment = {}, index = 0, cefrRubrics = {}) {
  const now = new Date().toISOString()
  const skill = getRubricSkill(cefrRubrics, assessment.skillId)
  const criteria = skill?.rubricCriteria || []
  const criteriaScores = criteria.reduce((scores, criterion) => {
    scores[criterion.id] = normalizeScore(assessment.criteriaScores?.[criterion.id], 3)
    return scores
  }, { ...(assessment.criteriaScores || {}) })
  const overallScore = assessment.overallScore
    ? normalizeScore(assessment.overallScore)
    : average(Object.values(criteriaScores)) || 3
  const createdAt = assessment.createdAt || now

  return {
    id: assessment.id || `rubric-assessment-${index + 1}`,
    date: assessment.date || createdAt.slice(0, 10),
    skillId: skill?.id || assessment.skillId || 'speaking',
    skillName: skill?.name || assessment.skillName || 'Speaking',
    assessedLevel: assessment.assessedLevel || cefrRubrics.levels?.[0] || 'B1',
    practiceType: assessment.practiceType || 'Self-assessment',
    relatedEntryId: assessment.relatedEntryId || '',
    criteriaScores,
    overallScore,
    evidenceNotes: assessment.evidenceNotes || '',
    teacherFeedback: assessment.teacherFeedback || '',
    learnerReflection: assessment.learnerReflection || '',
    nextAction: assessment.nextAction || '',
    createdAt,
    updatedAt: assessment.updatedAt || createdAt,
  }
}

export function normalizeRubricAssessments(assessments = [], cefrRubrics = {}) {
  return Array.isArray(assessments)
    ? assessments.map((assessment, index) => normalizeRubricAssessment(assessment, index, cefrRubrics))
    : []
}

export function buildEmptyFeedbackLoop() {
  return {
    skill: 'Speaking',
    relatedPracticeType: 'Manual note',
    relatedPracticeId: '',
    title: '',
    attemptNumber: 1,
    attemptNotes: '',
    feedbackSource: 'Self-review',
    feedbackText: '',
    correctionPlan: '',
    repeatedAttemptNotes: '',
    improvementEvidence: '',
    status: 'Open',
  }
}

export function normalizeFeedbackLoop(loop = {}, index = 0) {
  const now = new Date().toISOString()
  const createdAt = loop.createdAt || now

  return {
    id: loop.id || `feedback-loop-${index + 1}`,
    skill: loop.skill || 'Speaking',
    relatedPracticeType: relatedPracticeTypes.includes(loop.relatedPracticeType) ? loop.relatedPracticeType : 'Manual note',
    relatedPracticeId: loop.relatedPracticeId || '',
    title: loop.title || loop.feedbackText?.slice(0, 60) || 'Feedback loop',
    attemptNumber: Math.max(1, Number(loop.attemptNumber || 1)),
    attemptNotes: loop.attemptNotes || '',
    feedbackSource: feedbackSources.includes(loop.feedbackSource) ? loop.feedbackSource : 'Self-review',
    feedbackText: loop.feedbackText || '',
    correctionPlan: loop.correctionPlan || '',
    repeatedAttemptNotes: loop.repeatedAttemptNotes || '',
    improvementEvidence: loop.improvementEvidence || '',
    status: feedbackLoopStatuses.includes(loop.status) ? loop.status : 'Open',
    createdAt,
    updatedAt: loop.updatedAt || createdAt,
  }
}

export function normalizeFeedbackLoops(loops = []) {
  return Array.isArray(loops) ? loops.map((loop, index) => normalizeFeedbackLoop(loop, index)) : []
}

export function getRubricAssessmentSummary(assessments = []) {
  const normalizedAssessments = Array.isArray(assessments) ? assessments : []
  const skillScores = normalizedAssessments.reduce((groups, assessment) => {
    const skill = assessment.skillName || assessment.skillId || 'Unknown'
    groups[skill] = groups[skill] || []
    groups[skill].push(Number(assessment.overallScore || 0))
    return groups
  }, {})
  const skillAverages = Object.entries(skillScores)
    .map(([skill, scores]) => ({ skill, averageScore: average(scores) }))
    .filter((item) => item.averageScore > 0)
    .sort((a, b) => a.averageScore - b.averageScore)

  return {
    total: normalizedAssessments.length,
    averageScore: average(normalizedAssessments.map((assessment) => assessment.overallScore)),
    latest: normalizedAssessments.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null,
    weakestSkill: skillAverages[0]?.skill || 'Not assessed yet',
    strongestSkill: skillAverages.at(-1)?.skill || 'Not assessed yet',
    skillAverages,
  }
}

export function getFeedbackLoopSummary(loops = []) {
  const normalizedLoops = Array.isArray(loops) ? loops : []

  return {
    total: normalizedLoops.length,
    open: normalizedLoops.filter((loop) => loop.status === 'Open').length,
    practicing: normalizedLoops.filter((loop) => loop.status === 'Practicing').length,
    improved: normalizedLoops.filter((loop) => loop.status === 'Improved').length,
    closed: normalizedLoops.filter((loop) => loop.status === 'Closed').length,
    active: normalizedLoops.filter((loop) => loop.status === 'Open' || loop.status === 'Practicing').length,
  }
}
