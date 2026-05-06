import {
  defaultContentLibrary,
  defaultDailyPlan,
  defaultEvaluationSkills,
  defaultSpeakingTopics,
  defaultProfile,
  getDailyTaskId,
  getDailyTopicId,
  legacyEvaluationSkillIds,
  speakingStructure,
} from '../config'
import { migrateCompletedDailyTasksToPlan, normalizeLearningPlan } from './planUtils'
import { cloneData } from './storage'
import { normalizeTeacherNotes } from './teacherReport'

export const mistakeCategories = [
  'Grammar',
  'Vocabulary',
  'Pronunciation',
  'Sentence Structure',
  'Articles',
  'Prepositions',
  'Tense',
  'Question Formation',
  'Professional Tone',
  'Business Phrase',
  'Fluency',
]

export const mistakeSources = ['Speaking', 'Writing', 'Teacher', 'Self-review', 'Meeting', 'Email', 'Evaluation']
export const mistakeStatuses = ['New', 'Practicing', 'Fixed']

export function normalizeDailyPlan(plan) {
  const sourcePlan = Array.isArray(plan) && plan.length > 0 ? plan : defaultDailyPlan

  return sourcePlan.map((day, dayIndex) => {
    const defaultDay = defaultDailyPlan[dayIndex] || defaultDailyPlan[0]
    const dayName = day.day || defaultDay.day
    const rawTasks = Array.isArray(day.tasks) ? day.tasks : defaultDay.tasks
    const rawTopics = Array.isArray(day.speakingTopics)
      ? day.speakingTopics
      : [{ id: getDailyTopicId(dayName, 0), text: day.topic || defaultDay.speakingTopics[0].text }]

    return {
      day: dayName,
      focus: day.focus || defaultDay.focus,
      tasks: rawTasks.map((task, taskIndex) => ({
        id: typeof task === 'string' ? getDailyTaskId(dayName, taskIndex) : task.id || getDailyTaskId(dayName, taskIndex),
        text: typeof task === 'string' ? task : task.text || '',
      })),
      speakingTopics: rawTopics.map((topic, topicIndex) => ({
        id: typeof topic === 'string' ? getDailyTopicId(dayName, topicIndex) : topic.id || getDailyTopicId(dayName, topicIndex),
        text: typeof topic === 'string' ? topic : topic.text || '',
      })),
    }
  })
}

export function normalizeMistake(item = {}, index = 0) {
  const status = mistakeStatuses.includes(item.status) ? item.status : 'New'
  const now = new Date().toISOString()
  const category = mistakeCategories.includes(item.category || item.area) ? item.category || item.area : 'Grammar'

  return {
    id: item.id || `mistake-${index + 1}`,
    wrongSentence: item.wrongSentence || item.mistake || '',
    correctSentence: item.correctSentence || item.correction || '',
    category,
    rule: item.rule || item.tip || '',
    source: mistakeSources.includes(item.source) ? item.source : 'Self-review',
    status,
    relatedSkill: item.relatedSkill || category,
    relatedGrammarTopicId: item.relatedGrammarTopicId || '',
    notes: item.notes || '',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
    fixedAt: status === 'Fixed' ? item.fixedAt || now : '',
  }
}

export function normalizeMistakes(mistakes, legacyMistakes = []) {
  const sourceMistakes = Array.isArray(mistakes) && mistakes.length > 0
    ? mistakes
    : Array.isArray(legacyMistakes) && legacyMistakes.length > 0
      ? legacyMistakes
      : defaultContentLibrary.commonMistakes
  const seenIds = new Set()

  return sourceMistakes.map((item, index) => {
    const normalized = normalizeMistake(item, index)
    const id = seenIds.has(normalized.id) ? `${normalized.id}-${index + 1}` : normalized.id
    seenIds.add(id)
    return { ...normalized, id }
  })
}

export function updateMistakeStatusFields(mistake, status) {
  const nextStatus = mistakeStatuses.includes(status) ? status : 'New'
  const now = new Date().toISOString()

  return {
    ...mistake,
    status: nextStatus,
    updatedAt: now,
    fixedAt: nextStatus === 'Fixed' ? mistake.fixedAt || now : '',
  }
}

export function normalizeEvaluationSkills(skills) {
  const sourceSkills = Array.isArray(skills) && skills.length > 0 ? skills : defaultEvaluationSkills

  return sourceSkills.map((skill, index) => ({
    id: skill.id || `skill-${index + 1}`,
    name: skill.name || `Skill ${index + 1}`,
    weight: Math.min(5, Math.max(1, Number(skill.weight || 3))),
  }))
}

