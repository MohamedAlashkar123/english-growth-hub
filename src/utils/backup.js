import { APP_VERSION } from '../config'
import { safeJsonParse } from './storage'
import { normalizeImportedProgress } from './normalizers'

export function createBackupPayload(progress) {
  return {
    appVersion: APP_VERSION,
    exportDate: new Date().toISOString(),
    progress,
  }
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Backup must be a JSON object.'
  }

  const source = payload.progress && typeof payload.progress === 'object' ? payload.progress : payload
  if (!source.profile || typeof source.profile !== 'object' || typeof source.profile.name !== 'string') {
    return 'Backup is missing user profile data.'
  }

  if (source.dailyPlan !== undefined && !Array.isArray(source.dailyPlan)) {
    return 'Daily plan configuration must be an array.'
  }

  if (source.learningPlan !== undefined && (typeof source.learningPlan !== 'object' || !Array.isArray(source.learningPlan.months))) {
    return 'Learning plan configuration must include a months array.'
  }

  if (source.speakingTopicsBank !== undefined && !Array.isArray(source.speakingTopicsBank)) {
    return 'Speaking topics bank must be an array.'
  }

  if (source.speakingTopicProgress !== undefined && typeof source.speakingTopicProgress !== 'object') {
    return 'Speaking topic progress must be an object.'
  }

  if (source.contentLibrary !== undefined && typeof source.contentLibrary !== 'object') {
    return 'Content library data must be an object.'
  }

  if (source.evaluationSkills !== undefined && !Array.isArray(source.evaluationSkills)) {
    return 'Evaluation skill settings must be an array.'
  }

  if (source.evaluations !== undefined && !Array.isArray(source.evaluations)) {
    return 'Saved evaluations must be an array.'
  }

  if (source.mistakes !== undefined && !Array.isArray(source.mistakes)) {
    return 'Mistakes must be an array.'
  }

  if (source.levelProfile !== undefined && typeof source.levelProfile !== 'object') {
    return 'Level profile must be an object.'
  }

  if (source.levelHistory !== undefined && !Array.isArray(source.levelHistory)) {
    return 'Level history must be an array.'
  }

  if (source.writingEntries !== undefined && !Array.isArray(source.writingEntries)) {
    return 'Writing practice entries must be an array.'
  }

  if (source.listeningEntries !== undefined && !Array.isArray(source.listeningEntries)) {
    return 'Listening practice entries must be an array.'
  }

  if (source.pronunciationEntries !== undefined && !Array.isArray(source.pronunciationEntries)) {
    return 'Pronunciation practice entries must be an array.'
  }

  if (source.teacherNotes !== undefined && (typeof source.teacherNotes !== 'object' || Array.isArray(source.teacherNotes))) {
    return 'Teacher notes must be an object.'
  }

  if (source.rubricAssessments !== undefined && !Array.isArray(source.rubricAssessments)) {
    return 'Rubric assessments must be an array.'
  }

  if (source.feedbackLoops !== undefined && !Array.isArray(source.feedbackLoops)) {
    return 'Feedback loops must be an array.'
  }

  return ''
}

export function parseAndNormalizeBackup(jsonText, defaultProgress, emptyDrafts) {
  const imported = safeJsonParse(jsonText, null)
  if (!imported || typeof imported !== 'object') {
    return { error: 'Import failed. Please paste valid JSON data.' }
  }

  const validationError = validateBackupPayload(imported)
  if (validationError) {
    return { error: `Import failed. ${validationError}` }
  }

  const progress = normalizeImportedProgress(imported, defaultProgress, emptyDrafts)
  if (!progress) {
    return { error: 'Import failed. The backup data could not be normalized.' }
  }

  return { imported, progress }
}
