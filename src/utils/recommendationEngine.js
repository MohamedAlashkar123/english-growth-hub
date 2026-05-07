import { getEvaluationScore } from './progressCalculations'

export function getLatestEvaluation(evaluations = []) {
  return Array.isArray(evaluations) && evaluations.length > 0 ? evaluations[0] : null
}

export function getCompletionPercentage(total = 0, completed = 0) {
  return total ? Math.round((completed / total) * 100) : 0
}

export function getWeakestSkillFromEvaluation(evaluation, evaluationSkills = []) {
  if (!evaluation || !Array.isArray(evaluationSkills) || evaluationSkills.length === 0) return null

  return evaluationSkills
    .map((skill) => ({
      id: skill.id,
      name: skill.name || skill.id,
      score: getEvaluationScore(evaluation, skill.id),
    }))
    .filter((skill) => Number.isFinite(skill.score))
    .sort((a, b) => a.score - b.score)[0] || null
}

export function getActiveMistakes(mistakes = []) {
  return Array.isArray(mistakes) ? mistakes.filter((mistake) => mistake.status === 'New' || mistake.status === 'Practicing') : []
}

export function getMostCommonMistakeCategory(mistakes = []) {
  const activeMistakes = getActiveMistakes(mistakes)
  const categoryCounts = activeMistakes.reduce((counts, mistake) => {
    const category = mistake.category || 'Grammar'
    counts[category] = (counts[category] || 0) + 1
    return counts
  }, {})

  const [category, count] = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || []
  return category ? { category, count } : null
}

export function flattenWeekTasks(learningPlan, selectedPlanPosition = {}) {
  const month = learningPlan?.months?.find((item) => item.monthNumber === selectedPlanPosition.monthNumber) || learningPlan?.months?.[0]
  const week = month?.weeks?.find((item) => item.weekNumber === selectedPlanPosition.weekNumber) || month?.weeks?.[0]
  return week?.days?.flatMap((day) => day.tasks || []) || []
}

export function getNextIncompleteTodayTask(todayPlan, completedTasks = {}) {
  const tasks = Array.isArray(todayPlan?.tasks) ? todayPlan.tasks : []
  return tasks.find((task) => !completedTasks[task.id] && !(task.legacyId && completedTasks[task.legacyId])) || null
}

export function getRecommendedSpeakingTopic(speakingTopics = [], speakingTopicProgress = {}, profile = {}) {
  if (!Array.isArray(speakingTopics) || speakingTopics.length === 0) return null

  const incompleteTopics = speakingTopics.filter((topic) => !speakingTopicProgress[topic.id]?.completed)
  const sourceTopics = incompleteTopics.length ? incompleteTopics : speakingTopics
  const currentLevel = String(profile.currentLevel || '').toLowerCase()
  const mainGoal = String(profile.mainGoal || '').toLowerCase()

  return (
    sourceTopics.find((topic) => topic.recommendedFor?.some((level) => currentLevel.includes(String(level).toLowerCase()))) ||
    sourceTopics.find((topic) => String(topic.category || '').toLowerCase().includes(mainGoal.split(' ')[0] || 'business')) ||
    sourceTopics[0]
  )
}

export function mapSkillToSection(skill = '') {
  const normalizedSkill = String(skill).toLowerCase()
  if (normalizedSkill.includes('speak') || normalizedSkill.includes('fluency') || normalizedSkill.includes('confidence')) return 'Speaking Topics'
  if (normalizedSkill.includes('grammar')) return 'Grammar'
  if (normalizedSkill.includes('listen')) return 'Listening'
  if (normalizedSkill.includes('pronunciation')) return 'Pronunciation'
  if (normalizedSkill.includes('writing')) return 'Writing'
  if (normalizedSkill.includes('vocabulary')) return 'Business Phrases'
  return 'Daily Plan'
}

export function mapMistakeCategoryToSkill(category = '') {
  const normalizedCategory = String(category).toLowerCase()
  if (normalizedCategory.includes('pronunciation')) return 'Pronunciation'
  if (normalizedCategory.includes('tone') || normalizedCategory.includes('business phrase')) return 'Business Phrases'
  if (normalizedCategory.includes('fluency')) return 'Speaking'
  if (normalizedCategory.includes('vocabulary')) return 'Vocabulary'
  return 'Grammar'
}

