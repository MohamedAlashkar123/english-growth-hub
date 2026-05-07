const activeMistakeStatuses = ['New', 'Practicing']

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function average(values) {
  const scores = values.map(toNumber).filter((score) => score > 0)
  return scores.length ? Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1)) : 0
}

function getEvaluationScore(evaluation, skill) {
  if (!evaluation || !skill) return 0
  const id = skill.id || skill.name?.toLowerCase()
  return toNumber(evaluation.scores?.[id] ?? evaluation[id])
}

function getEntryDate(entry) {
  return entry?.updatedAt || entry?.createdAt || entry?.date || ''
}

function byNewest(a, b) {
  return getEntryDate(b).localeCompare(getEntryDate(a))
}

function uniqueNonEmpty(items) {
  return [...new Set(items.filter(Boolean))]
}

export function normalizeTeacherNotes(notes) {
  const source = notes && typeof notes === 'object' ? notes : {}

  return {
    generalNotes: source.generalNotes || '',
    nextSessionFocus: source.nextSessionFocus || '',
    homeworkRecommendation: source.homeworkRecommendation || '',
    coachComments: source.coachComments || '',
    updatedAt: source.updatedAt || '',
  }
}

export function getActiveMistakes(mistakes = []) {
  return asArray(mistakes).filter((mistake) => activeMistakeStatuses.includes(mistake.status || 'New'))
}

export function getTopActiveMistakes(mistakes = [], limit = 5) {
  return getActiveMistakes(mistakes).sort(byNewest).slice(0, limit)
}

export function getMostCommonMistakeCategories(mistakes = []) {
  const categoryCounts = getActiveMistakes(mistakes).reduce((counts, mistake) => {
    const category = mistake.category || 'Grammar'
    counts[category] = (counts[category] || 0) + 1
    return counts
  }, {})

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
}

export function summarizeTrackerProgress(entries = [], completedStatuses = ['Completed'], scoreField = 'score') {
  const normalizedEntries = asArray(entries)

  return {
    total: normalizedEntries.length,
    completed: normalizedEntries.filter((entry) => completedStatuses.includes(entry.status)).length,
    averageScore: average(normalizedEntries.map((entry) => entry[scoreField])),
    lastPracticedDate: normalizedEntries.map((entry) => entry.date || entry.createdAt || '').filter(Boolean).sort().at(-1) || 'Not available yet',
  }
}

function getLatestEvaluation(evaluations = []) {
  return asArray(evaluations).slice().sort(byNewest)[0] || null
}

function getSkillRows(evaluations = [], evaluationSkills = [], skillAverages = {}, skillTrends = {}) {
  const latestEvaluation = getLatestEvaluation(evaluations)
  const skills = asArray(evaluationSkills)

  return skills.map((skill) => {
    const latestScore = getEvaluationScore(latestEvaluation, skill)
    const averageScore = toNumber(skillAverages[skill.id])

    return {
      id: skill.id,
      name: skill.name,
      latestScore,
      averageScore,
      trend: skillTrends[skill.id] || 'Not available yet',
    }
  })
}

function getStrongestSkill(skillRows = []) {
  const scored = skillRows.filter((row) => row.averageScore > 0 || row.latestScore > 0)
  if (!scored.length) return 'Not available yet'
  return scored.sort((a, b) => (b.averageScore || b.latestScore) - (a.averageScore || a.latestScore))[0].name
}

function getWeakestSkill(skillRows = [], fallback = 'Not available yet') {
  const scored = skillRows.filter((row) => row.averageScore > 0 || row.latestScore > 0)
  if (!scored.length) return fallback || 'Not available yet'
  return scored.sort((a, b) => (a.averageScore || a.latestScore) - (b.averageScore || b.latestScore))[0].name
}

function summarizeAccentExposure(listeningEntries = []) {
  const counts = asArray(listeningEntries).reduce((result, entry) => {
    const accent = entry.accent || 'Not specified'
    result[accent] = (result[accent] || 0) + 1
    return result
  }, {})

  return Object.entries(counts)
    .map(([accent, count]) => `${accent}: ${count}`)
    .join(', ') || 'Not available yet'
}

