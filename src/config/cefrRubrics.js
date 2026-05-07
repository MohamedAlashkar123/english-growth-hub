export const cefrRubrics = {
  levels: ["B1", "B1+", "B2", "B2+", "Early C1"],
  skills: [
    {
      id: "speaking",
      name: "Speaking",
      rubricCriteria: [
        {
          id: "fluency",
          name: "Fluency",
          descriptors: {
            B1: "Can keep going comprehensibly but has to pause to plan and repair. Hesitations are noticeable and may sometimes interfere with meaning.",
            "B1+":
              "Can express opinions and give brief reasons without much hesitation. Can keep conversation going with some effort.",
            B2: "Can express ideas and opinions with relative fluency. Pauses are mainly for planning rather than searching for words.",
            "B2+":
              "Can speak fluently and spontaneously in most situations. Only complex ideas cause noticeable hesitation.",
            "Early C1":
              "Can express ideas fluently and spontaneously without obvious searching for expressions. Can use circumlocution effectively.",
          },
        },
        {
          id: "coherence",
          name: "Coherence",
          descriptors: {
            B1: "Can link ideas using simple connectors like and but so because. Organization is basic but understandable.",
            "B1+":
              "Can use a range of common linking words to organize speech. Ideas are mostly connected logically.",
            B2: "Can use a variety of connectors and discourse markers to structure speech. Ideas flow logically with clear organization.",
            "B2+":
              "Can use sophisticated linking devices to create well-structured extended discourse. Transitions are smooth and natural.",
            "Early C1":
              "Can produce clear well-structured speech with effective use of organizational patterns and cohesive devices.",
          },
        },
        {
          id: "interaction",
          name: "Interaction",
          descriptors: {
            B1: "Can participate in simple conversations on familiar topics. Can respond to questions but may struggle with follow-ups.",
            "B1+":
              "Can initiate maintain and close simple face-to-face conversations on familiar topics. Can ask for clarification when needed.",
            B2: "Can interact with a degree of fluency and spontaneity. Can take an active part in discussion in familiar contexts.",
            "B2+":
              "Can interact fluently and spontaneously. Can adapt flexibly to different situations and interlocutors.",
            "Early C1":
              "Can express ideas and opinions with precision and relate contributions to those of other speakers.",
          },
        },
        {
          id: "accuracy",
          name: "Accuracy",
          descriptors: {
            B1: "Uses simple grammatical structures correctly but makes errors with more complex forms. Errors rarely cause misunderstanding.",
            "B1+":
              "Uses a range of grammatical structures with reasonable control. Errors occur but do not usually impede communication.",
            B2: "Shows good control of grammar and vocabulary. Errors are minor and infrequent.",
            "B2+":
              "Shows high level of grammatical control. Errors are rare and usually self-corrected.",
            "Early C1":
              "Maintains consistent grammatical control of complex language. Errors are very rare.",
          },
        },
        {
          id: "professionalTone",
          name: "Professional Tone",
          descriptors: {
            B1: "Can use basic polite expressions. Tone is generally appropriate for simple professional situations.",
            "B1+":
              "Can use appropriate register for most familiar professional situations. Shows awareness of formal and informal language.",
            B2: "Can use appropriate language for a range of professional situations. Tone is consistently professional.",
            "B2+":
              "Can adapt tone and register effectively for different professional contexts and relationships.",
            "Early C1":
              "Can use language with precision and appropriateness for all professional situations including sensitive or complex topics.",
          },
        },
      ],
      canDoStatements: [
        {
          level: "B1",
          statement:
            "I can describe my work responsibilities and daily routine clearly.",
        },
        {
          level: "B1",
          statement:
            "I can give simple instructions and explanations for familiar work tasks.",
        },
        {
          level: "B1",
          statement:
            "I can participate in basic discussions about work projects I know well.",
        },
        {
          level: "B1+",
          statement:
            "I can explain the reasons for work-related decisions I have made.",
        },
        {
          level: "B1+",
          statement:
            "I can give a short presentation about a familiar work topic.",
        },
        {
          level: "B1+",
          statement:
            "I can handle simple telephone conversations with colleagues and clients.",
        },
        {
          level: "B2",
          statement:
            "I can present detailed information about complex work projects.",
        },
        {
          level: "B2",
          statement:
            "I can participate actively in meetings and express my opinions clearly.",
        },
        {
          level: "B2",
          statement:
            "I can negotiate simple agreements and explain my position.",
        },
        {
          level: "B2+",
          statement:
            "I can lead discussions and manage group conversations effectively.",
        },
        {
          level: "B2+",
          statement:
            "I can handle unexpected questions and challenges in meetings.",
        },
        {
          level: "B2+",
          statement:
            "I can give detailed presentations and handle follow-up questions confidently.",
        },
        {
          level: "Early C1",
          statement:
            "I can present and argue complex cases with sophisticated language.",
        },
        {
          level: "Early C1",
          statement:
            "I can participate effectively in high-level negotiations and discussions.",
        },
        {
          level: "Early C1",
          statement:
            "I can adapt my communication style for different professional audiences and purposes.",
        },
      ],
      assessmentQuestions: [
        "Can the learner explain a work topic clearly without excessive hesitation?",
        "Can the learner respond to follow-up questions with relevant answers?",
        "Can the learner express opinions and give reasons?",
        "Can the learner maintain conversation on familiar professional topics?",
        "Can the learner use appropriate linking words to organize speech?",
        "Can the learner adapt language for different professional situations?",
        "Can the learner handle interruptions and unexpected questions?",
        "Can the learner conclude a conversation or presentation appropriately?",
      ],
      teacherFeedbackPrompts: [
        "What did the learner communicate clearly?",
        "What caused the most hesitation or confusion?",
        "Which linking words or phrases were used effectively?",
        "What grammatical patterns need more practice?",
        "How appropriate was the tone for the situation?",
        "What should the learner repeat or improve in future practice?",
        "What specific vocabulary would help this learner?",
        "How can the learner build on current strengths?",
      ],
      practiceEvidenceExamples: [
        "3-minute project status update",
        "meeting roleplay with a colleague",
        "vendor clarification discussion",
        "short presentation about a work process",
        "telephone call simulation",
        "problem-solving discussion",
        "negotiation roleplay",
        "weekly team meeting participation",
      ],
    },
    {
      id: "writing",
      name: "Writing",
      rubricCriteria: [
        {
          id: "organization",
          name: "Organization",
          descriptors: {
            B1: "Can write simple connected text on familiar topics. Basic paragraph structure is present but transitions are limited.",
            "B1+":
              "Can write straightforward connected text on a range of familiar subjects. Paragraphs are generally well-structured.",
            B2: "Can write clear detailed text on a wide range of subjects. Structure is logical with effective paragraphing.",
            "B2+":
              "Can write well-structured complex texts with clear organization and effective use of headings and formatting.",
            "Early C1":
              "Can write clear well-structured texts with sophisticated organization and effective use of cohesive devices.",
          },
        },
        {
          id: "grammarAccuracy",
          name: "Grammar Accuracy",
          descriptors: {
            B1: "Uses simple grammatical structures correctly. Errors with complex forms are common but meaning remains clear.",
            "B1+":
              "Shows reasonable control of common grammatical patterns. Errors occur but do not usually impede understanding.",
            B2: "Shows good control of grammar and vocabulary. Errors are minor and infrequent.",
            "B2+":
              "Shows high level of grammatical control. Errors are rare and usually self-corrected.",
            "Early C1":
              "Maintains consistent grammatical control of complex language. Errors are very rare.",
          },
        },
        {
          id: "vocabularyRange",
          name: "Vocabulary Range",
          descriptors: {
            B1: "Uses basic vocabulary for familiar work topics. Repetition of common words is noticeable.",
            "B1+":
              "Uses a range of vocabulary related to work. Some variety in word choice is evident.",
            B2: "Uses a good range of vocabulary for professional purposes. Word choice is generally appropriate and varied.",
            "B2+":
              "Uses a wide range of vocabulary including some less common and precise terms.",
            "Early C1":
              "Uses a broad range of vocabulary with precision and sophistication.",
          },
        },
        {
          id: "clarity",
          name: "Clarity",
          descriptors: {
            B1: "Main ideas are understandable but supporting details may be unclear or disorganized.",
            "B1+":
              "Ideas are generally clear. Most points are understandable with some effort.",
            B2: "Ideas are clear and well-explained. Purpose is easily understood.",
            "B2+":
              "Ideas are expressed clearly and precisely. Complex concepts are explained effectively.",
            "Early C1":
              "Ideas are expressed with clarity and precision. Subtle meanings are conveyed effectively.",
          },
        },
        {
          id: "professionalTone",
          name: "Professional Tone",
          descriptors: {
            B1: "Uses basic polite expressions. Tone is generally appropriate for simple professional emails.",
            "B1+":
              "Uses appropriate register for most familiar professional writing. Shows awareness of formal and informal language.",
            B2: "Uses appropriate language for a range of professional writing. Tone is consistently professional.",
            "B2+":
              "Adapts tone and register effectively for different professional contexts and audiences.",
            "Early C1":
              "Uses language with precision and appropriateness for all professional writing including sensitive or complex topics.",
          },
        },
      ],
      canDoStatements: [
        {
          level: "B1",
          statement: "I can write simple emails about routine work matters.",
        },
        {
          level: "B1",
          statement: "I can write short notes and messages to colleagues.",
        },
        {
          level: "B1",
          statement:
            "I can write a basic report describing what I did at work.",
        },
        {
          level: "B1+",
          statement:
            "I can write emails requesting information or clarification.",
        },
        {
          level: "B1+",
          statement: "I can write a short report with clear sections.",
        },
        {
          level: "B1+",
          statement: "I can write meeting notes capturing main points.",
        },
        {
          level: "B2",
          statement:
            "I can write detailed emails explaining complex situations.",
        },
        {
          level: "B2",
          statement:
            "I can write clear reports with analysis and recommendations.",
        },
        {
          level: "B2",
          statement:
            "I can write proposals outlining plans and justifications.",
        },
        {
          level: "B2+",
          statement:
            "I can write persuasive documents for different audiences.",
        },
        {
          level: "B2+",
          statement: "I can write executive summaries of complex information.",
        },
        {
          level: "Early C1",
          statement: "I can write sophisticated reports with nuanced analysis.",
        },
        {
          level: "Early C1",
          statement:
            "I can write effective proposals for high-stakes situations.",
        },
        {
          level: "Early C1",
          statement:
            "I can adapt writing style for different professional purposes and readers.",
        },
      ],
      assessmentQuestions: [
        "Is the writing organized with clear paragraphs and structure?",
        "Are main ideas clear and well-supported?",
        "Is the vocabulary appropriate for the professional context?",
        "Are grammatical errors frequent enough to cause confusion?",
        "Is the tone appropriate for the intended audience?",
        "Does the writing achieve its purpose effectively?",
        "Are transitions between ideas smooth and logical?",
        "Is the writing concise and to the point?",
      ],
      teacherFeedbackPrompts: [
        "What organizational patterns did the learner use effectively?",
        "Which grammatical structures need more practice?",
        "What vocabulary would strengthen this writing?",
        "How appropriate was the tone for the audience?",
        "What made the writing clear or unclear?",
        "What should the learner focus on in the next writing task?",
        "How can the learner vary sentence structure for better flow?",
        "What specific improvements would make this writing more professional?",
      ],
      practiceEvidenceExamples: [
        "Project status email",
        "Meeting minutes or notes",
        "Process description document",
        "Problem analysis report",
        "Proposal for a new initiative",
        "Client communication email",
        "Executive summary",
        "Incident report",
      ],
    },
    {
      id: "listening",
      name: "Listening",
      rubricCriteria: [
        {
          id: "mainIdea",
          name: "Main Idea Understanding",
          descriptors: {
            B1: "Can understand the main points of clear standard speech on familiar work matters. May miss details in longer or faster speech.",
            "B1+":
              "Can understand main points of most speech on familiar work topics. Can follow the general flow of discussion.",
            B2: "Can understand the main ideas of complex speech on both concrete and abstract topics. Can follow extended speech and lectures.",
            "B2+":
              "Can understand a wide range of demanding longer texts and recognize implicit meaning.",
            "Early C1":
              "Can understand extended speech and lectures even with complex lines of argument.",
          },
        },
        {
          id: "detailUnderstanding",
          name: "Detail Understanding",
          descriptors: {
            B1: "Can catch important details in clear slow speech. May miss details in faster or more complex speech.",
            "B1+":
              "Can understand most details in clear speech on familiar topics. Some details in complex speech may be missed.",
            B2: "Can understand detailed information in most speech on familiar and unfamiliar topics.",
            "B2+":
              "Can understand detailed information even in complex or technical discussions.",
            "Early C1":
              "Can understand detailed information including nuances and implied meanings.",
          },
        },
        {
          id: "actionItems",
          name: "Action Item Extraction",
          descriptors: {
            B1: "Can identify simple action items in clear instructions. May miss complex or implied actions.",
            "B1+":
              "Can identify most action items in clear speech. Can follow simple multi-step instructions.",
            B2: "Can extract action items from most work-related discussions and meetings.",
            "B2+":
              "Can accurately identify and record action items from complex discussions.",
            "Early C1":
              "Can extract and prioritize action items from complex multi-party discussions.",
          },
        },
        {
          id: "accentTolerance",
          name: "Accent Tolerance",
          descriptors: {
            B1: "Can understand clear standard accents. May struggle with strong or unfamiliar accents.",
            "B1+": "Can understand a range of common accents with some effort.",
            B2: "Can understand most native and non-native accents with reasonable effort.",
            "B2+":
              "Can understand a wide range of accents including some regional variations.",
            "Early C1":
              "Can understand a wide range of accents including regional and non-standard varieties.",
          },
        },
        {
          id: "summaryAccuracy",
          name: "Summary Accuracy",
          descriptors: {
            B1: "Can summarize main points of short clear speech. May miss important details or nuances.",
            "B1+":
              "Can summarize most key points of familiar speech. Summary is generally accurate.",
            B2: "Can summarize complex speech accurately capturing main points and important details.",
            "B2+":
              "Can summarize complex speech accurately including some nuances and implicit meanings.",
            "Early C1":
              "Can summarize complex speech accurately capturing nuances and implicit meanings.",
          },
        },
      ],
      canDoStatements: [
        {
          level: "B1",
          statement:
            "I can understand the main points of clear standard speech about my work.",
        },
        {
          level: "B1",
          statement: "I can understand simple instructions and directions.",
        },
        {
          level: "B1",
          statement:
            "I can follow the general flow of a meeting on familiar topics.",
        },
        {
          level: "B1+",
          statement:
            "I can understand most of what is said in meetings about familiar topics.",
        },
        {
          level: "B1+",
          statement:
            "I can understand phone calls from colleagues about routine matters.",
        },
        {
          level: "B1+",
          statement:
            "I can extract key information from presentations on familiar topics.",
        },
        {
          level: "B2",
          statement:
            "I can understand extended speech and follow complex arguments.",
        },
        {
          level: "B2",
          statement:
            "I can understand most TV news and current affairs programs.",
        },
        {
          level: "B2",
          statement:
            "I can understand the majority of films in standard dialect.",
        },
        {
          level: "B2+",
          statement:
            "I can understand complex technical discussions in my field.",
        },
        {
          level: "B2+",
          statement:
            "I can understand lectures and presentations on unfamiliar topics.",
        },
        {
          level: "Early C1",
          statement:
            "I can understand a wide range of demanding longer texts and recognize implicit meaning.",
        },
        {
          level: "Early C1",
          statement:
            "I can understand television programs and films without too much effort.",
        },
        {
          level: "Early C1",
          statement:
            "I can understand complex technical discussions and debates.",
        },
      ],
      assessmentQuestions: [
        "Can the learner identify the main purpose of the spoken text?",
        "Can the learner extract specific details from the speech?",
        "Can the learner identify action items or next steps?",
        "Can the learner understand speech with different accents?",
        "Can the learner summarize what they heard accurately?",
        "Does the learner ask for clarification when needed?",
        "Can the learner follow complex instructions?",
        "Can the learner understand implicit meanings or suggestions?",
      ],
      teacherFeedbackPrompts: [
        "What types of listening situations does the learner handle well?",
        "What causes the most difficulty in listening comprehension?",
        "How well does the learner extract key information?",
        "What strategies does the learner use when they don't understand?",
        "What listening practice would benefit this learner most?",
        "How can the learner improve note-taking during listening?",
        "What accent or speed variations should the learner practice with?",
        "How can the learner build on current listening strengths?",
      ],
      practiceEvidenceExamples: [
        "Meeting recording with comprehension questions",
        "Podcast or lecture with summary task",
        "Telephone conversation simulation",
        "Video presentation with note-taking",
        "Multi-speaker discussion analysis",
        "Instruction following exercise",
        "News report with detail extraction",
        "Technical presentation comprehension",
      ],
    },
    {
      id: "pronunciation",
      name: "Pronunciation",
      rubricCriteria: [
        {
          id: "clarity",
          name: "Clarity",
          descriptors: {
            B1: "Pronunciation is generally clear but some sounds may be difficult to understand. Accent may be strong but meaning is usually clear.",
            "B1+":
              "Pronunciation is clear most of the time. Some sounds are still difficult but communication is not seriously affected.",
            B2: "Pronunciation is clearly intelligible. Accent is noticeable but does not impede understanding.",
            "B2+":
              "Pronunciation is clear with only occasional minor difficulties. Accent is present but not distracting.",
            "Early C1":
              "Pronunciation is clear and natural with very few difficulties.",
          },
        },
        {
          id: "wordStress",
          name: "Word Stress",
          descriptors: {
            B1: "Word stress is often incorrect on longer or less familiar words. This may occasionally cause confusion.",
            "B1+":
              "Word stress is usually correct on common words. Some errors with longer words.",
            B2: "Word stress is generally correct. Errors are occasional and do not usually cause confusion.",
            "B2+":
              "Word stress is consistently correct including on longer and less common words.",
            "Early C1": "Word stress is consistently correct and natural.",
          },
        },
        {
          id: "sentenceStress",
          name: "Sentence Stress",
          descriptors: {
            B1: "Sentence stress is often flat or incorrect. Important words are not always emphasized.",
            "B1+":
              "Sentence stress is sometimes correct. Important words are emphasized in familiar phrases.",
            B2: "Sentence stress is generally correct. Important words are emphasized appropriately.",
            "B2+":
              "Sentence stress is consistently correct and helps convey meaning effectively.",
            "Early C1":
              "Sentence stress is natural and effective for conveying meaning and emphasis.",
          },
        },
        {
          id: "endingSounds",
          name: "Ending Sounds",
          descriptors: {
            B1: "Ending sounds are often dropped or changed. This can affect understanding of past tense and plurals.",
            "B1+":
              "Ending sounds are usually correct in careful speech. May drop them in faster speech.",
            B2: "Ending sounds are generally correct. Occasional dropping in faster speech.",
            "B2+": "Ending sounds are consistently correct in most speech.",
            "Early C1": "Ending sounds are consistently correct and natural.",
          },
        },
        {
          id: "intelligibility",
          name: "Intelligibility",
          descriptors: {
            B1: "Generally intelligible but listener may need to ask for repetition sometimes. Accent may be strong.",
            "B1+":
              "Usually intelligible. Occasional need for repetition or clarification.",
            B2: "Easily intelligible. Rare need for repetition or clarification.",
            "B2+":
              "Highly intelligible. Communication is smooth with minimal need for clarification.",
            "Early C1":
              "Very highly intelligible. Communication is effortless.",
          },
        },
      ],
      canDoStatements: [
        {
          level: "B1",
          statement:
            "I can pronounce most common work-related words clearly enough to be understood.",
        },
        {
          level: "B1",
          statement:
            "I can use intonation to ask questions and make statements.",
        },
        {
          level: "B1",
          statement: "I can pronounce numbers and dates clearly.",
        },
        {
          level: "B1+",
          statement: "I can pronounce most words in my field correctly.",
        },
        {
          level: "B1+",
          statement:
            "I can use stress to emphasize important words in sentences.",
        },
        {
          level: "B1+",
          statement:
            "I can pronounce past tense and plural endings most of the time.",
        },
        {
          level: "B2",
          statement: "I can pronounce technical terms in my field correctly.",
        },
        {
          level: "B2",
          statement:
            "I can use intonation appropriately in different situations.",
        },
        {
          level: "B2",
          statement: "I can pronounce word endings correctly in most contexts.",
        },
        {
          level: "B2+",
          statement: "I can pronounce a wide range of vocabulary correctly.",
        },
        {
          level: "B2+",
          statement:
            "I can use stress and intonation to convey subtle meanings.",
        },
        {
          level: "Early C1",
          statement:
            "I can pronounce almost all words correctly including complex terms.",
        },
        {
          level: "Early C1",
          statement:
            "I can use pronunciation effectively for professional impact.",
        },
        {
          level: "Early C1",
          statement:
            "I can adapt my pronunciation for different audiences and situations.",
        },
      ],
      assessmentQuestions: [
        "Is the learner's pronunciation generally clear and understandable?",
        "Are word endings pronounced correctly especially for past tense and plurals?",
        "Is word stress correct on common and technical vocabulary?",
        "Does the learner use sentence stress to emphasize important words?",
        "Is intonation appropriate for questions statements and emphasis?",
        "Does the learner need to repeat often for clarity?",
        "Can the learner produce difficult sounds for their first language?",
        "How natural does the learner's pronunciation sound?",
      ],
      teacherFeedbackPrompts: [
        "Which sounds or sound patterns need the most practice?",
        "How can word stress be improved?",
        "What intonation patterns would help this learner sound more natural?",
        "What specific pronunciation exercises would be most beneficial?",
        "How does pronunciation affect the learner's confidence?",
        "What progress has the learner made in pronunciation?",
        "How can the learner practice pronunciation independently?",
        "What pronunciation resources would help this learner?",
      ],
      practiceEvidenceExamples: [
        "Reading aloud of work-related texts",
        "Recording and comparing with model pronunciation",
        "Minimal pairs practice",
        "Word stress drills",
        "Sentence stress and intonation practice",
        "Technical vocabulary pronunciation",
        "Presentation practice with pronunciation focus",
        "Dialogue practice with attention to sounds",
      ],
    },
    {
      id: "grammarAccuracy",
      name: "Grammar Accuracy",
      rubricCriteria: [
        {
          id: "tenseControl",
          name: "Tense Control",
          descriptors: {
            B1: "Uses present simple and past simple correctly most of the time. Errors with other tenses are common.",
            "B1+":
              "Uses common tenses correctly with some errors. More complex tenses show inconsistency.",
            B2: "Shows good control of all main tenses. Errors are minor and infrequent.",
            "B2+":
              "Shows very good control of all tenses including complex forms. Errors are rare.",
            "Early C1":
              "Shows excellent control of all tenses in all contexts.",
          },
        },
        {
          id: "sentenceStructure",
          name: "Sentence Structure",
          descriptors: {
            B1: "Uses simple sentences correctly. Complex sentences show errors but meaning is usually clear.",
            "B1+":
              "Uses a range of sentence structures with reasonable control. Errors occur but do not usually impede communication.",
            B2: "Uses a variety of complex sentence structures correctly. Errors are minor.",
            "B2+":
              "Uses sophisticated sentence structures effectively. Errors are very rare.",
            "Early C1":
              "Uses complex sentence structures with precision and flexibility.",
          },
        },
        {
          id: "articles",
          name: "Articles",
          descriptors: {
            B1: "Articles are often omitted or used incorrectly. This may occasionally cause confusion.",
            "B1+":
              "Articles are used correctly in common phrases. Errors still occur in more complex contexts.",
            B2: "Articles are generally correct. Errors are occasional and do not usually cause confusion.",
            "B2+": "Articles are consistently correct in most contexts.",
            "Early C1":
              "Articles are consistently correct including in complex contexts.",
          },
        },
        {
          id: "prepositions",
          name: "Prepositions",
          descriptors: {
            B1: "Prepositions are often incorrect. This can cause confusion about time place and relationship.",
            "B1+":
              "Common prepositions are used correctly. Errors still occur with less common prepositions.",
            B2: "Prepositions are generally correct. Errors are occasional and do not usually cause confusion.",
            "B2+": "Prepositions are consistently correct in most contexts.",
            "Early C1":
              "Prepositions are consistently correct including in complex and idiomatic uses.",
          },
        },
        {
          id: "questionFormation",
          name: "Question Formation",
          descriptors: {
            B1: "Simple questions are formed correctly. More complex questions show errors in word order and auxiliary verbs.",
            "B1+":
              "Most questions are formed correctly. Errors occur with more complex question types.",
            B2: "Questions are generally formed correctly including indirect questions.",
            "B2+":
              "Questions are consistently correct including complex forms.",
            "Early C1":
              "Questions are formed correctly and naturally in all contexts.",
          },
        },
      ],
      canDoStatements: [
        {
          level: "B1",
          statement:
            "I can use present simple and past simple correctly to describe work activities.",
        },
        {
          level: "B1",
          statement: "I can form simple questions to ask for information.",
        },
        {
          level: "B1",
          statement:
            "I can use basic prepositions of time and place correctly.",
        },
        {
          level: "B1+",
          statement:
            "I can use present perfect and future forms correctly in familiar contexts.",
        },
        {
          level: "B1+",
          statement:
            "I can form questions with different question words correctly.",
        },
        {
          level: "B1+",
          statement: "I can use articles correctly in common phrases.",
        },
        {
          level: "B2",
          statement:
            "I can use all main tenses correctly including perfect and continuous forms.",
        },
        {
          level: "B2",
          statement:
            "I can form complex sentences with relative clauses and conditionals.",
        },
        {
          level: "B2",
          statement:
            "I can use prepositions correctly in most work-related contexts.",
        },
        {
          level: "B2+",
          statement: "I can use complex tenses and structures accurately.",
        },
        {
          level: "B2+",
          statement:
            "I can form indirect questions and polite requests correctly.",
        },
        {
          level: "Early C1",
          statement:
            "I can use all grammatical structures with accuracy and flexibility.",
        },
        {
          level: "Early C1",
          statement:
            "I can use complex sentence structures for sophisticated expression.",
        },
        {
          level: "Early C1",
          statement:
            "I can use articles and prepositions correctly in all contexts.",
        },
      ],
      assessmentQuestions: [
        "Are tenses used correctly and consistently?",
        "Are sentence structures varied and appropriate?",
        "Are articles used correctly?",
        "Are prepositions used correctly?",
        "Are questions formed correctly?",
        "Do grammatical errors cause confusion?",
        "Does the learner self-correct grammatical errors?",
        "How complex are the grammatical structures used?",
      ],
      teacherFeedbackPrompts: [
        "Which grammatical structures are used correctly?",
        "Which grammatical patterns need more practice?",
        "How can the learner practice specific grammar points?",
        "What grammatical errors occur most frequently?",
        "How do grammatical errors affect communication?",
        "What grammar resources would help this learner?",
        "How has the learner's grammar improved over time?",
        "What specific grammar exercises would be most beneficial?",
      ],
      practiceEvidenceExamples: [
        "Grammar exercises on specific problem areas",
        "Writing tasks with grammar focus",
        "Speaking practice with attention to specific structures",
        "Error correction exercises",
        "Sentence transformation practice",
        "Grammar journal tracking common errors",
        "Self-correction during speaking and writing",
        "Targeted grammar practice based on mistakes",
      ],
    },
    {
      id: "vocabularyBusinessEnglish",
      name: "Vocabulary / Business English",
      rubricCriteria: [
        {
          id: "range",
          name: "Range",
          descriptors: {
            B1: "Uses basic vocabulary for familiar work topics. Vocabulary is limited and repetitive.",
            "B1+":
              "Uses a range of vocabulary related to work. Some variety is evident but repetition still occurs.",
            B2: "Uses a good range of vocabulary for professional purposes. Word choice is generally appropriate and varied.",
            "B2+":
              "Uses a wide range of vocabulary including some less common and precise terms.",
            "Early C1":
              "Uses a broad range of vocabulary with precision and sophistication.",
          },
        },
        {
          id: "accuracy",
          name: "Accuracy",
          descriptors: {
            B1: "Basic vocabulary is used correctly. More complex or specific vocabulary may be used incorrectly.",
            "B1+":
              "Common work-related vocabulary is used correctly. Some errors with less common terms.",
            B2: "Vocabulary is generally used correctly. Errors are minor and infrequent.",
            "B2+":
              "Vocabulary is used accurately including some technical and specialized terms.",
            "Early C1":
              "Vocabulary is used accurately and precisely including technical and specialized terms.",
          },
        },
        {
          id: "businessExpressions",
          name: "Business Expressions",
          descriptors: {
            B1: "Uses a few basic business expressions. Limited range of fixed phrases.",
            "B1+":
              "Uses common business expressions correctly. Some variety in fixed phrases.",
            B2: "Uses a good range of business expressions appropriately. Fixed phrases are used correctly.",
            "B2+":
              "Uses a wide range of business expressions naturally and appropriately.",
            "Early C1":
              "Uses business expressions naturally and appropriately in all contexts.",
          },
        },
        {
          id: "collocations",
          name: "Collocations",
          descriptors: {
            B1: "Uses basic word combinations correctly. More natural collocations may be missing.",
            "B1+":
              "Uses some common collocations correctly. Still uses literal translations sometimes.",
            B2: "Uses common collocations correctly. Some awareness of more natural word combinations.",
            "B2+":
              "Uses a wide range of collocations naturally and appropriately.",
            "Early C1":
              "Uses collocations naturally and appropriately including sophisticated combinations.",
          },
        },
        {
          id: "appropriateness",
          name: "Appropriateness",
          descriptors: {
            B1: "Vocabulary is generally appropriate for basic work situations. May use informal language inappropriately.",
            "B1+":
              "Vocabulary is usually appropriate for work situations. Shows some awareness of register.",
            B2: "Vocabulary is appropriate for a range of professional situations. Register is generally correct.",
            "B2+":
              "Vocabulary is appropriate for all professional situations. Register is consistently correct.",
            "Early C1":
              "Vocabulary is precisely appropriate for all professional situations including sensitive contexts.",
          },
        },
      ],
      canDoStatements: [
        {
          level: "B1",
          statement:
            "I can use basic vocabulary to describe my work and responsibilities.",
        },
        {
          level: "B1",
          statement:
            "I can understand and use common business terms for my field.",
        },
        {
          level: "B1",
          statement: "I can use simple expressions for meetings and emails.",
        },
        {
          level: "B1+",
          statement:
            "I can use a range of vocabulary to discuss work projects.",
        },
        {
          level: "B1+",
          statement:
            "I can use common business idioms and expressions correctly.",
        },
        {
          level: "B1+",
          statement:
            "I can choose appropriate vocabulary for different work situations.",
        },
        {
          level: "B2",
          statement: "I can use technical vocabulary in my field accurately.",
        },
        {
          level: "B2",
          statement:
            "I can use a range of business expressions for different purposes.",
        },
        {
          level: "B2",
          statement: "I can use collocations naturally in most contexts.",
        },
        {
          level: "B2+",
          statement:
            "I can use sophisticated vocabulary for complex discussions.",
        },
        {
          level: "B2+",
          statement: "I can use business idioms and expressions naturally.",
        },
        {
          level: "Early C1",
          statement:
            "I can use precise vocabulary for all professional purposes.",
        },
        {
          level: "Early C1",
          statement:
            "I can use sophisticated business expressions appropriately.",
        },
        {
          level: "Early C1",
          statement:
            "I can adapt my vocabulary for different professional audiences.",
        },
      ],
      assessmentQuestions: [
        "Is the vocabulary range appropriate for the level?",
        "Are words used correctly in context?",
        "Are business expressions used appropriately?",
        "Are collocations natural and accurate?",
        "Is the vocabulary appropriate for the situation and audience?",
        "Does the learner use precise terms or general words?",
        "How does the learner handle unfamiliar vocabulary?",
        "Is the vocabulary varied or repetitive?",
      ],
      teacherFeedbackPrompts: [
        "Which vocabulary areas are strong?",
        "What vocabulary needs more development?",
        "How can the learner expand their business vocabulary?",
        "What collocations would be useful to learn?",
        "How appropriate is the vocabulary for professional contexts?",
        "What vocabulary learning strategies would help?",
        "How has the learner's vocabulary improved?",
        "What specific vocabulary practice would be most beneficial?",
      ],
      practiceEvidenceExamples: [
        "Vocabulary lists for specific work areas",
        "Business expression practice",
        "Collocation exercises",
        "Technical vocabulary development",
        "Reading business texts for vocabulary acquisition",
        "Writing tasks with vocabulary focus",
        "Speaking practice with attention to word choice",
        "Vocabulary journal tracking new words and phrases",
      ],
    },
    {
      id: "fluency",
      name: "Fluency",
      rubricCriteria: [
        {
          id: "speedControl",
          name: "Speed Control",
          descriptors: {
            B1: "Speaks slowly with frequent pauses. Speed may be inconsistent.",
            "B1+":
              "Speaks at a moderate pace with some pauses. Speed is generally consistent.",
            B2: "Speaks at a natural pace with occasional pauses for planning.",
            "B2+":
              "Speaks fluently at a natural pace. Pauses are mainly for planning not searching.",
            "Early C1": "Speaks fluently and naturally with minimal pauses.",
          },
        },
        {
          id: "hesitation",
          name: "Hesitation",
          descriptors: {
            B1: "Frequent hesitation while searching for words. May use fillers excessively.",
            "B1+":
              "Some hesitation while searching for words. Uses fillers but not excessively.",
            B2: "Occasional hesitation mainly for planning. Uses fillers appropriately.",
            "B2+":
              "Minimal hesitation. Uses fillers naturally and appropriately.",
            "Early C1": "Very little hesitation. Speech flows naturally.",
          },
        },
        {
          id: "linkingIdeas",
          name: "Linking Ideas",
          descriptors: {
            B1: "Ideas are often presented as simple unconnected statements. Limited use of linking words.",
            "B1+":
              "Uses some linking words to connect ideas. Connections are sometimes clear.",
            B2: "Uses a range of linking words effectively. Ideas flow logically.",
            "B2+":
              "Uses sophisticated linking devices. Ideas flow smoothly and naturally.",
            "Early C1":
              "Uses linking devices effectively and naturally. Ideas flow seamlessly.",
          },
        },
        {
          id: "confidenceUnderPressure",
          name: "Confidence Under Pressure",
          descriptors: {
            B1: "Becomes noticeably less fluent under pressure. May lose track of ideas.",
            "B1+":
              "Some loss of fluency under pressure but can continue communicating.",
            B2: "Maintains reasonable fluency under pressure. May need more time to respond.",
            "B2+":
              "Maintains good fluency even under pressure. Can adapt to unexpected situations.",
            "Early C1":
              "Maintains fluent communication even in challenging situations.",
          },
        },
      ],
      canDoStatements: [
        {
          level: "B1",
          statement:
            "I can speak about familiar work topics without stopping too often.",
        },
        {
          level: "B1",
          statement: "I can use simple linking words to connect my ideas.",
        },
        {
          level: "B1",
          statement: "I can keep a conversation going with some effort.",
        },
        {
          level: "B1+",
          statement:
            "I can speak at a moderate pace about work topics I know well.",
        },
        {
          level: "B1+",
          statement:
            "I can use a range of linking words to organize my speech.",
        },
        {
          level: "B1+",
          statement:
            "I can maintain conversation even when I don't know a word.",
        },
        {
          level: "B2",
          statement: "I can speak fluently about most work-related topics.",
        },
        {
          level: "B2",
          statement: "I can express complex ideas without losing fluency.",
        },
        {
          level: "B2",
          statement: "I can maintain fluency even in unexpected situations.",
        },
        {
          level: "B2+",
          statement: "I can speak fluently about complex and abstract topics.",
        },
        {
          level: "B2+",
          statement: "I can adapt my speaking style to different situations.",
        },
        {
          level: "Early C1",
          statement: "I can speak fluently on any professional topic.",
        },
        {
          level: "Early C1",
          statement:
            "I can maintain fluent communication in high-pressure situations.",
        },
        {
          level: "Early C1",
          statement: "I can express complex ideas smoothly and naturally.",
        },
      ],
      assessmentQuestions: [
        "Does the learner speak at an appropriate pace?",
        "How often does the learner hesitate or pause?",
        "Are ideas linked together logically?",
        "How does the learner handle unexpected questions or situations?",
        "Does the learner use fillers appropriately?",
        "Can the learner maintain conversation on unfamiliar topics?",
        "How does pressure affect the learner's fluency?",
        "Does the learner self-correct smoothly or stop completely?",
      ],
      teacherFeedbackPrompts: [
        "What helps the learner speak more fluently?",
        "What causes the most hesitation or loss of fluency?",
        "How can the learner improve linking of ideas?",
        "What strategies help the learner maintain fluency under pressure?",
        "How can the learner reduce excessive fillers?",
        "What fluency practice would be most beneficial?",
        "How has the learner's fluency improved over time?",
        "What specific situations challenge the learner's fluency most?",
      ],
      practiceEvidenceExamples: [
        "Timed speaking practice",
        "Impromptu speaking exercises",
        "Linking word drills",
        "Conversation practice with focus on flow",
        "Pressure situation simulations",
        "Presentation practice with time limits",
        "Discussion practice on unfamiliar topics",
        "Fluency journal tracking improvements",
      ],
    },
    {
      id: "confidenceCommunicationControl",
      name: "Confidence / Communication Control",
      rubricCriteria: [
        {
          id: "initiating",
          name: "Initiating Communication",
          descriptors: {
            B1: "Can initiate simple conversations on familiar topics. May hesitate to start conversations.",
            "B1+":
              "Can initiate conversations on familiar topics with some confidence.",
            B2: "Can initiate conversations and discussions on a range of topics confidently.",
            "B2+":
              "Can initiate communication confidently in most professional situations.",
            "Early C1":
              "Can initiate communication confidently and appropriately in all situations.",
          },
        },
        {
          id: "clarification",
          name: "Asking Clarification",
          descriptors: {
            B1: "Can ask for repetition or simple clarification when needed. May not always understand the response.",
            "B1+":
              "Can ask for clarification in familiar situations. Understands most responses.",
            B2: "Can ask for clarification effectively in most situations. Understands responses well.",
            "B2+":
              "Can ask for clarification confidently and appropriately. Handles responses well.",
            "Early C1":
              "Can ask for clarification effectively and naturally in all situations.",
          },
        },
        {
          id: "handlingQuestions",
          name: "Handling Questions",
          descriptors: {
            B1: "Can answer simple questions about familiar topics. May struggle with unexpected or complex questions.",
            "B1+":
              "Can answer most questions about familiar topics. Some difficulty with unexpected questions.",
            B2: "Can answer questions confidently on a range of topics. Handles most unexpected questions.",
            "B2+":
              "Can answer questions confidently including complex and unexpected ones.",
            "Early C1":
              "Can handle all types of questions confidently and effectively.",
          },
        },
        {
          id: "recovering",
          name: "Recovering from Mistakes",
          descriptors: {
            B1: "Often stops or loses confidence when making mistakes. May need help to continue.",
            "B1+": "Can sometimes recover from mistakes but may lose fluency.",
            B2: "Can recover from mistakes and continue communicating. May need a moment to regroup.",
            "B2+":
              "Can recover from mistakes smoothly and continue with minimal disruption.",
            "Early C1":
              "Can recover from mistakes naturally without losing communication flow.",
          },
        },
        {
          id: "leading",
          name: "Leading Discussion",
          descriptors: {
            B1: "Cannot lead discussions. Can participate when others lead.",
            "B1+": "Can sometimes lead simple discussions on familiar topics.",
            B2: "Can lead discussions on familiar topics with some confidence.",
            "B2+": "Can lead discussions confidently on a range of topics.",
            "Early C1":
              "Can lead discussions effectively in all professional situations.",
          },
        },
      ],
      canDoStatements: [
        {
          level: "B1",
          statement: "I can start a simple conversation with colleagues.",
        },
        {
          level: "B1",
          statement: "I can ask for help when I don't understand something.",
        },
        {
          level: "B1",
          statement: "I can answer simple questions about my work.",
        },
        {
          level: "B1+",
          statement: "I can start conversations about work topics I know well.",
        },
        {
          level: "B1+",
          statement: "I can ask for clarification in most situations.",
        },
        { level: "B1+", statement: "I can handle most questions in meetings." },
        {
          level: "B2",
          statement:
            "I can start discussions and express my opinions confidently.",
        },
        {
          level: "B2",
          statement:
            "I can ask for clarification and check understanding effectively.",
        },
        {
          level: "B2",
          statement: "I can answer questions confidently even when unexpected.",
        },
        {
          level: "B2+",
          statement:
            "I can initiate communication confidently in professional situations.",
        },
        {
          level: "B2+",
          statement:
            "I can handle difficult questions and challenges confidently.",
        },
        {
          level: "Early C1",
          statement:
            "I can initiate and control communication in all situations.",
        },
        {
          level: "Early C1",
          statement: "I can handle any question or challenge with confidence.",
        },
        {
          level: "Early C1",
          statement: "I can lead discussions and meetings effectively.",
        },
      ],
      assessmentQuestions: [
        "Does the learner initiate communication or wait for others?",
        "How effectively does the learner ask for clarification?",
        "How does the learner handle unexpected or difficult questions?",
        "Can the learner recover from mistakes and continue communicating?",
        "Can the learner lead discussions or meetings?",
        "How confident does the learner appear in different situations?",
        "Does the learner participate actively or passively?",
        "How does the learner handle communication challenges?",
      ],
      teacherFeedbackPrompts: [
        "What situations increase the learner's confidence?",
        "What situations cause the learner to lose confidence?",
        "How can the learner improve at asking for clarification?",
        "What strategies help the learner handle difficult questions?",
        "How can the learner recover more smoothly from mistakes?",
        "What would help the learner take more initiative in communication?",
        "How has the learner's confidence improved over time?",
        "What specific confidence-building exercises would be beneficial?",
      ],
      practiceEvidenceExamples: [
        "Roleplay of initiating conversations",
        "Clarification practice exercises",
        "Question and answer practice",
        "Mistake recovery drills",
        "Leading discussion practice",
        "Presentation practice with Q&A",
        "Meeting participation exercises",
        "Confidence-building speaking tasks",
      ],
    },
  ],
};
