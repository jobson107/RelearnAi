
import { SeededRNG } from './seededRng';

export type Strategy = 'Fast Track' | 'Balanced' | 'Mastery';
export type ExamGoal = 'General' | 'NEET' | 'JEE' | 'SAT' | 'University' | 'IELTS';
export type Difficulty = 'Beginner' | 'Moderate' | 'Advanced';
export type TaskType = 'Learn' | 'Revise' | 'Test';

export interface Microtask {
  id: string;
  text: string;
  estMin: number;
  isComplete: boolean;
}

export interface RoadmapNode {
  id: string;
  title: string;
  type: TaskType;
  estMinutes: number;
  difficulty: Difficulty;
  microtasks: Microtask[];
  prerequisites: string[];
  resources: string[];
  progressPct: number;
  xpValue: number;
  isExpanded?: boolean;
  topicCluster?: string; // High-level grouping tag
}

export interface RoadmapConfig {
  examGoal: ExamGoal;
  strategy: Strategy;
  dailyMinutes: number;
  examDate?: string;
  seed?: number | string;
  content?: string; // Merged content from files
}

export interface ContentAnalysis {
  topics: string[];
  complexityScore: number; // 1-10
  keywordDensity: Record<string, number>;
  riskAreas: string[];
}

// --- Text Analysis Simulation ---
const analyzeContent = (text: string): ContentAnalysis => {
  if (!text) return { topics: [], complexityScore: 5, keywordDensity: {}, riskAreas: [] };

  // 1. Keyword extraction (Simulated)
  const words: string[] = text.toLowerCase().match(/\b(\w+)\b/g) || [];
  const freq: Record<string, number> = {};
  const stopWords = new Set(['the', 'and', 'of', 'to', 'in', 'is', 'for', 'with', 'a', 'on', 'that', 'this']);
  
  words.forEach(w => {
    if (w.length > 3 && !stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const sortedKeywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(x => x[0]);
  
  // 2. Topic Extraction based on Headers or Clusters
  // Simple heuristic: Lines that look like headers (Short, start with Capital, no period)
  const lines = text.split('\n');
  const potentialTopics = lines
    .map(l => l.trim())
    .filter(l => l.length > 5 && l.length < 50 && /^[A-Z0-9]/.test(l) && !l.endsWith('.'))
    .slice(0, 8); // Limit to top 8 detected headers

  // If no headers found, use keywords as topics
  const topics = potentialTopics.length > 2 
    ? potentialTopics 
    : sortedKeywords.length > 0 
      ? sortedKeywords.slice(0, 5).map(k => k.charAt(0).toUpperCase() + k.slice(1)) 
      : ['Core Concepts', 'Fundamentals', 'Advanced Theory', 'Application'];

  // 3. Complexity Heuristic (Avg word length)
  const avgWordLen = words.reduce((a: number, b: string) => a + b.length, 0) / (words.length || 1);
  const complexityScore = Math.min(10, Math.max(1, Math.round(avgWordLen * 1.5)));

  // 4. Risk Areas (Look for "hard", "complex", "difficult", "remember")
  const riskKeywords = ['formula', 'theorem', 'exception', 'irregular', 'complex', 'remember'];
  const riskAreas = sortedKeywords.filter(k => riskKeywords.some(r => k.includes(r)));

  return { topics, complexityScore, keywordDensity: freq, riskAreas };
};

const RESOURCES_POOL = [
  "AI Summary", "Visual Analogy", "Flashcard Deck", "Practice Quiz", 
  "Video Lecture", "Concept Map", "Deep Dive Paper"
];

export const generateRoadmap = (config: RoadmapConfig): RoadmapNode[] => {
  const rng = new SeededRNG(config.seed || Date.now());
  const nodes: RoadmapNode[] = [];
  
  // Analyze content if present
  const analysis = analyzeContent(config.content || "");
  const baseTopics = analysis.topics.length > 0 ? analysis.topics : ['Module 1', 'Module 2', 'Module 3', 'Final Review'];
  
  let nodeCount = 0;
  let distribution = { learn: 0, revise: 0, test: 0 };

  // Adjust config based on Strategy
  switch (config.strategy) {
    case 'Fast Track':
      nodeCount = Math.min(baseTopics.length, 5); 
      distribution = { learn: 0.3, revise: 0.2, test: 0.5 };
      break;
    case 'Balanced':
      nodeCount = Math.min(baseTopics.length + 2, 8);
      distribution = { learn: 0.5, revise: 0.3, test: 0.2 };
      break;
    case 'Mastery':
      nodeCount = Math.min(baseTopics.length + 4, 12);
      distribution = { learn: 0.6, revise: 0.3, test: 0.1 };
      break;
  }
  
  // Ensure we have enough topics to fill nodes by repeating or combining
  const roadmapTopics: string[] = [];
  while(roadmapTopics.length < nodeCount) {
    roadmapTopics.push(...baseTopics);
  }

  for (let i = 0; i < nodeCount; i++) {
    const id = `node-${i + 1}`;
    
    // Determine Type
    const randType = rng.next();
    let type: TaskType = 'Learn';
    if (randType > distribution.learn + distribution.revise) type = 'Test';
    else if (randType > distribution.learn) type = 'Revise';

    // Force first node to be Learn
    if (i === 0) type = 'Learn';

    // Topic Selection
    const baseTitle = roadmapTopics[i];
    let title = baseTitle;
    
    if (type === 'Revise') title = `Review: ${baseTitle}`;
    if (type === 'Test') title = `Assessment: ${baseTitle}`;

    // Determine Difficulty based on analysis complexity
    let difficulty: Difficulty = 'Beginner';
    const complexityMod = analysis.complexityScore > 7 ? 1 : 0; // Increase diff if text is complex
    
    if (i > nodeCount * 0.3 + complexityMod) difficulty = 'Moderate';
    if (i > nodeCount * 0.7) difficulty = 'Advanced';

    // Microtasks Generation
    const microtaskCount = rng.nextInt(3, 5);
    const microtasks: Microtask[] = [];
    
    const verbs = type === 'Learn' 
      ? ['Read', 'Summarize', 'Watch Video', 'Take Notes'] 
      : type === 'Revise' ? ['Review Flashcards', 'Mind Map', 'Self-Explain', 'Quick Quiz'] 
      : ['Practice Problems', 'Mock Questions', 'Error Analysis', 'Timed Drill'];

    for (let m = 0; m < microtaskCount; m++) {
      const verb = verbs[m % verbs.length];
      const detail = type === 'Learn' ? `Section ${m+1}` : `Key Concepts`;
      
      microtasks.push({
        id: `mt-${i}-${m}`,
        text: `${verb}: ${detail}`,
        estMin: rng.nextInt(10, 25),
        isComplete: false
      });
    }

    const totalMin = microtasks.reduce((acc, curr) => acc + curr.estMin, 0);

    // Resources
    const resCount = rng.nextInt(1, 3);
    const resources = [];
    const poolCopy = [...RESOURCES_POOL];
    for (let r=0; r<resCount; r++) {
      const idx = rng.nextInt(0, poolCopy.length - 1);
      resources.push(poolCopy[idx]);
      poolCopy.splice(idx, 1);
    }

    nodes.push({
      id,
      title,
      type,
      estMinutes: totalMin,
      difficulty,
      microtasks,
      prerequisites: i > 0 ? [`node-${i}`] : [],
      resources,
      progressPct: 0,
      xpValue: difficulty === 'Advanced' ? 50 : difficulty === 'Moderate' ? 30 : 15,
      isExpanded: i === 0,
      topicCluster: baseTitle
    });
  }

  return nodes;
};

// Export helper to get analysis separately
export const getAnalysis = (content: string) => analyzeContent(content);