export function normalizeContentLibrary(library, savedProgress = {}) {
  const source = library && typeof library === 'object' ? library : {}

  return {
    grammarTopics: (source.grammarTopics || defaultContentLibrary.grammarTopics).map((item, index) => ({
      id: item.id || `grammar-content-${index + 1}`,
      title: item.title || 'Grammar topic',
      level: item.level || 'B1-B2',
      priority: item.priority || 'Medium',
      category: item.category || 'Grammar',
      explanation: item.explanation || '',
      examples: Array.isArray(item.examples) ? item.examples : [],
      workExamples: item.workExamples || item.examples || '',
      practiceTask: item.practiceTask || '',
      completed: Boolean(item.completed || savedProgress.completedGrammarTopics?.[item.id]),
      notes: item.notes || '',
    })),
    speakingTopics: (source.speakingTopics || defaultContentLibrary.speakingTopics).map((item, index) => ({
      id: item.id || `speaking-content-${index + 1}`,
      title: item.title || 'Speaking topic',
      category: item.category || 'General',
      difficulty: item.difficulty || 'Medium',
      duration: item.duration || item.suggestedDuration || '5 min',
      structure: item.structure || speakingStructure.join(', '),
      usefulPhrases: item.usefulPhrases || '',
      completed: Boolean(item.completed || savedProgress.completedSpeakingTopics?.[item.id]),
    })),
    businessPhrases: (source.businessPhrases || defaultContentLibrary.businessPhrases).map((item, index) => ({
      id: item.id || `phrase-content-${index + 1}`,
      phrase: item.phrase || item.title || 'Business phrase',
      category: item.category || 'General',
      useCase: item.useCase || item.exampleUseCase || '',
      exampleUseCase: item.exampleUseCase || item.useCase || '',
      level: item.level || 'B1+ / B2',
      tags: Array.isArray(item.tags) ? item.tags : [],
      practiced: Boolean(item.practiced || savedProgress.completedBusinessPhrases?.[item.id]),
      notes: item.notes || '',
    })),
    pronunciationSentences: (source.pronunciationSentences || defaultContentLibrary.pronunciationSentences).map((item, index) => ({
      id: item.id || `pronunciation-content-${index + 1}`,
      sentence: item.sentence || 'Practice sentence',
      focusArea: item.focusArea || 'Clarity',
      repetitionTarget: Number(item.repetitionTarget || 10),
      level: item.level || 'B1+ / B2',
      completed: Boolean(item.completed),
      notes: item.notes || '',
    })),
    writingTemplates: (source.writingTemplates || defaultContentLibrary.writingTemplates).map((item, index) => ({
      id: item.id || `writing-template-${index + 1}`,
      title: item.title || item.templateTitle || 'Writing template',
      type: item.type || 'General',
      body: item.body || item.templateBody || '',
      notes: item.notes || '',
      level: item.level || 'B1+ / B2',
      tags: Array.isArray(item.tags) ? item.tags : [],
    })),
    commonMistakes: (source.commonMistakes || defaultContentLibrary.commonMistakes).map((item, index) => ({
      id: item.id || `mistake-content-${index + 1}`,
      wrongSentence: item.wrongSentence || item.mistake || '',
      correctSentence: item.correctSentence || item.correction || '',
      rule: item.rule || item.tip || '',
      status: item.status || (savedProgress.reviewedCommonMistakes?.[item.id] ? 'Fixed' : 'New'),
      notes: item.notes || '',
    })),
  }
}

