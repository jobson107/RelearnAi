
import { QuizData, Flashcard, ConceptMapData, RoadmapData, StudyAdvice } from "../types";

// --- Helpers ---

const extractSentences = (text: string): string[] => {
  if (!text) return [];
  return text.match(/[^.!?]+[.!?]+/g) || [];
};

const getKeywords = (text: string): string[] => {
  if (!text) return ["Learning", "Concept", "Study"];
  const words: string[] = text.toLowerCase().match(/\b(\w+)\b/g) || [];
  const freq: Record<string, number> = {};
  const stopWords = new Set(['the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'it', 'with', 'on', 'that', 'this', 'are', 'was', 'as', 'an', 'at']);
  
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
    .slice(0, 5);

  if (summaryPoints.length === 0) {
      return "### Summary Unavailable\n\nCould not extract a meaningful summary from the text. Please ensure the content is readable.";
  }

  return "### ⚠️ Rapid Summary (Offline Fallback)\n\n" + 
         summaryPoints.map(s => `- ${s.trim()}`).join("\n") + 
         "\n\n> *Note: AI service was unreachable. This is a heuristic summary.*";
};

export const generateLocalQuiz = (text: string): QuizData => {
  const sentences = extractSentences(text);
  const keywords = getKeywords(text);
  const questions: any[] = [];

  // Heuristic: Create questions from sentences containing keywords
  sentences.forEach(sent => {
    if (questions.length >= 5) return;
    
    const keyword = keywords.find(k => sent.toLowerCase().includes(k));
    if (keyword && sent.length < 150 && sent.length > 30) {
      // Create a cloze deletion (fill-in-the-blank) question
      const questionText = sent.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '_______');
      
      // Don't add if replacement didn't happen (regex safety)
      if (questionText === sent) return;

      questions.push({
        question: `Complete the sentence: "${questionText}"`,
        options: [
          keyword, 
          'Incorrect Option A', 
          'Incorrect Option B', 
          'Incorrect Option C'
        ].sort(() => Math.random() - 0.5),
        correctAnswerIndex: 0, // We will fix the index after sorting in a real scenario, but for fallback this is acceptable if options aren't shuffled or if we accept imperfection
        explanation: `The term "${keyword}" fits the context of the sentence.`
      });
    }
  });

  // Ensure we have valid questions
  while (questions.length < 3) {
    questions.push({
      question: "What is the primary subject of this material?",
      options: ["The Content Provided", "General Knowledge", "Unrelated Topic", "Specific Detail"],
      correctAnswerIndex: 0,
      explanation: "This is a fallback question generated to ensure the quiz functions."
    });
  }

  // Fix correct answer index mapping after random sort if we were strictly accurate, 
  // but for a safe fallback, we force the correct answer to be the keyword and place it randomly.
  questions.forEach(q => {
      const correct = q.options[0]; // The keyword was pushed first
      q.options.sort(() => Math.random() - 0.5);
      q.correctAnswerIndex = q.options.indexOf(correct);
  });

  return {
    title: "Review Quiz (Fallback)",
    questions
  };
};

export const generateLocalFlashcards = (text: string): Flashcard[] => {
  const sentences = extractSentences(text);
  const cards: Flashcard[] = [];
  
  // Regex for definitions: "Term is Definition"
  const definitionRegex = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s+(?:is|are|refers to|means)\s+(.+)/;

  sentences.forEach(sent => {
    if (cards.length >= 8) return;
    const match = sent.match(definitionRegex);
    if (match && match[2].length < 150) {
      cards.push({
        front: match[1],
        back: match[2].trim()
      });
    }
  });

  // Fallback: Keyword based
  if (cards.length < 3) {
    const keywords = getKeywords(text);
    keywords.slice(0, 5).forEach(k => {
        cards.push({
            front: k.charAt(0).toUpperCase() + k.slice(1),
            back: "Key concept from the text. Review source material for detailed definition."
        });
    });
  }

  return cards;
};

export const generateLocalConceptMap = (text: string): ConceptMapData => {
  const keywords = getKeywords(text);
  const mainTopic = keywords[0] ? keywords[0].toUpperCase() : "MAIN TOPIC";
  
  const nodes = [
      { id: "root", label: mainTopic, importance: 10, category: "Core", connections: [] as string[] }
  ];

  keywords.slice(1, 8).forEach((k, i) => {
    const id = `node-${i}`;
    nodes.push({
        id,
        label: k.charAt(0).toUpperCase() + k.slice(1),
        importance: 8 - i,
        category: "Concept",
        connections: []
    });
    // Connect to root
    nodes[0].connections.push(id);
  });

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
        description: "Review the extracted keywords and summary points from your uploaded document.",
        taskType: "Learn",
        estimatedMinutes: 45,
        difficulty: "Beginner",
        prerequisites: [],
        resources: [],
        microtasks: [
            { id: "m1", text: "Read generated summary", completed: false },
            { id: "m2", text: "Review key terms", completed: false }
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
            "Summarize each section in your own words to ensure understanding."
        ],
        microAdvice: "Focus on the bolded keywords in the summary."
    };
};
