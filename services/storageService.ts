
import { StudySession, ScheduleItem, AppState, SessionProgress, StudyGoals, DailyProgress, PomodoroSettings, PomodoroStats } from "../types";

const SESSIONS_KEY = 'synapse_sessions';
const SCHEDULE_KEY = 'synapse_schedule';
const GOALS_KEY = 'synapse_goals';
const PROGRESS_KEY = 'synapse_daily_progress';
const POMODORO_SETTINGS_KEY = 'synapse_pomodoro_settings';
const POMODORO_STATS_KEY = 'synapse_pomodoro_stats';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Session Management ---

export const saveSession = (title: string, appState: AppState): StudySession => {
  const sessions = getSessions();
  
  // We exclude visualUrl to avoid localStorage quota limits (images are heavy)
  const stateToSave = {
    ...appState,
    visualUrl: null 
  };

  const newSession: StudySession = {
    id: generateId(),
    title: title || "Untitled Session",
    date: new Date().toISOString(),
    previewText: appState.summary ? appState.summary.substring(0, 100) + "..." : "No summary available",
    data: stateToSave,
    progress: {
      isRead: false,
      quizScore: null,
      flashcardsViewed: 0
    }
  };

  sessions.unshift(newSession); // Add to top
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return newSession;
};

export const getSessions = (): StudySession[] => {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteSession = (id: string): void => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const updateSessionProgress = (id: string, progressUpdate: Partial<SessionProgress>): void => {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s.id === id);
  
  if (sessionIndex !== -1) {
    const currentProgress = sessions[sessionIndex].progress || { isRead: false, quizScore: null, flashcardsViewed: 0 };
    sessions[sessionIndex].progress = { ...currentProgress, ...progressUpdate };
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
};

export const updateSessionData = (id: string, dataUpdate: Partial<AppState>): void => {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s.id === id);
  
  if (sessionIndex !== -1) {
    const currentData = sessions[sessionIndex].data;
    sessions[sessionIndex].data = { ...currentData, ...dataUpdate };
    
    // Update preview text if summary is being updated
    if (dataUpdate.summary) {
        sessions[sessionIndex].previewText = dataUpdate.summary.substring(0, 100) + "...";
    }

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
};

// --- Schedule Management ---

export const getSchedule = (): ScheduleItem[] => {
  const data = localStorage.getItem(SCHEDULE_KEY);
  return data ? JSON.parse(data) : [];
};

export const addScheduleItem = (item: Omit<ScheduleItem, 'id'>): ScheduleItem => {
  const schedule = getSchedule();
  const newItem = { ...item, id: generateId() };
  schedule.push(newItem);
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  return newItem;
};

export const deleteScheduleItem = (id: string): void => {
  const schedule = getSchedule().filter(s => s.id !== id);
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
};

// --- Goal & Progress Tracking ---

const DEFAULT_GOALS: StudyGoals = {
  sessionsCompleted: 3,
  quizzesTaken: 2,
  flashcardsReviewed: 20
};

export const getGoals = (): StudyGoals => {
  const data = localStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : DEFAULT_GOALS;
};

export const setGoals = (goals: StudyGoals): void => {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
};

export const getDailyProgress = (): DailyProgress => {
  const today = new Date().toISOString().split('T')[0];
  const data = localStorage.getItem(PROGRESS_KEY);
  
  if (data) {
    const progress: DailyProgress = JSON.parse(data);
    // Reset if it's a new day
    if (progress.date === today) {
      return progress;
    }
  }

  // Return new empty progress for today
  const newProgress: DailyProgress = {
    date: today,
    sessionsCompleted: 0,
    quizzesTaken: 0,
    flashcardsReviewed: 0
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
  return newProgress;
};

export const updateDailyProgress = (update: Partial<DailyProgress>): DailyProgress => {
  const current = getDailyProgress();
  // Accumulate values
  const newProgress = {
    ...current,
    sessionsCompleted: current.sessionsCompleted + (update.sessionsCompleted || 0),
    quizzesTaken: current.quizzesTaken + (update.quizzesTaken || 0),
    flashcardsReviewed: current.flashcardsReviewed + (update.flashcardsReviewed || 0)
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
  return newProgress;
};

// --- Pomodoro Storage ---

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
  dailyGoal: 8
};

export const getPomodoroSettings = (): PomodoroSettings => {
  const data = localStorage.getItem(POMODORO_SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_POMODORO_SETTINGS;
};

export const savePomodoroSettings = (settings: PomodoroSettings): void => {
  localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(settings));
};

export const getPomodoroStats = (): PomodoroStats => {
  const data = localStorage.getItem(POMODORO_STATS_KEY);
  const today = new Date().toISOString().split('T')[0];
  
  if (data) {
      const stats = JSON.parse(data);
      // If it's a new day, reset daily sessions but keep streak if consecutive
      if (stats.lastActiveDate !== today) {
          return {
              ...stats,
              sessionsCompleted: 0, // Reset daily count
              lastActiveDate: today
          };
      }
      return stats;
  }
  
  return { sessionsCompleted: 0, totalFocusTime: 0, currentStreak: 0, lastActiveDate: today };
};

export const updatePomodoroStats = (statsUpdate: Partial<PomodoroStats>): PomodoroStats => {
  const current = getPomodoroStats();
  const newStats = { ...current, ...statsUpdate };
  localStorage.setItem(POMODORO_STATS_KEY, JSON.stringify(newStats));
  return newStats;
};

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const COLORS = [
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Emerald', value: 'bg-emerald-500' },
  { name: 'Rose', value: 'bg-rose-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Sky', value: 'bg-sky-500' },
  { name: 'Violet', value: 'bg-violet-500' },
];
