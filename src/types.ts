
export enum LearningMode {
  SUMMARIZE = 'SUMMARIZE',
  VISUALIZE = 'VISUALIZE',
  QUIZ = 'QUIZ'
}

export enum AnalysisDepth {
  NOTES_ONLY = 'NOTES_ONLY',
  DEEP_DIVE = 'DEEP_DIVE'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface WebResource {
  title: string;
  uri: string;
  snippet?: string;
  type?: 'video' | 'article' | 'animation';
  duration?: string;
  thumbnail?: string;
}

export interface DeepDiveData {
  content: string;
  resources: WebResource[];
}

// --- Roadmap Types ---
export type ExamType = 'General' | 'NEET' | 'JEE' | 'SAT' | 'University' | 'IELTS' | 'GATE';
export type StudyStrategy = 'Fast Track' | 'Balanced' | 'Mastery';

export interface RoadmapMicrotask {
    id: string;
    text: string;
    completed: boolean;
}

export interface RoadmapItem {
  id: string;
  week: string;
  day: string; 
  topic: string;
  description: string;
  taskType: 'Learn' | 'Revise' | 'Test';
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[]; // List of topic names or IDs
  resources: WebResource[];
  microtasks: RoadmapMicrotask[];
  xp: number;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface RoadmapData {
  examType: string;
  strategy: string;
  items: RoadmapItem[];
}

// --- Video & Animation Types ---
export interface VideoResult {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string; 
  source: 'local' | 'youtube' | 'gemini';
  duration?: string;
  relevance: number;
}

// --- Concept Map Types ---
export interface ConceptNode {
  id: string;
  label: string;
  importance: number; // 1-10
  category: string;
  connections: string[]; // IDs of connected nodes
}

export interface ConceptMapData {
  nodes: ConceptNode[];
}

export interface StudyAdvice {
  strategies: string[];
  microAdvice: string;
}

export interface AppState {
  content: string;
  summary: string | null;
  visualUrl: string | null;
  visualPrompt: string | null;
  quiz: QuizData | null;
  flashcards: Flashcard[] | null;
  deepDive: DeepDiveData | null;
  roadmap?: RoadmapData | null;
  conceptMap?: ConceptMapData | null;
  studyAdvice?: StudyAdvice | null;
}

export interface SessionProgress {
  isRead: boolean;
  quizScore: number | null; // null if not taken
  flashcardsViewed: number;
}

// Database Types
export interface StudySession {
  id: string;
  title: string;
  date: string; // ISO string
  previewText: string;
  data: AppState;
  progress?: SessionProgress;
}

export interface ScheduleItem {
  id: string;
  subject: string;
  day: string; // 'Monday', 'Tuesday', etc.
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  color: string; // Tailwind class like 'bg-indigo-500'
}

// Goal Tracking Types
export interface StudyGoals {
  sessionsCompleted: number; // Target number of sessions to analyze/read
  quizzesTaken: number;
  flashcardsReviewed: number;
}

export interface DailyProgress {
  date: string; // ISO Date string (YYYY-MM-DD)
  sessionsCompleted: number;
  quizzesTaken: number;
  flashcardsReviewed: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  unlocked: boolean;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  sources?: WebResource[]; // For search grounding
}

// --- Pomodoro Types ---
export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyGoal: number;
}

export interface PomodoroStats {
  sessionsCompleted: number;
  totalFocusTime: number; // in minutes
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
}
