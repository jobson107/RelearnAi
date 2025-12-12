
import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { SummaryCard } from './components/SummaryCard';
import { Visualizer } from './components/Visualizer';
import { QuizModule } from './components/QuizModule';
import { FlashcardDeck } from './components/FlashcardDeck';
import { ResourceModule } from './components/ResourceModule';
import { LoginScreen } from './components/LoginScreen';
import { Library } from './components/Library';
import { Schedule } from './components/Schedule';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { GoalTracker } from './components/GoalTracker';
import { ChatBot } from './components/ChatBot';
import { Sidebar } from './components/Sidebar'; 
import { PomodoroTimer } from './components/PomodoroTimer';
import RoadmapPage from './components/RoadmapPage';
import { generateSummary, generateQuiz, generateVisualAnalogy, generateFlashcards, generateDeepDive, generateStudyRoadmap } from './services/geminiService';
import { saveSession, getSessions, updateSessionProgress, updateDailyProgress, getSchedule, updateSessionData } from './services/storageService';
import { AppState, StudySession, AnalysisDepth, SessionProgress, ExamType, StudyStrategy } from './types';
import { GraduationCap, Activity, LogOut, Save, Search, Globe, Moon, Sun, EyeOff, Menu, Zap, Upload, Map, X } from 'lucide-react';