function summarizeFocusAreas(entries = [], field = 'focusArea') {
  const counts = asArray(entries).reduce((result, entry) => {
    const key = entry[field] || 'Not specified'
    result[key] = (result[key] || 0) + 1
    return result
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => `${label} (${count})`)
}

export function getTeacherSessionRecommendations({
  weakestSkill = '',
  mostCommonMistakeCategories = [],
  speakingCompletionPercentage = 0,
  writingSummary = {},
  listeningSummary = {},
  pronunciationSummary = {},
  topActiveMistakes = [],
} = {}) {
  const focusAreas = []
  const lessonActivities = []
  const homeworkSuggestions = []
  const monitoringNotes = []
  const normalizedWeakestSkill = String(weakestSkill || '').toLowerCase()
  const topCategory = mostCommonMistakeCategories[0]?.category || ''
  const hasGrammarPattern = ['grammar', 'articles', 'prepositions', 'tense', 'question formation', 'sentence structure'].some((category) =>
    String(topCategory).toLowerCase().includes(category),
  )

  if (normalizedWeakestSkill.includes('grammar') || hasGrammarPattern) {
    focusAreas.push(topCategory ? `${topCategory} correction` : 'Grammar accuracy')
    lessonActivities.push('Correct real learner mistakes, then rebuild the sentences using work-related examples.')
    homeworkSuggestions.push('Write 10 corrected work sentences using the grammar pattern reviewed in class.')
    monitoringNotes.push('Check whether corrected grammar appears again in speaking and writing tasks.')
  }

  if (normalizedWeakestSkill.includes('speaking') || normalizedWeakestSkill.includes('fluency') || speakingCompletionPercentage < 25) {
    focusAreas.push('Speaking fluency and meeting confidence')
    lessonActivities.push('Run a 3-5 minute meeting roleplay with follow-up questions and immediate correction.')
    homeworkSuggestions.push('Record one project status update and write down three mistakes noticed after listening.')
    monitoringNotes.push('Watch pauses, sentence flow, and ability to recover after mistakes.')
  }

  if (normalizedWeakestSkill.includes('pronunciation') || toNumber(pronunciationSummary.averageScore) < 3) {
    focusAreas.push('Pronunciation clarity')
    lessonActivities.push('Practice sentence stress, word stress, and clear pauses using meeting sentences.')
    homeworkSuggestions.push('Repeat five meeting sentences slowly, then at natural speed, and note difficult sounds.')
    monitoringNotes.push('Monitor ending sounds, stress placement, and confidence score.')
  }

  if (normalizedWeakestSkill.includes('writing') || toNumber(writingSummary.total) === 0) {
    focusAreas.push('Professional writing accuracy')
    lessonActivities.push('Review one professional email or status update and improve tone, structure, and grammar.')
    homeworkSuggestions.push('Write one professional email, then create a corrected version after feedback.')
    monitoringNotes.push('Track repeated writing mistakes and convert them into Common Mistakes records.')
  }

  if (normalizedWeakestSkill.includes('listening') || toNumber(listeningSummary.total) === 0) {
    focusAreas.push('Listening comprehension and summarizing')
    lessonActivities.push('Listen to a short business meeting clip and extract the main idea, details, and action items.')
    homeworkSuggestions.push('Listen to one business discussion and write a five-line summary with useful phrases.')
    monitoringNotes.push('Monitor accent exposure, speed tolerance, and summary accuracy.')
  }

  if (normalizedWeakestSkill.includes('confidence')) {
    focusAreas.push('Confidence under structured speaking pressure')
    lessonActivities.push('Use short repeated speaking drills before moving into open discussion.')
    homeworkSuggestions.push('Prepare a two-minute answer for a familiar meeting topic and repeat it twice.')
    monitoringNotes.push('Watch hesitation, self-correction, and willingness to continue after errors.')
  }

  if (topActiveMistakes.length > 0) {
    monitoringNotes.push(`Revisit these active mistakes first: ${topActiveMistakes.slice(0, 3).map((mistake) => mistake.wrongSentence).join(' | ')}`)
  }

  return {
    focusAreas: uniqueNonEmpty(focusAreas).slice(0, 5).length ? uniqueNonEmpty(focusAreas).slice(0, 5) : ['Balanced professional English review'],
    lessonActivities: uniqueNonEmpty(lessonActivities).slice(0, 5).length ? uniqueNonEmpty(lessonActivities).slice(0, 5) : ['Review today’s plan, correct one real mistake, and finish with a short speaking task.'],
    homeworkSuggestions: uniqueNonEmpty(homeworkSuggestions).slice(0, 5).length ? uniqueNonEmpty(homeworkSuggestions).slice(0, 5) : ['Complete one daily plan task and save one reflection note before the next session.'],
    monitoringNotes: uniqueNonEmpty(monitoringNotes).slice(0, 5).length ? uniqueNonEmpty(monitoringNotes).slice(0, 5) : ['Monitor consistency, accuracy, and confidence across weekly practice.'],
  }
}

export function buildTeacherReportData({
  profile = {},
  levelProfile = {},
  levelSuggestion = {},
  levelHistory = [],
  evaluations = [],
  evaluationSkills = [],
  skillAverages = {},
  skillTrends = {},
  latestEvaluation = null,
  averageEvaluationScore = 0,
  weakestSkill = '',
  mistakes = [],
  speakingTopics = [],
  speakingTopicProgress = {},
  businessPhrases = [],
  businessPhraseProgress = {},
  writingEntries = [],
  listeningEntries = [],
  pronunciationEntries = [],
  rubricAssessments = [],
  feedbackLoops = [],
  planPosition = {},
  currentMonth = {},
  currentWeek = {},
  todayPlan = {},
  planProgress = {},
  weeklyCompletion = 0,
  smartRecommendation = null,
  teacherNotes = {},
} = {}) {
  const normalizedTeacherNotes = normalizeTeacherNotes(teacherNotes)
  const activeMistakes = getActiveMistakes(mistakes)
  const fixedMistakes = asArray(mistakes).filter((mistake) => mistake.status === 'Fixed')
  const topActiveMistakes = getTopActiveMistakes(mistakes, 5)
  const mostCommonMistakeCategories = getMostCommonMistakeCategories(mistakes)
  const completedSpeakingTopics = asArray(speakingTopics).filter((topic) => speakingTopicProgress?.[topic.id]?.completed)
  const speakingCompletionPercentage = asArray(speakingTopics).length
    ? Math.round((completedSpeakingTopics.length / asArray(speakingTopics).length) * 100)
    : 0
  const lastPracticedSpeakingTopic = completedSpeakingTopics
    .slice()
    .sort((a, b) => (speakingTopicProgress[b.id]?.lastPracticedAt || '').localeCompare(speakingTopicProgress[a.id]?.lastPracticedAt || ''))[0]
  const incompleteSpeakingTopics = asArray(speakingTopics).filter((topic) => !speakingTopicProgress?.[topic.id]?.completed).slice(0, 3)
  const businessPhraseItems = asArray(businessPhrases)
  const practicedBusinessPhrases = businessPhraseItems.filter((phrase) => businessPhraseProgress?.[phrase.id]?.practiced || phrase.practiced)
  const favoriteBusinessPhrases = businessPhraseItems.filter((phrase) => businessPhraseProgress?.[phrase.id]?.favorite || phrase.favorite)
  const businessPhraseCompletionPercentage = businessPhraseItems.length
    ? Math.round((practicedBusinessPhrases.length / businessPhraseItems.length) * 100)
    : 0
  const writingSummary = summarizeTrackerProgress(writingEntries, ['Completed'], 'score')
  const listeningSummary = {
    ...summarizeTrackerProgress(listeningEntries, ['Completed'], 'score'),
    totalMinutes: asArray(listeningEntries).reduce((total, entry) => total + toNumber(entry.durationMinutes), 0),
    accentExposure: summarizeAccentExposure(listeningEntries),
  }
  const pronunciationSummary = {
    ...summarizeTrackerProgress(pronunciationEntries, ['Completed'], 'clarityScore'),
    averageConfidence: average(asArray(pronunciationEntries).map((entry) => entry.confidenceScore)),
    focusAreas: summarizeFocusAreas(pronunciationEntries),
  }
  const rubricAverage = average(asArray(rubricAssessments).map((assessment) => assessment.overallScore))
  const latestRubricAssessment = asArray(rubricAssessments).slice().sort(byNewest)[0] || null
  const openFeedbackLoops = asArray(feedbackLoops).filter((loop) => loop.status === 'Open' || loop.status === 'Practicing')
  const skillRows = getSkillRows(evaluations, evaluationSkills, skillAverages, skillTrends)
  const strongestSkill = getStrongestSkill(skillRows)
  const derivedWeakestSkill = weakestSkill || getWeakestSkill(skillRows)
  const recommendations = getTeacherSessionRecommendations({
    weakestSkill: derivedWeakestSkill,
    mostCommonMistakeCategories,
    speakingCompletionPercentage,
    writingSummary,
    listeningSummary,
    pronunciationSummary,
    topActiveMistakes,
  })

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      name: profile.name || 'Not available yet',
      currentLevel: levelProfile.officialLevel || profile.currentLevel || 'Not available yet',
      targetLevel: levelProfile.targetLevel || profile.targetLevel || 'Not available yet',
      mainGoal: profile.mainGoal || 'Not available yet',
      planIntensity: profile.planIntensity || 'Not available yet',
      studyDaysPerWeek: profile.studyDaysPerWeek || 'Not available yet',
      dailyStudyMinutes: profile.dailyStudyMinutes || 'Not available yet',
    },
    plan: {
      month: planPosition.monthNumber || 'Not available yet',
      week: planPosition.weekNumber || 'Not available yet',
      day: planPosition.dayName || 'Not available yet',
      monthTheme: currentMonth.theme || 'Not available yet',
      weeklyFocus: currentWeek.focus || 'Not available yet',
      todayFocus: todayPlan.focus || 'Not available yet',
      planProgress: planProgress.percentage || 0,
      weeklyCompletion,
    },
    level: {
      officialLevel: levelProfile.officialLevel || profile.currentLevel || 'Not available yet',
      targetLevel: levelProfile.targetLevel || profile.targetLevel || 'Not available yet',
      suggestedLevel: levelSuggestion.suggestedLevel || levelProfile.suggestedLevel || profile.currentLevel || 'Not available yet',
      confidence: levelSuggestion.confidence || levelProfile.suggestedLevelConfidence || 'Low',
      source: levelProfile.levelSource || 'Manual',
      lastUpdatedAt: levelProfile.lastUpdatedAt || 'Not available yet',
      reason: levelSuggestion.reason || levelProfile.suggestedLevelReason || 'Not available yet',
      evidence: asArray(levelSuggestion.evidence),
      history: asArray(levelHistory).slice(0, 5),
    },
    skills: {
      latestEvaluationDate: latestEvaluation?.date || 'No evaluations saved yet',
      latestAverageScore: averageEvaluationScore || 0,
      weakestSkill: derivedWeakestSkill || 'Not available yet',
      strongestSkill,
      rows: skillRows,
    },
    mistakes: {
      total: asArray(mistakes).length,
      activeCount: activeMistakes.length,
      fixedCount: fixedMistakes.length,
      mostCommonCategories: mostCommonMistakeCategories,
      topActiveMistakes,
    },
    speaking: {
      total: asArray(speakingTopics).length,
      completed: completedSpeakingTopics.length,
      completionPercentage: speakingCompletionPercentage,
      lastPracticedTopic: lastPracticedSpeakingTopic?.title || 'Not available yet',
      recommendedTopics: incompleteSpeakingTopics,
    },
    businessPhrases: {
      total: businessPhraseItems.length,
      practiced: practicedBusinessPhrases.length,
      favorites: favoriteBusinessPhrases.length,
      completionPercentage: businessPhraseCompletionPercentage,
    },
    writing: {
      ...writingSummary,
      recentEntries: asArray(writingEntries).slice().sort(byNewest).slice(0, 3),
      commonIssues: getActiveMistakes(mistakes).filter((mistake) => mistake.source === 'Writing').slice(0, 3),
    },
    listening: {
      ...listeningSummary,
      recentEntries: asArray(listeningEntries).slice().sort(byNewest).slice(0, 3),
    },
    pronunciation: {
      ...pronunciationSummary,
      recentEntries: asArray(pronunciationEntries).slice().sort(byNewest).slice(0, 3),
    },
    rubric: {
      total: asArray(rubricAssessments).length,
      averageScore: rubricAverage,
      latest: latestRubricAssessment,
    },
    feedbackLoops: {
      total: asArray(feedbackLoops).length,
      open: openFeedbackLoops.length,
      items: openFeedbackLoops.slice(0, 5),
    },
    recommendations,
    smartRecommendation,
    teacherNotes: normalizedTeacherNotes,
  }
}