export function normalizeSpeakingTopics(topics, existingTopics = []) {
  const suppliedTopics = Array.isArray(topics) ? topics : []
  const defaultIds = new Set(defaultSpeakingTopics.map((topic) => topic.id))
  const sourceTopics =
    suppliedTopics.length > 0
      ? [...defaultSpeakingTopics, ...suppliedTopics.filter((topic) => topic?.id && !defaultIds.has(topic.id))]
      : defaultSpeakingTopics
  const seenIds = new Set()

  const normalizeTopic = (topic, index) => {
    const fallbackId = `spk-${String(index + 1).padStart(3, '0')}`
    const baseId = topic.id || fallbackId
    const id = seenIds.has(baseId) ? `${baseId}-${index + 1}` : baseId
    seenIds.add(id)

    return {
      id,
      title: topic.title || 'Speaking topic',
      category: topic.category || 'General Fluency',
      difficulty: topic.difficulty || 'B1+',
      level: topic.level || 'B1+ / B2',
      durationMinutes: Number(topic.durationMinutes || topic.duration || 5),
      tags: Array.isArray(topic.tags) ? topic.tags : [],
      speakingStructure: Array.isArray(topic.speakingStructure)
        ? topic.speakingStructure
        : String(topic.structure || speakingStructure.join(','))
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
      usefulPhrases: Array.isArray(topic.usefulPhrases)
        ? topic.usefulPhrases
        : String(topic.usefulPhrases || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
      promptQuestions: Array.isArray(topic.promptQuestions) ? topic.promptQuestions : [],
      relatedSkills: Array.isArray(topic.relatedSkills) ? topic.relatedSkills : ['Speaking'],
      recommendedFor: Array.isArray(topic.recommendedFor) ? topic.recommendedFor : [],
      notesPrompt: topic.notesPrompt || 'Write your mistakes, repeated phrases, and next improvement point.',
    }
  }

  const normalized = sourceTopics.map(normalizeTopic)

  const generatedIds = new Set(normalized.map((topic) => topic.id))
  const migratedExistingTopics = existingTopics
    .filter((topic) => topic?.id && !generatedIds.has(topic.id))
    .map((topic, index) => normalizeTopic(topic, normalized.length + index))

  return [...normalized, ...migratedExistingTopics]
}

export function normalizeSpeakingTopicProgress(progress = {}, speakingTopics = [], legacyTopics = []) {
  const source = progress && typeof progress === 'object' ? progress : {}
  const normalized = {}

  speakingTopics.forEach((topic) => {
    const legacyTopic = legacyTopics.find((item) => item.id === topic.id || item.title === topic.title)
    const saved = source[topic.id] || {}
    const completed = Boolean(saved.completed || legacyTopic?.completed)

    if (completed || saved.notes || saved.lastPracticedAt) {
      normalized[topic.id] = {
        completed,
        notes: saved.notes || '',
        lastPracticedAt: saved.lastPracticedAt || (completed ? new Date().toISOString() : ''),
      }
    }
  })

  return normalized
}

function normalizeScore(value) {
  if (value === '' || value === null || value === undefined) return ''
  const score = Number(value)
  return Number.isFinite(score) ? Math.min(5, Math.max(1, score)) : ''
}

export function normalizeWritingEntries(entries = []) {
  const sourceEntries = Array.isArray(entries) ? entries : []
  return sourceEntries.map((entry, index) => {
    const createdAt = entry.createdAt || new Date().toISOString()
    return {
      id: entry.id || `writing-entry-${index + 1}`,
      date: entry.date || createdAt.slice(0, 10),
      type: entry.type || 'Professional Email',
      title: entry.title || entry.topic || entry.type || 'Writing practice',
      originalDraft: entry.originalDraft || entry.content || '',
      correctedVersion: entry.correctedVersion || '',
      mistakesNoticed: entry.mistakesNoticed || entry.feedback || '',
      usefulPhrases: entry.usefulPhrases || '',
      score: normalizeScore(entry.score || entry.clarityScore || entry.grammarScore),
      status: entry.status || 'Drafted',
      relatedSkills: Array.isArray(entry.relatedSkills) ? entry.relatedSkills : ['Writing'],
      notes: entry.notes || entry.feedback || '',
      createdAt,
      updatedAt: entry.updatedAt || createdAt,
    }
  })
}

export function normalizeListeningEntries(entries = []) {
  const sourceEntries = Array.isArray(entries) ? entries : []
  return sourceEntries.map((entry, index) => {
    const createdAt = entry.createdAt || new Date().toISOString()
    return {
      id: entry.id || `listening-entry-${index + 1}`,
      date: entry.date || createdAt.slice(0, 10),
      title: entry.title || entry.source || 'Listening practice',
      sourceLink: entry.sourceLink || '',
      category: entry.category || 'Business Meeting',
      accent: entry.accent || 'Mixed',
      durationMinutes: Number(entry.durationMinutes || entry.minutes || 10),
      difficulty: entry.difficulty || 'Medium',
      mainIdea: entry.mainIdea || '',
      usefulPhrases: entry.usefulPhrases || entry.newExpressions || '',
      summary: entry.summary || entry.actionItems || '',
      score: normalizeScore(entry.score || Math.ceil(Number(entry.understoodPercent || 0) / 20) || ''),
      status: entry.status || 'Planned',
      notes: entry.notes || '',
      createdAt,
      updatedAt: entry.updatedAt || createdAt,
    }
  })
}

export function normalizePronunciationEntries(entries = []) {
  const sourceEntries = Array.isArray(entries) ? entries : []
  return sourceEntries.map((entry, index) => {
    const createdAt = entry.createdAt || new Date().toISOString()
    return {
      id: entry.id || `pronunciation-entry-${index + 1}`,
      date: entry.date || createdAt.slice(0, 10),
      sentence: entry.sentence || '',
      focusArea: entry.focusArea || entry.focusSound || 'Meeting Sentences',
      repetitionsTarget: Number(entry.repetitionsTarget || entry.repetitionTarget || 10),
      repetitionsDone: Number(entry.repetitionsDone || entry.repetitions || 0),
      clarityScore: normalizeScore(entry.clarityScore),
      confidenceScore: normalizeScore(entry.confidenceScore || entry.clarityScore),
      status: entry.status || 'New',
      notes: entry.notes || '',
      createdAt,
      updatedAt: entry.updatedAt || createdAt,
    }
  })
}

export function getAverageScore(entries = [], field = 'score') {
  const scores = entries.map((entry) => Number(entry[field])).filter((score) => Number.isFinite(score) && score > 0)
  return scores.length ? Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1)) : 0
}