const DRAFT_KEY = 'synapse_draft_state';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentView, setCurrentView] = useState<'study' | 'library' | 'schedule' | 'goals' | 'roadmap'>('study');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0); 
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // Initialize Theme from LocalStorage or System Preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synapse_theme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [appState, setAppState] = useState<AppState>({
    content: '',
    summary: null,
    visualUrl: null,
    visualPrompt: null,
    quiz: null,
    flashcards: null,
    deepDive: null,
    roadmap: null
  });

  const [loadingState, setLoadingState] = useState({
    summary: false,
    visual: false,
    quiz: false,
    flashcards: false,
    deepDive: false,
    roadmap: false
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Derived state variables
  const isAnyLoading = Object.values(loadingState).some(state => state);
  const hasContent = !!appState.content;

  // --- Persistence & Reload Logic ---
  useEffect(() => {
    const savedDraft = sessionStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.content) {
          setAppState(parsed);
        }
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, []);

  useEffect(() => {
    if (appState.content) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(appState));
    }
  }, [appState]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('synapse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('synapse_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (currentView === 'library') {
      setSessions(getSessions());
    }
  }, [currentView]);

  useEffect(() => {
    const checkSchedule = () => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        const schedule = getSchedule();
        
        schedule.forEach(item => {
            if (item.day === currentDay && item.startTime === currentTime) {
                new Notification(`🔔 Class Starting: ${item.subject}`, {
                    body: `It's time for your ${item.subject} session! Good luck!`,
                    icon: '/favicon.ico',
                    requireInteraction: true
                });
            }
        });
    };

    const interval = setInterval(checkSchedule, 60000);
    const timeout = setTimeout(checkSchedule, 5000);

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowWelcome(true);
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowWelcome(false);
    setAppState({
      content: '',
      summary: null,
      visualUrl: null,
      visualPrompt: null,
      quiz: null,
      flashcards: null,
      deepDive: null,
      roadmap: null
    });
    sessionStorage.removeItem(DRAFT_KEY);
    setActiveSessionId(null);
  };

  const handleNewTopic = () => {
    setAppState({
      content: '',
      summary: null,
      visualUrl: null,
      visualPrompt: null,
      quiz: null,
      flashcards: null,
      deepDive: null,
      roadmap: null
    });
    setLoadingState({
      summary: false,
      visual: false,
      quiz: false,
      flashcards: false,
      deepDive: false,
      roadmap: false
    });
    setActiveSessionId(null);
    setSaveStatus('idle');
    sessionStorage.removeItem(DRAFT_KEY);
    
    setInputKey(prev => prev + 1);
    setCurrentView('study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSaveSession = () => {
    if (!appState.summary) return;
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleLoadSession = (session: StudySession) => {
    setAppState(session.data);
    setActiveSessionId(session.id);
    setCurrentView('study');
    setSaveStatus('idle');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query && currentView !== 'library') {
        setCurrentView('library');
    }
  };

  const trackSessionStart = () => {
    updateDailyProgress({ sessionsCompleted: 1 });
  };

  const handleQuizComplete = (score: number) => {
    updateDailyProgress({ quizzesTaken: 1 });
    if (activeSessionId) {
      updateSessionProgress(activeSessionId, { quizScore: score });
    }
  };

  const handleFlashcardView = () => {
     updateDailyProgress({ flashcardsReviewed: 1 });
  };

  const handleSummaryRead = () => {
     if (activeSessionId) {
         updateSessionProgress(activeSessionId, { isRead: true });
     }
  };

  const handleGenerateRoadmap = () => {
      setCurrentView('roadmap');
  };

  const handleAnalyze = async (text: string, depth: AnalysisDepth, includeVisuals: boolean) => {
    setActiveSessionId(null);
    
    setAppState(prev => ({ 
      ...prev, 
      content: text, 
      summary: null, 
      visualUrl: null, 
      quiz: null, 
      flashcards: null,
      deepDive: null,
      roadmap: null
    }));
    
    setSaveStatus('idle');
    trackSessionStart();

    const title = text.split('\n')[0].substring(0, 30) || "Study Session";
    const newSession = saveSession(title, { ...appState, content: text });
    setActiveSessionId(newSession.id);
    setSaveStatus('saved');

    setLoadingState(prev => ({ ...prev, summary: true }));
    generateSummary(text, depth)
      .then(summary => {
        setAppState(prev => ({ ...prev, summary }));
        setLoadingState(prev => ({ ...prev, summary: false }));
        updateSessionData(newSession.id, { summary });
      })
      .catch(() => setLoadingState(prev => ({ ...prev, summary: false })));

    if (includeVisuals) {
        setLoadingState(prev => ({ ...prev, visual: true }));
        generateVisualAnalogy(text)
        .then(({ imageUrl, prompt }) => {
            setAppState(prev => ({ ...prev, visualUrl: imageUrl, visualPrompt: prompt }));
            setLoadingState(prev => ({ ...prev, visual: false }));
        })
        .catch(() => setLoadingState(prev => ({ ...prev, visual: false })));
    } else {
        setAppState(prev => ({ ...prev, visualUrl: null, visualPrompt: null }));
    }

    setLoadingState(prev => ({ ...prev, quiz: true }));
    generateQuiz(text, depth)
      .then(quiz => {
        setAppState(prev => ({ ...prev, quiz }));
        setLoadingState(prev => ({ ...prev, quiz: false }));
        updateSessionData(newSession.id, { quiz });
      })
      .catch(() => setLoadingState(prev => ({ ...prev, quiz: false })));

    setLoadingState(prev => ({ ...prev, flashcards: true }));
    generateFlashcards(text)
      .then(flashcards => {
        setAppState(prev => ({ ...prev, flashcards }));
        setLoadingState(prev => ({ ...prev, flashcards: false }));
        updateSessionData(newSession.id, { flashcards });
      })
      .catch(() => setLoadingState(prev => ({ ...prev, flashcards: false })));
      
    // Auto generate roadmap if deep dive
    if (depth === AnalysisDepth.DEEP_DIVE) {
        setLoadingState(prev => ({ ...prev, roadmap: true }));
        generateStudyRoadmap(text)
        .then(roadmap => {
            setAppState(prev => ({ ...prev, roadmap }));
            setLoadingState(prev => ({ ...prev, roadmap: false }));
        })
        .catch(() => setLoadingState(prev => ({ ...prev, roadmap: false })));
    }

    if (depth === AnalysisDepth.DEEP_DIVE) {
        setLoadingState(prev => ({ ...prev, deepDive: true }));
        generateDeepDive(text, depth)
        .then(deepDive => {
            setAppState(prev => ({ ...prev, deepDive }));
            setLoadingState(prev => ({ ...prev, deepDive: false }));
            updateSessionData(newSession.id, { deepDive });
        })
        .catch(() => setLoadingState(prev => ({ ...prev, deepDive: false })));
    }
  };

  const handleRegenerateVisual = () => {
     if(appState.content) {
        setLoadingState(prev => ({ ...prev, visual: true }));
        generateVisualAnalogy(appState.content)
        .then(({ imageUrl, prompt }) => {
            setAppState(prev => ({ ...prev, visualUrl: imageUrl, visualPrompt: prompt }));
            setLoadingState(prev => ({ ...prev, visual: false }));
        })
        .catch(() => setLoadingState(prev => ({ ...prev, visual: false })));
     }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 pb-12 relative overflow-x-hidden animate-in fade-in duration-700 bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      
      {showWelcome && <WelcomeOverlay onComplete={handleWelcomeComplete} />}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView} 
        onNavigate={setCurrentView}
        onGenerateRoadmap={handleGenerateRoadmap}
      />
      
      <PomodoroTimer />

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-20 md:right-24 z-40">
          <button 
             onClick={() => setShowQuickActions(!showQuickActions)}
             className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
          >
             {showQuickActions ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6 fill-current" />}
          </button>
          
          {showQuickActions && (
              <div className="absolute bottom-16 right-0 flex flex-col gap-3 animate-in slide-in-from-bottom-4">
                  <button 
                    onClick={() => { handleGenerateRoadmap(); setShowQuickActions(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-white whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                      <span>Create Roadmap</span>
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                        <Map className="w-4 h-4" />
                      </div>
                  </button>
                  <button 
                    onClick={() => { handleNewTopic(); setShowQuickActions(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-white whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                      <span>New Upload</span>
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                        <Upload className="w-4 h-4" />
                      </div>
                  </button>
              </div>
          )}
      </div>


      {/* Animated Gradient Background */}
      <div className="fixed inset-0 w-full h-full -z-10 animate-gradient-bg opacity-10 dark:opacity-5"></div>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/60 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            {/* Hamburger Menu */}
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer flex-shrink-0" onClick={() => setCurrentView('study')}>
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 hidden lg:block">
                Synapse<span className="text-indigo-500">AI</span>
                </span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden md:block relative">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
             </div>
             <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search your library..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-200 dark:focus:border-indigo-500/30 rounded-full text-sm outline-none transition-all placeholder:text-slate-400 dark:text-slate-200"
             />
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
             <button
               onClick={toggleTheme}
               className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
               title="Toggle Theme"
             >
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <button 
                onClick={handleLogout}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                title="Sign Out"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 px-6 max-w-[1400px] mx-auto space-y-12 min-h-screen">
        
        {currentView === 'study' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`transition-all duration-700 ease-in-out ${hasContent ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100 py-12'}`}>
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-8 duration-1000">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 backdrop-blur-md text-sm text-indigo-600 dark:text-indigo-400 font-bold shadow-sm">
                        ✨ The Ultimate Entrance Exam Companion
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-slate-800 dark:text-white mb-6 tracking-tight leading-tight">
                    Master Your <br />
                    <span className="gradient-text">Study Material</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Upload your syllabus or notes. Synapse generates <strong className="text-slate-700 dark:text-slate-200">Exam-Level Summaries</strong>, <strong className="text-slate-700 dark:text-slate-200">Active Recall Cards</strong>, and <strong className="text-slate-700 dark:text-slate-200">Deep Research</strong> instantly.
                    </p>
                </div>

                {/* Input Section - Centered without GoalTracker */}
                <div className="max-w-4xl mx-auto">
                    <InputSection 
                        key={inputKey}
                        onAnalyze={handleAnalyze} 
                        isProcessing={isAnyLoading} 
                        isDarkMode={isDarkMode}
                        onToggleTheme={toggleTheme}
                        onViewLibrary={() => setCurrentView('library')}
                    />
                </div>
                
                </div>

                {hasContent && (
                <div className="flex flex-col sm:flex-row justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500 mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Study Dashboard</h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         {/* Quick Roadmap Gen */}
                         {(!appState.roadmap && !loadingState.roadmap) && (
                            <button 
                                onClick={handleGenerateRoadmap}
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                            >
                                <Map className="w-4 h-4" />
                                <span>Create Roadmap</span>
                            </button>
                         )}

                         <button 
                            onClick={handleSaveSession}
                            disabled={saveStatus === 'saved'}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700'}`}
                         >
                            <Save className="w-4 h-4" />
                            <span>{saveStatus === 'saved' ? 'Saved to Library' : 'Save Session'}</span>
                         </button>

                         <button 
                            onClick={handleNewTopic}
                            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4 hover:decoration-indigo-400 transition-all"
                        >
                        New Topic
                        </button>
                    </div>
                </div>
                )}

                {hasContent && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="lg:col-span-4 min-h-[500px] lg:h-auto h-full">
                    {loadingState.summary ? (
                        <div className="glass-panel h-full min-h-[500px] rounded-[2rem] flex items-center justify-center bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">Structuring Notes...</p>
                            </div>
                        </div>
                    ) : (
                        <SummaryCard summary={appState.summary || ""} />
                    )}
                    </div>

                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="min-h-[400px] h-full">
                                { (appState.visualUrl || loadingState.visual) ? (
                                    <Visualizer 
                                        imageUrl={appState.visualUrl} 
                                        prompt={appState.visualPrompt} 
                                        isLoading={loadingState.visual}
                                        onRegenerate={handleRegenerateVisual}
                                    />
                                ) : (
                                    <div className="glass-panel rounded-[2rem] p-1 h-full flex items-center justify-center bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700">
                                         <div className="text-center p-6 text-slate-400 dark:text-slate-500">
                                            <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                                            <p className="font-medium text-sm">Visuals disabled for this session.</p>
                                         </div>
                                    </div>
                                )}
                            </div>
                            <div className="min-h-[400px] h-full">
                                { (appState.deepDive || loadingState.deepDive) ? (
                                    <ResourceModule data={appState.deepDive} isLoading={loadingState.deepDive} />
                                ) : (
                                    <div className="glass-panel rounded-[2rem] p-1 h-full flex items-center justify-center bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700">
                                        <div className="text-center p-6">
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Globe className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                                            </div>
                                            <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Deep Dive skipped in Notes Only mode.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="min-h-[400px] h-full">
                                <FlashcardDeck 
                                flashcards={appState.flashcards} 
                                isLoading={loadingState.flashcards}
                                />
                            </div>
                            <div className="min-h-[400px] h-full">
                                <QuizModule 
                                quiz={appState.quiz} 
                                isLoading={loadingState.quiz}
                                />
                            </div>
                        </div>

                    </div>
                </div>
                )}
            </div>
        )}

        {currentView === 'library' && (
            <Library 
                sessions={sessions} 
                onLoadSession={handleLoadSession} 
                onRefresh={() => setSessions(getSessions())} 
                searchQuery={searchQuery}
                onSearch={handleSearchChange}
            />
        )}

        {currentView === 'schedule' && (
            <Schedule />
        )}
        
        {currentView === 'goals' && (
            <GoalTracker />
        )}

        {currentView === 'roadmap' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[700px]">
                <RoadmapPage />
            </div>
        )}

      </main>

      <ChatBot />

    </div>
  );
};

export default App;
