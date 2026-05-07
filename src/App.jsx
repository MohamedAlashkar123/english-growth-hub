import { useEffect, useState } from 'react'
import {
  APP_VERSION,
  STORAGE_KEY,
  cefrRubrics,
  commonMistakes,
  currentLevelOptions,
  defaultContentLibrary,
  defaultDailyPlan,
  defaultEvaluationSkills,
  defaultLearningPlan,
  defaultSpeakingTopics,
  defaultProfile,
  focusAreaOptions,
  grammarTopics,
  legacyEvaluationSkillIds,
  levelSummary,
  mainGoalOptions,
  monthlyRoadmap,
  planIntensityOptions,
  planIntensities,
  speakingStructure,
  targetLevelOptions,
  weeklyPlan,
} from './config'
import { defaultBusinessPhrases } from './config/defaultBusinessPhrases'
import { createBackupPayload, parseAndNormalizeBackup, validateBackupPayload } from './utils/backup'
import {
  calculatePercentage,
  countCompletedDailyTasks,
  formatDailyTarget,
  formatPlanDuration,
  getEvaluationAverage,
  getEvaluationScore,
  getEvaluationSkillsForEvaluation,
  getPlanIntensityConfig,
  getTotalDailyTasks,
  getWeakestSkill,
} from './utils/progressCalculations'
import { generateLearningRecommendation } from './utils/recommendationEngine'
import {
  calculateSkillAverages,
  calculateSkillTrends,
  createLevelHistoryEntry,
  levelSourceOptions,
  normalizeLevelProfile,
  suggestOverallLevel,
} from './utils/levelAssessment'
import {
  createDefaultProgress as createDefaultProgressFromTemplate,
  applyBusinessPhraseProgress,
  normalizeContentLibrary,
  normalizeDailyPlan,
  normalizeEvaluationDraft,
  normalizeEvaluationSkills,
  normalizeBusinessPhraseProgress,
  getAverageScore,
  mistakeCategories,
  mistakeSources,
  mistakeStatuses,
  normalizeListeningEntries,
  normalizeMistake,
  normalizeMistakes,
  normalizePronunciationEntries,
  normalizeSpeakingTopicProgress,
  normalizeSpeakingTopics,
  normalizeWritingEntries,
  updateMistakeStatusFields,
} from './utils/normalizers'
import {
  calculatePlanProgress,
  flattenPlanTasks,
  getCurrentMonth,
  getCurrentPlanPosition,
  getCurrentWeek,
  getDayProgress,
  getTodayPlan,
  migrateCompletedDailyTasksToPlan,
  normalizeLearningPlan,
  updateLearningPlanDay,
} from './utils/planUtils'
import {
  cloneData,
  readFromLocalStorage,
  removeFromLocalStorage,
  safeJsonParse,
  writeToLocalStorage,
} from './utils/storage'
import {
  buildTeacherReportData,
  formatTeacherReportText,
  getMostCommonMistakeCategories,
  getTopActiveMistakes,
  normalizeTeacherNotes,
} from './utils/teacherReport'
import {
  buildEmptyFeedbackLoop,
  buildEmptyRubricAssessment,
  feedbackLoopStatuses,
  feedbackSources,
  getFeedbackLoopSummary,
  getRubricAssessmentSummary,
  getRubricScoreLabel,
  normalizeFeedbackLoop,
  normalizeFeedbackLoops,
  normalizeRubricAssessment,
  normalizeRubricAssessments,
  relatedPracticeTypes,
} from './utils/cefrFeedback'

const todayIso = () => new Date().toISOString().slice(0, 10)

const emptyEvaluation = {
  date: todayIso(),
  type: 'Weekly',
  scores: {},
  notes: '',
  nextFocus: '',
}

const emptyWritingDraft = {
  date: todayIso(),
  type: 'Professional Email',
  title: '',
  originalDraft: '',
  correctedVersion: '',
  mistakesNoticed: '',
  usefulPhrases: '',
  score: '',
  status: 'Drafted',
  notes: '',
}

const emptyListeningDraft = {
  date: todayIso(),
  title: '',
  sourceLink: '',
  category: 'Business Meeting',
  accent: 'Mixed',
  durationMinutes: 10,
  difficulty: 'Medium',
  mainIdea: '',
  usefulPhrases: '',
  summary: '',
  score: '',
  status: 'Planned',
  notes: '',
}

const emptyPronunciationDraft = {
  date: todayIso(),
  sentence: '',
  focusArea: 'Meeting Sentences',
  repetitionsTarget: 10,
  repetitionsDone: 0,
  clarityScore: '',
  confidenceScore: '',
  status: 'New',
  notes: '',
}

const emptyNoteDraft = {
  date: todayIso(),
  title: '',
  category: 'General',
  content: '',
}

const allFilterValue = 'All'

const writingTypeOptions = [
  'Professional Email',
  'Teams Message',
  'Meeting Summary',
  'Status Update',
  'Clarification Request',
  'Escalation Email',
  'Project Update',
  'Vendor Request',
  'Manager Update',
  'Short Report Paragraph',
]
const writingStatusOptions = ['Drafted', 'Reviewed', 'Improved', 'Completed']
const listeningCategoryOptions = [
  'Business Meeting',
  'Technical Discussion',
  'Project Management',
  'Presentation',
  'Interview',
  'Workplace Conversation',
  'Different Accents',
  'Fast Speech',
]
const listeningAccentOptions = ['American', 'British', 'Indian', 'Arabic English', 'Mixed', 'Other']
const listeningDifficultyOptions = ['Easy', 'Medium', 'Hard']
const listeningStatusOptions = ['Planned', 'Listened Once', 'Reviewed with Transcript', 'Summarized', 'Completed']
const pronunciationFocusOptions = [
  'Word Stress',
  'Sentence Stress',
  'Ending Sounds',
  'TH Sound',
  'V/F Sounds',
  'P/B Sounds',
  'Long and Short Vowels',
  'Clear Pauses',
  'Meeting Sentences',
  'Technical Vocabulary',
]
const pronunciationStatusOptions = ['New', 'Practicing', 'Improved', 'Completed']
const scoreFilterOptions = [allFilterValue, '1-2', '3', '4-5']
const rubricScoreOptions = [
  { value: 1, label: '1 = Needs Focus' },
  { value: 2, label: '2 = Developing' },
  { value: 3, label: '3 = Meets Level' },
  { value: 4, label: '4 = Strong for Level' },
  { value: 5, label: '5 = Above Level' },
]

function createTrackerFilters(extra = {}) {
  return {
    search: '',
    type: allFilterValue,
    category: allFilterValue,
    accent: allFilterValue,
    difficulty: allFilterValue,
    focusArea: allFilterValue,
    status: allFilterValue,
    scoreRange: allFilterValue,
    ...extra,
  }
}

function createFeedbackLoopFilters() {
  return {
    search: '',
    skill: allFilterValue,
    status: allFilterValue,
    feedbackSource: allFilterValue,
    relatedPracticeType: allFilterValue,
  }
}

function getRubricSkill(skillId) {
  return cefrRubrics.skills.find((skill) => skill.id === skillId) || cefrRubrics.skills[0]
}

function getRubricCanDoStatements(skill, level) {
  return (skill?.canDoStatements || []).filter((item) => item.level === level)
}

function getRubricDescriptor(criterion, level) {
  return criterion?.descriptors?.[level] || 'No descriptor available for this level.'
}

function calculateCriteriaAverage(criteriaScores = {}) {
  const scores = Object.values(criteriaScores).map(Number).filter((score) => Number.isFinite(score) && score > 0)
  return scores.length ? Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1)) : 0
}

function filterFeedbackLoops(loops, filters) {
  const search = filters.search.trim().toLowerCase()

  return loops.filter((loop) => {
    const searchText = [
      loop.title,
      loop.skill,
      loop.relatedPracticeType,
      loop.relatedPracticeId,
      loop.feedbackText,
      loop.correctionPlan,
      loop.improvementEvidence,
    ].join(' ').toLowerCase()

    return (
      (!search || searchText.includes(search)) &&
      (filters.skill === allFilterValue || loop.skill === filters.skill) &&
      (filters.status === allFilterValue || loop.status === filters.status) &&
      (filters.feedbackSource === allFilterValue || loop.feedbackSource === filters.feedbackSource) &&
      (filters.relatedPracticeType === allFilterValue || loop.relatedPracticeType === filters.relatedPracticeType)
    )
  })
}

function getUniqueOptions(items, field) {
  return [allFilterValue, ...Array.from(new Set(items.map((item) => item[field]).filter(Boolean))).sort()]
}

function filterSpeakingTopics(topics, filters, progress = {}) {
  const search = filters.search.trim().toLowerCase()

  return topics.filter((topic) => {
    const topicProgress = progress[topic.id] || {}
    const searchableText = [
      topic.title,
      topic.category,
      topic.difficulty,
      topic.level,
      topic.tags.join(' '),
      topic.usefulPhrases.join(' '),
      topic.promptQuestions.join(' '),
    ]
      .join(' ')
      .toLowerCase()

    const matchesSearch = !search || searchableText.includes(search)
    const matchesCategory = filters.category === allFilterValue || topic.category === filters.category
    const matchesDifficulty = filters.difficulty === allFilterValue || topic.difficulty === filters.difficulty
    const matchesLevel = filters.level === allFilterValue || topic.level === filters.level
    const matchesStatus =
      filters.status === allFilterValue ||
      (filters.status === 'Completed' && topicProgress.completed) ||
      (filters.status === 'Not Completed' && !topicProgress.completed)
    const matchesDuration =
      filters.duration === allFilterValue ||
      (filters.duration === 'Short' && topic.durationMinutes <= 3) ||
      (filters.duration === 'Medium' && topic.durationMinutes > 3 && topic.durationMinutes <= 7) ||
      (filters.duration === 'Long' && topic.durationMinutes > 7)

    return matchesSearch && matchesCategory && matchesDifficulty && matchesLevel && matchesStatus && matchesDuration
  })
}

function filterBusinessPhrases(phrases, filters, progress = {}) {
  const search = filters.search.trim().toLowerCase()

  return phrases.filter((phrase) => {
    const phraseProgress = progress[phrase.id] || {}
    const searchableText = [
      phrase.phrase,
      phrase.category,
      phrase.level,
      phrase.difficulty,
      phrase.useCase,
      phrase.example,
      phrase.tags?.join(' '),
      phrase.relatedSkills?.join(' '),
      phrase.practicePrompt,
      phraseProgress.notes,
    ].join(' ').toLowerCase()
    const matchesSearch = !search || searchableText.includes(search)
    const matchesCategory = filters.category === allFilterValue || phrase.category === filters.category
    const matchesLevel = filters.level === allFilterValue || phrase.level === filters.level
    const matchesDifficulty = filters.difficulty === allFilterValue || phrase.difficulty === filters.difficulty
    const matchesStatus =
      filters.status === allFilterValue ||
      (filters.status === 'New' && !phraseProgress.practiced) ||
      (filters.status === 'Practiced' && phraseProgress.practiced) ||
      (filters.status === 'Favorite' && phraseProgress.favorite)

    return matchesSearch && matchesCategory && matchesLevel && matchesDifficulty && matchesStatus
  })
}

function getBusinessPhraseSummary(phrases = [], progress = {}) {
  const practiced = phrases.filter((phrase) => progress[phrase.id]?.practiced).length
  const favorite = phrases.filter((phrase) => progress[phrase.id]?.favorite).length

  return {
    total: phrases.length,
    practiced,
    favorite,
    practicedPercentage: phrases.length ? Math.round((practiced / phrases.length) * 100) : 0,
  }
}

function createEmptyMistakeDraft() {
  return {
    wrongSentence: '',
    correctSentence: '',
    category: 'Grammar',
    rule: '',
    source: 'Self-review',
    status: 'New',
    relatedSkill: 'Grammar',
    relatedGrammarTopicId: '',
    notes: '',
  }
}

function filterMistakes(mistakes, filters) {
  const search = filters.search.trim().toLowerCase()

  return mistakes.filter((mistake) => {
    const searchableText = [
      mistake.wrongSentence,
      mistake.correctSentence,
      mistake.category,
      mistake.rule,
      mistake.source,
      mistake.status,
      mistake.relatedSkill,
      mistake.notes,
    ]
      .join(' ')
      .toLowerCase()

    const matchesSearch = !search || searchableText.includes(search)
    const matchesCategory = filters.category === allFilterValue || mistake.category === filters.category
    const matchesSource = filters.source === allFilterValue || mistake.source === filters.source
    const matchesStatus = filters.status === allFilterValue || mistake.status === filters.status
    const matchesSkill = filters.relatedSkill === allFilterValue || mistake.relatedSkill === filters.relatedSkill

    return matchesSearch && matchesCategory && matchesSource && matchesStatus && matchesSkill
  })
}

function getMistakeSummary(mistakes) {
  const activeMistakes = mistakes.filter((mistake) => mistake.status !== 'Fixed')
  const categoryCounts = activeMistakes.reduce((counts, mistake) => {
    counts[mistake.category] = (counts[mistake.category] || 0) + 1
    return counts
  }, {})
  const mostCommonCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'

  return {
    total: mistakes.length,
    newCount: mistakes.filter((mistake) => mistake.status === 'New').length,
    practicingCount: mistakes.filter((mistake) => mistake.status === 'Practicing').length,
    fixedCount: mistakes.filter((mistake) => mistake.status === 'Fixed').length,
    activeCount: activeMistakes.length,
    mostCommonCategory,
    fixedPercentage: mistakes.length ? Math.round((mistakes.filter((mistake) => mistake.status === 'Fixed').length / mistakes.length) * 100) : 0,
  }
}

const contentTypeConfig = {
  grammarTopics: { label: 'Grammar', icon: '📚', editable: true },
  speakingTopics: { label: 'Speaking', icon: '🎙️', editable: false },
  businessPhrases: { label: 'Business Phrases', icon: '💼', editable: false },
  pronunciationSentences: { label: 'Pronunciation', icon: '🔊', editable: true },
  writingTemplates: { label: 'Writing Templates', icon: '✍️', editable: true },
  commonMistakes: { label: 'Mistakes', icon: '🧩', editable: false },
}

function createContentFilters() {
  return {
    search: '',
    category: allFilterValue,
    level: allFilterValue,
    difficulty: allFilterValue,
    status: allFilterValue,
  }
}

function getContentSearchText(item, type, progress = {}) {
  if (type === 'speakingTopics') {
    return [
      item.title,
      item.category,
      item.difficulty,
      item.level,
      item.tags?.join(' '),
      item.speakingStructure?.join(' '),
      item.usefulPhrases?.join(' '),
      item.promptQuestions?.join(' '),
      progress[item.id]?.notes,
    ].join(' ')
  }

  if (type === 'commonMistakes') {
    return [
      item.wrongSentence,
      item.correctSentence,
      item.category,
      item.source,
      item.status,
      item.relatedSkill,
      item.rule,
      item.notes,
    ].join(' ')
  }

  return [
    item.title,
    item.phrase,
    item.sentence,
    item.category,
    item.level,
    item.priority,
    item.type,
    item.focusArea,
    item.explanation,
    item.workExamples,
    item.practiceTask,
    item.useCase,
    item.exampleUseCase,
    item.body,
    item.notes,
    item.tags?.join(' '),
  ].join(' ')
}

function getContentItemStatus(item, type, progress = {}) {
  if (type === 'speakingTopics') return progress[item.id]?.completed ? 'Completed' : 'Not Completed'
  if (type === 'commonMistakes') return item.status || 'New'
  if (type === 'businessPhrases') {
    const phraseProgress = progress[item.id] || item
    if (phraseProgress.favorite) return 'Favorite'
    return phraseProgress.practiced ? 'Practiced' : 'New'
  }
  if (type === 'writingTemplates') return 'Available'
  return item.completed ? 'Completed' : 'Not Completed'
}

function getRecommendationTargetTab(targetSection) {
  const targetMap = {
    Evaluation: 'evaluation',
    'Daily Plan': 'daily',
    Grammar: 'grammar',
    'Speaking Topics': 'speaking',
    Listening: 'listening',
    Pronunciation: 'pronunciation',
    Writing: 'writing',
    'Business Phrases': 'phrases',
    Mistakes: 'mistakes',
    'Content Library': 'content',
    'Level & Assessment': 'level',
  }

  return targetMap[targetSection] || 'overview'
}

function filterContentItems(items, type, filters, progress = {}) {
  const search = filters.search.trim().toLowerCase()

  return items.filter((item) => {
    const status = getContentItemStatus(item, type, progress)
    const matchesSearch = !search || getContentSearchText(item, type, progress).toLowerCase().includes(search)
    const matchesCategory = filters.category === allFilterValue || item.category === filters.category
    const matchesLevel = filters.level === allFilterValue || item.level === filters.level
    const matchesDifficulty = filters.difficulty === allFilterValue || item.difficulty === filters.difficulty
    const matchesStatus =
      type === 'businessPhrases'
        ? filters.status === allFilterValue ||
          (filters.status === 'New' && !progress[item.id]?.practiced) ||
          (filters.status === 'Practiced' && progress[item.id]?.practiced) ||
          (filters.status === 'Favorite' && progress[item.id]?.favorite)
        : filters.status === allFilterValue || status === filters.status

    return matchesSearch && matchesCategory && matchesLevel && matchesDifficulty && matchesStatus
  })
}

function matchesScoreRange(score, range) {
  if (range === allFilterValue) return true
  const numericScore = Number(score)
  if (!numericScore) return false
  if (range === '1-2') return numericScore <= 2
  if (range === '3') return numericScore === 3
  if (range === '4-5') return numericScore >= 4
  return true
}

function filterTrackerEntries(entries, filters, searchableFields, fieldFilters = {}) {
  const search = filters.search.trim().toLowerCase()

  return entries.filter((entry) => {
    const searchableText = searchableFields.map((field) => entry[field] || '').join(' ').toLowerCase()
    const matchesSearch = !search || searchableText.includes(search)
    const matchesFields = Object.entries(fieldFilters).every(([filterName, entryField]) =>
      filters[filterName] === allFilterValue || entry[entryField] === filters[filterName],
    )
    const matchesScore = matchesScoreRange(entry.score || entry.clarityScore, filters.scoreRange)

    return matchesSearch && matchesFields && matchesScore
  })
}

function getTrackerSummary(entries, completedStatuses, scoreField = 'score') {
  return {
    total: entries.length,
    completed: entries.filter((entry) => completedStatuses.includes(entry.status)).length,
    averageScore: getAverageScore(entries, scoreField),
    lastPracticedDate: entries.map((entry) => entry.date).sort().at(-1) || 'Not practiced yet',
  }
}

const defaultProgress = {
  profile: defaultProfile,
  dailyPlan: defaultDailyPlan,
  learningPlan: defaultLearningPlan,
  speakingTopicsBank: defaultSpeakingTopics,
  speakingTopicProgress: {},
  businessPhraseProgress: {},
  mistakes: normalizeMistakes(null, defaultContentLibrary.commonMistakes),
  contentLibrary: defaultContentLibrary,
  evaluationSkills: defaultEvaluationSkills,
  selectedMonth: 1,
  selectedWeek: 1,
  selectedDay: 'Saturday',
  completedDailyTasks: {},
  completedPlanTasks: {},
  completedSpeakingTopics: {},
  completedGrammarTopics: {},
  completedBusinessPhrases: {},
  reviewedCommonMistakes: {},
  evaluationDraft: emptyEvaluation,
  evaluations: [],
  writingDraft: emptyWritingDraft,
  writingEntries: [],
  listeningDraft: emptyListeningDraft,
  listeningEntries: [],
  pronunciationDraft: emptyPronunciationDraft,
  pronunciationEntries: [],
  noteDraft: emptyNoteDraft,
  notes: [],
  levelProfile: {},
  levelHistory: [],
  teacherNotes: normalizeTeacherNotes(),
  rubricAssessments: [],
  feedbackLoops: [],
}

function createDefaultProgress() {
  return createDefaultProgressFromTemplate(defaultProgress, {
    emptyEvaluation,
    emptyWritingDraft,
    emptyListeningDraft,
    emptyPronunciationDraft,
    emptyNoteDraft,
    todayIso,
  })
}

function loadProgress() {
  const saved = readFromLocalStorage(STORAGE_KEY, createDefaultProgress())
  const evaluationSkills = normalizeEvaluationSkills(saved.evaluationSkills)
  const profile = { ...defaultProfile, ...saved.profile }
  const dailyPlan = normalizeDailyPlan(saved.dailyPlan)
  const learningPlan = normalizeLearningPlan(saved.learningPlan, profile, dailyPlan)
  const contentLibrary = normalizeContentLibrary(saved.contentLibrary, saved)
  const mistakes = normalizeMistakes(saved.mistakes, contentLibrary.commonMistakes)
  const speakingTopicsBank = normalizeSpeakingTopics(saved.speakingTopicsBank, contentLibrary.speakingTopics)
  const speakingTopicProgress = normalizeSpeakingTopicProgress(
    saved.speakingTopicProgress,
    speakingTopicsBank,
    contentLibrary.speakingTopics,
  )
  const businessPhraseProgress = normalizeBusinessPhraseProgress(
    saved.businessPhraseProgress,
    defaultBusinessPhrases,
    contentLibrary.businessPhrases,
  )
  const completedPlanTasks = migrateCompletedDailyTasksToPlan(
    learningPlan,
    saved.completedDailyTasks,
    saved.completedPlanTasks,
  )

  return {
    ...createDefaultProgress(),
    ...saved,
    profile,
    levelProfile: normalizeLevelProfile(saved.levelProfile, profile, levelSummary),
    levelHistory: Array.isArray(saved.levelHistory) ? saved.levelHistory : [],
    dailyPlan,
    learningPlan,
    mistakes,
    speakingTopicsBank,
    speakingTopicProgress,
    businessPhraseProgress,
    completedPlanTasks,
    selectedMonth: Number(saved.selectedMonth || 1),
    selectedWeek: Number(saved.selectedWeek || 1),
    contentLibrary,
    evaluationSkills,
    evaluationDraft: normalizeEvaluationDraft(saved.evaluationDraft, evaluationSkills, emptyEvaluation),
    writingDraft: { ...emptyWritingDraft, ...saved.writingDraft },
    writingEntries: normalizeWritingEntries(saved.writingEntries || saved.writingPracticeEntries),
    listeningDraft: { ...emptyListeningDraft, ...saved.listeningDraft },
    listeningEntries: normalizeListeningEntries(saved.listeningEntries || saved.listeningPracticeEntries),
    pronunciationDraft: { ...emptyPronunciationDraft, ...saved.pronunciationDraft },
    pronunciationEntries: normalizePronunciationEntries(saved.pronunciationEntries || saved.pronunciationPracticeEntries),
    noteDraft: { ...emptyNoteDraft, ...saved.noteDraft },
    teacherNotes: normalizeTeacherNotes(saved.teacherNotes),
    rubricAssessments: normalizeRubricAssessments(saved.rubricAssessments, cefrRubrics),
    feedbackLoops: normalizeFeedbackLoops(saved.feedbackLoops),
  }
}

function saveProgress(progress) {
  return writeToLocalStorage(STORAGE_KEY, progress)
}

