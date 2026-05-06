export const levelSummary = [
  { skill: 'Speaking', level: 'B1+ / B2', note: 'Can explain work topics, needs smoother fluency.' },
  { skill: 'Listening', level: 'B1+', note: 'Understands common business topics with focused listening.' },
  { skill: 'Grammar', level: 'B1', note: 'Needs stronger accuracy in tense, articles, and sentence control.' },
  { skill: 'Vocabulary', level: 'B2', note: 'Good business and technical range.' },
  { skill: 'Pronunciation', level: 'B1+', note: 'Clear enough, but pacing and stress need polish.' },
  { skill: 'Writing', level: 'B1+ / B2', note: 'Professional emails are good with grammar review.' },
]

export const strengths = [
  'Strong professional and project vocabulary',
  'Good ability to explain technical and operational topics',
  'Clear motivation and practical work-related goals',
]

export const improvementAreas = [
  'Grammar accuracy in longer professional sentences',
  'Speaking fluency without long pauses',
  'Listening for detailed action items and meeting decisions',
  'Pronunciation rhythm, stress, and confidence',
]

export const trainingFocus = [
  'Daily speaking recordings about real project situations',
  'Grammar correction through work-related examples',
  'Meeting summaries, action items, and clarification phrases',
  'Weekly evaluation to identify the weakest skill',
]

export const speakingStructure = [
  'Introduction',
  'Background',
  'Current Status',
  'Challenge',
  'Action Taken',
  'Next Step',
  'Conclusion',
]

export const grammarTopics = [
  'Present Simple vs Present Continuous',
  'Past Simple vs Present Perfect',
  'Articles: a, an, the',
  'Prepositions: in, on, at, for, to, with, about',
  'Question formation',
  'Modal verbs',
  'Passive voice',
  'Conditionals',
  'Relative clauses',
  'Linking words',
  'Professional sentence structure',
].map((title, index) => ({ id: `grammar-${index + 1}`, title }))

export const speakingTopics = [
  ['Smart Parks project overview', 'Medium', '5 min'],
  ['Current project status', 'Medium', '4 min'],
  ['Vendor coordination update', 'Medium', '4 min'],
  ['API integration discussion', 'Hard', '6 min'],
  ['Server requirement clarification', 'Hard', '5 min'],
  ['Production environment warning', 'Hard', '5 min'],
  ['Asset handover process', 'Medium', '4 min'],
  ['Training session coordination', 'Easy', '3 min'],
  ['Project risks', 'Hard', '5 min'],
  ['Budget justification', 'Hard', '6 min'],
  ['Procurement update', 'Medium', '4 min'],
  ['Technical issue escalation', 'Hard', '5 min'],
].map(([title, difficulty, duration], index) => ({
  id: `speaking-${index + 1}`,
  title,
  difficulty,
  duration,
}))

export const businessPhrases = [
  'Could you please confirm the required action from your side?',
  "Based on today's discussion, the next step is to coordinate with the vendor.",
  'We need to review this internally before proceeding.',
  'Please let us know if any further details are required.',
  'I will follow up with the concerned team and update you accordingly.',
  'From my side, I would like to highlight one concern.',
  'The current status is as follows.',
  'Once we receive the confirmation, we will proceed with the next step.',
].map((title, index) => ({ id: `phrase-${index + 1}`, title }))

export const commonMistakes = [
  {
    id: 'mistake-1',
    area: 'Grammar',
    mistake: 'I am working in this project since two years.',
    correction: 'I have been working on this project for two years.',
    tip: 'Use present perfect continuous with since/for, and say working on a project.',
  },
  {
    id: 'mistake-2',
    area: 'Articles',
    mistake: 'Vendor shared the update with team.',
    correction: 'The vendor shared the update with the team.',
    tip: 'Use the when both speaker and listener know the specific noun.',
  },
  {
    id: 'mistake-3',
    area: 'Prepositions',
    mistake: 'We discussed about the server requirements.',
    correction: 'We discussed the server requirements.',
    tip: 'Discuss does not need about after it.',
  },
  {
    id: 'mistake-4',
    area: 'Professional Tone',
    mistake: 'Send me the confirmation today.',
    correction: 'Could you please send the confirmation today?',
    tip: 'Use polite request forms in professional messages.',
  },
  {
    id: 'mistake-5',
    area: 'Sentence Structure',
    mistake: 'Because the production is ready, so we can proceed.',
    correction: 'Because the production environment is ready, we can proceed.',
    tip: 'Do not use because and so together in the same clause structure.',
  },
  {
    id: 'mistake-6',
    area: 'Vocabulary',
    mistake: 'We need to make a meeting with the vendor.',
    correction: 'We need to schedule a meeting with the vendor.',
    tip: 'Use schedule, arrange, or hold a meeting.',
  },
]

