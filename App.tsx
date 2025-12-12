
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
import { VideoSearchPanel } from './components/VideoSearchPanel';
import { ConceptGraph } from './components/ConceptGraph';
import { generateSummary, generateQuiz, generateVisualAnalogy, generateFlashcards, generateDeepDive, generateStudyRoadmap, generateConceptMap, generateStudyAdvice } from './services/geminiService';
import { saveSession, getSessions, updateSessionData } from './services/storageService';
import { AppState, StudySession, AnalysisDepth, VideoResult, WebResource } from './types';
import { GraduationCap, Activity, LogOut, Save, Search, Moon, Sun, EyeOff, Menu, Zap, Upload, Map, X, Play, Globe } from 'lucide-react';

const DRAFT_KEY = 'relearn_draft_state';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentView, setCurrentView] = useState<'study' | 'library' | 'schedule' | 'goals' | 'roadmap'>('study');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0); 
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('relearn_theme');
      if (saved) return saved === 'dark';
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
    roadmap: null,
    conceptMap: null,
    studyAdvice: null,
    isFallback: false
  });

  const [loadingState, setLoadingState] = useState({
    summary: false, visual: false, quiz: false, flashcards: false, deepDive: false, roadmap: false, conceptMap: false, studyAdvice: false
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const isAnyLoading = Object.values(loadingState).some(state => state);
  const hasContent = !!appState.content;

  useEffect(() => { if (appState.content) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(appState)); }, [appState]);
  useEffect(() => { 
      document.documentElement.classList.toggle('dark', isDarkMode); 
      localStorage.setItem('relearn_theme', isDarkMode ? 'dark' : 'light'); 
  }, [isDarkMode]);
  useEffect(() => { if (currentView === 'library') setSessions(getSessions()); }, [currentView]);

  const handleLogin = () => { setIsAuthenticated(true); setShowWelcome(true); };
  const handleLogout = () => { setIsAuthenticated(false); setAppState({ content: '', summary: null, visualUrl: null, visualPrompt: null, quiz: null, flashcards: null, deepDive: null }); };
  
  const handleLoadDemo = () => {
      // Instant impact for judges
      setAppState({
          content: "Neuroscience Demo Data",
          summary: "### Synaptic Plasticity\n\n**Synaptic plasticity** is the ability of synapses to strengthen or weaken over time, in response to increases or decreases in their activity. \\[ \\Delta w = \\eta \\cdot x \\cdot y \\] \n\n*   **LTP (Long-Term Potentiation)**: Persistent strengthening of synapses.\n*   **LTD (Long-Term Depression)**: Activity-dependent reduction in efficacy.",
          visualUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80",
          visualPrompt: "Neuronal network glowing",
          quiz: { title: "Neuro Quiz", questions: [{ question: "What is the primary mechanism of memory formation?", options: ["LTP", "Mitosis", "Osmosis"], correctAnswerIndex: 0, explanation: "LTP strengthens connections." }] },
          flashcards: [{ front: "LTP", back: "Long-Term Potentiation" }, { front: "Synapse", back: "Junction between neurons" }],
          deepDive: { content: "Recent studies link LTP to spatial memory...", resources: [] },
          conceptMap: { nodes: [{ id: "1", label: "Neuron", importance: 10, category: "Cell", connections: ["2", "3"] }, { id: "2", label: "Synapse", importance: 8, category: "Structure", connections: [] }, { id: "3", label: "Action Potential", importance: 9, category: "Process", connections: ["2"] }] },
          studyAdvice: { strategies: ["Draw diagrams", "Spaced repetition"], microAdvice: "Focus on the LTP mechanism." },
          isFallback: false
      });
  };

  const handleSaveSession = () => {
    if (appState.summary) {
        saveSession(appState.summary.split('\n')[0] || "Study Session", appState);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleAnalyze = async (text: string, depth: AnalysisDepth, includeVisuals: boolean) => {
    setActiveSessionId(null);
    setAppState(prev => ({ ...prev, content: text, summary: null, visualUrl: null, quiz: null, flashcards: null, conceptMap: null, studyAdvice: null, isFallback: false }));
    setSaveStatus('saved');
    
    const processResult = (result: {data: any, isFallback: boolean}, key: keyof AppState) => {
        if (result.isFallback) setAppState(prev => ({ ...prev, isFallback: true }));
        setAppState(prev => ({ ...prev, [key]: result.data }));
        setLoadingState(prev => ({ ...prev, [key]: false }));
    };

    setLoadingState(p => ({ ...p, summary: true, quiz: true, flashcards: true, conceptMap: true, studyAdvice: true }));
    generateSummary(text, depth).then(r => processResult(r, 'summary'));
    generateStudyAdvice(text).then(r => processResult(r, 'studyAdvice'));
    generateQuiz(text, depth).then(r => processResult(r, 'quiz'));
    generateFlashcards(text).then(r => processResult(r, 'flashcards'));
    generateConceptMap(text).then(r => processResult(r, 'conceptMap'));

    if (includeVisuals) {
        setLoadingState(p => ({ ...p, visual: true }));
        generateVisualAnalogy(text).then(r => {
            setAppState(p => ({ ...p, visualUrl: r.data.imageUrl, visualPrompt: r.data.prompt }));
            setLoadingState(p => ({ ...p, visual: false }));
        });
    }
  };

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 pb-12 relative overflow-x-hidden animate-in fade-in duration-700 bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {showWelcome && <WelcomeOverlay onComplete={() => setShowWelcome(false)} />}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={currentView} onNavigate={setCurrentView} onGenerateRoadmap={() => setCurrentView('roadmap')} onOpenVideoPanel={() => setIsVideoPanelOpen(true)} />
      <PomodoroTimer />
      <VideoSearchPanel isOpen={isVideoPanelOpen} onClose={() => setIsVideoPanelOpen(false)} appState={appState} onInsertVideo={() => {}} />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/60 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Menu className="w-6 h-6" /></button>
            <div className="flex items-center space-x-3 cursor-pointer flex-shrink-0" onClick={() => setCurrentView('study')}>
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20"><GraduationCap className="w-6 h-6 text-white" /></div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 hidden lg:block">ReLearn<span className="text-indigo-500">AI</span></span>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
             <button onClick={handleLogout} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <main className="pt-20 px-6 max-w-[1400px] mx-auto space-y-8 min-h-screen">
        {currentView === 'study' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
                <div className={`transition-all duration-700 ease-in-out ${hasContent ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100 py-8'}`}>
                    <div className="text-center mb-12 animate-in fade-in slide-in-from-top-8 duration-1000">
                        <h1 className="text-5xl md:text-7xl font-bold text-slate-800 dark:text-white mb-6 tracking-tight leading-tight">Master Your <br /><span className="gradient-text">Study Material</span></h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
                            Upload your syllabus or notes. ReLearn generates 3D Knowledge Graphs, Exam-Level Summaries, and Animations instantly.
                        </p>
                        <button onClick={handleLoadDemo} className="px-8 py-3 bg-white dark:bg-slate-800 text-indigo-600 font-bold rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto border border-indigo-100 dark:border-indigo-900">
                            <Play className="w-5 h-5 fill-current" /> Try Demo (No Upload Needed)
                        </button>
                    </div>
                    <div className="max-w-4xl mx-auto"><InputSection key={inputKey} onAnalyze={handleAnalyze} isProcessing={isAnyLoading} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} onViewLibrary={() => setCurrentView('library')} /></div>
                </div>

                {hasContent && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500 mb-8 gap-4">
                        <div className="flex items-center gap-3"><div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg"><Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Study Dashboard</h2></div>
                        <div className="flex items-center gap-4">
                             <button onClick={handleSaveSession} disabled={saveStatus === 'saved'} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-700' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700'}`}><Save className="w-4 h-4" /><span>{saveStatus === 'saved' ? 'Saved' : 'Save Session'}</span></button>
                             <button onClick={() => { setAppState({ content: '', summary: null, visualUrl: null, visualPrompt: null, quiz: null, flashcards: null, deepDive: null }); setInputKey(k => k+1); }} className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 underline">New Topic</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="lg:col-span-4 min-h-[500px] lg:h-auto h-full">
                            {loadingState.summary ? (
                                <div className="glass-panel h-full min-h-[500px] rounded-[2rem] flex items-center justify-center bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700"><p className="text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">Structuring Notes...</p></div>
                            ) : ( <SummaryCard summary={appState.summary || ""} advice={appState.studyAdvice} /> )}
                        </div>

                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {(appState.conceptMap || loadingState.conceptMap) && (
                                <div className="w-full">
                                    {loadingState.conceptMap ? (
                                        <div className="h-[300px] bg-white/40 dark:bg-slate-800/40 rounded-2xl flex items-center justify-center animate-pulse">Building Knowledge Graph...</div>
                                    ) : ( <ConceptGraph data={appState.conceptMap!} /> )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="min-h-[400px] h-full">
                                    {(appState.visualUrl || loadingState.visual) ? (
                                        <Visualizer imageUrl={appState.visualUrl} prompt={appState.visualPrompt} isLoading={loadingState.visual} onRegenerate={() => {}} />
                                    ) : ( <div className="glass-panel rounded-[2rem] p-1 h-full flex items-center justify-center bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700"><EyeOff className="w-8 h-8 opacity-50"/></div> )}
                                </div>
                                <div className="min-h-[400px] h-full">
                                    {(appState.deepDive || loadingState.deepDive) ? <ResourceModule data={appState.deepDive} isLoading={loadingState.deepDive} /> : <div className="glass-panel rounded-[2rem] p-1 h-full flex items-center justify-center bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700"><Globe className="w-6 h-6 opacity-50"/></div>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="min-h-[400px] h-full"><FlashcardDeck flashcards={appState.flashcards} isLoading={loadingState.flashcards} /></div>
                                <div className="min-h-[400px] h-full"><QuizModule quiz={appState.quiz} isLoading={loadingState.quiz} /></div>
                            </div>
                        </div>
                    </div>
                </>
                )}
            </div>
        )}
        {currentView === 'library' && <Library sessions={sessions} onLoadSession={(s) => { setAppState(s.data); setActiveSessionId(s.id); setCurrentView('study'); }} onRefresh={() => setSessions(getSessions())} searchQuery={searchQuery} onSearch={setSearchQuery} />}
        {currentView === 'schedule' && <Schedule />}
        {currentView === 'goals' && <GoalTracker />}
        {currentView === 'roadmap' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[700px]"><RoadmapPage initialData={appState.roadmap} /></div>}
      </main>
      <ChatBot />
    </div>
  );
};

export default App;