function runSmokeTests() {
  console.assert(weeklyPlan.length === 7, 'Smoke test failed: weekly plan must have 7 days')
  console.assert(defaultDailyPlan.length === 7, 'Smoke test failed: default daily plan must have 7 days')
  console.assert(defaultLearningPlan.months.length > 0, 'Smoke test failed: learning plan must have months')
  console.assert(defaultSpeakingTopics.length >= 100, 'Smoke test failed: speaking topic bank should have at least 100 topics')
  console.assert(
    new Set(defaultSpeakingTopics.map((topic) => topic.id)).size === defaultSpeakingTopics.length,
    'Smoke test failed: speaking topic IDs should be unique',
  )
  console.assert(defaultSpeakingTopics.every((topic) => topic.title), 'Smoke test failed: every speaking topic should have a title')
  console.assert(defaultBusinessPhrases.length >= 150, 'Smoke test failed: default business phrase bank should have at least 150 phrases')
  console.assert(
    new Set(defaultBusinessPhrases.map((phrase) => phrase.id)).size === defaultBusinessPhrases.length,
    'Smoke test failed: business phrase IDs should be unique',
  )
  console.assert(
    defaultBusinessPhrases.every((phrase) => phrase.id && phrase.phrase),
    'Smoke test failed: every business phrase should have id and phrase text',
  )
  console.assert(
    Array.isArray(filterBusinessPhrases(defaultBusinessPhrases, createContentFilters(), {})),
    'Smoke test failed: business phrase filters should not crash',
  )
  console.assert(
    Object.keys(normalizeBusinessPhraseProgress({ 'phr-001': { practiced: true } }, defaultBusinessPhrases)).includes('phr-001'),
    'Smoke test failed: business phrase progress should use stable IDs',
  )
  console.assert(
    applyBusinessPhraseProgress(defaultBusinessPhrases, {}).length === defaultBusinessPhrases.length,
    'Smoke test failed: missing business phrase progress should not crash',
  )
  console.assert(
    Array.isArray(filterSpeakingTopics(defaultSpeakingTopics, {
      search: 'project',
      category: allFilterValue,
      difficulty: allFilterValue,
      level: allFilterValue,
      status: allFilterValue,
      duration: allFilterValue,
    })),
    'Smoke test failed: speaking topic filters should not crash',
  )
  console.assert(
    Object.keys(normalizeSpeakingTopicProgress({ 'spk-001': { completed: true } }, defaultSpeakingTopics)).includes('spk-001'),
    'Smoke test failed: speaking topic progress should use stable IDs',
  )
  console.assert(defaultLearningPlan.months[0].weeks[0], 'Smoke test failed: Month 1 must include Week 1')
  console.assert(defaultLearningPlan.months[0].weeks[0].days.length === 7, 'Smoke test failed: Week 1 must have 7 days')
  console.assert(flattenPlanTasks(defaultLearningPlan).length > 0, 'Smoke test failed: flattened learning plan must return tasks')
  console.assert(calculatePlanProgress(defaultLearningPlan, {}).percentage === 0, 'Smoke test failed: plan progress should calculate')
  console.assert(Boolean(getTodayPlan(defaultLearningPlan, { selectedDay: 'Saturday' })?.dayName), 'Smoke test failed: today plan should return a valid day')
  console.assert(
    flattenPlanTasks(defaultLearningPlan).every((task) => typeof task.id === 'string' && task.id.length > 0),
    'Smoke test failed: plan task IDs should be stable and non-empty',
  )
  console.assert(getTotalDailyTasks(defaultDailyPlan) === 28, 'Smoke test failed: weekly task count should be 28')
  console.assert(defaultDailyPlan[0].tasks[0].id === 'Saturday-0', 'Smoke test failed: daily task IDs should stay stable')
  console.assert(defaultContentLibrary.grammarTopics.length >= grammarTopics.length, 'Smoke test failed: content library should include grammar defaults')
  console.assert(defaultContentLibrary.commonMistakes.length >= commonMistakes.length, 'Smoke test failed: content library should include mistake defaults')
  console.assert(
    ['grammarTopics', 'speakingTopics', 'businessPhrases', 'pronunciationSentences', 'writingTemplates', 'commonMistakes'].every((type) => Boolean(contentTypeConfig[type])),
    'Smoke test failed: content library should include expected content types',
  )
  console.assert(
    normalizeContentLibrary({ grammarTopics: [{ title: 'Test grammar' }] }).grammarTopics.every((item) => item.id),
    'Smoke test failed: content library items should normalize with IDs',
  )
  console.assert(
    Array.isArray(filterContentItems(defaultContentLibrary.grammarTopics, 'grammarTopics', createContentFilters())),
    'Smoke test failed: content filters should not crash',
  )
  console.assert(
    filterContentItems(defaultContentLibrary.grammarTopics, 'grammarTopics', createContentFilters()).length === defaultContentLibrary.grammarTopics.length,
    'Smoke test failed: empty content search should return all items',
  )
  console.assert(
    new Set(normalizeSpeakingTopics(defaultSpeakingTopics).map((topic) => topic.id)).size === normalizeSpeakingTopics(defaultSpeakingTopics).length,
    'Smoke test failed: speaking topics should not be duplicated',
  )
  console.assert(
    filterContentItems(normalizeMistakes([{ id: 'shared-mistake', wrongSentence: 'Bad' }]), 'commonMistakes', createContentFilters())[0].id === 'shared-mistake',
    'Smoke test failed: content library mistakes should use shared mistake data',
  )
  console.assert(normalizeWritingEntries([{ title: 'Email' }])[0].id, 'Smoke test failed: writing entries should normalize safely')
  console.assert(normalizeListeningEntries([{ title: 'Meeting' }])[0].id, 'Smoke test failed: listening entries should normalize safely')
  console.assert(normalizePronunciationEntries([{ sentence: 'Test' }])[0].id, 'Smoke test failed: pronunciation entries should normalize safely')
  console.assert(getAverageScore([{ score: 4 }, { score: 2 }]) === 3, 'Smoke test failed: average score calculation should work')
  console.assert(Array.isArray(filterTrackerEntries([], createTrackerFilters(), ['title'])), 'Smoke test failed: tracker filters should not crash with empty arrays')
  console.assert(normalizeWritingEntries([{ title: 'Email' }]).every((entry) => entry.id), 'Smoke test failed: tracker entries should have stable IDs')
  console.assert(getTrackerSummary([{ status: 'Completed' }], ['Completed']).completed === 1, 'Smoke test failed: completed tracker counts should calculate')
  console.assert(normalizeListeningEntries(null).length === 0, 'Smoke test failed: missing tracker data should not crash')
  const emptyTeacherReport = buildTeacherReportData({
    profile: defaultProfile,
    evaluations: [],
    evaluationSkills: defaultEvaluationSkills,
    mistakes: [],
    speakingTopics: defaultSpeakingTopics,
    speakingTopicProgress: {},
    writingEntries: [],
    listeningEntries: [],
    pronunciationEntries: [],
  })
  console.assert(emptyTeacherReport.profile.name === defaultProfile.name, 'Smoke test failed: teacher report should build without evaluations')
  console.assert(buildTeacherReportData({ profile: defaultProfile, mistakes: [] }).mistakes.activeCount === 0, 'Smoke test failed: teacher report should build without mistakes')
  console.assert(buildTeacherReportData({ profile: defaultProfile }).writing.total === 0, 'Smoke test failed: teacher report should build without tracker entries')
  console.assert(
    getTopActiveMistakes([{ status: 'New' }, { status: 'Fixed' }, { status: 'Practicing' }]).length === 2,
    'Smoke test failed: active mistakes count should be correct',
  )
  console.assert(
    getMostCommonMistakeCategories([{ category: 'Grammar', status: 'New' }, { category: 'Grammar', status: 'Practicing' }])[0].count === 2,
    'Smoke test failed: top mistake categories should calculate correctly',
  )
  console.assert(
    emptyTeacherReport.recommendations.focusAreas.length > 0 && emptyTeacherReport.recommendations.homeworkSuggestions.length > 0,
    'Smoke test failed: teacher recommendations should include focus areas and homework suggestions',
  )
  console.assert(
    formatTeacherReportText(emptyTeacherReport).includes(defaultProfile.name) && formatTeacherReportText(emptyTeacherReport).includes(defaultProfile.currentLevel),
    'Smoke test failed: formatted teacher report should include learner name and level',
  )
  console.assert(normalizeTeacherNotes(null).generalNotes === '', 'Smoke test failed: missing teacher notes should normalize safely')
  console.assert(Array.isArray(cefrRubrics.skills) && cefrRubrics.skills.length >= 8, 'Smoke test failed: CEFR rubrics should load safely')
  console.assert(cefrRubrics.skills.every((skill) => skill.id && skill.name), 'Smoke test failed: every CEFR rubric skill should have id and name')
  console.assert(normalizeRubricAssessment({}, 0, cefrRubrics).id, 'Smoke test failed: rubric assessment should normalize safely')
  console.assert(normalizeFeedbackLoop({}).status === 'Open', 'Smoke test failed: feedback loop should normalize safely')
  console.assert(normalizeRubricAssessments(null, cefrRubrics).length === 0, 'Smoke test failed: missing rubric assessments should not crash')
  console.assert(normalizeFeedbackLoops(null).length === 0, 'Smoke test failed: missing feedback loops should not crash')
  console.assert(
    generateLearningRecommendation({
      profile: defaultProfile,
      learningPlan: defaultLearningPlan,
      selectedPlanPosition: { monthNumber: 1, weekNumber: 1, dayName: 'Saturday' },
      todayPlan: defaultLearningPlan.months[0].weeks[0].days[0],
      completedTasks: {},
      evaluations: [{ id: 'eval-test', scores: { grammar: 4, speaking: 4 } }],
      evaluationSkills: defaultEvaluationSkills,
      feedbackLoops: [normalizeFeedbackLoop({ id: 'loop-test', title: 'Repeat articles', status: 'Open' })],
    }).targetSection === 'Level & Assessment',
    'Smoke test failed: recommendation should use open feedback loop',
  )
  console.assert(
    Array.isArray(createBackupPayload({ ...createDefaultProgress(), rubricAssessments: [], feedbackLoops: [] }).progress.rubricAssessments) &&
      Array.isArray(createBackupPayload({ ...createDefaultProgress(), rubricAssessments: [], feedbackLoops: [] }).progress.feedbackLoops),
    'Smoke test failed: export payload should include rubric assessments and feedback loops',
  )
  console.assert(
    createBackupPayload({ ...createDefaultProgress(), businessPhraseProgress: { 'phr-001': { practiced: true } } }).progress.businessPhraseProgress['phr-001'].practiced,
    'Smoke test failed: export payload should include business phrase progress',
  )
  console.assert(
    parseAndNormalizeBackup(JSON.stringify({ progress: createDefaultProgress() }), defaultProgress, { emptyEvaluation, emptyWritingDraft, emptyListeningDraft, emptyPronunciationDraft, emptyNoteDraft, todayIso }).progress.feedbackLoops.length === 0,
    'Smoke test failed: import should handle missing feedback loops',
  )
  console.assert(
    Object.keys(parseAndNormalizeBackup(JSON.stringify({ progress: createDefaultProgress() }), defaultProgress, { emptyEvaluation, emptyWritingDraft, emptyListeningDraft, emptyPronunciationDraft, emptyNoteDraft, todayIso }).progress.businessPhraseProgress || {}).length === 0,
    'Smoke test failed: import should handle missing business phrase progress',
  )
  console.assert(normalizeMistakes([{ wrongSentence: 'Bad', correctSentence: 'Good' }]).length === 1, 'Smoke test failed: mistakes should normalize safely')
  console.assert(normalizeMistakes([{ wrongSentence: 'Bad' }]).every((mistake) => mistake.id), 'Smoke test failed: every mistake should have a stable id')
  console.assert(mistakeStatuses.includes(normalizeMistake({ status: 'Invalid' }).status), 'Smoke test failed: mistake status should be valid')
  console.assert(Boolean(normalizeMistake({ status: 'Fixed' }).fixedAt), 'Smoke test failed: fixed mistakes should have fixedAt')
  console.assert(!normalizeMistake({ status: 'Practicing', fixedAt: '2026-01-01T00:00:00.000Z' }).fixedAt, 'Smoke test failed: non-fixed mistakes should clear fixedAt')
  console.assert(
    Array.isArray(filterMistakes(normalizeMistakes([{ wrongSentence: 'Bad', category: 'Grammar' }]), {
      search: 'bad',
      category: allFilterValue,
      source: allFilterValue,
      status: allFilterValue,
      relatedSkill: allFilterValue,
    })),
    'Smoke test failed: mistake filters should not crash',
  )
  console.assert(calculatePercentage(7, 28) === 25, 'Smoke test failed: progress calculation should be 25')
  console.assert(
    getEvaluationAverage({ scores: { speaking: 5, listening: 3 } }, defaultEvaluationSkills.slice(0, 2), normalizeEvaluationSkills) === 4,
    'Smoke test failed: weighted evaluation average should be 4',
  )
  console.assert(
    getEvaluationAverage({ ...emptyEvaluation, speaking: 5, listening: 5 }, defaultEvaluationSkills.slice(0, 2), normalizeEvaluationSkills) === 5,
    'Smoke test failed: legacy evaluation fields should remain readable',
  )
  console.assert(safeJsonParse('{bad json', { ok: true }).ok === true, 'Smoke test failed: local storage fallback should not crash')
  console.assert(defaultProfile.name === 'Mohamed Ashkar', 'Smoke test failed: default profile should be Mohamed Ashkar')
  console.assert(levelSummary.length >= 6, 'Smoke test failed: skill evaluation config should include core skills')
  console.assert(
    suggestOverallLevel({ profile: defaultProfile, evaluations: [], evaluationSkills: defaultEvaluationSkills }).confidence === 'Low',
    'Smoke test failed: no evaluations should keep current level with low confidence',
  )
  console.assert(
    suggestOverallLevel({
      profile: defaultProfile,
      evaluations: [{ scores: Object.fromEntries(defaultEvaluationSkills.map((skill) => [skill.id, 4])) }],
      evaluationSkills: defaultEvaluationSkills,
      mistakes: [],
    }).suggestedLevel !== 'A1',
    'Smoke test failed: high average scores should suggest same or slightly higher level',
  )
  console.assert(
    suggestOverallLevel({
      profile: defaultProfile,
      evaluations: [{ scores: { grammar: 2, speaking: 2, listening: 3 } }],
      evaluationSkills: defaultEvaluationSkills,
    }).suggestedLevel === defaultProfile.currentLevel,
    'Smoke test failed: low scores should not suggest an upgrade',
  )
  console.assert(
    suggestOverallLevel({
      profile: defaultProfile,
      evaluations: [{ scores: Object.fromEntries(defaultEvaluationSkills.map((skill) => [skill.id, 4])) }],
      evaluationSkills: defaultEvaluationSkills,
      mistakes: normalizeMistakes([
        { id: 'm1', status: 'New' },
        { id: 'm2', status: 'New' },
        { id: 'm3', status: 'Practicing' },
        { id: 'm4', status: 'Practicing' },
      ]),
    }).suggestedLevel === defaultProfile.currentLevel,
    'Smoke test failed: active mistakes should prevent upgrade',
  )
  console.assert(
    createLevelHistoryEntry({ oldLevel: 'B1+', newLevel: 'B2', source: 'App-suggested', reason: 'Accepted', note: '' }).newLevel === 'B2',
    'Smoke test failed: accepting suggested level should create history entry shape',
  )
  console.assert(
    normalizeLevelProfile(null, defaultProfile, levelSummary).levelSource === 'Manual',
    'Smoke test failed: missing level data should normalize safely',
  )
  console.assert(
    Boolean(suggestOverallLevel({ profile: defaultProfile }).confidence && suggestOverallLevel({ profile: defaultProfile }).reason),
    'Smoke test failed: suggested level should always have confidence and reason',
  )
  console.assert(monthlyRoadmap.length === 9, 'Smoke test failed: monthly roadmap should cover 9 months')
  console.assert(currentLevelOptions.includes(defaultProfile.currentLevel), 'Smoke test failed: default current level should be editable')
  console.assert(targetLevelOptions.includes(defaultProfile.targetLevel), 'Smoke test failed: default target level should be editable')
  console.assert(planIntensityOptions.length === 4, 'Smoke test failed: plan intensity config should include 4 options')
  console.assert(planIntensities.Sprint.warning.includes('full C1'), 'Smoke test failed: sprint intensity warning should mention C1')
  console.assert(validateBackupPayload({ progress: createDefaultProgress() }) === '', 'Smoke test failed: backup validation should accept default progress')
  console.assert(Boolean(validateBackupPayload({ profile: {} })), 'Smoke test failed: backup validation should reject incomplete data')
  console.assert(Boolean(createBackupPayload(createDefaultProgress()).appVersion), 'Smoke test failed: export payload should include appVersion')
  console.assert(Boolean(createBackupPayload(createDefaultProgress()).exportDate), 'Smoke test failed: export payload should include exportDate')
  console.assert(
    Boolean(parseAndNormalizeBackup('{bad json', defaultProgress, { emptyEvaluation, emptyWritingDraft, emptyListeningDraft, emptyPronunciationDraft, emptyNoteDraft, todayIso }).error),
    'Smoke test failed: import validation should reject invalid JSON safely',
  )
  console.assert(
    countCompletedDailyTasks([{ tasks: [{ id: 'active-task' }] }], { 'active-task': true, 'deleted-task': true }) === 1,
    'Smoke test failed: completed daily task count should ignore deleted task IDs',
  )
  const recommendationCompletedTasks = Object.fromEntries(
    defaultLearningPlan.months[0].weeks[0].days.flatMap((day) => day.tasks).map((task) => [task.id, true]),
  )
  console.assert(
    generateLearningRecommendation({
      profile: defaultProfile,
      learningPlan: defaultLearningPlan,
      selectedPlanPosition: { monthNumber: 1, weekNumber: 1, dayName: 'Saturday' },
      todayPlan: defaultLearningPlan.months[0].weeks[0].days[0],
      completedTasks: {},
      evaluations: [],
      evaluationSkills: defaultEvaluationSkills,
    }).targetSection === 'Evaluation',
    'Smoke test failed: no evaluations should return Evaluation recommendation',
  )
  console.assert(
    generateLearningRecommendation({
      profile: defaultProfile,
      learningPlan: defaultLearningPlan,
      selectedPlanPosition: { monthNumber: 1, weekNumber: 1, dayName: 'Saturday' },
      todayPlan: defaultLearningPlan.months[0].weeks[0].days[0],
      completedTasks: recommendationCompletedTasks,
      evaluations: [{ id: 'eval-test', scores: { grammar: 4, speaking: 4 } }],
      evaluationSkills: defaultEvaluationSkills,
      mistakes: normalizeMistakes([
        { id: 'mistake-a', category: 'Prepositions', status: 'New' },
        { id: 'mistake-b', category: 'Prepositions', status: 'Practicing' },
      ]),
      contentLibrary: defaultContentLibrary,
    }).title.includes('Prepositions'),
    'Smoke test failed: active mistake pattern should return category recommendation',
  )
  console.assert(
    generateLearningRecommendation({
      profile: defaultProfile,
      learningPlan: defaultLearningPlan,
      selectedPlanPosition: { monthNumber: 1, weekNumber: 1, dayName: 'Saturday' },
      todayPlan: defaultLearningPlan.months[0].weeks[0].days[0],
      completedTasks: recommendationCompletedTasks,
      evaluations: [{ id: 'eval-test', scores: { speaking: 2, grammar: 4, listening: 4 } }],
      evaluationSkills: defaultEvaluationSkills,
      speakingTopics: defaultSpeakingTopics,
      speakingTopicProgress: {},
      contentLibrary: defaultContentLibrary,
    }).targetSection === 'Speaking Topics',
    'Smoke test failed: weakest skill Speaking should return Speaking Topics recommendation',
  )
  console.assert(
    generateLearningRecommendation({
      profile: defaultProfile,
      learningPlan: defaultLearningPlan,
      selectedPlanPosition: { monthNumber: 1, weekNumber: 1, dayName: 'Saturday' },
      todayPlan: defaultLearningPlan.months[0].weeks[0].days[0],
      completedTasks: {},
      evaluations: [{ id: 'eval-test', scores: { grammar: 4, speaking: 4 } }],
      evaluationSkills: defaultEvaluationSkills,
    }).targetSection === 'Daily Plan',
    'Smoke test failed: low weekly progress should return Daily Plan recommendation',
  )
  const missingDataRecommendation = generateLearningRecommendation()
  console.assert(
    Boolean(missingDataRecommendation.title && missingDataRecommendation.reason && missingDataRecommendation.suggestedAction && missingDataRecommendation.targetSection),
    'Smoke test failed: missing data recommendation should not crash and should include required fields',
  )
}

runSmokeTests()

function Card({ title, subtitle, icon, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-white/80 sm:p-6 ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{subtitle}</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">{title}</h2>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-teal-100 bg-teal-50 text-xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      {children}
    </section>
  )
}

function MetricCard({ label, value, detail, icon }) {
  return (
    <div className="group overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg transition group-hover:bg-teal-50" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
      <p className="mt-1.5 break-words text-sm leading-5 text-slate-500">{detail}</p>
    </div>
  )
}

function ProgressBar({ value }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0))

  return (
    <div className="h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0.5">
      <div className="h-full rounded-full bg-teal-600 shadow-[0_0_12px_rgba(13,148,136,0.35)] transition-all duration-500" style={{ width: `${safeValue}%` }} />
    </div>
  )
}

function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
      <p className="font-bold text-slate-950">{title}</p>
      <p className="mt-1">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function CheckboxRow({ checked, onChange, children }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 text-sm leading-6 transition ${
      checked
        ? 'border-teal-200 bg-teal-50/80 text-slate-800'
        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-teal-700"
      />
      <span>{children}</span>
    </label>
  )
}

function ScoreInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="number"
        min="1"
        max="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  )
}

function TextInput({ label, value, onChange, type = 'text', min, max, placeholder = '' }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        min={min}
        max={max}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  )
}

function TextArea({ label, value, onChange, rows = 3, placeholder = '' }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  )
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
      >
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value
          const label = typeof option === 'string' ? option : option.label
          return (
            <option key={value} value={value}>
              {label}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function EntryCard({ title, meta, children, onDelete }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{meta}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
        >
          Delete
        </button>
      </div>
      <div className="mt-3 break-words text-sm leading-6 text-slate-600">{children}</div>
    </article>
  )
}