function formatList(items = [], emptyText = 'Not available yet') {
  return asArray(items).length ? asArray(items).map((item) => `- ${item}`).join('\n') : `- ${emptyText}`
}

export function formatTeacherReportText(reportData = {}) {
  const report = reportData.generatedAt && reportData.profile ? reportData : buildTeacherReportData(reportData)
  const skillLines = report.skills.rows.map((skill) =>
    `${skill.name}: latest ${skill.latestScore || 'N/A'}/5, average ${skill.averageScore || 'N/A'}/5, trend ${skill.trend}`,
  )
  const mistakeLines = report.mistakes.topActiveMistakes.map((mistake) =>
    `${mistake.wrongSentence || 'Wrong sentence not available'} -> ${mistake.correctSentence || 'Correct sentence not available'} (${mistake.category || 'Grammar'})`,
  )
  const categoryLines = report.mistakes.mostCommonCategories.map((item) => `${item.category}: ${item.count}`)

  return [
    'Teacher Mode Report',
    `Generated: ${report.generatedAt}`,
    '',
    'Student Profile',
    `Name: ${report.profile.name}`,
    `Official level: ${report.profile.currentLevel}`,
    `Target level: ${report.profile.targetLevel}`,
    `Main goal: ${report.profile.mainGoal}`,
    `Plan intensity: ${report.profile.planIntensity}`,
    '',
    'Level Summary',
    `Suggested level: ${report.level.suggestedLevel}`,
    `Confidence: ${report.level.confidence}`,
    `Source: ${report.level.source}`,
    `Reason: ${report.level.reason}`,
    '',
    'Skill Summary',
    `Latest evaluation: ${report.skills.latestEvaluationDate}`,
    `Latest average: ${report.skills.latestAverageScore || 'N/A'}/5`,
    `Weakest skill: ${report.skills.weakestSkill}`,
    `Strongest skill: ${report.skills.strongestSkill}`,
    formatList(skillLines, 'No skill evaluations saved yet'),
    '',
    'Mistakes Summary',
    `Total mistakes: ${report.mistakes.total}`,
    `Active mistakes: ${report.mistakes.activeCount}`,
    `Fixed mistakes: ${report.mistakes.fixedCount}`,
    'Top categories:',
    formatList(categoryLines, 'No active mistake categories yet'),
    'Top mistakes to review:',
    formatList(mistakeLines, 'No active mistakes yet'),
    '',
    'Practice Summary',
    `Speaking: ${report.speaking.completed}/${report.speaking.total} completed (${report.speaking.completionPercentage}%)`,
    `Business phrases: ${report.businessPhrases?.practiced || 0}/${report.businessPhrases?.total || 0} practiced (${report.businessPhrases?.completionPercentage || 0}%), favorites ${report.businessPhrases?.favorites || 0}`,
    `Writing: ${report.writing.completed}/${report.writing.total} completed, average ${report.writing.averageScore || 'N/A'}/5`,
    `Listening: ${report.listening.completed}/${report.listening.total} completed, average ${report.listening.averageScore || 'N/A'}/5, minutes ${report.listening.totalMinutes || 0}`,
    `Pronunciation: ${report.pronunciation.completed}/${report.pronunciation.total} completed, clarity ${report.pronunciation.averageScore || 'N/A'}/5, confidence ${report.pronunciation.averageConfidence || 'N/A'}/5`,
    `Rubric assessments: ${report.rubric?.total || 0}, average ${report.rubric?.averageScore || 'N/A'}/5`,
    `Open feedback loops: ${report.feedbackLoops?.open || 0}`,
    '',
    'Recommended Focus',
    formatList(report.recommendations.focusAreas),
    '',
    'Suggested Lesson Activities',
    formatList(report.recommendations.lessonActivities),
    '',
    'Suggested Homework',
    formatList(report.recommendations.homeworkSuggestions),
    '',
    'Teacher Notes',
    `General notes: ${report.teacherNotes.generalNotes || 'Not available yet'}`,
    `Next session focus: ${report.teacherNotes.nextSessionFocus || 'Not available yet'}`,
    `Homework recommendation: ${report.teacherNotes.homeworkRecommendation || 'Not available yet'}`,
    `Coach comments: ${report.teacherNotes.coachComments || 'Not available yet'}`,
  ].join('\n')
}