function findGrammarTopic(contentLibrary = {}, category = '') {
  const normalizedCategory = String(category).toLowerCase()
  return contentLibrary.grammarTopics?.find((topic) => String(topic.title || '').toLowerCase().includes(normalizedCategory)) ||
    contentLibrary.grammarTopics?.find((topic) => !topic.completed) ||
    contentLibrary.grammarTopics?.[0] ||
    null
}

function buildRecommendation(overrides) {
  return {
    id: 'rec-general-maintenance',
    type: 'Review',
    priority: 'Medium',
    title: 'Review and consolidate your progress',
    reason: 'Your main indicators look stable, so the best next step is maintenance.',
    suggestedAction: 'Review your fixed mistakes and repeat useful business phrases.',
    estimatedMinutes: 20,
    targetSection: 'Business Phrases',
    relatedSkill: 'Review',
    relatedContentId: '',
    evidence: ['No urgent weak area was detected from the available data.'],
    ...overrides,
  }
}

export function generateLearningRecommendation({
  profile = {},
  learningPlan = {},
  selectedPlanPosition = {},
  todayPlan = {},
  completedTasks = {},
  evaluations = [],
  evaluationSkills = [],
  mistakes = [],
  speakingTopics = [],
  speakingTopicProgress = {},
  contentLibrary = {},
  trackerData = {},
  rubricAssessments = [],
  feedbackLoops = [],
} = {}) {
  const latestEvaluation = getLatestEvaluation(evaluations)
  const weakestSkill = getWeakestSkillFromEvaluation(latestEvaluation, evaluationSkills)
  const weekTasks = flattenWeekTasks(learningPlan, selectedPlanPosition)
  const completedWeekTasks = weekTasks.filter((task) => completedTasks[task.id] || (task.legacyId && completedTasks[task.legacyId])).length
  const weeklyCompletion = getCompletionPercentage(weekTasks.length, completedWeekTasks)
  const nextTodayTask = getNextIncompleteTodayTask(todayPlan, completedTasks)
  const activeMistakePattern = getMostCommonMistakeCategory(mistakes)
  const completedSpeakingTopics = Array.isArray(speakingTopics)
    ? speakingTopics.filter((topic) => speakingTopicProgress[topic.id]?.completed).length
    : 0
  const speakingCompletion = getCompletionPercentage(speakingTopics.length || 0, completedSpeakingTopics)
  const activeFeedbackLoop = Array.isArray(feedbackLoops)
    ? feedbackLoops.find((loop) => loop.status === 'Open' || loop.status === 'Practicing')
    : null
  const lowRubricAssessment = Array.isArray(rubricAssessments)
    ? rubricAssessments.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).find((assessment) => Number(assessment.overallScore) > 0 && Number(assessment.overallScore) < 3)
    : null

  if (activeFeedbackLoop) {
    return buildRecommendation({
      id: `rec-feedback-loop-${activeFeedbackLoop.id}`,
      type: 'Feedback Loop',
      priority: 'High',
      title: `Repeat feedback loop: ${activeFeedbackLoop.title}`,
      reason: 'An open feedback loop means there is feedback that still needs correction, repetition, and improvement evidence.',
      suggestedAction: activeFeedbackLoop.correctionPlan || 'Review the feedback, repeat the practice attempt, and write improvement evidence.',
      estimatedMinutes: 20,
      targetSection: 'Level & Assessment',
      relatedSkill: activeFeedbackLoop.skill || 'Feedback',
      relatedContentId: activeFeedbackLoop.id,
      evidence: [
        `Feedback source: ${activeFeedbackLoop.feedbackSource || 'Not specified'}.`,
        `Status: ${activeFeedbackLoop.status}.`,
      ],
    })
  }

  if (latestEvaluation && lowRubricAssessment) {
    return buildRecommendation({
      id: `rec-rubric-${lowRubricAssessment.id}`,
      type: 'Rubric Assessment',
      priority: 'High',
      title: `Improve rubric skill: ${lowRubricAssessment.skillName}`,
      reason: `${lowRubricAssessment.skillName} scored below Meets Level in the latest rubric evidence.`,
      suggestedAction: lowRubricAssessment.nextAction || `Repeat one ${String(lowRubricAssessment.skillName).toLowerCase()} practice task and collect evidence.`,
      estimatedMinutes: 25,
      targetSection: 'Level & Assessment',
      relatedSkill: lowRubricAssessment.skillName,
      relatedContentId: lowRubricAssessment.id,
      evidence: [
        `Rubric score: ${lowRubricAssessment.overallScore}/5.`,
        `Assessed level: ${lowRubricAssessment.assessedLevel}.`,
      ],
    })
  }

  if (!latestEvaluation) {
    return buildRecommendation({
      id: 'rec-first-evaluation',
      type: 'Assessment',
      priority: 'High',
      title: 'Complete your first self-evaluation',
      reason: 'No saved evaluations exist yet, so the app needs a baseline before it can identify your weakest skill.',
      suggestedAction: 'Open Evaluation and save a weekly self-assessment for your core skills.',
      estimatedMinutes: 10,
      targetSection: 'Evaluation',
      relatedSkill: 'Assessment',
      evidence: ['Saved evaluations: 0.', 'A baseline is required before skill-based recommendations can be precise.'],
    })
  }

  if (Array.isArray(rubricAssessments) && rubricAssessments.length === 0) {
    return buildRecommendation({
      id: 'rec-first-rubric-assessment',
      type: 'Rubric Assessment',
      priority: 'Medium',
      title: 'Complete your first CEFR-style rubric assessment',
      reason: 'A rubric assessment adds quality evidence beyond simple completion tracking.',
      suggestedAction: 'Open Level & Assessment, choose one skill, and score the rubric criteria with evidence notes.',
      estimatedMinutes: 15,
      targetSection: 'Level & Assessment',
      relatedSkill: 'Assessment',
      evidence: ['Rubric assessments saved: 0.', 'Rubrics are for learning guidance, not official certification.'],
    })
  }

  if (weeklyCompletion < 50) {
    return buildRecommendation({
      id: 'rec-light-recovery-plan',
      type: 'Daily Plan',
      priority: 'High',
      title: 'Restore consistency with a light recovery task',
      reason: `Weekly plan completion is ${weeklyCompletion}%, so consistency should be restored before adding harder practice.`,
      suggestedAction: nextTodayTask
        ? `Complete this task from today’s plan: ${nextTodayTask.text}`
        : 'Complete one short task from today’s plan and write one quick reflection.',
      estimatedMinutes: nextTodayTask?.estimatedMinutes || 20,
      targetSection: 'Daily Plan',
      relatedSkill: nextTodayTask?.skill || 'Consistency',
      relatedContentId: nextTodayTask?.id || '',
      evidence: [`Weekly completion is ${weeklyCompletion}%.`, `${completedWeekTasks}/${weekTasks.length || 0} selected-week tasks are complete.`],
    })
  }

  if (activeMistakePattern && activeMistakePattern.count >= 2) {
    const relatedSkill = mapMistakeCategoryToSkill(activeMistakePattern.category)
    const grammarTopic = findGrammarTopic(contentLibrary, activeMistakePattern.category)
    const targetSection = mapSkillToSection(relatedSkill)

    return buildRecommendation({
      id: `rec-mistake-${activeMistakePattern.category.toLowerCase().replace(/\s+/g, '-')}`,
      type: relatedSkill,
      priority: 'High',
      title: `Review ${activeMistakePattern.category} using work-related examples`,
      reason: `${activeMistakePattern.category} appears frequently in your active mistakes.`,
      suggestedAction:
        relatedSkill === 'Grammar'
          ? `Write 10 work-related sentences focused on ${activeMistakePattern.category.toLowerCase()}, then correct them.`
          : `Practice one short ${relatedSkill.toLowerCase()} activity and rewrite the related mistakes.`,
      estimatedMinutes: 20,
      targetSection,
      relatedSkill,
      relatedContentId: grammarTopic?.id || '',
      evidence: [
        `You have ${activeMistakePattern.count} active ${activeMistakePattern.category} mistakes.`,
        grammarTopic ? `"${grammarTopic.title}" is available in your content library.` : 'No matching grammar topic was found, so use your mistake examples directly.',
      ],
    })
  }

  if (weakestSkill) {
    const targetSection = mapSkillToSection(weakestSkill.name)
    const recommendedSpeakingTopic = getRecommendedSpeakingTopic(speakingTopics, speakingTopicProgress, profile)
    const grammarTopic = findGrammarTopic(contentLibrary, weakestSkill.name)
    const phrase = contentLibrary.businessPhrases?.find((item) => !item.practiced) || contentLibrary.businessPhrases?.[0]
    const pronunciation = contentLibrary.pronunciationSentences?.find((item) => !item.completed) || contentLibrary.pronunciationSentences?.[0]
    const writingTemplate = contentLibrary.writingTemplates?.[0]
    const writingCount = trackerData.writingEntries?.length || 0
    const listeningCount = trackerData.listeningEntries?.length || 0
    const pronunciationCount = trackerData.pronunciationEntries?.length || 0

    const actionBySection = {
      'Speaking Topics': `Practice this speaking topic: ${recommendedSpeakingTopic?.title || 'choose one incomplete speaking topic'}.`,
      Grammar: `Review ${grammarTopic?.title || 'one grammar topic'} and write 10 corrected work-related sentences.`,
      Listening: listeningCount ? 'Review one listening entry, improve the summary, and extract three new phrases.' : 'Create your first listening practice entry and summarize the main idea.',
      Pronunciation: pronunciationCount ? `Practice this sentence slowly: ${pronunciation?.sentence || 'choose one pronunciation sentence'}.` : 'Create your first pronunciation entry using one meeting sentence.',
      Writing: writingCount ? 'Review one writing entry and improve the corrected version.' : `Create your first writing entry using: ${writingTemplate?.title || 'one professional email'}.`,
      'Business Phrases': `Practice this phrase in three work examples: ${phrase?.phrase || 'choose one business phrase'}.`,
    }

    return buildRecommendation({
      id: `rec-weakest-${weakestSkill.name.toLowerCase().replace(/\s+/g, '-')}`,
      type: weakestSkill.name,
      priority: weakestSkill.score <= 2 ? 'High' : 'Medium',
      title: `Focus on ${weakestSkill.name}`,
      reason: `${weakestSkill.name} is the weakest skill in your latest evaluation.`,
      suggestedAction: actionBySection[targetSection] || `Complete one ${weakestSkill.name.toLowerCase()} task and save notes.`,
      estimatedMinutes: 20,
      targetSection,
      relatedSkill: weakestSkill.name,
      relatedContentId: recommendedSpeakingTopic?.id || grammarTopic?.id || phrase?.id || pronunciation?.id || writingTemplate?.id || '',
      evidence: [`Latest evaluation shows ${weakestSkill.name} score is ${weakestSkill.score}/5.`],
    })
  }

  if (speakingTopics.length > 0 && speakingCompletion < 20) {
    const topic = getRecommendedSpeakingTopic(speakingTopics, speakingTopicProgress, profile)
    return buildRecommendation({
      id: 'rec-low-speaking-completion',
      type: 'Speaking',
      priority: 'Medium',
      title: 'Build speaking momentum with one topic',
      reason: `Speaking topic completion is ${speakingCompletion}%, which is low for your ${profile.mainGoal || 'English'} goal.`,
      suggestedAction: `Record yourself for ${topic?.durationMinutes || 5} minutes on: ${topic?.title || 'one work-related topic'}.`,
      estimatedMinutes: topic?.durationMinutes || 5,
      targetSection: 'Speaking Topics',
      relatedSkill: 'Speaking',
      relatedContentId: topic?.id || '',
      evidence: [`Completed speaking topics: ${completedSpeakingTopics}/${speakingTopics.length}.`],
    })
  }

  if (nextTodayTask) {
    return buildRecommendation({
      id: 'rec-next-daily-task',
      type: 'Daily Plan',
      priority: 'Medium',
      title: 'Continue today’s plan',
      reason: 'No stronger warning pattern was found, so the best next step is the next incomplete task in today’s plan.',
      suggestedAction: nextTodayTask.text,
      estimatedMinutes: nextTodayTask.estimatedMinutes || 15,
      targetSection: 'Daily Plan',
      relatedSkill: nextTodayTask.skill || 'Daily Plan',
      relatedContentId: nextTodayTask.id,
      evidence: [`Today’s focus: ${todayPlan?.focus || 'Daily practice'}.`],
    })
  }

  return buildRecommendation()
}