function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isEditingDailyPlan, setIsEditingDailyPlan] = useState(false)
  const [contentLibraryTab, setContentLibraryTab] = useState('grammarTopics')
  const [contentFilters, setContentFilters] = useState(createContentFilters)
  const [contentViewMode, setContentViewMode] = useState('cards')
  const [editingContentItemId, setEditingContentItemId] = useState('')
  const [writingFilters, setWritingFilters] = useState(createTrackerFilters)
  const [listeningFilters, setListeningFilters] = useState(createTrackerFilters)
  const [pronunciationFilters, setPronunciationFilters] = useState(createTrackerFilters)
  const [editingWritingId, setEditingWritingId] = useState('')
  const [editingListeningId, setEditingListeningId] = useState('')
  const [editingPronunciationId, setEditingPronunciationId] = useState('')
  const [isWritingFormOpen, setIsWritingFormOpen] = useState(false)
  const [isListeningFormOpen, setIsListeningFormOpen] = useState(false)
  const [isPronunciationFormOpen, setIsPronunciationFormOpen] = useState(false)
  const [speakingFilters, setSpeakingFilters] = useState({
    search: '',
    category: allFilterValue,
    difficulty: allFilterValue,
    level: allFilterValue,
    status: allFilterValue,
    duration: allFilterValue,
  })
  const [selectedSpeakingTopicId, setSelectedSpeakingTopicId] = useState('')
  const [businessPhraseFilters, setBusinessPhraseFilters] = useState(createContentFilters)
  const [selectedBusinessPhraseId, setSelectedBusinessPhraseId] = useState('')
  const [mistakeFilters, setMistakeFilters] = useState({
    search: '',
    category: allFilterValue,
    source: allFilterValue,
    status: allFilterValue,
    relatedSkill: allFilterValue,
  })
  const [mistakeDraft, setMistakeDraft] = useState(createEmptyMistakeDraft)
  const [editingMistakeId, setEditingMistakeId] = useState('')
  const [levelDraft, setLevelDraft] = useState(() => ({
    officialLevel: '',
    targetLevel: '',
    levelSource: 'Manual',
    teacherNote: '',
    userNote: '',
  }))
  const [selectedRubricSkillId, setSelectedRubricSkillId] = useState(cefrRubrics.skills[0]?.id || '')
  const [selectedRubricLevel, setSelectedRubricLevel] = useState(cefrRubrics.levels[0] || 'B1')
  const [isRubricAssessmentFormOpen, setIsRubricAssessmentFormOpen] = useState(false)
  const [rubricAssessmentDraft, setRubricAssessmentDraft] = useState(() => buildEmptyRubricAssessment(cefrRubrics))
  const [editingRubricAssessmentId, setEditingRubricAssessmentId] = useState('')
  const [isFeedbackLoopFormOpen, setIsFeedbackLoopFormOpen] = useState(false)
  const [feedbackLoopDraft, setFeedbackLoopDraft] = useState(buildEmptyFeedbackLoop)
  const [editingFeedbackLoopId, setEditingFeedbackLoopId] = useState('')
  const [feedbackLoopFilters, setFeedbackLoopFilters] = useState(createFeedbackLoopFilters)
  const [importText, setImportText] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [teacherCopyMessage, setTeacherCopyMessage] = useState('')
  const [teacherReportFallbackText, setTeacherReportFallbackText] = useState('')

  const profile = progress.profile
  const levelProfile = normalizeLevelProfile(progress.levelProfile, profile, levelSummary)
  const evaluationSkills = progress.evaluationSkills
  const contentLibrary = progress.contentLibrary
  const mistakes = normalizeMistakes(progress.mistakes, contentLibrary.commonMistakes)
  const speakingTopicsBank = normalizeSpeakingTopics(progress.speakingTopicsBank, contentLibrary.speakingTopics)
  const speakingTopicProgress = progress.speakingTopicProgress || {}
  const businessPhraseProgress = normalizeBusinessPhraseProgress(progress.businessPhraseProgress, defaultBusinessPhrases, contentLibrary.businessPhrases)
  const businessPhrasesBank = applyBusinessPhraseProgress(defaultBusinessPhrases, businessPhraseProgress)
  const writingEntries = normalizeWritingEntries(progress.writingEntries)
  const listeningEntries = normalizeListeningEntries(progress.listeningEntries)
  const pronunciationEntries = normalizePronunciationEntries(progress.pronunciationEntries)
  const rubricAssessments = normalizeRubricAssessments(progress.rubricAssessments, cefrRubrics)
  const feedbackLoops = normalizeFeedbackLoops(progress.feedbackLoops)
  const rubricSummary = getRubricAssessmentSummary(rubricAssessments)
  const feedbackLoopSummary = getFeedbackLoopSummary(feedbackLoops)
  const selectedRubricSkill = getRubricSkill(selectedRubricSkillId)
  const selectedRubricCanDoStatements = getRubricCanDoStatements(selectedRubricSkill, selectedRubricLevel)
  const filteredFeedbackLoops = filterFeedbackLoops(feedbackLoops, feedbackLoopFilters)
  const planDurationLabel = formatPlanDuration(profile)
  const dailyTargetLabel = formatDailyTarget(profile)
  const selectedIntensity = getPlanIntensityConfig(profile, planIntensities)
  const learningPlan = progress.learningPlan
  const planPosition = getCurrentPlanPosition(profile, learningPlan, progress)
  const currentMonth = getCurrentMonth(learningPlan, planPosition)
  const currentWeek = getCurrentWeek(learningPlan, planPosition)
  const todayPlan = getTodayPlan(learningPlan, planPosition)
  const selectedPlan = { ...todayPlan, day: todayPlan.dayName }
  const currentWeekTasks = currentWeek.days.flatMap((day) => day.tasks)
  const totalDailyTasks = currentWeekTasks.length
  const completedDailyTasks = currentWeekTasks.filter(
    (task) => progress.completedPlanTasks[task.id] || (task.legacyId && progress.completedDailyTasks[task.legacyId]),
  ).length
  const planProgress = calculatePlanProgress(learningPlan, progress.completedPlanTasks)
  const todayProgress = getDayProgress(todayPlan, progress.completedPlanTasks)
  const dailyPlan = currentWeek.days.map((day) => ({ ...day, day: day.dayName }))
  const completedSpeakingTopics = speakingTopicsBank.filter((topic) => speakingTopicProgress[topic.id]?.completed).length
  const completedGrammarTopics = contentLibrary.grammarTopics.filter((topic) => topic.completed).length
  const businessPhraseSummary = getBusinessPhraseSummary(defaultBusinessPhrases, businessPhraseProgress)
  const completedBusinessPhrases = businessPhraseSummary.practiced
  const mistakeSummary = getMistakeSummary(mistakes)
  const reviewedCommonMistakes = mistakeSummary.fixedCount
  const weeklyCompletion = calculatePercentage(completedDailyTasks, totalDailyTasks)
  const trackerEntries =
    progress.writingEntries.length + progress.listeningEntries.length + progress.pronunciationEntries.length
  const latestEvaluation = progress.evaluations[0]
  const levelSuggestion = suggestOverallLevel({
    profile,
    evaluations: progress.evaluations,
    evaluationSkills,
    mistakes,
    speakingTopicProgress,
    businessPhraseProgress,
    contentLibrary: { ...contentLibrary, businessPhrases: businessPhrasesBank },
  })
  const skillAverages = calculateSkillAverages(progress.evaluations, evaluationSkills)
  const skillTrends = calculateSkillTrends(progress.evaluations, evaluationSkills)
  const averageEvaluationScore = progress.evaluations.length
    ? getEvaluationAverage(
        latestEvaluation,
        getEvaluationSkillsForEvaluation(latestEvaluation, evaluationSkills, legacyEvaluationSkillIds, normalizeEvaluationSkills),
        normalizeEvaluationSkills,
      )
    : 0
  const weakestSkill = getWeakestSkill(
    latestEvaluation,
    latestEvaluation
      ? getEvaluationSkillsForEvaluation(latestEvaluation, evaluationSkills, legacyEvaluationSkillIds, normalizeEvaluationSkills)
      : evaluationSkills,
    normalizeEvaluationSkills,
  )
  const recommendedFocusArea = latestEvaluation
    ? `${weakestSkill.charAt(0).toUpperCase()}${weakestSkill.slice(1)} practice`
    : 'Grammar accuracy + speaking fluency'
  const smartRecommendation = generateLearningRecommendation({
    profile,
    learningPlan,
    selectedPlanPosition: planPosition,
    todayPlan,
    completedTasks: progress.completedPlanTasks,
    evaluations: progress.evaluations,
    evaluationSkills,
    mistakes,
    speakingTopics: speakingTopicsBank,
    speakingTopicProgress,
    businessPhrases: businessPhrasesBank,
    businessPhraseProgress,
    contentLibrary,
    trackerData: {
      writingEntries,
      listeningEntries,
      pronunciationEntries,
    },
    rubricAssessments,
    feedbackLoops,
    libraryProgress: {
      completedGrammarTopics,
      completedBusinessPhrases,
      completedSpeakingTopics,
    },
  })
  const contentSummary = {
    grammarTopics: contentLibrary.grammarTopics.length,
    speakingTopics: speakingTopicsBank.length,
    businessPhrases: businessPhrasesBank.length,
    pronunciationSentences: contentLibrary.pronunciationSentences.length,
    writingTemplates: contentLibrary.writingTemplates.length,
    commonMistakes: mistakes.length,
  }
  const totalLibraryItems = Object.values(contentSummary).reduce((total, count) => total + count, 0)
  const filteredWritingEntries = filterTrackerEntries(
    writingEntries,
    writingFilters,
    ['title', 'type', 'originalDraft', 'correctedVersion', 'usefulPhrases', 'notes'],
    { type: 'type', status: 'status' },
  )
  const filteredListeningEntries = filterTrackerEntries(
    listeningEntries,
    listeningFilters,
    ['title', 'category', 'accent', 'mainIdea', 'usefulPhrases', 'summary', 'notes'],
    { category: 'category', accent: 'accent', difficulty: 'difficulty', status: 'status' },
  )
  const filteredPronunciationEntries = filterTrackerEntries(
    pronunciationEntries,
    pronunciationFilters,
    ['sentence', 'focusArea', 'notes'],
    { focusArea: 'focusArea', status: 'status' },
  )
  const writingSummary = getTrackerSummary(writingEntries, ['Completed'], 'score')
  const listeningSummary = {
    ...getTrackerSummary(listeningEntries, ['Completed'], 'score'),
    totalMinutes: listeningEntries.reduce((total, entry) => total + Number(entry.durationMinutes || 0), 0),
  }
  const pronunciationSummary = {
    ...getTrackerSummary(pronunciationEntries, ['Completed'], 'clarityScore'),
    averageConfidence: getAverageScore(pronunciationEntries, 'confidenceScore'),
  }
  const teacherNotes = normalizeTeacherNotes(progress.teacherNotes)
  const teacherReportData = buildTeacherReportData({
    profile,
    levelProfile,
    levelSuggestion,
    levelHistory: progress.levelHistory,
    evaluations: progress.evaluations,
    evaluationSkills,
    skillAverages,
    skillTrends,
    latestEvaluation,
    averageEvaluationScore,
    weakestSkill,
    mistakes,
    speakingTopics: speakingTopicsBank,
    speakingTopicProgress,
    writingEntries,
    listeningEntries,
    pronunciationEntries,
    rubricAssessments,
    feedbackLoops,
    planPosition,
    currentMonth,
    currentWeek,
    todayPlan,
    planProgress,
    weeklyCompletion,
    smartRecommendation,
    teacherNotes,
  })

  const analytics = [
    { label: 'Weekly completion', value: `${weeklyCompletion}%`, total: totalDailyTasks, done: completedDailyTasks, icon: '📅' },
    { label: 'Daily tasks', value: completedDailyTasks, total: totalDailyTasks, done: completedDailyTasks, icon: '✅' },
    { label: 'Speaking topics', value: completedSpeakingTopics, total: speakingTopicsBank.length, done: completedSpeakingTopics, icon: '🎙️' },
    { label: 'Grammar topics', value: completedGrammarTopics, total: contentLibrary.grammarTopics.length, done: completedGrammarTopics, icon: '📚' },
    { label: 'Business phrases', value: completedBusinessPhrases, total: businessPhrasesBank.length, done: completedBusinessPhrases, icon: '💼' },
    { label: 'Total business phrases', value: businessPhraseSummary.total, total: Math.max(businessPhraseSummary.total, 1), done: businessPhraseSummary.total, icon: '💼' },
    { label: 'Favorite phrases', value: businessPhraseSummary.favorite, total: Math.max(businessPhraseSummary.total, 1), done: businessPhraseSummary.favorite, icon: '⭐' },
    { label: 'Business phrase practiced %', value: `${businessPhraseSummary.practicedPercentage}%`, total: 100, done: businessPhraseSummary.practicedPercentage, icon: '📈' },
    { label: 'Common mistakes', value: reviewedCommonMistakes, total: mistakes.length, done: reviewedCommonMistakes, icon: '🧩' },
    { label: 'Active mistakes', value: mistakeSummary.activeCount, total: mistakes.length, done: mistakeSummary.activeCount, icon: '🔁' },
    { label: 'Weakest skill', value: latestEvaluation ? weakestSkill : 'Pending', total: 1, done: latestEvaluation ? 1 : 0, icon: '🎯' },
    { label: 'Review focus', value: mistakeSummary.mostCommonCategory, total: 1, done: mistakeSummary.activeCount ? 1 : 0, icon: '🧩' },
    { label: 'Saved evaluations', value: progress.evaluations.length, total: 10, done: Math.min(progress.evaluations.length, 10), icon: '🧾' },
    { label: 'Practice logs', value: trackerEntries, total: 30, done: Math.min(trackerEntries, 30), icon: '🗂️' },
    { label: 'Library items', value: totalLibraryItems, total: Math.max(totalLibraryItems, 1), done: totalLibraryItems, icon: '🗂️' },
    { label: 'Writing completed', value: writingSummary.completed, total: writingSummary.total, done: writingSummary.completed, icon: '✍️' },
    { label: 'Listening minutes', value: listeningSummary.totalMinutes, total: Math.max(listeningSummary.totalMinutes, 1), done: listeningSummary.totalMinutes, icon: '🎧' },
    { label: 'Pronunciation clarity', value: pronunciationSummary.averageScore || 'N/A', total: 5, done: pronunciationSummary.averageScore, icon: '🔊' },
    { label: 'Rubric assessments', value: rubricAssessments.length, total: 10, done: Math.min(rubricAssessments.length, 10), icon: '📋' },
    { label: 'Feedback loops', value: feedbackLoopSummary.active, total: Math.max(feedbackLoops.length, 1), done: feedbackLoopSummary.active, icon: '🔁' },
  ]
  const filteredSpeakingTopics = filterSpeakingTopics(speakingTopicsBank, speakingFilters, speakingTopicProgress)
  const selectedSpeakingTopic = speakingTopicsBank.find((topic) => topic.id === selectedSpeakingTopicId)
  const speakingCategoryOptions = getUniqueOptions(speakingTopicsBank, 'category')
  const speakingDifficultyOptions = getUniqueOptions(speakingTopicsBank, 'difficulty')
  const speakingLevelOptions = getUniqueOptions(speakingTopicsBank, 'level')
  const filteredBusinessPhrases = filterBusinessPhrases(defaultBusinessPhrases, businessPhraseFilters, businessPhraseProgress)
  const selectedBusinessPhrase = businessPhrasesBank.find((phrase) => phrase.id === selectedBusinessPhraseId)
  const businessCategoryOptions = getUniqueOptions(defaultBusinessPhrases, 'category')
  const businessLevelOptions = getUniqueOptions(defaultBusinessPhrases, 'level')
  const businessDifficultyOptions = getUniqueOptions(defaultBusinessPhrases, 'difficulty')
  const filteredMistakes = filterMistakes(mistakes, mistakeFilters)
  const mistakeSkillOptions = getUniqueOptions(mistakes, 'relatedSkill')
  const contentLibraryItems = {
    grammarTopics: contentLibrary.grammarTopics,
    speakingTopics: speakingTopicsBank,
    businessPhrases: businessPhrasesBank,
    pronunciationSentences: contentLibrary.pronunciationSentences,
    writingTemplates: contentLibrary.writingTemplates,
    commonMistakes: mistakes,
  }
  const activeContentItems = contentLibraryItems[contentLibraryTab] || []
  const filteredContentItems = filterContentItems(
    activeContentItems,
    contentLibraryTab,
    contentFilters,
    contentLibraryTab === 'businessPhrases' ? businessPhraseProgress : speakingTopicProgress,
  )
  const editingContentItem = activeContentItems.find((item) => item.id === editingContentItemId)
  const contentCategoryOptions = getUniqueOptions(activeContentItems, 'category')
  const contentLevelOptions = getUniqueOptions(activeContentItems, 'level')
  const contentDifficultyOptions = getUniqueOptions(activeContentItems, 'difficulty')
  const contentStatusOptions =
    contentLibraryTab === 'commonMistakes'
      ? [allFilterValue, ...mistakeStatuses]
      : contentLibraryTab === 'businessPhrases'
        ? [allFilterValue, 'New', 'Practiced', 'Favorite']
        : contentLibraryTab === 'writingTemplates'
          ? [allFilterValue, 'Available']
          : [allFilterValue, 'Completed', 'Not Completed']
  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const updateProgress = (changes) => setProgress((current) => ({ ...current, ...changes }))

  const updateProfile = (field, value) => {
    setProgress((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value },
    }))
  }

  const updateLevelDraft = (field, value) => {
    setLevelDraft((current) => ({ ...current, [field]: value }))
  }

  const acceptSuggestedLevel = () => {
    const oldLevel = profile.currentLevel
    const newLevel = levelSuggestion.suggestedLevel
    const historyEntry = createLevelHistoryEntry({
      oldLevel,
      newLevel,
      source: 'App-suggested',
      reason: levelSuggestion.reason,
      note: 'Accepted app suggested level.',
    })

    setProgress((current) => ({
      ...current,
      profile: {
        ...current.profile,
        currentLevel: newLevel,
      },
      levelProfile: {
        ...normalizeLevelProfile(current.levelProfile, current.profile, levelSummary),
        officialLevel: newLevel,
        targetLevel: current.profile.targetLevel,
        levelSource: 'App-suggested',
        lastUpdatedAt: new Date().toISOString(),
        suggestedLevel: newLevel,
        suggestedLevelConfidence: levelSuggestion.confidence,
        suggestedLevelReason: levelSuggestion.reason,
      },
      levelHistory: [historyEntry, ...(current.levelHistory || [])],
    }))
  }

  const keepCurrentLevel = () => {
    const historyEntry = createLevelHistoryEntry({
      oldLevel: profile.currentLevel,
      newLevel: profile.currentLevel,
      source: levelProfile.levelSource,
      reason: 'Suggested level reviewed but official level was kept.',
      note: levelSuggestion.reason,
    })

    setProgress((current) => ({
      ...current,
      levelHistory: [historyEntry, ...(current.levelHistory || [])],
      levelProfile: {
        ...normalizeLevelProfile(current.levelProfile, current.profile, levelSummary),
        suggestedLevel: levelSuggestion.suggestedLevel,
        suggestedLevelConfidence: levelSuggestion.confidence,
        suggestedLevelReason: levelSuggestion.reason,
        lastUpdatedAt: new Date().toISOString(),
      },
    }))
  }

  const saveManualLevelUpdate = (event) => {
    event.preventDefault()
    const oldLevel = profile.currentLevel
    const newLevel = levelDraft.officialLevel || profile.currentLevel
    const targetLevel = levelDraft.targetLevel || profile.targetLevel
    const teacherNote = levelDraft.teacherNote || levelProfile.teacherNote
    const userNote = levelDraft.userNote || levelProfile.userNote
    const levelSource = levelDraft.levelSource || levelProfile.levelSource
    const historyEntry = createLevelHistoryEntry({
      oldLevel,
      newLevel,
      source: levelSource,
      reason: 'Manual level update.',
      note: [teacherNote, userNote].filter(Boolean).join(' | '),
    })

    setProgress((current) => ({
      ...current,
      profile: {
        ...current.profile,
        currentLevel: newLevel,
        targetLevel,
      },
      levelProfile: {
        ...normalizeLevelProfile(current.levelProfile, current.profile, levelSummary),
        officialLevel: newLevel,
        targetLevel,
        levelSource,
        teacherNote,
        userNote,
        lastUpdatedAt: new Date().toISOString(),
      },
      levelHistory: [historyEntry, ...(current.levelHistory || [])],
    }))
  }

  const deleteLevelHistoryEntry = (entryId) => {
    setProgress((current) => ({
      ...current,
      levelHistory: (current.levelHistory || []).filter((entry) => entry.id !== entryId),
    }))
  }

  const openRubricAssessmentForm = (assessment = null) => {
    const draft = assessment
      ? { ...assessment }
      : {
          ...buildEmptyRubricAssessment(cefrRubrics),
          skillId: selectedRubricSkill.id,
          skillName: selectedRubricSkill.name,
          assessedLevel: selectedRubricLevel,
        }
    setRubricAssessmentDraft(draft)
    setEditingRubricAssessmentId(assessment?.id || '')
    setIsRubricAssessmentFormOpen(true)
  }

  const updateRubricAssessmentDraft = (field, value) => {
    setRubricAssessmentDraft((current) => {
      if (field === 'skillId') {
        const skill = getRubricSkill(value)
        return { ...current, skillId: skill.id, skillName: skill.name, criteriaScores: {} }
      }
      return { ...current, [field]: value }
    })
  }

  const updateRubricCriterionScore = (criterionId, value) => {
    setRubricAssessmentDraft((current) => {
      const criteriaScores = { ...(current.criteriaScores || {}), [criterionId]: Number(value) }
      return { ...current, criteriaScores, overallScore: calculateCriteriaAverage(criteriaScores) || current.overallScore }
    })
  }

  const saveRubricAssessment = (event) => {
    event.preventDefault()
    const now = new Date().toISOString()
    const normalizedAssessment = normalizeRubricAssessment(
      {
        ...rubricAssessmentDraft,
        id: editingRubricAssessmentId || `rubric-assessment-${Date.now()}`,
        createdAt: rubricAssessmentDraft.createdAt || now,
        updatedAt: now,
      },
      0,
      cefrRubrics,
    )

    setProgress((current) => ({
      ...current,
      rubricAssessments: editingRubricAssessmentId
        ? normalizeRubricAssessments(current.rubricAssessments, cefrRubrics).map((assessment) =>
            assessment.id === editingRubricAssessmentId ? normalizedAssessment : assessment,
          )
        : [normalizedAssessment, ...normalizeRubricAssessments(current.rubricAssessments, cefrRubrics)],
    }))
    setIsRubricAssessmentFormOpen(false)
    setEditingRubricAssessmentId('')
    setRubricAssessmentDraft(buildEmptyRubricAssessment(cefrRubrics))
  }

  const deleteRubricAssessment = (assessmentId) => {
    if (!window.confirm('Delete this rubric assessment?')) return
    setProgress((current) => ({
      ...current,
      rubricAssessments: normalizeRubricAssessments(current.rubricAssessments, cefrRubrics).filter((assessment) => assessment.id !== assessmentId),
    }))
  }

  const openFeedbackLoopForm = (loop = null) => {
    setFeedbackLoopDraft(loop ? { ...loop } : buildEmptyFeedbackLoop())
    setEditingFeedbackLoopId(loop?.id || '')
    setIsFeedbackLoopFormOpen(true)
  }

  const openFeedbackLoopFromMistake = (mistake) => {
    setFeedbackLoopDraft({
      ...buildEmptyFeedbackLoop(),
      skill: mistake.relatedSkill || mistake.category || 'Grammar Accuracy',
      relatedPracticeType: 'Mistake',
      relatedPracticeId: mistake.id,
      title: `Correct: ${mistake.wrongSentence}`,
      attemptNotes: mistake.wrongSentence,
      feedbackSource: mistake.source === 'Teacher' ? 'Teacher' : 'Self-review',
      feedbackText: mistake.rule || `Correct this sentence: ${mistake.correctSentence}`,
      correctionPlan: `Practice the corrected pattern using 5 work-related examples: ${mistake.correctSentence}`,
      status: 'Open',
    })
    setEditingFeedbackLoopId('')
    setIsFeedbackLoopFormOpen(true)
    setActiveTab('level')
  }

  const updateFeedbackLoopDraft = (field, value) => {
    setFeedbackLoopDraft((current) => ({ ...current, [field]: value }))
  }

  const saveFeedbackLoop = (event) => {
    event.preventDefault()
    const now = new Date().toISOString()
    const normalizedLoop = normalizeFeedbackLoop({
      ...feedbackLoopDraft,
      id: editingFeedbackLoopId || `feedback-loop-${Date.now()}`,
      createdAt: feedbackLoopDraft.createdAt || now,
      updatedAt: now,
    })

    setProgress((current) => ({
      ...current,
      feedbackLoops: editingFeedbackLoopId
        ? normalizeFeedbackLoops(current.feedbackLoops).map((loop) => (loop.id === editingFeedbackLoopId ? normalizedLoop : loop))
        : [normalizedLoop, ...normalizeFeedbackLoops(current.feedbackLoops)],
    }))
    setIsFeedbackLoopFormOpen(false)
    setEditingFeedbackLoopId('')
    setFeedbackLoopDraft(buildEmptyFeedbackLoop())
  }

  const deleteFeedbackLoop = (loopId) => {
    if (!window.confirm('Delete this feedback loop?')) return
    setProgress((current) => ({
      ...current,
      feedbackLoops: normalizeFeedbackLoops(current.feedbackLoops).filter((loop) => loop.id !== loopId),
    }))
  }

  const updateFeedbackLoopFilter = (field, value) => {
    setFeedbackLoopFilters((current) => ({ ...current, [field]: value }))
  }

  const toggleProfileFocusArea = (focusArea) => {
    setProgress((current) => {
      const focusAreas = current.profile.primaryFocusAreas || []
      const nextFocusAreas = focusAreas.includes(focusArea)
        ? focusAreas.filter((item) => item !== focusArea)
        : [...focusAreas, focusArea]

      return {
        ...current,
        profile: { ...current.profile, primaryFocusAreas: nextFocusAreas },
      }
    })
  }

  const resetProfileToDefault = () => {
    setProgress((current) => ({
      ...current,
      profile: cloneData(defaultProfile),
    }))
  }

  const applyIntensityRecommendations = () => {
    setProgress((current) => {
      const intensity = getPlanIntensityConfig(current.profile, planIntensities)

      return {
        ...current,
        profile: {
          ...current.profile,
          ...intensity.recommendedSettings,
        },
      }
    })
  }

  const togglePlanTask = (task) => {
    setProgress((current) => ({
      ...current,
      completedPlanTasks: {
        ...current.completedPlanTasks,
        [task.id]: !current.completedPlanTasks[task.id],
      },
      completedDailyTasks: task.legacyId
        ? {
            ...current.completedDailyTasks,
            [task.legacyId]: !current.completedPlanTasks[task.id],
          }
        : current.completedDailyTasks,
    }))
  }

  const updateSpeakingTopicProgress = (topicId, changes) => {
    setProgress((current) => {
      const currentTopicProgress = current.speakingTopicProgress?.[topicId] || {}
      const nextTopicProgress = {
        ...currentTopicProgress,
        ...changes,
      }

      if (changes.completed !== undefined) {
        nextTopicProgress.lastPracticedAt = changes.completed ? new Date().toISOString() : currentTopicProgress.lastPracticedAt || ''
      }

      return {
        ...current,
        speakingTopicProgress: {
          ...current.speakingTopicProgress,
          [topicId]: nextTopicProgress,
        },
      }
    })
  }

  const updateBusinessPhraseProgress = (phraseId, changes) => {
    setProgress((current) => {
      const currentPhraseProgress = current.businessPhraseProgress?.[phraseId] || {}
      const nextPhraseProgress = {
        ...currentPhraseProgress,
        ...changes,
      }

      if (changes.practiced !== undefined) {
        nextPhraseProgress.lastPracticedAt = changes.practiced ? new Date().toISOString() : currentPhraseProgress.lastPracticedAt || ''
      }

      return {
        ...current,
        businessPhraseProgress: {
          ...current.businessPhraseProgress,
          [phraseId]: nextPhraseProgress,
        },
      }
    })
  }

  const updateSpeakingFilter = (field, value) => {
    setSpeakingFilters((current) => ({ ...current, [field]: value }))
  }

  const clearSpeakingFilters = () => {
    setSpeakingFilters({
      search: '',
      category: allFilterValue,
      difficulty: allFilterValue,
      level: allFilterValue,
      status: allFilterValue,
      duration: allFilterValue,
    })
    setSelectedSpeakingTopicId('')
  }

  const selectRandomSpeakingTopic = () => {
    const sourceTopics = filteredSpeakingTopics.length ? filteredSpeakingTopics : speakingTopicsBank
    const topic = sourceTopics[Math.floor(Math.random() * sourceTopics.length)]
    if (topic) setSelectedSpeakingTopicId(topic.id)
  }

  const updateBusinessPhraseFilter = (field, value) => {
    setBusinessPhraseFilters((current) => ({ ...current, [field]: value }))
  }

  const clearBusinessPhraseFilters = () => {
    setBusinessPhraseFilters(createContentFilters())
    setSelectedBusinessPhraseId('')
  }

  const selectRandomBusinessPhrase = () => {
    if (!filteredBusinessPhrases.length) {
      setSelectedBusinessPhraseId('')
      return
    }

    const phrase = filteredBusinessPhrases[Math.floor(Math.random() * filteredBusinessPhrases.length)]
    setSelectedBusinessPhraseId(phrase.id)
  }

  const updateMistakeDraft = (field, value) => {
    setMistakeDraft((current) => ({ ...current, [field]: value }))
  }

  const updateMistakeFilter = (field, value) => {
    setMistakeFilters((current) => ({ ...current, [field]: value }))
  }

  const clearMistakeFilters = () => {
    setMistakeFilters({
      search: '',
      category: allFilterValue,
      source: allFilterValue,
      status: allFilterValue,
      relatedSkill: allFilterValue,
    })
  }

  const saveMistake = (event) => {
    event.preventDefault()
    const now = new Date().toISOString()

    if (editingMistakeId) {
      setProgress((current) => ({
        ...current,
        mistakes: current.mistakes.map((mistake) =>
          mistake.id === editingMistakeId
            ? updateMistakeStatusFields(
                normalizeMistake({
                  ...mistake,
                  ...mistakeDraft,
                  id: mistake.id,
                  createdAt: mistake.createdAt,
                  updatedAt: now,
                }),
                mistakeDraft.status,
              )
            : mistake,
        ),
      }))
    } else {
      const mistake = updateMistakeStatusFields(
        normalizeMistake({
          ...mistakeDraft,
          id: `mistake-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        }),
        mistakeDraft.status,
      )

      setProgress((current) => ({
        ...current,
        mistakes: [mistake, ...current.mistakes],
      }))
    }

    setMistakeDraft(createEmptyMistakeDraft())
    setEditingMistakeId('')
  }

  const startEditingMistake = (mistake) => {
    setMistakeDraft({
      wrongSentence: mistake.wrongSentence,
      correctSentence: mistake.correctSentence,
      category: mistake.category,
      rule: mistake.rule,
      source: mistake.source,
      status: mistake.status,
      relatedSkill: mistake.relatedSkill,
      relatedGrammarTopicId: mistake.relatedGrammarTopicId,
      notes: mistake.notes,
    })
    setEditingMistakeId(mistake.id)
  }

  const cancelMistakeEdit = () => {
    setMistakeDraft(createEmptyMistakeDraft())
    setEditingMistakeId('')
  }

  const updateMistake = (mistakeId, changes) => {
    setProgress((current) => ({
      ...current,
      mistakes: current.mistakes.map((mistake) => {
        if (mistake.id !== mistakeId) return mistake
        const nextMistake = { ...mistake, ...changes, updatedAt: new Date().toISOString() }
        return changes.status ? updateMistakeStatusFields(nextMistake, changes.status) : nextMistake
      }),
    }))
  }

  const deleteMistake = (mistakeId) => {
    if (!window.confirm('Delete this mistake? This cannot be undone.')) return

    setProgress((current) => ({
      ...current,
      mistakes: current.mistakes.filter((mistake) => mistake.id !== mistakeId),
    }))

    if (editingMistakeId === mistakeId) cancelMistakeEdit()
  }

  const updateDraft = (field, value) => {
    setProgress((current) => ({
      ...current,
      evaluationDraft: { ...current.evaluationDraft, [field]: value },
    }))
  }

  const updateEvaluationScore = (skillId, value) => {
    setProgress((current) => ({
      ...current,
      evaluationDraft: {
        ...current.evaluationDraft,
        scores: { ...current.evaluationDraft.scores, [skillId]: value },
      },
    }))
  }

  const addEvaluationSkill = () => {
    const id = `skill-${Date.now()}`

    setProgress((current) => ({
      ...current,
      evaluationSkills: [...current.evaluationSkills, { id, name: 'Custom skill', weight: 3 }],
      evaluationDraft: {
        ...current.evaluationDraft,
        scores: { ...current.evaluationDraft.scores, [id]: 3 },
      },
    }))
  }

  const updateEvaluationSkill = (skillId, changes) => {
    setProgress((current) => ({
      ...current,
      evaluationSkills: current.evaluationSkills.map((skill) =>
        skill.id === skillId ? { ...skill, ...changes } : skill,
      ),
    }))
  }

  const deleteEvaluationSkill = (skillId) => {
    setProgress((current) => ({
      ...current,
      evaluationSkills: current.evaluationSkills.filter((skill) => skill.id !== skillId),
    }))
  }

  const updateContentItem = (collectionName, itemId, changes) => {
    if (collectionName === 'businessPhrases') {
      updateBusinessPhraseProgress(itemId, changes)
      return
    }

    setProgress((current) => ({
      ...current,
      contentLibrary: {
        ...current.contentLibrary,
        [collectionName]: current.contentLibrary[collectionName].map((item) =>
          item.id === itemId ? { ...item, ...changes } : item,
        ),
      },
    }))
  }

  const addContentItem = (collectionName) => {
    const id = `${collectionName}-${Date.now()}`
    const templates = {
      grammarTopics: {
        id,
        title: 'New grammar topic',
        level: profile.currentLevel || 'B1+ / B2',
        priority: 'Medium',
        category: 'Grammar',
        explanation: '',
        examples: [],
        workExamples: '',
        practiceTask: '',
        completed: false,
        notes: '',
      },
      speakingTopics: {
        id,
        title: 'New speaking topic',
        category: 'General',
        difficulty: 'Medium',
        duration: '5 min',
        structure: speakingStructure.join(', '),
        usefulPhrases: '',
        completed: false,
      },
      businessPhrases: {
        id,
        phrase: 'New business phrase',
        category: 'General',
        useCase: '',
        exampleUseCase: '',
        level: profile.currentLevel || 'B1+ / B2',
        tags: [],
        practiced: false,
        notes: '',
      },
      pronunciationSentences: {
        id,
        sentence: 'New pronunciation sentence',
        focusArea: 'Clarity',
        repetitionTarget: 10,
        level: profile.currentLevel || 'B1+ / B2',
        completed: false,
        notes: '',
      },
      writingTemplates: {
        id,
        title: 'New writing template',
        type: 'General',
        body: '',
        notes: '',
        level: profile.currentLevel || 'B1+ / B2',
        tags: [],
      },
      commonMistakes: {
        id,
        wrongSentence: '',
        correctSentence: '',
        rule: '',
        status: 'New',
        notes: '',
      },
    }

    setProgress((current) => ({
      ...current,
      contentLibrary: {
        ...current.contentLibrary,
        [collectionName]: [templates[collectionName], ...current.contentLibrary[collectionName]],
      },
    }))
    setEditingContentItemId(id)
  }

  const deleteContentItem = (collectionName, itemId) => {
    if (!window.confirm('Delete this content item? This cannot be undone.')) return

    setProgress((current) => ({
      ...current,
      contentLibrary: {
        ...current.contentLibrary,
        [collectionName]: current.contentLibrary[collectionName].filter((item) => item.id !== itemId),
      },
    }))
    if (editingContentItemId === itemId) setEditingContentItemId('')
  }

  const updateLibraryItem = (type, itemId, changes) => {
    if (type === 'speakingTopics') {
      updateSpeakingTopicProgress(itemId, changes)
      return
    }

    if (type === 'commonMistakes') {
      updateMistake(itemId, changes)
      return
    }

    updateContentItem(type, itemId, changes)
  }

  const deleteLibraryItem = (type, itemId) => {
    if (type === 'commonMistakes') {
      deleteMistake(itemId)
      return
    }

    if (type === 'speakingTopics') return
    deleteContentItem(type, itemId)
  }

  const selectContentTab = (tabId) => {
    setContentLibraryTab(tabId)
    setContentFilters(createContentFilters())
    setEditingContentItemId('')
  }

  const updateContentFilter = (field, value) => {
    setContentFilters((current) => ({ ...current, [field]: value }))
  }

  const clearContentFilters = () => {
    setContentFilters(createContentFilters())
  }

  const resetContentLibraryToDefault = () => {
    setProgress((current) => ({
      ...current,
      contentLibrary: cloneData(defaultContentLibrary),
    }))
  }

  const deleteAllContentLibrary = () => {
    if (!window.confirm('Delete all content library items? This cannot be undone.')) return

    setProgress((current) => ({
      ...current,
      contentLibrary: {
        grammarTopics: [],
        speakingTopics: [],
        businessPhrases: [],
        pronunciationSentences: [],
        writingTemplates: [],
        commonMistakes: [],
      },
    }))
  }

  const updateNestedDraft = (draftName, field, value) => {
    setProgress((current) => ({
      ...current,
      [draftName]: { ...current[draftName], [field]: value },
    }))
  }

  const updateTrackerFilter = (tracker, field, value) => {
    const setters = {
      writing: setWritingFilters,
      listening: setListeningFilters,
      pronunciation: setPronunciationFilters,
    }
    setters[tracker]((current) => ({ ...current, [field]: value }))
  }

  const clearTrackerFilters = (tracker) => {
    const setters = {
      writing: setWritingFilters,
      listening: setListeningFilters,
      pronunciation: setPronunciationFilters,
    }
    setters[tracker](createTrackerFilters())
  }

  const openTrackerForm = (tracker, entry = null) => {
    const nowDate = todayIso()
    if (tracker === 'writing') {
      setEditingWritingId(entry?.id || '')
      setProgress((current) => ({ ...current, writingDraft: entry ? { ...entry } : { ...emptyWritingDraft, date: nowDate } }))
      setIsWritingFormOpen(true)
    }
    if (tracker === 'listening') {
      setEditingListeningId(entry?.id || '')
      setProgress((current) => ({ ...current, listeningDraft: entry ? { ...entry } : { ...emptyListeningDraft, date: nowDate } }))
      setIsListeningFormOpen(true)
    }
    if (tracker === 'pronunciation') {
      setEditingPronunciationId(entry?.id || '')
      setProgress((current) => ({ ...current, pronunciationDraft: entry ? { ...entry } : { ...emptyPronunciationDraft, date: nowDate } }))
      setIsPronunciationFormOpen(true)
    }
  }

  const closeTrackerForm = (tracker) => {
    if (tracker === 'writing') {
      setEditingWritingId('')
      setIsWritingFormOpen(false)
      setProgress((current) => ({ ...current, writingDraft: { ...emptyWritingDraft, date: todayIso() } }))
    }
    if (tracker === 'listening') {
      setEditingListeningId('')
      setIsListeningFormOpen(false)
      setProgress((current) => ({ ...current, listeningDraft: { ...emptyListeningDraft, date: todayIso() } }))
    }
    if (tracker === 'pronunciation') {
      setEditingPronunciationId('')
      setIsPronunciationFormOpen(false)
      setProgress((current) => ({ ...current, pronunciationDraft: { ...emptyPronunciationDraft, date: todayIso() } }))
    }
  }

  const savePracticeEntry = (event, tracker) => {
    event.preventDefault()
    const now = new Date().toISOString()
    const config = {
      writing: {
        draftName: 'writingDraft',
        listName: 'writingEntries',
        editingId: editingWritingId,
        normalize: normalizeWritingEntries,
        close: () => closeTrackerForm('writing'),
      },
      listening: {
        draftName: 'listeningDraft',
        listName: 'listeningEntries',
        editingId: editingListeningId,
        normalize: normalizeListeningEntries,
        close: () => closeTrackerForm('listening'),
      },
      pronunciation: {
        draftName: 'pronunciationDraft',
        listName: 'pronunciationEntries',
        editingId: editingPronunciationId,
        normalize: normalizePronunciationEntries,
        close: () => closeTrackerForm('pronunciation'),
      },
    }[tracker]
    const draft = progress[config.draftName]
    const entry = config.normalize([{ ...draft, id: config.editingId || `${config.listName}-${Date.now()}`, createdAt: draft.createdAt || now, updatedAt: now }])[0]

    setProgress((current) => ({
      ...current,
      [config.listName]: config.editingId
        ? current[config.listName].map((item) => (item.id === config.editingId ? entry : item))
        : [entry, ...current[config.listName]],
    }))
    config.close()
  }

  const deletePracticeEntry = (tracker, entryId) => {
    if (!window.confirm('Delete this practice entry? This cannot be undone.')) return
    const listName = {
      writing: 'writingEntries',
      listening: 'listeningEntries',
      pronunciation: 'pronunciationEntries',
    }[tracker]
    setProgress((current) => ({
      ...current,
      [listName]: current[listName].filter((entry) => entry.id !== entryId),
    }))
  }

  const saveTrackerEntry = (event, draftName, listName, emptyDraft) => {
    event.preventDefault()
    const draft = progress[draftName]
    const entry = {
      ...draft,
      id: `${listName}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    setProgress((current) => ({
      ...current,
      [listName]: [entry, ...current[listName]],
      [draftName]: { ...emptyDraft, date: todayIso() },
    }))
  }

  const deleteTrackerEntry = (listName, entryId) => {
    setProgress((current) => ({
      ...current,
      [listName]: current[listName].filter((entry) => entry.id !== entryId),
    }))
  }

  const saveEvaluation = (event) => {
    event.preventDefault()
    const evaluationDraft = normalizeEvaluationDraft(progress.evaluationDraft, evaluationSkills, emptyEvaluation)
    const evaluation = {
      ...evaluationDraft,
      skills: evaluationSkills,
      id: `evaluation-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    setProgress((current) => ({
      ...current,
      evaluations: [evaluation, ...current.evaluations],
      evaluationDraft: normalizeEvaluationDraft({ ...emptyEvaluation, date: todayIso() }, current.evaluationSkills, emptyEvaluation),
    }))
  }

  const deleteEvaluation = (evaluationId) => {
    setProgress((current) => ({
      ...current,
      evaluations: current.evaluations.filter((evaluation) => evaluation.id !== evaluationId),
    }))
  }

  const resetWeeklyProgress = () => {
    setProgress((current) => ({
      ...current,
      completedDailyTasks: {},
      completedPlanTasks: {},
      completedSpeakingTopics: {},
      completedGrammarTopics: {},
      completedBusinessPhrases: {},
      reviewedCommonMistakes: {},
    }))
  }

  const updateDailyPlanDay = (dayName, changes) => {
    setProgress((current) => ({
      ...current,
      learningPlan: updateLearningPlanDay(
        current.learningPlan,
        { monthNumber: current.selectedMonth || 1, weekNumber: current.selectedWeek || 1, dayName },
        (day) => ({ ...day, ...changes }),
      ),
    }))
  }

  const updateDailyPlanTask = (dayName, taskId, text) => {
    setProgress((current) => ({
      ...current,
      learningPlan: updateLearningPlanDay(
        current.learningPlan,
        { monthNumber: current.selectedMonth || 1, weekNumber: current.selectedWeek || 1, dayName },
        (day) => ({
          ...day,
          tasks: day.tasks.map((task) => (task.id === taskId ? { ...task, text } : task)),
        }),
      ),
    }))
  }

  const addDailyPlanTask = (dayName) => {
    setProgress((current) => ({
      ...current,
      learningPlan: updateLearningPlanDay(
        current.learningPlan,
        { monthNumber: current.selectedMonth || 1, weekNumber: current.selectedWeek || 1, dayName },
        (day) => ({
          ...day,
          tasks: [
            ...day.tasks,
            {
              id: `m${current.selectedMonth || 1}-w${current.selectedWeek || 1}-${dayName.toLowerCase()}-task-${Date.now()}`,
              text: 'New practice task',
              skill: 'Practice',
              estimatedMinutes: 15,
            },
          ],
        }),
      ),
    }))
  }

  const deleteDailyPlanTask = (dayName, taskId) => {
    setProgress((current) => ({
      ...current,
      learningPlan: updateLearningPlanDay(
        current.learningPlan,
        { monthNumber: current.selectedMonth || 1, weekNumber: current.selectedWeek || 1, dayName },
        (day) => ({ ...day, tasks: day.tasks.filter((task) => task.id !== taskId) }),
      ),
    }))
  }

  const updateDailyPlanTopic = (dayName, topicId, text) => {
    setProgress((current) => ({
      ...current,
      learningPlan: updateLearningPlanDay(
        current.learningPlan,
        { monthNumber: current.selectedMonth || 1, weekNumber: current.selectedWeek || 1, dayName },
        (day) => ({
          ...day,
          speakingTopics: day.speakingTopics.map((topic) =>
            topic.id === topicId ? { ...topic, text } : topic,
          ),
        }),
      ),
    }))
  }

  const addDailyPlanTopic = (dayName) => {
    setProgress((current) => ({
      ...current,
      learningPlan: updateLearningPlanDay(
        current.learningPlan,
        { monthNumber: current.selectedMonth || 1, weekNumber: current.selectedWeek || 1, dayName },
        (day) => ({
          ...day,
          speakingTopics: [
            ...day.speakingTopics,
            {
              id: `m${current.selectedMonth || 1}-w${current.selectedWeek || 1}-${dayName.toLowerCase()}-topic-${Date.now()}`,
              text: 'New speaking topic',
            },
          ],
        }),
      ),
    }))
  }

  const deleteDailyPlanTopic = (dayName, topicId) => {
    setProgress((current) => ({
      ...current,
      learningPlan: updateLearningPlanDay(
        current.learningPlan,
        { monthNumber: current.selectedMonth || 1, weekNumber: current.selectedWeek || 1, dayName },
        (day) => ({ ...day, speakingTopics: day.speakingTopics.filter((topic) => topic.id !== topicId) }),
      ),
    }))
  }

  const resetDailyPlanToDefault = () => {
    setProgress((current) => ({
      ...current,
      dailyPlan: cloneData(defaultDailyPlan),
      learningPlan: normalizeLearningPlan(null, current.profile, defaultDailyPlan),
      selectedMonth: 1,
      selectedWeek: 1,
      selectedDay: defaultDailyPlan.some((day) => day.day === current.selectedDay) ? current.selectedDay : defaultDailyPlan[0].day,
    }))
    setIsEditingDailyPlan(false)
  }

  const clearAllData = () => {
    if (!window.confirm('Clear all saved Professional English Growth Hub data?')) return
    removeFromLocalStorage(STORAGE_KEY)
    setProgress(createDefaultProgress())
    setImportMessage('All saved data was cleared.')
  }

  const exportData = () => {
    const data = JSON.stringify(createBackupPayload(progress), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `professional-english-growth-hub-backup-${todayIso()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setCopyMessage('Backup JSON file exported.')
  }

  const copyBackupJson = async () => {
    const data = JSON.stringify(createBackupPayload(progress), null, 2)

    try {
      await navigator.clipboard.writeText(data)
      setCopyMessage('Backup JSON copied to clipboard.')
    } catch {
      setCopyMessage('Clipboard copy failed. You can use Export to JSON file instead.')
    }
  }

  const applyImportedBackup = (jsonText) => {
    const result = parseAndNormalizeBackup(jsonText, defaultProgress, {
      emptyEvaluation,
      emptyWritingDraft,
      emptyListeningDraft,
      emptyPronunciationDraft,
      emptyNoteDraft,
      todayIso,
    })
    if (result.error) {
      setImportMessage(result.error)
      return
    }

    if (!window.confirm('Importing this backup will replace your current saved data. Continue?')) {
      setImportMessage('Import cancelled. Current data was not changed.')
      return
    }

    setProgress(result.progress)
    setImportText('')
    setImportMessage(`Backup imported successfully. App version: ${result.imported.appVersion || 'legacy'}.`)
  }

  const importData = () => {
    applyImportedBackup(importText)
  }

  const importFromJsonFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      applyImportedBackup(String(reader.result || ''))
      event.target.value = ''
    }
    reader.onerror = () => {
      setImportMessage('Import failed. The selected file could not be read.')
      event.target.value = ''
    }
    reader.readAsText(file)
  }

  const restoreDefaultData = () => {
    if (!window.confirm('Restore default data? This will replace your current saved configuration and progress.')) return
    removeFromLocalStorage(STORAGE_KEY)
    setProgress(createDefaultProgress())
    setImportText('')
    setImportMessage('Default data restored.')
  }

  const updateTeacherNotes = (field, value) => {
    setProgress((current) => ({
      ...current,
      teacherNotes: {
        ...normalizeTeacherNotes(current.teacherNotes),
        [field]: value,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const copyTeacherReport = async () => {
    const reportText = formatTeacherReportText(teacherReportData)
    setTeacherReportFallbackText('')

    try {
      await navigator.clipboard.writeText(reportText)
      setTeacherCopyMessage('Teacher report copied to clipboard.')
    } catch {
      setTeacherReportFallbackText(reportText)
      setTeacherCopyMessage('Clipboard is not available. You can copy the report text below.')
    }
  }

  const printTeacherReport = () => {
    window.print()
  }

  const navigationGroups = [
    {
      label: 'Dashboard',
      items: [{ id: 'overview', label: 'Overview', icon: '🏠' }],
    },
    {
      label: 'Learning Plan',
      items: [
        { id: 'daily', label: 'Daily Plan', icon: '📅' },
        { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
        { id: 'analytics', label: 'Analytics', icon: '📊' },
      ],
    },
    {
      label: 'Practice',
      items: [
        { id: 'speaking', label: 'Speaking Topics', icon: '🎙️' },
        { id: 'writing', label: 'Writing', icon: '✍️' },
        { id: 'listening', label: 'Listening', icon: '🎧' },
        { id: 'pronunciation', label: 'Pronunciation', icon: '🔊' },
        { id: 'grammar', label: 'Grammar', icon: '📚' },
        { id: 'phrases', label: 'Business Phrases', icon: '💼' },
        { id: 'notes', label: 'Notes', icon: '📝' },
      ],
    },
    {
      label: 'Assessment',
      items: [
        { id: 'level', label: 'Level & Assessment', icon: '🧭' },
        { id: 'mistakes', label: 'Mistakes', icon: '🧩' },
        { id: 'evaluation', label: 'Evaluation', icon: '🧾' },
        { id: 'teacher', label: 'Teacher Mode', icon: '👩‍🏫' },
      ],
    },
    {
      label: 'Library',
      items: [{ id: 'content', label: 'Content Library', icon: '🗂️' }],
    },
    {
      label: 'Settings',
      items: [
        { id: 'settings', label: 'Profile Settings', icon: '⚙️' },
        { id: 'data', label: 'Data', icon: '💾' },
      ],
    },
  ]
  const activeSection =
    navigationGroups.flatMap((group) => group.items).find((item) => item.id === activeTab) || navigationGroups[0].items[0]
  const handleNavigation = (id) => {
    setActiveTab(id)
    setIsMobileNavOpen(false)
  }

  const navigationMarkup = (
    <div className="space-y-5">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">
            {group.label}
          </p>
          <div className="mt-2 space-y-1">
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item.id)}
                className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition ${
                  activeTab === item.id
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="text-base" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[96rem] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200 bg-[#f5f7fb]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Version {APP_VERSION}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Professional English Growth Hub
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  A configurable English learning platform for structured progress.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen((current) => !current)}
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
              >
                Menu
              </button>
            </div>
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-4 lg:min-w-[32rem]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Learner</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-950">{profile.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Current</p>
                <p className="mt-1 text-sm font-bold text-slate-950">{profile.currentLevel}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Target</p>
                <p className="mt-1 text-sm font-bold text-slate-950">{profile.targetLevel}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Intensity</p>
                <p className="mt-1 text-sm font-bold text-teal-800">{profile.planIntensity}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              {navigationMarkup}
            </nav>
          </aside>

          {isMobileNavOpen && (
            <nav className="rounded-lg border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:hidden">
              {navigationMarkup}
            </nav>
          )}

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  {activeSection.label}
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  {activeSection.label}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-800">
                  {weeklyCompletion}% weekly progress
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700">
                  {selectedIntensity.dailyStudyLabel}
                </span>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                  <div className="space-y-6">
                    <Card title="Today’s Smart Recommendation" subtitle="What should I do today?" icon="🧠">
                      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                              {smartRecommendation.priority} priority
                            </span>
                            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                              {smartRecommendation.type}
                            </span>
                          </div>
                          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{smartRecommendation.title}</h3>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-bold text-slate-950">Reason</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{smartRecommendation.reason}</p>
                            </div>
                            <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
                              <p className="text-sm font-bold text-teal-900">Suggested action</p>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{smartRecommendation.suggestedAction}</p>
                            </div>
                          </div>
                          {smartRecommendation.evidence?.length > 0 && (
                            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                              <p className="text-sm font-bold text-slate-950">Evidence</p>
                              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                                {smartRecommendation.evidence.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="rounded-lg bg-slate-950 p-4 text-white lg:min-w-48">
                          <p className="text-sm font-semibold text-slate-300">Estimated time</p>
                          <p className="mt-2 text-3xl font-bold">{smartRecommendation.estimatedMinutes} min</p>
                          <button
                            type="button"
                            onClick={() => handleNavigation(getRecommendationTargetTab(smartRecommendation.targetSection))}
                            className="mt-4 min-h-10 w-full rounded-lg bg-white px-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                          >
                            Open {smartRecommendation.targetSection}
                          </button>
                        </div>
                      </div>
                    </Card>

                    <Card title="Quick actions" subtitle="Jump into the next useful workflow" icon="⚡">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                          ['daily', 'Start Today Plan', '📅'],
                          ['speaking', 'Practice Speaking', '🎙️'],
                          ['evaluation', 'Add Evaluation', '🧾'],
                          ['mistakes', 'Review Mistakes', '🧩'],
                          ['content', 'Open Content Library', '🗂️'],
                        ].map(([id, label, icon]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleNavigation(id)}
                            className="min-h-24 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                          >
                            <span className="text-2xl" aria-hidden="true">{icon}</span>
                            <span className="mt-3 block text-sm font-bold text-slate-950">{label}</span>
                          </button>
                        ))}
                      </div>
                    </Card>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricCard label="Current Month" value={`Month ${currentMonth.monthNumber}`} detail={currentMonth.theme} icon="🗓️" />
                      <MetricCard label="Current Week" value={`Week ${currentWeek.weekNumber}`} detail={currentWeek.focus} icon="📌" />
                      <MetricCard label="Today’s Focus" value={selectedPlan.day} detail={selectedPlan.focus} icon="🎯" />
                      <MetricCard label="Today’s Completion" value={`${todayProgress.percentage}%`} detail={`${todayProgress.completed}/${todayProgress.total} tasks complete`} icon="📈" />
                      <MetricCard label="Plan Progress" value={`${planProgress.percentage}%`} detail={`${planProgress.completed}/${planProgress.total} plan tasks`} icon="✅" />
                      <MetricCard label="Latest Evaluation" value={latestEvaluation ? `${averageEvaluationScore}/5` : 'Not saved'} detail={latestEvaluation ? latestEvaluation.date : 'Add your first review'} icon="🧾" />
                      <MetricCard label="Weakest Skill" value={latestEvaluation ? weakestSkill : 'Pending'} detail={recommendedFocusArea} icon="🔎" />
                      <MetricCard label="Current Level" value={profile.currentLevel} detail="Overall English level" icon="🧭" />
                      <MetricCard label="Suggested Level" value={levelSuggestion.suggestedLevel} detail={`${levelSuggestion.confidence} confidence`} icon="📌" />
                      <MetricCard label="Target Level" value={profile.targetLevel} detail={profile.mainGoal} icon="🚀" />
                      <MetricCard label="Plan Intensity" value={profile.planIntensity} detail={selectedIntensity.focus} icon="⚡" />
                      <MetricCard label="Review Focus" value={mistakeSummary.mostCommonCategory} detail={`${mistakeSummary.activeCount} active mistakes`} icon="🧩" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card title="Profile Summary" subtitle="Learner configuration" icon="👤">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-500">Learner</p>
                          <p className="mt-1 text-2xl font-bold text-slate-950">{profile.name}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Level path</p>
                            <p className="mt-2 text-lg font-bold text-slate-950">
                              {profile.currentLevel} → {profile.targetLevel}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Plan</p>
                            <p className="mt-2 text-sm font-bold text-slate-950">
                              Month {currentMonth.monthNumber} · Week {currentWeek.weekNumber}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">{currentMonth.theme}</p>
                          </div>
                        </div>
                        {selectedIntensity.warning && (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                            {selectedIntensity.warning}
                          </p>
                        )}
                        {levelSuggestion.suggestedLevel !== profile.currentLevel && (
                          <button
                            type="button"
                            onClick={() => handleNavigation('level')}
                            className="w-full rounded-lg border border-teal-200 bg-teal-50 p-3 text-left text-sm font-bold text-teal-900 transition hover:bg-teal-100"
                          >
                            Suggested level review available: {levelSuggestion.suggestedLevel}
                          </button>
                        )}
                      </div>
                    </Card>

                    <Card title="Today’s Plan" subtitle={selectedPlan.focus} icon="📅">
                      <select
                        value={planPosition.dayName}
                        onChange={(event) => updateProgress({ selectedDay: event.target.value })}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                      >
                        {dailyPlan.map((day) => (
                          <option key={day.day}>{day.day}</option>
                        ))}
                      </select>
                      <div className="mt-4 space-y-3">
                        {selectedPlan.tasks.slice(0, 4).map((task) => (
                          <label key={task.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!progress.completedPlanTasks[task.id]}
                              onChange={() => togglePlanTask(task)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                            />
                            <span>{task.text}</span>
                          </label>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
        {activeTab === 'level' && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card title="Level & Assessment" subtitle="Official level vs evidence-based suggestion" icon="🧭">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard label="Official Level" value={profile.currentLevel} detail={`Source: ${levelProfile.levelSource}`} icon="✅" />
                  <MetricCard label="Suggested Level" value={levelSuggestion.suggestedLevel} detail={`${levelSuggestion.confidence} confidence`} icon="📌" />
                  <MetricCard label="Target Level" value={profile.targetLevel} detail="Long-term goal" icon="🚀" />
                </div>
                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-950">Suggestion reason</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{levelSuggestion.reason}</p>
                  <ul className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                    {levelSuggestion.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={acceptSuggestedLevel} className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800">
                    Accept Suggested Level
                  </button>
                  <button type="button" onClick={keepCurrentLevel} className="min-h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                    Keep Current Level
                  </button>
                </div>
              </Card>

              <Card title="Manual Level Update" subtitle="Learner or teacher confirmation" icon="✍️">
                <form onSubmit={saveManualLevelUpdate} className="space-y-4">
                  <SelectInput label="Official level" value={levelDraft.officialLevel || levelProfile.officialLevel} onChange={(value) => updateLevelDraft('officialLevel', value)} options={currentLevelOptions} />
                  <SelectInput label="Target level" value={levelDraft.targetLevel || levelProfile.targetLevel} onChange={(value) => updateLevelDraft('targetLevel', value)} options={targetLevelOptions} />
                  <SelectInput label="Level source" value={levelDraft.levelSource || levelProfile.levelSource} onChange={(value) => updateLevelDraft('levelSource', value)} options={levelSourceOptions} />
                  <TextArea label="Teacher / coach note" value={levelDraft.teacherNote || levelProfile.teacherNote} onChange={(value) => updateLevelDraft('teacherNote', value)} />
                  <TextArea label="User note" value={levelDraft.userNote || levelProfile.userNote} onChange={(value) => updateLevelDraft('userNote', value)} />
                  <button type="submit" className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800">
                    Save level update
                  </button>
                </form>
              </Card>
            </div>

            <Card title="Skill-Level Evidence" subtitle="Scores, averages, trends, and notes" icon="📊">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      <th className="px-3 py-2">Skill</th>
                      <th className="px-3 py-2">Current skill level</th>
                      <th className="px-3 py-2">Latest score</th>
                      <th className="px-3 py-2">Average</th>
                      <th className="px-3 py-2">Trend</th>
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationSkills.map((skill) => {
                      const skillKey = skill.id
                      const configuredLevel = levelProfile.skillLevels[skillKey] || levelProfile.skillLevels[skill.name?.toLowerCase()] || 'Not assessed yet'
                      const latestScore = latestEvaluation ? getEvaluationScore(latestEvaluation, skill.id) : 0
                      return (
                        <tr key={skill.id} className="rounded-lg bg-slate-50">
                          <td className="rounded-l-lg px-3 py-3 font-bold text-slate-950">{skill.name}</td>
                          <td className="px-3 py-3 text-slate-600">{configuredLevel}</td>
                          <td className="px-3 py-3 text-slate-600">{latestScore ? `${latestScore}/5` : 'Not assessed yet'}</td>
                          <td className="px-3 py-3 text-slate-600">{skillAverages[skill.id] ? `${skillAverages[skill.id]}/5` : 'Not assessed yet'}</td>
                          <td className="px-3 py-3 text-slate-600">{skillTrends[skill.id]}</td>
                          <td className="rounded-r-lg px-3 py-3 text-slate-600">
                            {levelSummary.find((item) => item.skill.toLowerCase() === skill.name.toLowerCase())?.note || 'No notes yet.'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="CEFR Rubrics" subtitle="Learning guidance, not official certification" icon="📋">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                These descriptors are for learning guidance and teacher-supported review. They are not an official CEFR certification.
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <SelectInput
                  label="Skill"
                  value={selectedRubricSkillId}
                  onChange={(value) => setSelectedRubricSkillId(value)}
                  options={cefrRubrics.skills.map((skill) => ({ label: skill.name, value: skill.id }))}
                />
                <SelectInput
                  label="Level"
                  value={selectedRubricLevel}
                  onChange={(value) => setSelectedRubricLevel(value)}
                  options={cefrRubrics.levels}
                />
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-bold text-slate-950">{selectedRubricSkill.name} can-do statements</h3>
                  <div className="mt-3 space-y-2">
                    {selectedRubricCanDoStatements.length === 0 && <p className="text-sm text-slate-500">No can-do statements saved for this level yet.</p>}
                    {selectedRubricCanDoStatements.map((item) => (
                      <p key={item.statement} className="rounded-lg border border-slate-100 bg-white p-3 text-sm leading-6 text-slate-600">{item.statement}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-bold text-slate-950">Assessment questions</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    {(selectedRubricSkill.assessmentQuestions || []).slice(0, 6).map((question) => <li key={question}>• {question}</li>)}
                  </ul>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {(selectedRubricSkill.rubricCriteria || []).map((criterion) => (
                  <article key={criterion.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-950">{criterion.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{getRubricDescriptor(criterion, selectedRubricLevel)}</p>
                  </article>
                ))}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
                  <h3 className="font-bold text-teal-950">Teacher feedback prompts</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {(selectedRubricSkill.teacherFeedbackPrompts || []).slice(0, 5).map((prompt) => <li key={prompt}>• {prompt}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-bold text-slate-950">Practice evidence examples</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedRubricSkill.practiceEvidenceExamples || []).slice(0, 8).map((example) => (
                      <span key={example} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{example}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1fr]">
              <Card title="Rubric Assessment" subtitle="Evaluate practice quality" icon="🧾">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Assessments" value={rubricSummary.total} detail="Rubric records" icon="📋" />
                  <MetricCard label="Average Score" value={rubricSummary.averageScore || 'N/A'} detail="Rubric /5" icon="⭐" />
                  <MetricCard label="Weakest Rubric Skill" value={rubricSummary.weakestSkill} detail={`Strongest: ${rubricSummary.strongestSkill}`} icon="🎯" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => openRubricAssessmentForm()} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800">
                    Add rubric assessment
                  </button>
                  {isRubricAssessmentFormOpen && (
                    <button type="button" onClick={() => setIsRubricAssessmentFormOpen(false)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
                      Close form
                    </button>
                  )}
                </div>
                {isRubricAssessmentFormOpen && (
                  <form onSubmit={saveRubricAssessment} className="mt-5 space-y-5 rounded-lg border border-teal-100 bg-teal-50 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Date" type="date" value={rubricAssessmentDraft.date} onChange={(value) => updateRubricAssessmentDraft('date', value)} />
                      <SelectInput label="Skill" value={rubricAssessmentDraft.skillId} onChange={(value) => updateRubricAssessmentDraft('skillId', value)} options={cefrRubrics.skills.map((skill) => ({ label: skill.name, value: skill.id }))} />
                      <SelectInput label="Level assessed" value={rubricAssessmentDraft.assessedLevel} onChange={(value) => updateRubricAssessmentDraft('assessedLevel', value)} options={cefrRubrics.levels} />
                      <TextInput label="Practice type" value={rubricAssessmentDraft.practiceType} onChange={(value) => updateRubricAssessmentDraft('practiceType', value)} placeholder="Speaking topic, writing entry, teacher review..." />
                      <TextInput label="Related practice entry" value={rubricAssessmentDraft.relatedEntryId} onChange={(value) => updateRubricAssessmentDraft('relatedEntryId', value)} placeholder="Optional ID or title" />
                      <ScoreInput label="Overall score /5" value={rubricAssessmentDraft.overallScore} onChange={(value) => updateRubricAssessmentDraft('overallScore', value)} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {(getRubricSkill(rubricAssessmentDraft.skillId).rubricCriteria || []).map((criterion) => (
                        <SelectInput
                          key={criterion.id}
                          label={criterion.name}
                          value={String(rubricAssessmentDraft.criteriaScores?.[criterion.id] || 3)}
                          onChange={(value) => updateRubricCriterionScore(criterion.id, value)}
                          options={rubricScoreOptions.map((option) => ({ label: option.label, value: String(option.value) }))}
                        />
                      ))}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextArea label="Evidence notes" value={rubricAssessmentDraft.evidenceNotes} onChange={(value) => updateRubricAssessmentDraft('evidenceNotes', value)} />
                      <TextArea label="Teacher feedback" value={rubricAssessmentDraft.teacherFeedback} onChange={(value) => updateRubricAssessmentDraft('teacherFeedback', value)} />
                      <TextArea label="Learner reflection" value={rubricAssessmentDraft.learnerReflection} onChange={(value) => updateRubricAssessmentDraft('learnerReflection', value)} />
                      <TextArea label="Next action" value={rubricAssessmentDraft.nextAction} onChange={(value) => updateRubricAssessmentDraft('nextAction', value)} />
                    </div>
                    <button type="submit" className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white">
                      {editingRubricAssessmentId ? 'Save rubric assessment' : 'Add rubric assessment'}
                    </button>
                  </form>
                )}
                <div className="mt-5 space-y-3">
                  {rubricAssessments.length === 0 && <EmptyState title="No rubric assessments yet.">Add a CEFR-style rubric assessment after a speaking, writing, listening, or pronunciation practice attempt.</EmptyState>}
                  {rubricAssessments.slice(0, 5).map((assessment) => (
                    <article key={assessment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-slate-950">{assessment.skillName} · {assessment.assessedLevel}</p>
                          <p className="mt-1 text-sm text-slate-500">{assessment.date} · Overall {assessment.overallScore}/5 ({getRubricScoreLabel(assessment.overallScore)})</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => openRubricAssessmentForm(assessment)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">Edit</button>
                          <button type="button" onClick={() => deleteRubricAssessment(assessment.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Delete</button>
                        </div>
                      </div>
                      {assessment.nextAction && <p className="mt-3 text-sm leading-6 text-slate-600"><strong>Next action:</strong> {assessment.nextAction}</p>}
                    </article>
                  ))}
                </div>
              </Card>

              <Card title="Feedback Loops" subtitle="Attempt → feedback → correction → repeat" icon="🔁">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Active Loops" value={feedbackLoopSummary.active} detail={`${feedbackLoopSummary.total} total`} icon="🔁" />
                  <MetricCard label="Improved" value={feedbackLoopSummary.improved} detail="Evidence saved" icon="✅" />
                  <MetricCard label="Closed" value={feedbackLoopSummary.closed} detail="Completed loops" icon="📌" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => openFeedbackLoopForm()} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800">
                    Add feedback loop
                  </button>
                  {isFeedbackLoopFormOpen && (
                    <button type="button" onClick={() => setIsFeedbackLoopFormOpen(false)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
                      Close form
                    </button>
                  )}
                </div>
                {isFeedbackLoopFormOpen && (
                  <form onSubmit={saveFeedbackLoop} className="mt-5 space-y-5 rounded-lg border border-teal-100 bg-teal-50 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Title" value={feedbackLoopDraft.title} onChange={(value) => updateFeedbackLoopDraft('title', value)} />
                      <SelectInput label="Skill" value={feedbackLoopDraft.skill} onChange={(value) => updateFeedbackLoopDraft('skill', value)} options={cefrRubrics.skills.map((skill) => skill.name)} />
                      <SelectInput label="Related practice type" value={feedbackLoopDraft.relatedPracticeType} onChange={(value) => updateFeedbackLoopDraft('relatedPracticeType', value)} options={relatedPracticeTypes} />
                      <TextInput label="Related practice ID or title" value={feedbackLoopDraft.relatedPracticeId} onChange={(value) => updateFeedbackLoopDraft('relatedPracticeId', value)} />
                      <TextInput label="Attempt number" type="number" min="1" value={feedbackLoopDraft.attemptNumber} onChange={(value) => updateFeedbackLoopDraft('attemptNumber', value)} />
                      <SelectInput label="Feedback source" value={feedbackLoopDraft.feedbackSource} onChange={(value) => updateFeedbackLoopDraft('feedbackSource', value)} options={feedbackSources} />
                      <SelectInput label="Status" value={feedbackLoopDraft.status} onChange={(value) => updateFeedbackLoopDraft('status', value)} options={feedbackLoopStatuses} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextArea label="Attempt notes" value={feedbackLoopDraft.attemptNotes} onChange={(value) => updateFeedbackLoopDraft('attemptNotes', value)} />
                      <TextArea label="Feedback" value={feedbackLoopDraft.feedbackText} onChange={(value) => updateFeedbackLoopDraft('feedbackText', value)} />
                      <TextArea label="Correction plan" value={feedbackLoopDraft.correctionPlan} onChange={(value) => updateFeedbackLoopDraft('correctionPlan', value)} />
                      <TextArea label="Repeated attempt notes" value={feedbackLoopDraft.repeatedAttemptNotes} onChange={(value) => updateFeedbackLoopDraft('repeatedAttemptNotes', value)} />
                      <div className="md:col-span-2">
                        <TextArea label="Improvement evidence" value={feedbackLoopDraft.improvementEvidence} onChange={(value) => updateFeedbackLoopDraft('improvementEvidence', value)} />
                      </div>
                    </div>
                    <button type="submit" className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white">
                      {editingFeedbackLoopId ? 'Save feedback loop' : 'Add feedback loop'}
                    </button>
                  </form>
                )}
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(4,0.8fr)]">
                  <TextInput label="Search loops" value={feedbackLoopFilters.search} onChange={(value) => updateFeedbackLoopFilter('search', value)} />
                  <SelectInput label="Skill" value={feedbackLoopFilters.skill} onChange={(value) => updateFeedbackLoopFilter('skill', value)} options={[allFilterValue, ...cefrRubrics.skills.map((skill) => skill.name)]} />
                  <SelectInput label="Status" value={feedbackLoopFilters.status} onChange={(value) => updateFeedbackLoopFilter('status', value)} options={[allFilterValue, ...feedbackLoopStatuses]} />
                  <SelectInput label="Source" value={feedbackLoopFilters.feedbackSource} onChange={(value) => updateFeedbackLoopFilter('feedbackSource', value)} options={[allFilterValue, ...feedbackSources]} />
                  <SelectInput label="Type" value={feedbackLoopFilters.relatedPracticeType} onChange={(value) => updateFeedbackLoopFilter('relatedPracticeType', value)} options={[allFilterValue, ...relatedPracticeTypes]} />
                </div>
                <div className="mt-5 space-y-3">
                  {filteredFeedbackLoops.length === 0 && <EmptyState title="No feedback loops found.">Add a loop when feedback needs correction, repetition, and improvement evidence.</EmptyState>}
                  {filteredFeedbackLoops.map((loop) => (
                    <article key={loop.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-slate-950">{loop.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{loop.skill} · {loop.relatedPracticeType} · Attempt {loop.attemptNumber} · {loop.status}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => openFeedbackLoopForm(loop)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">Edit</button>
                          <button type="button" onClick={() => deleteFeedbackLoop(loop.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Delete</button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
                        {loop.feedbackText && <p><strong>Feedback:</strong> {loop.feedbackText}</p>}
                        {loop.correctionPlan && <p><strong>Correction plan:</strong> {loop.correctionPlan}</p>}
                        {loop.improvementEvidence && <p><strong>Improvement evidence:</strong> {loop.improvementEvidence}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1fr]">
              <Card title="Assessment Evidence" subtitle="Signals used for suggestion" icon="🔎">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Latest Evaluation" value={latestEvaluation ? `${averageEvaluationScore}/5` : 'None'} detail={latestEvaluation?.date || 'No score yet'} icon="🧾" />
                  <MetricCard label="Weakest Skill" value={latestEvaluation ? weakestSkill : 'Pending'} detail={recommendedFocusArea} icon="🎯" />
                  <MetricCard label="Active Mistakes" value={mistakeSummary.activeCount} detail={mistakeSummary.mostCommonCategory} icon="🧩" />
                  <MetricCard label="Fixed Mistakes" value={mistakeSummary.fixedCount} detail="Evidence of correction" icon="✅" />
                  <MetricCard label="Speaking Topics" value={completedSpeakingTopics} detail={`${speakingTopicsBank.length} total`} icon="🎙️" />
                  <MetricCard label="Plan Progress" value={`${planProgress.percentage}%`} detail="Overall plan tasks" icon="📈" />
                  <MetricCard label="Writing Practice" value={writingEntries.length} detail={`Avg ${writingSummary.averageScore || 'N/A'}/5`} icon="✍️" />
                  <MetricCard label="Listening Practice" value={listeningEntries.length} detail={`Avg ${listeningSummary.averageScore || 'N/A'}/5`} icon="🎧" />
                  <MetricCard label="Pronunciation" value={pronunciationEntries.length} detail={`Clarity ${pronunciationSummary.averageScore || 'N/A'}/5`} icon="🔊" />
                  <MetricCard label="Rubric Evidence" value={rubricSummary.total} detail={`Avg ${rubricSummary.averageScore || 'N/A'}/5`} icon="📋" />
                  <MetricCard label="Feedback Loops" value={feedbackLoopSummary.active} detail={`${feedbackLoopSummary.improved} improved`} icon="🔁" />
                </div>
              </Card>

              <Card title="Level History" subtitle={`${(progress.levelHistory || []).length} saved entries`} icon="🕘">
                <div className="space-y-3">
                  {(progress.levelHistory || []).length === 0 && (
                    <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">No level history saved yet.</p>
                  )}
                  {(progress.levelHistory || []).map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950">{entry.oldLevel} → {entry.newLevel}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{new Date(entry.date).toLocaleString()} · {entry.source}</p>
                        </div>
                        <button type="button" onClick={() => deleteLevelHistoryEntry(entry.id)} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50">
                          Delete
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{entry.reason}</p>
                      {entry.note && <p className="mt-2 text-sm leading-6 text-slate-600">Note: {entry.note}</p>}
                    </article>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <Card title="Roadmap" subtitle={`${planDurationLabel} learning direction`} icon="🗺️">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {learningPlan.months.map((month) => (
                <article key={month.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-950">Month {month.monthNumber}</h3>
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                      {month.weeks.length} weeks
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-700">{month.theme}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{month.goals.join(' ')}</p>
                </article>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'daily' && (
          <div className="grid gap-6 xl:grid-cols-[18rem_1fr]">
            <Card title="Plan Position" subtitle="Month → Week → Day" icon="📅">
              <div className="space-y-4">
                <SelectInput
                  label="Select Month"
                  value={String(planPosition.monthNumber)}
                  onChange={(value) => updateProgress({ selectedMonth: Number(value), selectedWeek: 1 })}
                  options={learningPlan.months.map((month) => ({
                    label: `Month ${month.monthNumber}: ${month.theme}`,
                    value: String(month.monthNumber),
                  }))}
                />
                <SelectInput
                  label="Select Week"
                  value={String(planPosition.weekNumber)}
                  onChange={(value) => updateProgress({ selectedWeek: Number(value) })}
                  options={currentMonth.weeks.map((week) => ({
                    label: `Week ${week.weekNumber}`,
                    value: String(week.weekNumber),
                  }))}
                />
                <SelectInput
                  label="Select Day"
                  value={selectedPlan.day}
                  onChange={(value) => updateProgress({ selectedDay: value })}
                  options={currentWeek.days.map((day) => ({
                    label: day.dayName,
                    value: day.dayName,
                  }))}
                />
              </div>
              <div className="my-5 border-t border-slate-100" />
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Month theme</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{currentMonth.theme}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Weekly focus</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{currentWeek.focus}</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Day completion</span>
                    <span>{todayProgress.percentage}%</span>
                  </div>
                  <ProgressBar value={todayProgress.percentage} />
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                {dailyPlan.map((day) => {
                  const done = day.tasks.filter(
                    (task) => progress.completedPlanTasks[task.id] || (task.legacyId && progress.completedDailyTasks[task.legacyId]),
                  ).length
                  return (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() => updateProgress({ selectedDay: day.day })}
                      className={`rounded-lg border p-3 text-left transition ${
                        planPosition.dayName === day.day ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold">{day.day}</span>
                      <span className={`text-sm ${planPosition.dayName === day.day ? 'text-slate-300' : 'text-slate-500'}`}>
                        {done}/{day.tasks.length} complete
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card title={`${selectedPlan.day} · Month ${currentMonth.monthNumber}, Week ${currentWeek.weekNumber}`} subtitle={selectedPlan.focus} icon="✅">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  {isEditingDailyPlan
                    ? 'Edit the focus, tasks, and speaking topics for this day. Changes save automatically.'
                    : 'Use edit mode to customize this day without losing existing completed task progress.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {isEditingDailyPlan ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingDailyPlan(false)}
                      className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800"
                    >
                      Save changes
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingDailyPlan(true)}
                      className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      Edit daily plan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetDailyPlanToDefault}
                    className="min-h-10 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
                  >
                    Reset daily plan to default
                  </button>
                </div>
              </div>

              {isEditingDailyPlan && (
                <div className="mb-5">
                  <TextInput
                    label="Day focus"
                    value={selectedPlan.focus}
                    onChange={(value) => updateDailyPlanDay(selectedPlan.day, { focus: value })}
                  />
                </div>
              )}

              <div className="mb-5 rounded-lg border border-teal-100 bg-teal-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-teal-900">Suggested speaking topics</p>
                  {isEditingDailyPlan && (
                    <button
                      type="button"
                      onClick={() => addDailyPlanTopic(selectedPlan.day)}
                      className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-teal-800 transition hover:bg-teal-100"
                    >
                      Add speaking topic
                    </button>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  {selectedPlan.speakingTopics.map((topic) => (
                    <div key={topic.id}>
                      {isEditingDailyPlan ? (
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <input
                            value={topic.text}
                            onChange={(event) => updateDailyPlanTopic(selectedPlan.day, topic.id, event.target.value)}
                            className="min-h-11 rounded-lg border border-teal-200 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                          />
                          <button
                            type="button"
                            onClick={() => deleteDailyPlanTopic(selectedPlan.day, topic.id)}
                            className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete speaking topic
                          </button>
                        </div>
                      ) : (
                        <p className="text-slate-700">{topic.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isEditingDailyPlan && (
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => addDailyPlanTask(selectedPlan.day)}
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Add task
                  </button>
                </div>
              )}

              <div className="grid gap-3">
                {selectedPlan.tasks.map((task) => (
                  isEditingDailyPlan ? (
                    <div key={task.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto]">
                      <input
                        value={task.text}
                        onChange={(event) => updateDailyPlanTask(selectedPlan.day, task.id, event.target.value)}
                        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                        aria-label="Edit task text"
                      />
                      <button
                        type="button"
                        onClick={() => deleteDailyPlanTask(selectedPlan.day, task.id)}
                        className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                      >
                        Delete task
                      </button>
                    </div>
                  ) : (
                    <CheckboxRow
                      key={task.id}
                      checked={Boolean(progress.completedPlanTasks[task.id])}
                      onChange={() => togglePlanTask(task)}
                    >
                      <span className="block">
                        <span>{task.text}</span>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          {task.skill} · {task.estimatedMinutes} min
                        </span>
                      </span>
                    </CheckboxRow>
                  )
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'speaking' && (
          <div className="space-y-6">
            <Card title="Speaking Topics Bank" subtitle="Search, filter, and practice" icon="🎙️">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
                <TextInput
                  label="Search topics"
                  value={speakingFilters.search}
                  onChange={(value) => updateSpeakingFilter('search', value)}
                  placeholder="Search by title, tag, phrase, or question"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectRandomSpeakingTopic}
                    className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Random Topic
                  </button>
                  <button
                    type="button"
                    onClick={clearSpeakingFilters}
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <SelectInput label="Category" value={speakingFilters.category} onChange={(value) => updateSpeakingFilter('category', value)} options={speakingCategoryOptions} />
                <SelectInput label="Difficulty" value={speakingFilters.difficulty} onChange={(value) => updateSpeakingFilter('difficulty', value)} options={speakingDifficultyOptions} />
                <SelectInput label="Level" value={speakingFilters.level} onChange={(value) => updateSpeakingFilter('level', value)} options={speakingLevelOptions} />
                <SelectInput label="Status" value={speakingFilters.status} onChange={(value) => updateSpeakingFilter('status', value)} options={[allFilterValue, 'Completed', 'Not Completed']} />
                <SelectInput label="Duration" value={speakingFilters.duration} onChange={(value) => updateSpeakingFilter('duration', value)} options={[allFilterValue, 'Short', 'Medium', 'Long']} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Visible Topics" value={filteredSpeakingTopics.length} detail={`${speakingTopicsBank.length} total in bank`} icon="🔎" />
                <MetricCard label="Completed" value={completedSpeakingTopics} detail="Saved by topic ID" icon="✅" />
                <MetricCard label="Selected" value={selectedSpeakingTopic ? selectedSpeakingTopic.title : 'None'} detail="Use Random Topic to pick one" icon="🎯" />
              </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              {filteredSpeakingTopics.map((topic) => {
                const topicProgress = speakingTopicProgress[topic.id] || {}
                const isSelected = selectedSpeakingTopicId === topic.id

                return (
                  <article
                    key={topic.id}
                    className={`rounded-lg border bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition ${
                      isSelected ? 'border-teal-400 ring-4 ring-teal-100' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{topic.category}</p>
                        <h3 className="mt-2 text-lg font-bold text-slate-950">{topic.title}</h3>
                      </div>
                      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(topicProgress.completed)}
                          onChange={() => updateSpeakingTopicProgress(topic.id, { completed: !topicProgress.completed })}
                          className="h-4 w-4 rounded border-slate-300 accent-teal-700"
                        />
                        Completed
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                        Difficulty: {topic.difficulty}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                        Level: {topic.level}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                        {topic.durationMinutes} min
                      </span>
                      {topicProgress.lastPracticedAt && (
                        <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-800">
                          Last practiced: {new Date(topicProgress.lastPracticedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {topic.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Speaking structure</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {topic.speakingStructure.map((step) => (
                            <span key={step} className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                              {step}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">Prompt questions</p>
                        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                          {topic.promptQuestions.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm font-bold text-slate-700">Useful phrases</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {topic.usefulPhrases.map((phrase) => (
                          <span key={phrase} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-sm font-bold text-slate-700">Practice notes</span>
                      <textarea
                        value={topicProgress.notes || ''}
                        onChange={(event) => updateSpeakingTopicProgress(topic.id, { notes: event.target.value })}
                        rows={3}
                        placeholder={topic.notesPrompt}
                        className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                      />
                    </label>
                  </article>
                )
              })}
            </div>

            {filteredSpeakingTopics.length === 0 && (
              <Card title="No topics found" subtitle="Adjust filters" icon="🔎">
                <EmptyState title="No speaking topics match the current filters.">
                  Clear filters or search for a broader category, then use Random Topic to pick a practice item.
                </EmptyState>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="space-y-6">
            <Card title="Mistakes Evidence System" subtitle="Add, review, and fix real mistakes" icon="🧩">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard label="Total Mistakes" value={mistakeSummary.total} detail="All saved evidence" icon="🧾" />
                <MetricCard label="New" value={mistakeSummary.newCount} detail="Needs first review" icon="🆕" />
                <MetricCard label="Practicing" value={mistakeSummary.practicingCount} detail="Still being corrected" icon="🔁" />
                <MetricCard label="Fixed" value={mistakeSummary.fixedCount} detail={`${mistakeSummary.fixedPercentage}% fixed`} icon="✅" />
                <MetricCard label="Review Focus" value={mistakeSummary.mostCommonCategory} detail={`${mistakeSummary.activeCount} active mistakes`} icon="🎯" />
              </div>
            </Card>

            <Card title={editingMistakeId ? 'Edit Mistake' : 'Add Mistake'} subtitle="Learning evidence form" icon="✍️">
              <form onSubmit={saveMistake} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextArea
                    label="Wrong sentence"
                    value={mistakeDraft.wrongSentence}
                    onChange={(value) => updateMistakeDraft('wrongSentence', value)}
                    placeholder="Example: I wants to check this."
                  />
                  <TextArea
                    label="Correct sentence"
                    value={mistakeDraft.correctSentence}
                    onChange={(value) => updateMistakeDraft('correctSentence', value)}
                    placeholder="Example: I want to check this."
                  />
                  <SelectInput label="Category" value={mistakeDraft.category} onChange={(value) => updateMistakeDraft('category', value)} options={mistakeCategories} />
                  <SelectInput label="Source" value={mistakeDraft.source} onChange={(value) => updateMistakeDraft('source', value)} options={mistakeSources} />
                  <SelectInput label="Status" value={mistakeDraft.status} onChange={(value) => updateMistakeDraft('status', value)} options={mistakeStatuses} />
                  <TextInput label="Related skill" value={mistakeDraft.relatedSkill} onChange={(value) => updateMistakeDraft('relatedSkill', value)} placeholder="Example: Grammar" />
                  <SelectInput
                    label="Related grammar topic"
                    value={mistakeDraft.relatedGrammarTopicId}
                    onChange={(value) => updateMistakeDraft('relatedGrammarTopicId', value)}
                    options={[
                      { label: 'None', value: '' },
                      ...contentLibrary.grammarTopics.map((topic) => ({ label: topic.title, value: topic.id })),
                    ]}
                  />
                  <TextArea label="Rule" value={mistakeDraft.rule} onChange={(value) => updateMistakeDraft('rule', value)} placeholder="Example: Subject-verb agreement" />
                  <div className="md:col-span-2">
                    <TextArea label="Notes" value={mistakeDraft.notes} onChange={(value) => updateMistakeDraft('notes', value)} placeholder="Where did this happen? What should you remember?" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800">
                    {editingMistakeId ? 'Save mistake changes' : 'Add mistake'}
                  </button>
                  {editingMistakeId && (
                    <button type="button" onClick={cancelMistakeEdit} className="min-h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </Card>

            <Card title="Mistake Filters" subtitle="Find correction patterns" icon="🔎">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_repeat(4,1fr)_auto] xl:items-end">
                <TextInput label="Search mistakes" value={mistakeFilters.search} onChange={(value) => updateMistakeFilter('search', value)} placeholder="Search sentence, rule, note, or source" />
                <SelectInput label="Category" value={mistakeFilters.category} onChange={(value) => updateMistakeFilter('category', value)} options={[allFilterValue, ...mistakeCategories]} />
                <SelectInput label="Source" value={mistakeFilters.source} onChange={(value) => updateMistakeFilter('source', value)} options={[allFilterValue, ...mistakeSources]} />
                <SelectInput label="Status" value={mistakeFilters.status} onChange={(value) => updateMistakeFilter('status', value)} options={[allFilterValue, ...mistakeStatuses]} />
                <SelectInput label="Related skill" value={mistakeFilters.relatedSkill} onChange={(value) => updateMistakeFilter('relatedSkill', value)} options={mistakeSkillOptions} />
                <button type="button" onClick={clearMistakeFilters} className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  Clear filters
                </button>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-600">
                Showing {filteredMistakes.length} of {mistakes.length} mistakes.
              </p>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              {filteredMistakes.map((mistake) => (
                <article key={mistake.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{mistake.category}</p>
                      <h3 className="mt-2 text-lg font-bold text-slate-950">{mistake.relatedSkill || mistake.category}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEditingMistake(mistake)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                        Edit
                      </button>
                      <button type="button" onClick={() => openFeedbackLoopFromMistake(mistake)} className="min-h-10 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-bold text-teal-800 transition hover:bg-teal-100">
                        Create feedback loop
                      </button>
                      <button type="button" onClick={() => deleteMistake(mistake.id)} className="min-h-10 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100">
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-6">
                    <p className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-rose-800">
                      <strong>Wrong:</strong> {mistake.wrongSentence}
                    </p>
                    <p className="rounded-lg border border-teal-100 bg-teal-50 p-3 text-teal-900">
                      <strong>Correct:</strong> {mistake.correctSentence}
                    </p>
                    <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-slate-700">
                      <strong>Rule:</strong> {mistake.rule || 'No rule added yet.'}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SelectInput label="Status" value={mistake.status} onChange={(value) => updateMistake(mistake.id, { status: value })} options={mistakeStatuses} />
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                      <p><strong>Source:</strong> {mistake.source}</p>
                      <p><strong>Created:</strong> {new Date(mistake.createdAt).toLocaleDateString()}</p>
                      {mistake.fixedAt && <p><strong>Fixed:</strong> {new Date(mistake.fixedAt).toLocaleDateString()}</p>}
                    </div>
                  </div>

                  {mistake.notes && (
                    <p className="mt-4 rounded-lg border border-slate-100 bg-white p-3 text-sm leading-6 text-slate-600">
                      <strong>Notes:</strong> {mistake.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>

            {filteredMistakes.length === 0 && (
              <Card title="No mistakes found" subtitle="Adjust filters or add a mistake" icon="🔎">
                <EmptyState title="No mistakes match the current filters.">
                  Clear filters or add a mistake from speaking, writing, teacher feedback, or self-review.
                </EmptyState>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <Card title="Content Library" subtitle="Manage all learning materials, topics, phrases, templates, and mistakes in one place." icon="🗂️">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <MetricCard label="Grammar" value={contentSummary.grammarTopics} detail="Topics" icon="📚" />
                <MetricCard label="Speaking" value={contentSummary.speakingTopics} detail="Topic bank" icon="🎙️" />
                <MetricCard label="Business Phrases" value={contentSummary.businessPhrases} detail="Phrase bank" icon="💼" />
                <MetricCard label="Pronunciation" value={contentSummary.pronunciationSentences} detail="Sentences" icon="🔊" />
                <MetricCard label="Writing Templates" value={contentSummary.writingTemplates} detail="Templates" icon="✍️" />
                <MetricCard label="Mistakes" value={contentSummary.commonMistakes} detail="Evidence items" icon="🧩" />
              </div>
            </Card>

            <Card title={contentTypeConfig[contentLibraryTab].label} subtitle={`${filteredContentItems.length} of ${activeContentItems.length} visible`} icon={contentTypeConfig[contentLibraryTab].icon}>
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {Object.entries(contentTypeConfig).map(([id, config]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectContentTab(id)}
                    className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-bold transition ${
                      contentLibraryTab === id
                        ? 'bg-slate-950 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {config.icon} {config.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_repeat(4,0.8fr)_auto] xl:items-end">
                <TextInput label="Search" value={contentFilters.search} onChange={(value) => updateContentFilter('search', value)} placeholder="Search title, phrase, sentence, tag, category, or notes" />
                <SelectInput label="Category" value={contentFilters.category} onChange={(value) => updateContentFilter('category', value)} options={contentCategoryOptions} />
                <SelectInput label="Level" value={contentFilters.level} onChange={(value) => updateContentFilter('level', value)} options={contentLevelOptions} />
                <SelectInput label="Difficulty" value={contentFilters.difficulty} onChange={(value) => updateContentFilter('difficulty', value)} options={contentDifficultyOptions} />
                <SelectInput label="Status" value={contentFilters.status} onChange={(value) => updateContentFilter('status', value)} options={contentStatusOptions} />
                <button type="button" onClick={clearContentFilters} className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  Clear filters
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {contentTypeConfig[contentLibraryTab].editable && (
                    <button type="button" onClick={() => addContentItem(contentLibraryTab)} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800">
                      Add {contentTypeConfig[contentLibraryTab].label}
                    </button>
                  )}
                  <button type="button" onClick={resetContentLibraryToDefault} className="min-h-10 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100">
                    Reset editable content
                  </button>
                  <button type="button" onClick={deleteAllContentLibrary} className="min-h-10 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100">
                    Delete editable content
                  </button>
                </div>
                <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                  {['cards', 'list'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setContentViewMode(mode)}
                      className={`min-h-9 rounded-md px-3 text-sm font-bold capitalize transition ${
                        contentViewMode === mode ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {editingContentItem && contentTypeConfig[contentLibraryTab].editable && (
                <div className="mt-5 rounded-lg border border-teal-100 bg-teal-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-950">Editing: {editingContentItem.title || editingContentItem.phrase || editingContentItem.sentence}</h3>
                    <button type="button" onClick={() => setEditingContentItemId('')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                      Close editor
                    </button>
                  </div>

                  {contentLibraryTab === 'grammarTopics' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Title" value={editingContentItem.title} onChange={(value) => updateContentItem('grammarTopics', editingContentItem.id, { title: value })} />
                      <TextInput label="Level" value={editingContentItem.level} onChange={(value) => updateContentItem('grammarTopics', editingContentItem.id, { level: value })} />
                      <TextInput label="Category" value={editingContentItem.category || ''} onChange={(value) => updateContentItem('grammarTopics', editingContentItem.id, { category: value })} />
                      <SelectInput label="Priority" value={editingContentItem.priority} onChange={(value) => updateContentItem('grammarTopics', editingContentItem.id, { priority: value })} options={['Low', 'Medium', 'High']} />
                      <TextArea label="Explanation" value={editingContentItem.explanation} onChange={(value) => updateContentItem('grammarTopics', editingContentItem.id, { explanation: value })} />
                      <TextArea label="Examples" value={editingContentItem.workExamples} onChange={(value) => updateContentItem('grammarTopics', editingContentItem.id, { workExamples: value })} />
                      <TextArea label="Practice task" value={editingContentItem.practiceTask} onChange={(value) => updateContentItem('grammarTopics', editingContentItem.id, { practiceTask: value })} />
                      <TextArea label="Notes" value={editingContentItem.notes || ''} onChange={(value) => updateContentItem('grammarTopics', editingContentItem.id, { notes: value })} />
                    </div>
                  )}

                  {contentLibraryTab === 'businessPhrases' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextArea label="Phrase" value={editingContentItem.phrase} onChange={(value) => updateContentItem('businessPhrases', editingContentItem.id, { phrase: value })} />
                      <TextInput label="Category" value={editingContentItem.category} onChange={(value) => updateContentItem('businessPhrases', editingContentItem.id, { category: value })} />
                      <TextInput label="Level" value={editingContentItem.level || ''} onChange={(value) => updateContentItem('businessPhrases', editingContentItem.id, { level: value })} />
                      <TextArea label="Example use case" value={editingContentItem.useCase || editingContentItem.exampleUseCase || ''} onChange={(value) => updateContentItem('businessPhrases', editingContentItem.id, { useCase: value, exampleUseCase: value })} />
                      <TextArea label="Notes" value={editingContentItem.notes || ''} onChange={(value) => updateContentItem('businessPhrases', editingContentItem.id, { notes: value })} />
                    </div>
                  )}

                  {contentLibraryTab === 'pronunciationSentences' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextArea label="Sentence" value={editingContentItem.sentence} onChange={(value) => updateContentItem('pronunciationSentences', editingContentItem.id, { sentence: value })} />
                      <TextInput label="Focus area" value={editingContentItem.focusArea} onChange={(value) => updateContentItem('pronunciationSentences', editingContentItem.id, { focusArea: value })} />
                      <TextInput label="Repetition target" type="number" min="1" value={editingContentItem.repetitionTarget} onChange={(value) => updateContentItem('pronunciationSentences', editingContentItem.id, { repetitionTarget: value })} />
                      <TextInput label="Level" value={editingContentItem.level || ''} onChange={(value) => updateContentItem('pronunciationSentences', editingContentItem.id, { level: value })} />
                      <TextArea label="Notes" value={editingContentItem.notes || ''} onChange={(value) => updateContentItem('pronunciationSentences', editingContentItem.id, { notes: value })} />
                    </div>
                  )}

                  {contentLibraryTab === 'writingTemplates' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Template title" value={editingContentItem.title} onChange={(value) => updateContentItem('writingTemplates', editingContentItem.id, { title: value })} />
                      <TextInput label="Type" value={editingContentItem.type} onChange={(value) => updateContentItem('writingTemplates', editingContentItem.id, { type: value })} />
                      <TextInput label="Level" value={editingContentItem.level || ''} onChange={(value) => updateContentItem('writingTemplates', editingContentItem.id, { level: value })} />
                      <div className="md:col-span-2">
                        <TextArea label="Template body" rows={6} value={editingContentItem.body} onChange={(value) => updateContentItem('writingTemplates', editingContentItem.id, { body: value })} />
                      </div>
                      <div className="md:col-span-2">
                        <TextArea label="Notes" value={editingContentItem.notes} onChange={(value) => updateContentItem('writingTemplates', editingContentItem.id, { notes: value })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={`mt-5 grid gap-3 ${contentViewMode === 'cards' ? 'xl:grid-cols-2' : ''}`}>
                {filteredContentItems.length === 0 && (
                  <EmptyState title="No content items found.">
                    Clear filters, switch content type, or add a new editable library item.
                  </EmptyState>
                )}

                {filteredContentItems.map((item) => {
                  const status = getContentItemStatus(item, contentLibraryTab, contentLibraryTab === 'businessPhrases' ? businessPhraseProgress : speakingTopicProgress)
                  const isCompact = contentViewMode === 'list'
                  const title = item.title || item.phrase || item.sentence || item.wrongSentence || 'Content item'
                  const detail =
                    contentLibraryTab === 'speakingTopics'
                      ? `${item.category} · ${item.difficulty} · ${item.durationMinutes} min`
                      : contentLibraryTab === 'commonMistakes'
                        ? `${item.category} · ${item.source} · ${item.relatedSkill}`
                        : item.category || item.level || item.type || item.focusArea || 'Library item'

                  return (
                    <article key={item.id} className={`rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${isCompact ? 'grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center' : ''}`}>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{status}</span>
                          {item.level && <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">{item.level}</span>}
                          {item.priority && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{item.priority}</span>}
                        </div>
                        <h3 className="mt-3 font-bold text-slate-950">{title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{detail}</p>
                        {!isCompact && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                            {item.explanation || item.practiceTask || item.useCase || item.exampleUseCase || item.body || item.correctSentence || item.promptQuestions?.[0] || item.notes || 'No preview added yet.'}
                          </p>
                        )}
                        {contentLibraryTab === 'speakingTopics' && !isCompact && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">
                        {contentLibraryTab === 'speakingTopics' && (
                          <>
                            <button type="button" onClick={() => updateSpeakingTopicProgress(item.id, { completed: !speakingTopicProgress[item.id]?.completed })} className="min-h-10 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-bold text-teal-800">
                              {speakingTopicProgress[item.id]?.completed ? 'Completed' : 'Mark complete'}
                            </button>
                            <button type="button" onClick={() => handleNavigation('speaking')} className="min-h-10 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white">
                              Practice
                            </button>
                          </>
                        )}
                        {contentLibraryTab === 'commonMistakes' && (
                          <>
                            <SelectInput label="Status" value={item.status} onChange={(value) => updateMistake(item.id, { status: value })} options={mistakeStatuses} />
                            <button type="button" onClick={() => handleNavigation('mistakes')} className="min-h-10 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white">
                              Open
                            </button>
                          </>
                        )}
                        {contentLibraryTab === 'businessPhrases' && (
                          <>
                            <button type="button" onClick={() => updateBusinessPhraseProgress(item.id, { practiced: !businessPhraseProgress[item.id]?.practiced })} className="min-h-10 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-bold text-teal-800">
                              {businessPhraseProgress[item.id]?.practiced ? 'Practiced' : 'Mark practiced'}
                            </button>
                            <button type="button" onClick={() => updateBusinessPhraseProgress(item.id, { favorite: !businessPhraseProgress[item.id]?.favorite })} className="min-h-10 rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-bold text-amber-800">
                              {businessPhraseProgress[item.id]?.favorite ? 'Favorite' : 'Add favorite'}
                            </button>
                            <button type="button" onClick={() => handleNavigation('phrases')} className="min-h-10 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white">
                              Practice
                            </button>
                          </>
                        )}
                        {contentTypeConfig[contentLibraryTab].editable && (
                          <>
                            <button type="button" onClick={() => updateLibraryItem(contentLibraryTab, item.id, contentLibraryTab === 'businessPhrases' ? { practiced: !item.practiced } : { completed: !item.completed })} className="min-h-10 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-bold text-teal-800">
                              {status.includes('Not') ? 'Mark done' : 'Done'}
                            </button>
                            <button type="button" onClick={() => setEditingContentItemId(item.id)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                              Edit
                            </button>
                            <button type="button" onClick={() => deleteLibraryItem(contentLibraryTab, item.id)} className="min-h-10 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-bold text-rose-700">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'writing' && (
          <div className="space-y-6">
            <Card title="Writing Practice Tracker" subtitle="Draft, review, improve, and track professional writing" icon="✍️">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Entries" value={writingSummary.total} detail="Writing records" icon="📄" />
                <MetricCard label="Completed" value={writingSummary.completed} detail="Finished entries" icon="✅" />
                <MetricCard label="Average Score" value={writingSummary.averageScore || 'N/A'} detail="Score /5" icon="📊" />
                <MetricCard label="Last Practiced" value={writingSummary.lastPracticedDate} detail="Latest saved date" icon="🕘" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => openTrackerForm('writing')} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800">Add writing entry</button>
                <button type="button" onClick={() => clearTrackerFilters('writing')} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">Clear filters</button>
              </div>
            </Card>

            {isWritingFormOpen && (
              <Card title={editingWritingId ? 'Edit Writing Entry' : 'Add Writing Entry'} subtitle="Writing practice details" icon="📝">
                <form onSubmit={(event) => savePracticeEntry(event, 'writing')} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput label="Date" type="date" value={progress.writingDraft.date} onChange={(value) => updateNestedDraft('writingDraft', 'date', value)} />
                    <SelectInput label="Type" value={progress.writingDraft.type} onChange={(value) => updateNestedDraft('writingDraft', 'type', value)} options={writingTypeOptions} />
                    <TextInput label="Title" value={progress.writingDraft.title} onChange={(value) => updateNestedDraft('writingDraft', 'title', value)} />
                    <ScoreInput label="Score /5" value={progress.writingDraft.score} onChange={(value) => updateNestedDraft('writingDraft', 'score', value)} />
                    <SelectInput label="Status" value={progress.writingDraft.status} onChange={(value) => updateNestedDraft('writingDraft', 'status', value)} options={writingStatusOptions} />
                    <TextInput label="Useful phrases" value={progress.writingDraft.usefulPhrases} onChange={(value) => updateNestedDraft('writingDraft', 'usefulPhrases', value)} />
                    <TextArea label="Original draft" value={progress.writingDraft.originalDraft} onChange={(value) => updateNestedDraft('writingDraft', 'originalDraft', value)} />
                    <TextArea label="Corrected version" value={progress.writingDraft.correctedVersion} onChange={(value) => updateNestedDraft('writingDraft', 'correctedVersion', value)} />
                    <TextArea label="Mistakes noticed" value={progress.writingDraft.mistakesNoticed} onChange={(value) => updateNestedDraft('writingDraft', 'mistakesNoticed', value)} />
                    <TextArea label="Notes" value={progress.writingDraft.notes} onChange={(value) => updateNestedDraft('writingDraft', 'notes', value)} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white">Save entry</button>
                    <button type="button" onClick={() => closeTrackerForm('writing')} className="min-h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700">Cancel</button>
                  </div>
                </form>
              </Card>
            )}

            <Card title="Writing Entries" subtitle={`${filteredWritingEntries.length} of ${writingEntries.length} visible`} icon="📄">
              <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto] xl:items-end">
                <TextInput label="Search" value={writingFilters.search} onChange={(value) => updateTrackerFilter('writing', 'search', value)} placeholder="Search title, draft, corrections, phrases, notes" />
                <SelectInput label="Type" value={writingFilters.type} onChange={(value) => updateTrackerFilter('writing', 'type', value)} options={[allFilterValue, ...writingTypeOptions]} />
                <SelectInput label="Status" value={writingFilters.status} onChange={(value) => updateTrackerFilter('writing', 'status', value)} options={[allFilterValue, ...writingStatusOptions]} />
                <SelectInput label="Score" value={writingFilters.scoreRange} onChange={(value) => updateTrackerFilter('writing', 'scoreRange', value)} options={scoreFilterOptions} />
                <button type="button" onClick={() => clearTrackerFilters('writing')} className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">Clear</button>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredWritingEntries.length === 0 && (
                  <EmptyState title="No writing entries found.">
                    Add your first professional email, status update, or meeting summary practice entry.
                  </EmptyState>
                )}
                {filteredWritingEntries.map((entry) => (
                  <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{entry.type}</p><h3 className="mt-1 font-bold text-slate-950">{entry.title}</h3><p className="mt-1 text-sm text-slate-500">{entry.date} · Score {entry.score || 'N/A'}/5 · {entry.status}</p></div>
                      <div className="flex gap-2"><button type="button" onClick={() => openTrackerForm('writing', entry)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">Edit</button><button type="button" onClick={() => deletePracticeEntry('writing', entry.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Delete</button></div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                      {entry.originalDraft && <p><strong>Original:</strong> {entry.originalDraft}</p>}
                      {entry.correctedVersion && <p><strong>Corrected:</strong> {entry.correctedVersion}</p>}
                      {entry.mistakesNoticed && <p><strong>Mistakes:</strong> {entry.mistakesNoticed}</p>}
                      {entry.usefulPhrases && <p><strong>Phrases:</strong> {entry.usefulPhrases}</p>}
                      {entry.notes && <p><strong>Notes:</strong> {entry.notes}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'listening' && (
          <div className="space-y-6">
            <Card title="Listening Practice Tracker" subtitle="Comprehension, phrases, and summaries" icon="🎧">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Entries" value={listeningSummary.total} detail={`${listeningSummary.totalMinutes} minutes`} icon="📋" />
                <MetricCard label="Completed" value={listeningSummary.completed} detail="Finished listening" icon="✅" />
                <MetricCard label="Average Score" value={listeningSummary.averageScore || 'N/A'} detail="Score /5" icon="📊" />
                <MetricCard label="Last Practiced" value={listeningSummary.lastPracticedDate} detail="Latest saved date" icon="🕘" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => openTrackerForm('listening')} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white">Add listening entry</button><button type="button" onClick={() => clearTrackerFilters('listening')} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">Clear filters</button></div>
            </Card>

            <Card title="Recommended Listening Method" subtitle="Practice flow" icon="🎯">
              <ol className="grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-3">
                {['Listen once without subtitles.', 'Write the main idea.', 'Listen again with subtitles or transcript.', 'Extract 5 useful phrases.', 'Repeat important sentences aloud.', 'Summarize the audio in your own words.'].map((step, index) => (
                  <li key={step} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><strong>{index + 1}.</strong> {step}</li>
                ))}
              </ol>
            </Card>

            {isListeningFormOpen && (
              <Card title={editingListeningId ? 'Edit Listening Entry' : 'Add Listening Entry'} subtitle="Listening practice details" icon="📝">
                <form onSubmit={(event) => savePracticeEntry(event, 'listening')} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput label="Date" type="date" value={progress.listeningDraft.date} onChange={(value) => updateNestedDraft('listeningDraft', 'date', value)} />
                    <TextInput label="Title" value={progress.listeningDraft.title} onChange={(value) => updateNestedDraft('listeningDraft', 'title', value)} />
                    <TextInput label="Source Link" value={progress.listeningDraft.sourceLink} onChange={(value) => updateNestedDraft('listeningDraft', 'sourceLink', value)} />
                    <SelectInput label="Category" value={progress.listeningDraft.category} onChange={(value) => updateNestedDraft('listeningDraft', 'category', value)} options={listeningCategoryOptions} />
                    <SelectInput label="Accent" value={progress.listeningDraft.accent} onChange={(value) => updateNestedDraft('listeningDraft', 'accent', value)} options={listeningAccentOptions} />
                    <SelectInput label="Difficulty" value={progress.listeningDraft.difficulty} onChange={(value) => updateNestedDraft('listeningDraft', 'difficulty', value)} options={listeningDifficultyOptions} />
                    <TextInput label="Duration Minutes" type="number" min="1" value={progress.listeningDraft.durationMinutes} onChange={(value) => updateNestedDraft('listeningDraft', 'durationMinutes', value)} />
                    <ScoreInput label="Score /5" value={progress.listeningDraft.score} onChange={(value) => updateNestedDraft('listeningDraft', 'score', value)} />
                    <SelectInput label="Status" value={progress.listeningDraft.status} onChange={(value) => updateNestedDraft('listeningDraft', 'status', value)} options={listeningStatusOptions} />
                    <TextArea label="Main Idea" value={progress.listeningDraft.mainIdea} onChange={(value) => updateNestedDraft('listeningDraft', 'mainIdea', value)} />
                    <TextArea label="Useful Phrases" value={progress.listeningDraft.usefulPhrases} onChange={(value) => updateNestedDraft('listeningDraft', 'usefulPhrases', value)} />
                    <TextArea label="Summary" value={progress.listeningDraft.summary} onChange={(value) => updateNestedDraft('listeningDraft', 'summary', value)} />
                    <TextArea label="Notes" value={progress.listeningDraft.notes} onChange={(value) => updateNestedDraft('listeningDraft', 'notes', value)} />
                  </div>
                  <div className="flex flex-wrap gap-2"><button type="submit" className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white">Save entry</button><button type="button" onClick={() => closeTrackerForm('listening')} className="min-h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700">Cancel</button></div>
                </form>
              </Card>
            )}

            <Card title="Listening Entries" subtitle={`${filteredListeningEntries.length} of ${listeningEntries.length} visible`} icon="📋">
              <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(5,0.8fr)_auto] xl:items-end">
                <TextInput label="Search" value={listeningFilters.search} onChange={(value) => updateTrackerFilter('listening', 'search', value)} />
                <SelectInput label="Category" value={listeningFilters.category} onChange={(value) => updateTrackerFilter('listening', 'category', value)} options={[allFilterValue, ...listeningCategoryOptions]} />
                <SelectInput label="Accent" value={listeningFilters.accent} onChange={(value) => updateTrackerFilter('listening', 'accent', value)} options={[allFilterValue, ...listeningAccentOptions]} />
                <SelectInput label="Difficulty" value={listeningFilters.difficulty} onChange={(value) => updateTrackerFilter('listening', 'difficulty', value)} options={[allFilterValue, ...listeningDifficultyOptions]} />
                <SelectInput label="Status" value={listeningFilters.status} onChange={(value) => updateTrackerFilter('listening', 'status', value)} options={[allFilterValue, ...listeningStatusOptions]} />
                <SelectInput label="Score" value={listeningFilters.scoreRange} onChange={(value) => updateTrackerFilter('listening', 'scoreRange', value)} options={scoreFilterOptions} />
                <button type="button" onClick={() => clearTrackerFilters('listening')} className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">Clear</button>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredListeningEntries.length === 0 && (
                  <EmptyState title="No listening entries found.">
                    Add a business meeting, presentation, or technical discussion practice entry.
                  </EmptyState>
                )}
                {filteredListeningEntries.map((entry) => (
                  <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{entry.category}</p><h3 className="mt-1 font-bold text-slate-950">{entry.title}</h3><p className="mt-1 text-sm text-slate-500">{entry.date} · {entry.accent} · {entry.durationMinutes} min · Score {entry.score || 'N/A'}/5 · {entry.status}</p></div><div className="flex gap-2"><button type="button" onClick={() => openTrackerForm('listening', entry)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">Edit</button><button type="button" onClick={() => deletePracticeEntry('listening', entry.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Delete</button></div></div>
                    <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">{entry.mainIdea && <p><strong>Main idea:</strong> {entry.mainIdea}</p>}{entry.usefulPhrases && <p><strong>Phrases:</strong> {entry.usefulPhrases}</p>}{entry.summary && <p><strong>Summary:</strong> {entry.summary}</p>}{entry.sourceLink && <p><strong>Source:</strong> <a className="text-teal-700 underline" href={entry.sourceLink} target="_blank" rel="noreferrer">{entry.sourceLink}</a></p>}{entry.notes && <p><strong>Notes:</strong> {entry.notes}</p>}</div>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'pronunciation' && (
          <div className="space-y-6">
            <Card title="Pronunciation Practice Tracker" subtitle="Repetitions, clarity, and confidence" icon="🔊">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Entries" value={pronunciationSummary.total} detail="Pronunciation records" icon="🎙️" />
                <MetricCard label="Completed" value={pronunciationSummary.completed} detail="Finished items" icon="✅" />
                <MetricCard label="Avg Clarity" value={pronunciationSummary.averageScore || 'N/A'} detail="Score /5" icon="📊" />
                <MetricCard label="Avg Confidence" value={pronunciationSummary.averageConfidence || 'N/A'} detail="Score /5" icon="💬" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => openTrackerForm('pronunciation')} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white">Add pronunciation entry</button><button type="button" onClick={() => clearTrackerFilters('pronunciation')} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">Clear filters</button></div>
            </Card>

            {isPronunciationFormOpen && (
              <Card title={editingPronunciationId ? 'Edit Pronunciation Entry' : 'Add Pronunciation Entry'} subtitle="Pronunciation practice details" icon="📝">
                <form onSubmit={(event) => savePracticeEntry(event, 'pronunciation')} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput label="Date" type="date" value={progress.pronunciationDraft.date} onChange={(value) => updateNestedDraft('pronunciationDraft', 'date', value)} />
                    <SelectInput label="Focus Area" value={progress.pronunciationDraft.focusArea} onChange={(value) => updateNestedDraft('pronunciationDraft', 'focusArea', value)} options={pronunciationFocusOptions} />
                    <TextInput label="Repetitions Target" type="number" min="1" value={progress.pronunciationDraft.repetitionsTarget} onChange={(value) => updateNestedDraft('pronunciationDraft', 'repetitionsTarget', value)} />
                    <TextInput label="Repetitions Done" type="number" min="0" value={progress.pronunciationDraft.repetitionsDone} onChange={(value) => updateNestedDraft('pronunciationDraft', 'repetitionsDone', value)} />
                    <ScoreInput label="Clarity Score /5" value={progress.pronunciationDraft.clarityScore} onChange={(value) => updateNestedDraft('pronunciationDraft', 'clarityScore', value)} />
                    <ScoreInput label="Confidence Score /5" value={progress.pronunciationDraft.confidenceScore} onChange={(value) => updateNestedDraft('pronunciationDraft', 'confidenceScore', value)} />
                    <SelectInput label="Status" value={progress.pronunciationDraft.status} onChange={(value) => updateNestedDraft('pronunciationDraft', 'status', value)} options={pronunciationStatusOptions} />
                    <TextArea label="Sentence" value={progress.pronunciationDraft.sentence} onChange={(value) => updateNestedDraft('pronunciationDraft', 'sentence', value)} />
                    <TextArea label="Notes" value={progress.pronunciationDraft.notes} onChange={(value) => updateNestedDraft('pronunciationDraft', 'notes', value)} />
                  </div>
                  <div className="flex flex-wrap gap-2"><button type="submit" className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white">Save entry</button><button type="button" onClick={() => closeTrackerForm('pronunciation')} className="min-h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700">Cancel</button></div>
                </form>
              </Card>
            )}

            <Card title="Pronunciation Entries" subtitle={`${filteredPronunciationEntries.length} of ${pronunciationEntries.length} visible`} icon="🎙️">
              <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto] xl:items-end">
                <TextInput label="Search" value={pronunciationFilters.search} onChange={(value) => updateTrackerFilter('pronunciation', 'search', value)} />
                <SelectInput label="Focus Area" value={pronunciationFilters.focusArea} onChange={(value) => updateTrackerFilter('pronunciation', 'focusArea', value)} options={[allFilterValue, ...pronunciationFocusOptions]} />
                <SelectInput label="Status" value={pronunciationFilters.status} onChange={(value) => updateTrackerFilter('pronunciation', 'status', value)} options={[allFilterValue, ...pronunciationStatusOptions]} />
                <SelectInput label="Clarity" value={pronunciationFilters.scoreRange} onChange={(value) => updateTrackerFilter('pronunciation', 'scoreRange', value)} options={scoreFilterOptions} />
                <button type="button" onClick={() => clearTrackerFilters('pronunciation')} className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">Clear</button>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredPronunciationEntries.length === 0 && (
                  <EmptyState title="No pronunciation entries found.">
                    Add a meeting sentence, choose a focus area, and track repetitions and clarity.
                  </EmptyState>
                )}
                {filteredPronunciationEntries.map((entry) => (
                  <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{entry.focusArea}</p><h3 className="mt-1 font-bold text-slate-950">{entry.sentence || 'Pronunciation sentence'}</h3><p className="mt-1 text-sm text-slate-500">{entry.date} · {entry.repetitionsDone}/{entry.repetitionsTarget} reps · clarity {entry.clarityScore || 'N/A'}/5 · confidence {entry.confidenceScore || 'N/A'}/5 · {entry.status}</p></div><div className="flex gap-2"><button type="button" onClick={() => openTrackerForm('pronunciation', entry)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">Edit</button><button type="button" onClick={() => deletePracticeEntry('pronunciation', entry.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Delete</button></div></div>
                    {entry.notes && <p className="mt-4 text-sm leading-6 text-slate-600"><strong>Notes:</strong> {entry.notes}</p>}
                  </article>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'grammar' && (
          <Card title="Grammar roadmap" subtitle="Accuracy builder" icon="📚">
            <div className="grid gap-3 md:grid-cols-2">
              {contentLibrary.grammarTopics.map((topic) => (
                <CheckboxRow
                  key={topic.id}
                  checked={Boolean(topic.completed)}
                  onChange={() => updateContentItem('grammarTopics', topic.id, { completed: !topic.completed })}
                >
                  <span>
                    <strong className="text-slate-950">{topic.title}</strong>
                    <span className="mt-1 block text-xs text-slate-500">
                      {topic.level} · {topic.priority} priority
                    </span>
                  </span>
                </CheckboxRow>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'phrases' && (
          <Card title="Business phrases" subtitle={`${filteredBusinessPhrases.length} of ${defaultBusinessPhrases.length} phrases visible`} icon="💼">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total phrases" value={businessPhraseSummary.total} detail="Expanded phrase bank" icon="💼" />
              <MetricCard label="Practiced" value={businessPhraseSummary.practiced} detail={`${businessPhraseSummary.practicedPercentage}% complete`} icon="✅" />
              <MetricCard label="Favorites" value={businessPhraseSummary.favorite} detail="Saved for reuse" icon="⭐" />
              <MetricCard label="Filtered" value={filteredBusinessPhrases.length} detail="Current view" icon="🔎" />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_repeat(4,0.8fr)_auto] xl:items-end">
              <TextInput label="Search" value={businessPhraseFilters.search} onChange={(value) => updateBusinessPhraseFilter('search', value)} placeholder="Search phrase, example, use case, tag, skill, or notes" />
              <SelectInput label="Category" value={businessPhraseFilters.category} onChange={(value) => updateBusinessPhraseFilter('category', value)} options={businessCategoryOptions} />
              <SelectInput label="Level" value={businessPhraseFilters.level} onChange={(value) => updateBusinessPhraseFilter('level', value)} options={businessLevelOptions} />
              <SelectInput label="Difficulty" value={businessPhraseFilters.difficulty} onChange={(value) => updateBusinessPhraseFilter('difficulty', value)} options={businessDifficultyOptions} />
              <SelectInput label="Status" value={businessPhraseFilters.status} onChange={(value) => updateBusinessPhraseFilter('status', value)} options={[allFilterValue, 'New', 'Practiced', 'Favorite']} />
              <button type="button" onClick={clearBusinessPhraseFilters} className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Clear filters
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-teal-100 bg-teal-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-teal-950">Random phrase practice</p>
                <p className="mt-1 text-sm text-slate-600">
                  Pick from the currently filtered phrases.
                </p>
              </div>
              <button type="button" onClick={selectRandomBusinessPhrase} className="min-h-11 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800">
                Random Phrase
              </button>
            </div>

            {filteredBusinessPhrases.length === 0 && (
              <div className="mt-5">
                <EmptyState title="No business phrases match the current filters.">
                  Clear filters or broaden your search before choosing a random phrase.
                </EmptyState>
              </div>
            )}

            {selectedBusinessPhrase && (
              <article className="mt-5 rounded-lg border-2 border-teal-400 bg-white p-4 shadow-[0_12px_30px_rgba(13,148,136,0.14)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Selected phrase</p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">{selectedBusinessPhrase.phrase}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedBusinessPhrase.practicePrompt}</p>
              </article>
            )}

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {filteredBusinessPhrases.map((phrase) => {
                const phraseProgress = businessPhraseProgress[phrase.id] || {}
                const isSelected = selectedBusinessPhraseId === phrase.id

                return (
                  <article key={phrase.id} className={`rounded-lg border bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${isSelected ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-200'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{phrase.category}</span>
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">{phrase.level}</span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{phrase.difficulty}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-slate-950">{phrase.phrase}</h3>
                      </div>
                      <button type="button" onClick={() => updateBusinessPhraseProgress(phrase.id, { favorite: !phraseProgress.favorite })} className={`min-h-10 rounded-lg border px-3 text-sm font-bold ${phraseProgress.favorite ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                        {phraseProgress.favorite ? 'Favorite' : 'Add favorite'}
                      </button>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div><dt className="font-bold text-slate-950">Use case</dt><dd className="mt-1 leading-6 text-slate-600">{phrase.useCase}</dd></div>
                      <div><dt className="font-bold text-slate-950">Example</dt><dd className="mt-1 leading-6 text-slate-600">{phrase.example}</dd></div>
                      <div><dt className="font-bold text-slate-950">Related skills</dt><dd className="mt-1 leading-6 text-slate-600">{phrase.relatedSkills?.join(', ') || 'Not specified'}</dd></div>
                      <div><dt className="font-bold text-slate-950">Practice prompt</dt><dd className="mt-1 leading-6 text-slate-600">{phrase.practicePrompt}</dd></div>
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(phrase.tags || []).map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500">{tag}</span>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
                      <CheckboxRow
                        checked={Boolean(phraseProgress.practiced)}
                        onChange={() => updateBusinessPhraseProgress(phrase.id, { practiced: !phraseProgress.practiced })}
                      >
                        <span className="font-semibold text-slate-700">Practiced</span>
                      </CheckboxRow>
                      <TextArea label="Notes" rows={3} value={phraseProgress.notes || ''} onChange={(value) => updateBusinessPhraseProgress(phrase.id, { notes: value })} />
                    </div>
                  </article>
                )
              })}
            </div>
          </Card>
        )}

        {activeTab === 'notes' && (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Card title="Notes journal" subtitle="Learning observations" icon="📝">
              <form
                onSubmit={(event) => saveTrackerEntry(event, 'noteDraft', 'notes', emptyNoteDraft)}
                className="space-y-5"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Date" type="date" value={progress.noteDraft.date} onChange={(value) => updateNestedDraft('noteDraft', 'date', value)} />
                  <SelectInput
                    label="Category"
                    value={progress.noteDraft.category}
                    onChange={(value) => updateNestedDraft('noteDraft', 'category', value)}
                    options={['General', 'Grammar', 'Speaking', 'Writing', 'Listening', 'Pronunciation', 'Vocabulary', 'Teacher feedback']}
                  />
                </div>
                <TextInput
                  label="Title"
                  value={progress.noteDraft.title}
                  placeholder="Example: phrases for vendor meetings"
                  onChange={(value) => updateNestedDraft('noteDraft', 'title', value)}
                />
                <TextArea
                  label="Note"
                  rows={6}
                  value={progress.noteDraft.content}
                  placeholder="Write corrections, ideas, teacher feedback, or useful examples."
                  onChange={(value) => updateNestedDraft('noteDraft', 'content', value)}
                />
                <button type="submit" className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800">
                  Save note
                </button>
              </form>
            </Card>

            <Card title="Saved notes" subtitle={`${progress.notes.length} total`} icon="📓">
              <div className="space-y-3">
                {progress.notes.length === 0 && <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">No notes saved yet.</p>}
                {progress.notes.map((note) => (
                  <EntryCard
                    key={note.id}
                    title={note.title || 'Learning note'}
                    meta={`${note.date} • ${note.category}`}
                    onDelete={() => deleteTrackerEntry('notes', note.id)}
                  >
                    {note.content}
                  </EntryCard>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'teacher' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Official Level" value={teacherReportData.level.officialLevel} detail={`Target: ${teacherReportData.level.targetLevel}`} icon="🧭" />
              <MetricCard label="Suggested Level" value={teacherReportData.level.suggestedLevel} detail={`${teacherReportData.level.confidence} confidence`} icon="📌" />
              <MetricCard label="Weakest Skill" value={teacherReportData.skills.weakestSkill} detail={`Strongest: ${teacherReportData.skills.strongestSkill}`} icon="🔎" />
              <MetricCard label="Active Mistakes" value={teacherReportData.mistakes.activeCount} detail={`${teacherReportData.mistakes.fixedCount} fixed mistakes`} icon="🧩" />
            </div>

            <Card title="Teacher Mode Report" subtitle="Professional coaching summary" icon="👨‍🏫">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Single learner report</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{teacherReportData.profile.name}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Generated {new Date(teacherReportData.generatedAt).toLocaleString()} for a teacher or coach review session.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyTeacherReport}
                    className="min-h-11 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800"
                  >
                    Copy Teacher Report
                  </button>
                  <button
                    type="button"
                    onClick={printTeacherReport}
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50"
                  >
                    Print Report
                  </button>
                </div>
              </div>
              {teacherCopyMessage && <p className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm font-semibold text-teal-800">{teacherCopyMessage}</p>}
              {teacherReportFallbackText && (
                <textarea
                  readOnly
                  value={teacherReportFallbackText}
                  rows={10}
                  className="mt-4 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-700"
                />
              )}
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card title="Student Profile Summary" subtitle="Learner context" icon="👤">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <dl className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between gap-3"><dt>Name</dt><dd className="font-semibold text-slate-950">{teacherReportData.profile.name}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Official level</dt><dd className="font-semibold text-slate-950">{teacherReportData.profile.currentLevel}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Target level</dt><dd className="font-semibold text-slate-950">{teacherReportData.profile.targetLevel}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Main goal</dt><dd className="font-semibold text-slate-950">{teacherReportData.profile.mainGoal}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Plan intensity</dt><dd className="font-semibold text-slate-950">{teacherReportData.profile.planIntensity}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Plan duration</dt><dd className="font-semibold text-slate-950">{planDurationLabel}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Daily target</dt><dd className="font-semibold text-slate-950">{dailyTargetLabel}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Study days</dt><dd className="font-semibold text-slate-950">{teacherReportData.profile.studyDaysPerWeek}/week</dd></div>
                    <div className="flex justify-between gap-3"><dt>Current plan</dt><dd className="font-semibold text-slate-950">M{teacherReportData.plan.month} / W{teacherReportData.plan.week} / {teacherReportData.plan.day}</dd></div>
                  </dl>
                </div>
              </Card>

              <Card title="Level & Assessment Summary" subtitle="Official vs suggested" icon="🧭">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <dl className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between gap-3"><dt>Official level</dt><dd className="font-semibold text-slate-950">{teacherReportData.level.officialLevel}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Suggested level</dt><dd className="font-semibold text-slate-950">{teacherReportData.level.suggestedLevel}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Confidence</dt><dd className="font-semibold text-slate-950">{teacherReportData.level.confidence}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Level source</dt><dd className="font-semibold text-slate-950">{teacherReportData.level.source}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Last update</dt><dd className="font-semibold text-slate-950">{teacherReportData.level.lastUpdatedAt}</dd></div>
                  </dl>
                  <p className="mt-4 rounded-lg border border-white bg-white p-3 text-sm leading-6 text-slate-600">{teacherReportData.level.reason}</p>
                  <div className="mt-4 space-y-2">
                    {teacherReportData.level.evidence.length === 0 && <p className="text-sm text-slate-500">No level evidence saved yet.</p>}
                    {teacherReportData.level.evidence.slice(0, 4).map((evidence) => (
                      <p key={evidence} className="rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">{evidence}</p>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card title="Skill Evaluation Summary" subtitle="Scores and trends" icon="📊">
                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricCard label="Latest Evaluation" value={teacherReportData.skills.latestAverageScore ? `${teacherReportData.skills.latestAverageScore}/5` : 'None'} detail={teacherReportData.skills.latestEvaluationDate} icon="🧾" />
                  <MetricCard label="Weakest Skill" value={teacherReportData.skills.weakestSkill} detail="Priority coaching area" icon="🎯" />
                  <MetricCard label="Strongest Skill" value={teacherReportData.skills.strongestSkill} detail="Build from this strength" icon="⭐" />
                </div>
                <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
                  <div className="min-w-[620px]">
                  <div className="grid grid-cols-4 bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    <span>Skill</span>
                    <span>Latest</span>
                    <span>Average</span>
                    <span>Trend</span>
                  </div>
                  {teacherReportData.skills.rows.length === 0 && <p className="p-4 text-sm text-slate-500">No evaluation skills configured yet.</p>}
                  {teacherReportData.skills.rows.map((skill) => (
                    <div key={skill.id} className="grid grid-cols-4 border-t border-slate-100 px-3 py-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-950">{skill.name}</span>
                      <span>{skill.latestScore || 'N/A'}/5</span>
                      <span>{skill.averageScore || 'N/A'}/5</span>
                      <span>{skill.trend}</span>
                    </div>
                  ))}
                  </div>
                </div>
              </Card>

              <Card title="Mistakes Summary" subtitle="Evidence to review" icon="🧩">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Total</p><p className="mt-1 text-2xl font-bold text-slate-950">{teacherReportData.mistakes.total}</p></div>
                    <div className="rounded-lg bg-white p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Active</p><p className="mt-1 text-2xl font-bold text-slate-950">{teacherReportData.mistakes.activeCount}</p></div>
                    <div className="rounded-lg bg-white p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Fixed</p><p className="mt-1 text-2xl font-bold text-slate-950">{teacherReportData.mistakes.fixedCount}</p></div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-950">Most common active categories</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {teacherReportData.mistakes.mostCommonCategories.length === 0 && <span className="text-sm text-slate-500">No active categories yet.</span>}
                      {teacherReportData.mistakes.mostCommonCategories.slice(0, 5).map((item) => (
                        <span key={item.category} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">{item.category}: {item.count}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-950">Top mistakes to review</h3>
                    {teacherReportData.mistakes.topActiveMistakes.length === 0 && <p className="text-sm text-slate-500">No active mistakes yet.</p>}
                    {teacherReportData.mistakes.topActiveMistakes.map((mistake) => (
                      <div key={mistake.id} className="rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">
                        <p><strong className="text-rose-700">Wrong:</strong> {mistake.wrongSentence}</p>
                        <p className="mt-1"><strong className="text-teal-700">Correct:</strong> {mistake.correctSentence}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{mistake.category} • {mistake.source} • {mistake.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Speaking Practice" value={`${teacherReportData.speaking.completed}/${teacherReportData.speaking.total}`} detail={`${teacherReportData.speaking.completionPercentage}% complete`} icon="🎙️" />
              <MetricCard label="Business Phrases" value={`${teacherReportData.businessPhrases.practiced}/${teacherReportData.businessPhrases.total}`} detail={`${teacherReportData.businessPhrases.completionPercentage}% practiced, ${teacherReportData.businessPhrases.favorites} favorite`} icon="💼" />
              <MetricCard label="Writing Practice" value={teacherReportData.writing.total} detail={`Completed ${teacherReportData.writing.completed}, avg ${teacherReportData.writing.averageScore || 'N/A'}/5`} icon="✍️" />
              <MetricCard label="Listening Practice" value={teacherReportData.listening.total} detail={`${teacherReportData.listening.totalMinutes} minutes, avg ${teacherReportData.listening.averageScore || 'N/A'}/5`} icon="🎧" />
              <MetricCard label="Pronunciation" value={teacherReportData.pronunciation.total} detail={`Clarity ${teacherReportData.pronunciation.averageScore || 'N/A'}, confidence ${teacherReportData.pronunciation.averageConfidence || 'N/A'}`} icon="🔊" />
              <MetricCard label="Rubric Evidence" value={teacherReportData.rubric.total} detail={`Average ${teacherReportData.rubric.averageScore || 'N/A'}/5`} icon="📋" />
              <MetricCard label="Open Feedback Loops" value={teacherReportData.feedbackLoops.open} detail={`${teacherReportData.feedbackLoops.total} total loops`} icon="🔁" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card title="Practice Evidence" subtitle="Recent learner work" icon="🗂️">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">Recommended speaking topics</h3>
                      <div className="mt-2 space-y-2">
                        {teacherReportData.speaking.recommendedTopics.length === 0 && <p className="text-sm text-slate-500">No incomplete speaking topics available.</p>}
                        {teacherReportData.speaking.recommendedTopics.map((topic) => (
                          <p key={topic.id} className="rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">{topic.title} • {topic.category} • {topic.durationMinutes} min</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">Recent writing entries</h3>
                      <div className="mt-2 space-y-2">
                        {teacherReportData.writing.recentEntries.length === 0 && <p className="text-sm text-slate-500">No writing practice entries yet.</p>}
                        {teacherReportData.writing.recentEntries.map((entry) => (
                          <p key={entry.id} className="rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">{entry.title || entry.type} • {entry.status} • {entry.score || 'N/A'}/5</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">Accent exposure</h3>
                      <p className="mt-2 rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">{teacherReportData.listening.accentExposure}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">Pronunciation focus areas</h3>
                      <p className="mt-2 rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">
                        {teacherReportData.pronunciation.focusAreas.length ? teacherReportData.pronunciation.focusAreas.join(', ') : 'No pronunciation focus areas yet.'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">Rubric and feedback evidence</h3>
                      <p className="mt-2 rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">
                        {teacherReportData.rubric.latest
                          ? `Latest rubric: ${teacherReportData.rubric.latest.skillName} ${teacherReportData.rubric.latest.overallScore}/5. Open loops: ${teacherReportData.feedbackLoops.open}.`
                          : `No rubric assessments yet. Open loops: ${teacherReportData.feedbackLoops.open}.`}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Recommendation for Teacher" subtitle="Next 1-3 sessions" icon="🎯">
                <div className="grid gap-4">
                  {[
                    ['Recommended focus', teacherReportData.recommendations.focusAreas],
                    ['Suggested lesson activities', teacherReportData.recommendations.lessonActivities],
                    ['Suggested homework', teacherReportData.recommendations.homeworkSuggestions],
                    ['Skills to monitor', teacherReportData.recommendations.monitoringNotes],
                  ].map(([title, items]) => (
                    <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-bold text-slate-950">{title}</h3>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                        {items.map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card title="Teacher Notes" subtitle="Coach notes and homework" icon="📝">
              <div className="grid gap-4 lg:grid-cols-2">
                <TextArea
                  label="Teacher notes"
                  rows={5}
                  value={teacherNotes.generalNotes}
                  placeholder="Write session observations, correction priorities, or learner behavior notes."
                  onChange={(value) => updateTeacherNotes('generalNotes', value)}
                />
                <TextArea
                  label="Next session focus"
                  rows={5}
                  value={teacherNotes.nextSessionFocus}
                  placeholder="Example: prepositions in project updates + meeting roleplay."
                  onChange={(value) => updateTeacherNotes('nextSessionFocus', value)}
                />
                <TextArea
                  label="Homework recommendation"
                  rows={5}
                  value={teacherNotes.homeworkRecommendation}
                  placeholder="Example: record a 3-minute status update and write one corrected email."
                  onChange={(value) => updateTeacherNotes('homeworkRecommendation', value)}
                />
                <TextArea
                  label="Coach comments"
                  rows={5}
                  value={teacherNotes.coachComments}
                  placeholder="Add comments to discuss with the learner."
                  onChange={(value) => updateTeacherNotes('coachComments', value)}
                />
              </div>
              <p className="mt-4 text-sm text-slate-500">Last saved: {teacherNotes.updatedAt || 'Not saved yet'}</p>
            </Card>
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Card title="Periodic evaluation" subtitle="Weekly or monthly" icon="🧾">
              <form onSubmit={saveEvaluation} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Date</span>
                    <input
                      type="date"
                      value={progress.evaluationDraft.date}
                      onChange={(event) => updateDraft('date', event.target.value)}
                      className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Type</span>
                    <select
                      value={progress.evaluationDraft.type}
                      onChange={(event) => updateDraft('type', event.target.value)}
                      className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    >
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {evaluationSkills.map((skill) => (
                    <ScoreInput
                      key={skill.id}
                      label={`${skill.name} /5`}
                      value={progress.evaluationDraft.scores?.[skill.id] || 3}
                      onChange={(value) => updateEvaluationScore(skill.id, value)}
                    />
                  ))}
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Notes</span>
                  <textarea
                    value={progress.evaluationDraft.notes}
                    onChange={(event) => updateDraft('notes', event.target.value)}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Next Focus</span>
                  <textarea
                    value={progress.evaluationDraft.nextFocus}
                    onChange={(event) => updateDraft('nextFocus', event.target.value)}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  />
                </label>
                <button type="submit" className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800">
                  Save evaluation
                </button>
              </form>
            </Card>

            <div className="space-y-6">
              <Card title="Evaluation Settings" subtitle="Skills and weights" icon="⚙️">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm leading-6 text-slate-600">
                    Customize which skills are evaluated. Weight 1 is light; weight 5 has the strongest impact on the average.
                  </p>
                  <button
                    type="button"
                    onClick={addEvaluationSkill}
                    className="min-h-10 shrink-0 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Add custom skill
                  </button>
                </div>
                <div className="space-y-3">
                  {evaluationSkills.map((skill) => (
                    <div key={skill.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
                      <TextInput
                        label="Skill name"
                        value={skill.name}
                        onChange={(value) => updateEvaluationSkill(skill.id, { name: value })}
                      />
                      <TextInput
                        label="Weight"
                        type="number"
                        min="1"
                        max="5"
                        value={skill.weight}
                        onChange={(value) => updateEvaluationSkill(skill.id, { weight: Math.min(5, Math.max(1, value)) })}
                      />
                      <button
                        type="button"
                        onClick={() => deleteEvaluationSkill(skill.id)}
                        className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Saved evaluations" subtitle={`${progress.evaluations.length} total`} icon="📋">
                <div className="space-y-3">
                  {progress.evaluations.length === 0 && (
                    <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">No evaluations saved yet.</p>
                  )}
                  {progress.evaluations.map((evaluation) => {
                    const evaluationSkillSet = getEvaluationSkillsForEvaluation(
                      evaluation,
                      evaluation.skills || evaluationSkills,
                      legacyEvaluationSkillIds,
                      normalizeEvaluationSkills,
                    )
                    return (
                      <article key={evaluation.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-950">
                              {evaluation.type} evaluation - {evaluation.date}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Weighted average: <strong>{getEvaluationAverage(evaluation, evaluationSkillSet, normalizeEvaluationSkills)}/5</strong>
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Weakest skill: <strong>{getWeakestSkill(evaluation, evaluationSkillSet, normalizeEvaluationSkills)}</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteEvaluation(evaluation.id)}
                            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {evaluationSkillSet.map((skill) => (
                            <span key={skill.id} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                              {skill.name}: {getEvaluationScore(evaluation, skill.id) || '-'}/5 · w{skill.weight}
                            </span>
                          ))}
                        </div>
                        {(evaluation.notes || evaluation.nextFocus) && (
                          <div className="mt-3 space-y-2 text-sm text-slate-600">
                            {evaluation.notes && <p>Notes: {evaluation.notes}</p>}
                            {evaluation.nextFocus && <p>Next focus: {evaluation.nextFocus}</p>}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Average Eval Score" value={`${averageEvaluationScore}/5`} detail="Latest saved evaluation" icon="⭐" />
              <MetricCard label="Weakest Skill" value={weakestSkill} detail="Based on latest evaluation" icon="🔎" />
              <MetricCard label="Daily Tasks" value={`${completedDailyTasks}/${totalDailyTasks}`} detail="Completed this week" icon="✅" />
              <MetricCard label="Evaluations" value={progress.evaluations.length} detail="Saved progress reviews" icon="🧾" />
            </div>
            <Card title="Progress analytics" subtitle="Completion by area" icon="📈">
              <div className="grid gap-4 md:grid-cols-2">
                {analytics.map((item) => {
                  const percent = calculatePercentage(item.done, item.total)
                  return (
                    <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-950">{item.icon} {item.label}</p>
                          <p className="text-sm text-slate-500">{item.done}/{item.total} completed</p>
                        </div>
                        <span className="text-lg font-bold text-slate-950">{item.value}</span>
                      </div>
                      <ProgressBar value={percent} />
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <Card title="Profile Settings" subtitle="Learner configuration" icon="⚙️">
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput
                  label="Name"
                  value={profile.name}
                  onChange={(value) => updateProfile('name', value)}
                />
                <SelectInput
                  label="Main goal"
                  value={profile.mainGoal}
                  onChange={(value) => updateProfile('mainGoal', value)}
                  options={mainGoalOptions}
                />
                <SelectInput
                  label="Plan Intensity"
                  value={profile.planIntensity}
                  onChange={(value) => updateProfile('planIntensity', value)}
                  options={planIntensityOptions}
                />
                <SelectInput
                  label="Current level"
                  value={profile.currentLevel}
                  onChange={(value) => updateProfile('currentLevel', value)}
                  options={currentLevelOptions}
                />
                <SelectInput
                  label="Target level"
                  value={profile.targetLevel}
                  onChange={(value) => updateProfile('targetLevel', value)}
                  options={targetLevelOptions}
                />
                <TextInput
                  label="Plan duration in months"
                  type="number"
                  min="1"
                  value={profile.planDurationMonths}
                  onChange={(value) => updateProfile('planDurationMonths', value)}
                />
                <TextInput
                  label="Daily study minutes"
                  type="number"
                  min="10"
                  value={profile.dailyStudyMinutes}
                  onChange={(value) => updateProfile('dailyStudyMinutes', value)}
                />
                <TextInput
                  label="Study days per week"
                  type="number"
                  min="1"
                  max="7"
                  value={profile.studyDaysPerWeek}
                  onChange={(value) => updateProfile('studyDaysPerWeek', Math.min(7, Math.max(1, value)))}
                />
              </div>

              <div className="mt-6 rounded-lg border border-teal-100 bg-teal-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-bold text-teal-900">{profile.planIntensity} recommendation</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Duration: <strong>{selectedIntensity.durationLabel}</strong>. Daily study:{' '}
                      <strong>{selectedIntensity.dailyStudyLabel}</strong>. Study rhythm:{' '}
                      <strong>{selectedIntensity.studyDaysLabel}</strong>. Focus:{' '}
                      <strong>{selectedIntensity.focus}</strong>.
                    </p>
                    {selectedIntensity.warning && (
                      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                        {selectedIntensity.warning}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={applyIntensityRecommendations}
                    className="min-h-11 shrink-0 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800"
                  >
                    Apply Recommended Settings for Selected Intensity
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-700">Primary focus areas</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {focusAreaOptions.map((focusArea) => (
                    <CheckboxRow
                      key={focusArea}
                      checked={(profile.primaryFocusAreas || []).includes(focusArea)}
                      onChange={() => toggleProfileFocusArea(focusArea)}
                    >
                      {focusArea}
                    </CheckboxRow>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={resetProfileToDefault}
                className="mt-6 min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Reset to Default Mohamed Profile
              </button>
            </Card>

            <Card title="Live profile preview" subtitle="Dashboard source" icon="👤">
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Learner</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{profile.name}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {profile.currentLevel} → {profile.targetLevel}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-500">Goal</p>
                    <p className="mt-1 font-bold text-slate-950">{profile.mainGoal}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-500">Intensity</p>
                    <p className="mt-1 font-bold text-slate-950">{profile.planIntensity}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-500">Plan</p>
                    <p className="mt-1 font-bold text-slate-950">{planDurationLabel}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-500">Daily study</p>
                    <p className="mt-1 font-bold text-slate-950">{dailyTargetLabel}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-500">Weekly rhythm</p>
                    <p className="mt-1 font-bold text-slate-950">{profile.studyDaysPerWeek} days/week</p>
                  </div>
                </div>
                <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
                  <p className="text-sm font-bold text-teal-900">Primary focus areas</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(profile.primaryFocusAreas || []).map((focusArea) => (
                      <span key={focusArea} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-teal-800">
                        {focusArea}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Backup and data management" subtitle={`App version ${APP_VERSION}`} icon="💾">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={resetWeeklyProgress}
                  className="min-h-11 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
                >
                  Reset weekly progress
                </button>
                <button
                  type="button"
                  onClick={exportData}
                  className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Export to JSON file
                </button>
                <button
                  type="button"
                  onClick={copyBackupJson}
                  className="min-h-11 rounded-lg border border-teal-200 bg-teal-50 px-4 text-sm font-bold text-teal-800 transition hover:bg-teal-100"
                >
                  Copy backup JSON
                </button>
                <button
                  type="button"
                  onClick={restoreDefaultData}
                  className="min-h-11 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
                >
                  Restore default data
                </button>
                <button
                  type="button"
                  onClick={clearAllData}
                  className="min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                >
                  Clear all saved data
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Export includes profile, plan intensity, daily plan configuration, completed tasks,
                structured learning plan, level profile, level history, practice trackers, mistakes, evaluation skill settings, saved evaluations, content library, notes, app version, and export date.
              </p>
              {copyMessage && <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">{copyMessage}</p>}
            </Card>

            <Card title="Import backup" subtitle="Upload or paste JSON" icon="📥">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Import from JSON file</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={importFromJsonFile}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
                />
              </label>
              <div className="my-4 border-t border-slate-100" />
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                rows={10}
                placeholder="Paste backup JSON here"
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={importData}
                className="mt-3 min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800"
              >
                Validate and import JSON
              </button>
              {importMessage && (
                <p className={`mt-3 rounded-lg border p-3 text-sm ${
                  importMessage.includes('failed')
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-slate-100 bg-slate-50 text-slate-600'
                }`}>
                  {importMessage}
                </p>
              )}
            </Card>
          </div>
        )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
