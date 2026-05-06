export const weeklyPlan = [
  {
    day: 'Saturday',
    focus: 'Grammar + Listening + Speaking',
    topic: 'Explain a work update from the Smart Parks project',
    tasks: [
      'Study one grammar topic: tenses, articles, or prepositions',
      'Listen to one 5-minute business English video',
      'Record yourself speaking for 3 minutes about a work topic',
      'Write 5 corrected sentences from your mistakes',
    ],
  },
  {
    day: 'Sunday',
    focus: 'Writing + Vocabulary + Pronunciation',
    topic: 'Describe a vendor coordination email',
    tasks: [
      'Write one professional email',
      'Learn 10 useful business phrases',
      'Practice pronunciation for 10 meeting sentences',
      'Read your email aloud and improve the wording',
    ],
  },
  {
    day: 'Monday',
    focus: 'Meeting English',
    topic: 'Open a meeting and summarize the agenda',
    tasks: [
      'Practice opening a meeting professionally',
      'Roleplay a project update discussion',
      'Listen to a meeting conversation and extract action items',
      'Practice 5 phrases for asking clarification',
    ],
  },
  {
    day: 'Tuesday',
    focus: 'Grammar + Technical Speaking',
    topic: 'Explain a technical issue and proposed action',
    tasks: [
      'Study one grammar topic and write work-related examples',
      'Explain one technical issue in English',
      'Record yourself and identify 3 mistakes',
      'Rewrite your explanation in a more professional way',
    ],
  },
  {
    day: 'Wednesday',
    focus: 'Listening + Meeting Summary',
    topic: 'Summarize a business or technical discussion',
    tasks: [
      'Listen to a business or technical discussion',
      'Write a short meeting summary',
      'Extract 5 useful expressions',
      'Practice summarizing the topic verbally in 2 minutes',
    ],
  },
  {
    day: 'Thursday',
    focus: 'Presentation Practice',
    topic: 'Present project status, challenges, and next steps',
    tasks: [
      'Prepare a 5-minute presentation',
      'Use structure: introduction, status, challenges, next steps',
      'Record yourself and check fluency',
      'Improve pauses, pronunciation, and professional phrases',
    ],
  },
  {
    day: 'Friday',
    focus: 'Light Review + Confidence',
    topic: 'Reflect on progress and weak points',
    tasks: [
      'Review vocabulary from the week',
      'Watch English content for enjoyment',
      'Speak casually for 10 minutes',
      'Write your weekly reflection and weak points',
    ],
  },
]

export function getDailyTaskId(day, taskIndex) {
  return `${day}-${taskIndex}`
}

export function getDailyTopicId(day, topicIndex) {
  return `${day}-topic-${topicIndex}`
}

export function createDailyPlanFromConfig(plan) {
  return plan.map((day) => ({
    day: day.day,
    focus: day.focus,
    tasks: day.tasks.map((task, index) => ({
      id: getDailyTaskId(day.day, index),
      text: task,
    })),
    speakingTopics: [
      {
        id: getDailyTopicId(day.day, 0),
        text: day.topic,
      },
    ],
  }))
}

export const defaultDailyPlan = createDailyPlanFromConfig(weeklyPlan)