export const defaultPronunciationSentences = [
  {
    id: 'pronunciation-content-1',
    sentence: 'Could you please confirm the required action from your side?',
    focusArea: 'Polite request rhythm',
    repetitionTarget: 10,
    completed: false,
  },
  {
    id: 'pronunciation-content-2',
    sentence: 'The current status is as follows.',
    focusArea: 'Sentence stress',
    repetitionTarget: 10,
    completed: false,
  },
  {
    id: 'pronunciation-content-3',
    sentence: 'Once we receive the confirmation, we will proceed with the next step.',
    focusArea: 'Linking and pauses',
    repetitionTarget: 8,
    completed: false,
  },
]

export const defaultWritingTemplates = [
  {
    id: 'writing-template-1',
    title: 'Professional email update',
    type: 'Email',
    body: 'Dear [Name],\n\nI would like to share the latest update regarding [topic].\n\nThe current status is [status]. The next step is to [action].\n\nPlease let us know if any further details are required.\n\nBest regards,',
    notes: 'Use for vendor coordination and internal project updates.',
  },
  {
    id: 'writing-template-2',
    title: 'Meeting summary',
    type: 'Summary',
    body: 'Meeting topic: [topic]\nMain points discussed:\n1. [point]\n2. [point]\n\nAction items:\n1. [owner] will [action] by [date].\n\nNext step: [next step]',
    notes: 'Use after meetings to capture decisions and action items.',
  },
]

export const defaultContentLibrary = {
  grammarTopics: grammarTopics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    level: 'B1-B2',
    priority: 'High',
    explanation: 'Review the rule, then create examples connected to your work.',
    workExamples: 'Write examples about projects, vendors, meetings, or technical issues.',
    practiceTask: `Write 5 professional sentences using: ${topic.title}`,
    completed: false,
  })),
  speakingTopics: speakingTopics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    category: 'Work communication',
    difficulty: topic.difficulty,
    duration: topic.duration,
    structure: speakingStructure.join(', '),
    usefulPhrases: 'The current status is..., The main challenge is..., The next step is...',
    completed: false,
  })),
  businessPhrases: businessPhrases.map((phrase) => ({
    id: phrase.id,
    phrase: phrase.title,
    category: 'Professional communication',
    useCase: 'Use this in emails, meetings, or project follow-ups.',
    practiced: false,
  })),
  pronunciationSentences: defaultPronunciationSentences,
  writingTemplates: defaultWritingTemplates,
  commonMistakes: commonMistakes.map((mistake) => ({
    id: mistake.id,
    wrongSentence: mistake.mistake,
    correctSentence: mistake.correction,
    rule: mistake.tip,
    status: 'New',
    notes: '',
  })),
}

export const contentLibraryTabs = [
  ['grammarTopics', 'Grammar Topics'],
  ['speakingTopics', 'Speaking Topics'],
  ['businessPhrases', 'Business Phrases'],
  ['pronunciationSentences', 'Pronunciation Sentences'],
  ['writingTemplates', 'Writing Templates'],
  ['commonMistakes', 'Common Mistakes'],
]

export const monthlyRoadmap = [
  {
    month: 1,
    focus: 'Foundation accuracy',
    goals: ['Stabilize tenses', 'Build daily speaking habit', 'Start mistake correction'],
  },
  {
    month: 2,
    focus: 'Professional writing',
    goals: ['Improve emails', 'Use business phrases', 'Write meeting summaries'],
  },
  {
    month: 3,
    focus: 'Meeting confidence',
    goals: ['Open meetings', 'Ask clarification', 'Summarize action items'],
  },
  {
    month: 4,
    focus: 'Technical explanation',
    goals: ['Explain issues clearly', 'Describe risks', 'Use structured speaking'],
  },
  {
    month: 5,
    focus: 'Listening depth',
    goals: ['Extract details', 'Track decisions', 'Recognize professional expressions'],
  },
  {
    month: 6,
    focus: 'Presentation fluency',
    goals: ['Present status updates', 'Improve pauses', 'Use executive structure'],
  },
  {
    month: 7,
    focus: 'Advanced workplace communication',
    goals: ['Negotiate priorities', 'Escalate issues', 'Justify budget and procurement needs'],
  },
  {
    month: 8,
    focus: 'C1 readiness',
    goals: ['Speak with less hesitation', 'Write with stronger precision', 'Handle complex discussions'],
  },
  {
    month: 9,
    focus: 'Final polish',
    goals: ['Review weak areas', 'Complete final evaluation', 'Prepare next learning plan'],
  },
]
