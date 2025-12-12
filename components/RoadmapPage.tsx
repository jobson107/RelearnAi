
import React, { useState } from 'react';
import '../styles/roadmap.css';
import { GenerateButton } from './GenerateButton';
import { RoadmapResult } from './RoadmapResult';
import ConfettiCanvas from './ConfettiCanvas';
import { MultiFileUploader } from './MultiFileUploader';
import { InsightPanel } from './InsightPanel';
import { ToastProvider, useToast } from './Toast';
import { generateRoadmap, getAnalysis, RoadmapConfig, RoadmapNode, ExamGoal, Strategy, ContentAnalysis } from '../utils/roadmapGenerator';
import { Map, Trophy, Target, Calendar, Clock, Flame, ChevronRight, Layers } from 'lucide-react';

const RoadmapPageContent: React.FC = () => {
  const [step, setStep] = useState<'form' | 'generating' | 'success' | 'complete'>('form');
  const [config, setConfig] = useState<RoadmapConfig>({
    examGoal: 'General',
    strategy: 'Balanced',
    dailyMinutes: 60,
    content: ''
  });
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  
  const { addToast } = useToast();

  // Stats for gamification
  const totalTasks = nodes.reduce((acc, n) => acc + n.microtasks.length, 0);
  const completedTasks = nodes.reduce((acc, n) => acc + n.microtasks.filter(t => t.isComplete).length, 0);
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleContentReady = (mergedContent: string, count: number) => {
    setConfig(prev => ({ ...prev, content: mergedContent }));
    setFileCount(count);
    if (mergedContent) {
        addToast(`${count} files merged and ready for analysis.`, 'success');
    }
  };

  const handleGenerate = async () => {
    if (!config.content && fileCount === 0) {
        addToast("Please upload at least one file to generate a roadmap.", "error");
        return;
    }

    setStep('generating');
    
    // 1. Simulate AI Analysis Delay
    await new Promise(resolve => setTimeout(resolve, 800));
    const analysisResult = getAnalysis(config.content || "");
    setAnalysis(analysisResult);
    
    // 2. Generate Data
    await new Promise(resolve => setTimeout(resolve, 600));
    const newNodes = generateRoadmap(config);
    setNodes(newNodes);

    // 3. Success Animation Sequence
    setStep('success');
    setShowConfetti(true);
    addToast("Roadmap generated successfully!", "success");
    
    // 4. Reveal Roadmap after animation
    setTimeout(() => {
        setStep('complete');
        // Confetti stops slightly before
        setTimeout(() => setShowConfetti(false), 1200);
    }, 1600);
  };

  const handleRegenerate = () => {
    addToast("Regenerating plan with new randomization...", "info");
    setStep('generating');
    setTimeout(() => {
        const newNodes = generateRoadmap({ ...config, seed: Date.now() });
        setNodes(newNodes);
        setStep('complete');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 md:p-8 overflow-x-hidden">
      <ConfettiCanvas active={showConfetti} />

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header / Gamification Bar */}
        <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
                  <Map className="w-6 h-6" />
              </div>
              <div>
                  <h1 className="text-2xl font-bold tracking-tight">Study Roadmap</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Multi-Source Curriculum Designer</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{streak} Day Streak</span>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                  <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{xp} XP</span>
              </div>
           </div>
        </div>

        {/* Input Card - Only show full form if not complete, or show summary if complete */}
        <div className={`relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] border border-white/60 dark:border-slate-700 shadow-xl overflow-hidden transition-all duration-700 ease-in-out ${step === 'complete' ? 'p-6' : 'p-8 md:p-10'}`}>
            
            {/* Success Sweep Overlay */}
            {step === 'success' && (
                <div className="success-sweep-overlay animate-sweep"></div>
            )}

            {step !== 'complete' ? (
                <div className={`space-y-8 transition-opacity duration-300 ${step !== 'form' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Design Your Path</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                            Upload your study materials (PDFs, Notes). Our AI will merge them, analyze complexity, and build a master schedule.
                        </p>
                    </div>

                    {/* Step 1: Upload */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">1</div>
                            Upload Materials
                        </div>
                        <MultiFileUploader onContentReady={handleContentReady} isProcessing={step !== 'form'} />
                    </div>

                    {/* Step 2: Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">2</div>
                            Configure Plan
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Exam Goal</label>
                                <div className="relative">
                                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <select 
                                        value={config.examGoal}
                                        onChange={(e) => setConfig({...config, examGoal: e.target.value as ExamGoal})}
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                                    >
                                        <option value="General">General Study</option>
                                        <option value="NEET">NEET (Medical)</option>
                                        <option value="JEE">JEE (Engineering)</option>
                                        <option value="SAT">SAT</option>
                                        <option value="University">University Semester</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Strategy</label>
                                <div className="grid grid-cols-3 gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    {['Fast Track', 'Balanced', 'Mastery'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setConfig({...config, strategy: s as Strategy})}
                                            className={`py-2 rounded-lg text-xs font-bold transition-all ${config.strategy === s ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Daily Availability</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <select 
                                        value={config.dailyMinutes}
                                        onChange={(e) => setConfig({...config, dailyMinutes: parseInt(e.target.value)})}
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                                    >
                                        <option value={30}>30 Minutes</option>
                                        <option value={60}>1 Hour</option>
                                        <option value={120}>2 Hours</option>
                                        <option value={180}>3+ Hours</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Target Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input 
                                        type="date"
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                         {step === 'generating' && (
                             <div className="text-center mb-4">
                                 <p className="text-sm font-bold shimmer-text">Analyzing Content Density & Clustering Topics...</p>
                             </div>
                         )}
                        <GenerateButton 
                            isLoading={step === 'generating' || step === 'success'} 
                            onClick={handleGenerate} 
                            label={config.content ? `Analyze & Generate Plan` : `Generate Plan`}
                        />
                    </div>
                </div>
            ) : (
                // Compact Header when complete
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {progress === 100 ? <Trophy className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{config.examGoal} Roadmap</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <Layers className="w-4 h-4" />
                                <span>{fileCount} Sources Analyzed</span>
                                <span>•</span>
                                <span>{config.strategy} Strategy</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-48 bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 w-12 text-right">{progress}%</span>
                    </div>
                </div>
            )}
        </div>

        {/* Results Area */}
        {step === 'complete' && (
            <>
                {analysis && <InsightPanel analysis={analysis} />}
                <RoadmapResult 
                    nodes={nodes} 
                    onUpdateNodes={setNodes}
                    onRegenerate={handleRegenerate}
                    onAddXP={(amount) => setXp(prev => prev + amount)}
                />
            </>
        )}

      </div>
    </div>
  );
};

// Wrapper to provide Toast Context
const RoadmapPage: React.FC = () => (
    <ToastProvider>
        <RoadmapPageContent />
    </ToastProvider>
);

export default RoadmapPage;
