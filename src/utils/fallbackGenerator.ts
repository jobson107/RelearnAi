
import { QuizData, Flashcard, ConceptMapData, RoadmapData, StudyAdvice } from "../types";

// --- Helpers ---

const extractSentences = (text: string): string[] => {
  return text.match(/[^.!?]+[.!?]+/g) || [];
};

const getKeywords = (text: string): string[] => {
  const words: string[] = text.toLowerCase().match(/\b(\w+)\b/g) || [];
  const freq: Record<string, number> = {};
  const stopWords = new Set(['the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'it', 'with', 'on', 'that', 'this', 'are', 'was', 'as']);
  
  words.forEach(w => {
    if (w.length > 3 && !stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(e => e[0]);
};

// --- Generators ---

export const generateLocalSummary = (text: string): string => {
  const paragraphs = text.split(/\n\s*\n/);
  const summaryPoints = paragraphs
    .map(p => {
      const sentences = extractSentences(p);
      return sentences.length > 0 ? sentences[0] : "";
    })
    .filter(s => s.length > 20)
    .slice(0, 6);

  return "### ⚠️ Offline Mode Summary\n\n" + 
         summaryPoints.map(s => `- ${s.trim()}`).join("\n") + 
         "\n\n*Note: Enable Cloud Assist for deeper AI reasoning.*";
};

export const generateLocalQuiz = (text: string): QuizData => {
  const sentences = extractSentences(text);
  const keywords = getKeywords(text);
  const questions: any[] = [];

  // Simple heuristic: Find sentences containing definitions or keywords
  sentences.forEach(sent => {
    if (questions.length >= 5) return;
    
    const keyword = keywords.find(k => sent.toLowerCase().includes(k));
    if (keyword && sent.length < 150 && sent.length > 30) {
      // Create a cloze deletion question
      const questionText = sent.replace(new RegExp(keyword, 'gi'), '_______');
      questions.push({
        question: `Complete the sentence: "${questionText}"`,
        options: [
          keyword, 
          'something else', 
          'incorrect answer', 
          'another option'
        ].sort(() => Math.random() - 0.5),
        correctAnswerIndex: 0, // We shuffle options in UI ideally, but here keeping simple
        explanation: "Extracted from text context."
      });
    }
  });

  // Fill with generic if not enough
  while (questions.length < 5) {
    questions.push({
      question: "What is the main topic of this text?",
      options: ["The Content", "Biology", "History", "Math"],
      correctAnswerIndex: 0,
      explanation: "General understanding."
    });
  }

  return {
    title: "Review Quiz (Local Mode)",
    questions
  };
};

export const generateLocalFlashcards = (text: string): Flashcard[] => {
  const sentences = extractSentences(text);
  const cards: Flashcard[] = [];
  
  // Look for "Term is Definition" or "Term: Definition" patterns
  const definitionRegex = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)(?:\s(?:is|are|refers to)|:)\s(.+)/;

  sentences.forEach(sent => {
    if (cards.length >= 8) return;
    const match = sent.match(definitionRegex);
    if (match) {
      cards.push({
        front: match[1],
        back: match[2]
      });
    }
  });

  // Fallback if regex fails: Use keywords
  if (cards.length < 4) {
    const keywords = getKeywords(text);
    keywords.forEach(k => {
        if (cards.length < 8) {
            cards.push({
                front: k.charAt(0).toUpperCase() + k.slice(1),
                back: `Key concept found in the text. (Review context for details)`
            });
        }
    });
  }

  return cards;
};

export const generateLocalConceptMap = (text: string): ConceptMapData => {
  const keywords = getKeywords(text);
  const nodes = keywords.map((k, i) => ({
    id: `node-${i}`,
    label: k.charAt(0).toUpperCase() + k.slice(1),
    importance: 10 - i,
    category: 'Key Concept',
    connections: i > 0 ? [`node-${0}`] : [] // Connect everything to the main keyword
  }));

  return { nodes };
};

export const generateLocalRoadmap = (text: string): RoadmapData => {
  return {
    examType: "General",
    strategy: "Local Fallback",
    items: [
      {
        id: "local-1",
        week: "Week 1",
        day: "Monday",
        topic: "Core Concepts Review",
        description: "Review the main keywords and definitions extracted from the document.",
        taskType: "Learn",
        estimatedMinutes: 45,
        difficulty: "Beginner",
        prerequisites: [],
        resources: [],
        microtasks: [
            { id: "m1", text: "Read summary", completed: false },
            { id: "m2", text: "Review flashcards", completed: false }
        ],
        xp: 50,
        status: "pending"
      }
    ]
  };
};

export const generateLocalStudyAdvice = (): StudyAdvice => {
    return {
        strategies: [
            "Use the Pomodoro timer to break study sessions.",
            "Review the generated flashcards for active recall.",
            "Summarize each section in your own words."
        ],
        microAdvice: "Focus on the bolded keywords in the summary."
    };
};
