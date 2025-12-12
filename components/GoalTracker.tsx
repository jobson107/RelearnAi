
import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Edit2, Save, X, BrainCircuit, Layers, BookOpen, Trophy, Play, Sparkles, ChevronRight, Share2, Star, Award, Zap } from 'lucide-react';
import { StudyGoals, DailyProgress } from '../types';
import { getGoals, setGoals, getDailyProgress } from '../services/storageService';
import confetti from 'canvas-confetti';

interface GoalTrackerProps {
  onUpdate?: () => void; // Trigger parent refresh if needed
}

// --- Recap Story Component ---
interface RecapStoryProps {
  progress: DailyProgress;
  goals: StudyGoals;
  onClose: () => void;
}

const RecapStory: React.FC<RecapStoryProps> = ({ progress, goals, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Define slides configuration
  const slides = [
    {
      id: 'intro',
      bg: 'bg-gradient-to-br from-indigo-600 to-violet-700',
      textWhite: true,
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in zoom-in duration-700">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 shadow-2xl ring-4 ring-white/10">
             <Sparkles className="w-12 h-12 text-yellow-300" fill="currentColor" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">Daily Recap</h2>
          <p className="text-xl md:text-2xl text-indigo-100 font-medium">Let's see what you achieved today!</p>
        </div>
      )
    },
    {
      id: 'sessions',
      bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      textWhite: true,
      render: () => (
        <StatSlide 
          icon={<BookOpen className="w-16 h-16 text-white" />}
          label="Sessions Completed"
          value={progress.sessionsCompleted}
          target={goals.sessionsCompleted}
          color="text-cyan-200"
        />
      )
    },
    {
      id: 'quizzes',
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      textWhite: true,
      render: () => (
        <StatSlide 
          icon={<BrainCircuit className="w-16 h-16 text-white" />}
          label="Quizzes Taken"
          value={progress.quizzesTaken}
          target={goals.quizzesTaken}
          color="text-emerald-200"
        />
      )
    },
    {
      id: 'flashcards',
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      textWhite: true,
      render: () => (
        <StatSlide 
          icon={<Layers className="w-16 h-16 text-white" />}
          label="Flashcards Reviewed"
          value={progress.flashcardsReviewed}
          target={goals.flashcardsReviewed}
          color="text-amber-200"
        />
      )
    },
    {
      id: 'outro',
      bg: 'bg-gradient-to-br from-fuchsia-600 to-rose-600',
      textWhite: true,
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in zoom-in duration-500">
           <div className="relative mb-8">
               <div className="absolute inset-0 bg-white blur-3xl opacity-30 animate-pulse"></div>
               <Trophy className="w-32 h-32 text-yellow-300 relative z-10 drop-shadow-2xl" fill="currentColor" />
           </div>
           <h2 className="text-4xl md:text-6xl font-black text-white mb-6">You're Crushing It!</h2>
           <p className="text-xl text-white/90 max-w-md mx-auto leading-relaxed">
             Consistency is the key to mastery. Keep up the great work!
           </p>
           <button onClick={onClose} className="mt-12 px-8 py-4 bg-white text-fuchsia-600 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform">
             Close Recap
           </button>
        </div>
      )
    }
  ];

  // Auto-advance logic
  useEffect(() => {
    const slideDuration = 4000; // 4 seconds per slide
    
    // Trigger confetti on the last slide
    if (currentSlide === slides.length - 1) {
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#ffffff'],
            zIndex: 10000
        });
        return; // Don't auto-close immediately on last slide
    }

    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1);
      }
    }, slideDuration);

    return () => clearTimeout(timer);
  }, [currentSlide, slides.length]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${slides[currentSlide].bg} transition-colors duration-700 ease-in-out`}>
      
      {/* Progress Indicators */}
      <div className="flex gap-2 p-4 pt-8 md:pt-4 max-w-2xl mx-auto w-full z-20">
        {slides.map((_, idx) => (
          <div key={idx} className="h-1.5 flex-1 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className={`h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)] rounded-full transition-all duration-300 ease-linear ${
                idx < currentSlide ? 'w-full' : 
                idx === currentSlide ? 'w-full origin-left animate-[progress_4s_linear]' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 backdrop-blur-md rounded-full text-white transition-colors z-20"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Slide Content */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {slides[currentSlide].render()}
      </div>

      {/* CSS Animation for Progress Bar injected here for simplicity */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

// Helper component for Stat Slides to maintain consistency
const StatSlide: React.FC<{ icon: React.ReactNode, label: string, value: number, target: number, color: string }> = ({ icon, label, value, target, color }) => {
    const percentage = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in slide-in-from-right duration-500">
            <div className="mb-8 p-6 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl">
                {icon}
            </div>
            <div className="text-7xl font-black text-white mb-2 tracking-tighter drop-shadow-sm">
                {value}
            </div>
            <p className={`text-xl font-bold ${color} mb-12 uppercase tracking-widest`}>{label}</p>
            
            {/* Context */}
            <div className="w-full max-w-xs bg-black/20 rounded-full h-4 mb-4 backdrop-blur-sm p-1 border border-white/10">
                <div 
                    className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out" 
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="text-white/80 font-medium">Goal: {target}</p>
            
            {percentage >= 100 && (
                <div className="mt-8 px-6 py-2 bg-yellow-400/20 text-yellow-200 rounded-full border border-yellow-400/30 flex items-center gap-2 font-bold animate-bounce">
                    <Star className="w-4 h-4 fill-current" />
                    Goal Reached!
                </div>
            )}
        </div>
    );
};


// --- Main GoalTracker Component ---

export const GoalTracker: React.FC<GoalTrackerProps> = ({ onUpdate }) => {
  const [goals, setGoalsState] = useState<StudyGoals>(getGoals());
  const [progress, setProgress] = useState<DailyProgress>(getDailyProgress());
  const [isEditing, setIsEditing] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  
  // Temporary state for editing
  const [editGoals, setEditGoals] = useState<StudyGoals>(goals);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(getDailyProgress());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    setGoals(editGoals);
    setGoalsState(editGoals);
    setIsEditing(false);
    if (onUpdate) onUpdate();
  };

  const calculatePercentage = (current: number, target: number) => {
    return Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  };

  const renderProgressRing = (current: number, target: number, colorClass: string, icon: React.ReactNode, label: string) => {
    const percentage = calculatePercentage(current, target);
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-6 relative group p-8 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-white/50 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="relative w-40 h-40 flex items-center justify-center">
           {/* Background Circle */}
           <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90 drop-shadow-lg"
           >
             <circle
               stroke="currentColor"
               fill="transparent"
               strokeWidth={stroke}
               strokeDasharray={circumference + ' ' + circumference}
               style={{ strokeDashoffset: 0 }}
               r={normalizedRadius}
               cx={radius}
               cy={radius}
               className="text-slate-200 dark:text-slate-700 opacity-50"
             />
             <circle
               stroke="currentColor"
               fill="transparent"
               strokeWidth={stroke}
               strokeDasharray={circumference + ' ' + circumference}
               style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
               r={normalizedRadius}
               cx={radius}
               cy={radius}
               className={`${colorClass} transition-all duration-1000`}
               strokeLinecap="round"
             />
           </svg>
           
           {/* Icon Center */}
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              {percentage >= 100 ? (
                 <CheckCircle2 className={`w-10 h-10 ${colorClass.replace('text-', 'text-')} mb-2 animate-bounce`} />
              ) : (
                <div className="text-slate-400 dark:text-slate-500 mb-2 transform group-hover:scale-110 transition-transform">
                    {icon}
                </div>
              )}
               <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {current} <span className="text-slate-400 text-lg font-normal">/ {target}</span>
              </p>
           </div>
        </div>
        
        <div className="text-center">
            <p className="text-lg font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{label}</p>
        </div>
      </div>
    );
  };

  const getBadges = () => {
      const badges = [
          { name: "Novice Scholar", desc: "First Session Completed", unlocked: progress.sessionsCompleted >= 1, icon: BookOpen },
          { name: "Quiz Master", desc: "10 Quizzes Taken", unlocked: progress.quizzesTaken >= 10, icon: BrainCircuit },
          { name: "Recall King", desc: "20 Flashcards Reviewed", unlocked: progress.flashcardsReviewed >= 20, icon: Zap },
          { name: "Dedicated", desc: "Hit all daily goals", unlocked: progress.sessionsCompleted >= goals.sessionsCompleted && progress.quizzesTaken >= goals.quizzesTaken, icon: Award }
      ];
      return badges;
  };

  return (
    <>
        {showRecap && <RecapStory progress={progress} goals={goals} onClose={() => setShowRecap(false)} />}
        
        <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-12">
            <div>
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Goals & Progress
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Track your daily learning consistency and achievements.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {!isEditing && (
                            <button 
                                onClick={() => setShowRecap(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-fuchsia-500/30 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                <span>Daily Recap</span>
                            </button>
                        )}

                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold shadow-md hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700"
                            >
                                <Edit2 className="w-5 h-5" />
                                <span>Edit Targets</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/60 dark:border-slate-700 shadow-xl max-w-2xl mx-auto">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">Set Your Daily Targets</h3>
                        <div className="space-y-6">
                            <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <label className="font-bold text-slate-700 dark:text-slate-200">Sessions Completed</label>
                                </div>
                                <input 
                                    type="number" 
                                    value={editGoals.sessionsCompleted}
                                    onChange={(e) => setEditGoals({...editGoals, sessionsCompleted: parseInt(e.target.value) || 0})}
                                    className="w-24 text-center bg-white dark:bg-slate-800 font-bold text-xl text-indigo-600 dark:text-indigo-400 p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                                        <BrainCircuit className="w-6 h-6" />
                                    </div>
                                    <label className="font-bold text-slate-700 dark:text-slate-200">Quizzes Taken</label>
                                </div>
                                <input 
                                    type="number" 
                                    value={editGoals.quizzesTaken}
                                    onChange={(e) => setEditGoals({...editGoals, quizzesTaken: parseInt(e.target.value) || 0})}
                                    className="w-24 text-center bg-white dark:bg-slate-800 font-bold text-xl text-emerald-600 dark:text-emerald-400 p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <label className="font-bold text-slate-700 dark:text-slate-200">Flashcards Reviewed</label>
                                </div>
                                <input 
                                    type="number" 
                                    value={editGoals.flashcardsReviewed}
                                    onChange={(e) => setEditGoals({...editGoals, flashcardsReviewed: parseInt(e.target.value) || 0})}
                                    className="w-24 text-center bg-white dark:bg-slate-800 font-bold text-xl text-amber-600 dark:text-amber-400 p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {renderProgressRing(
                            progress.sessionsCompleted, 
                            goals.sessionsCompleted, 
                            'text-indigo-500', 
                            <BookOpen className="w-8 h-8" />, 
                            'Sessions'
                        )}
                        {renderProgressRing(
                            progress.quizzesTaken, 
                            goals.quizzesTaken, 
                            'text-emerald-500', 
                            <BrainCircuit className="w-8 h-8" />, 
                            'Quizzes'
                        )}
                        {renderProgressRing(
                            progress.flashcardsReviewed, 
                            goals.flashcardsReviewed, 
                            'text-amber-500', 
                            <Layers className="w-8 h-8" />, 
                            'Flashcards'
                        )}
                    </div>
                )}
            </div>

            {/* Achievements Section */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Award className="w-6 h-6 text-indigo-500" />
                    Achievements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {getBadges().map((badge, idx) => {
                        const Icon = badge.icon;
                        return (
                            <div key={idx} className={`p-4 rounded-xl border transition-all ${badge.unlocked ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 grayscale'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${badge.unlocked ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{badge.name}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{badge.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    </>
  );
};
