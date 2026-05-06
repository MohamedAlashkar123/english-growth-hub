export const legacyEvaluationSkillIds = ['speaking', 'listening', 'grammar', 'vocabulary', 'pronunciation', 'writing']

export const defaultEvaluationSkills = [
  'Speaking',
  'Listening',
  'Grammar',
  'Vocabulary',
  'Pronunciation',
  'Writing',
  'Fluency',
  'Confidence',
].map((name) => ({
  id: name.toLowerCase(),
  name,
  weight: 3,
}))