export function normalizeEvaluationDraft(draft, skills, emptyEvaluation) {
  const sourceDraft = { ...emptyEvaluation, ...draft }
  const scores = { ...(sourceDraft.scores || {}) }

  skills.forEach((skill) => {
    if (scores[skill.id] === undefined) {
      scores[skill.id] = sourceDraft[skill.id] || 3
    }
  })

  return { ...sourceDraft, scores }
}

export function createDefaultProgress(defaultProgress, emptyDrafts) {
  return {
    ...cloneData(defaultProgress),
    evaluationDraft: { ...emptyDrafts.emptyEvaluation, date: emptyDrafts.todayIso() },
    writingDraft: { ...emptyDrafts.emptyWritingDraft, date: emptyDrafts.todayIso() },
    writingEntries: normalizeWritingEntries(defaultProgress.writingEntries),
    listeningDraft: { ...emptyDrafts.emptyListeningDraft, date: emptyDrafts.todayIso() },
    listeningEntries: normalizeListeningEntries(defaultProgress.listeningEntries),
    pronunciationDraft: { ...emptyDrafts.emptyPronunciationDraft, date: emptyDrafts.todayIso() },
    pronunciationEntries: normalizePronunciationEntries(defaultProgress.pronunciationEntries),
    noteDraft: { ...emptyDrafts.emptyNoteDraft, date: emptyDrafts.todayIso() },
  }
}

export function normalizeImportedProgress(imported, defaultProgress, emptyDrafts) {
  const source = imported?.progress && typeof imported.progress === 'object' ? imported.progress : imported
  if (!source || typeof source !== 'object') return null

  const evaluationSkills = normalizeEvaluationSkills(source.evaluationSkills)
  const profile = { ...defaultProfile, ...source.profile }
  const dailyPlan = normalizeDailyPlan(source.dailyPlan)
  const learningPlan = normalizeLearningPlan(source.learningPlan, profile, dailyPlan)
  const contentLibrary = normalizeContentLibrary(source.contentLibrary, source)
  const mistakes = normalizeMistakes(source.mistakes, contentLibrary.commonMistakes)
  const speakingTopicsBank = normalizeSpeakingTopics(source.speakingTopicsBank, contentLibrary.speakingTopics)
  const speakingTopicProgress = normalizeSpeakingTopicProgress(
    source.speakingTopicProgress,
    speakingTopicsBank,
    contentLibrary.speakingTopics,
  )

  return {
    ...createDefaultProgress(defaultProgress, emptyDrafts),
    ...source,
    profile,
    levelProfile: source.levelProfile || {},
    levelHistory: Array.isArray(source.levelHistory) ? source.levelHistory : [],
    dailyPlan,
    learningPlan,
    mistakes,
    speakingTopicsBank,
    speakingTopicProgress,
    selectedMonth: Number(source.selectedMonth || 1),
    selectedWeek: Number(source.selectedWeek || 1),
    contentLibrary,
    evaluationSkills,
    evaluationDraft: normalizeEvaluationDraft(source.evaluationDraft, evaluationSkills, emptyDrafts.emptyEvaluation),
    writingDraft: { ...emptyDrafts.emptyWritingDraft, ...source.writingDraft },
    writingEntries: normalizeWritingEntries(source.writingEntries || source.writingPracticeEntries),
    listeningDraft: { ...emptyDrafts.emptyListeningDraft, ...source.listeningDraft },
    listeningEntries: normalizeListeningEntries(source.listeningEntries || source.listeningPracticeEntries),
    pronunciationDraft: { ...emptyDrafts.emptyPronunciationDraft, ...source.pronunciationDraft },
    pronunciationEntries: normalizePronunciationEntries(source.pronunciationEntries || source.pronunciationPracticeEntries),
    noteDraft: { ...emptyDrafts.emptyNoteDraft, ...source.noteDraft },
    teacherNotes: normalizeTeacherNotes(source.teacherNotes),
    completedPlanTasks: migrateCompletedDailyTasksToPlan(
      learningPlan,
      source.completedDailyTasks,
      source.completedPlanTasks,
    ),
  }
}

export { legacyEvaluationSkillIds }
