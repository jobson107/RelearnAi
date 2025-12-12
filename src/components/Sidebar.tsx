
import React from 'react';
import { X, LayoutGrid, BookOpen, Calendar, Target, GraduationCap, Map, Sparkles, Play, Video } from 'lucide-react';
import { playClick } from '../utils/soundEffects';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: 'study' | 'library' | 'schedule' | 'goals' | 'roadmap') => void;
  onGenerateRoadmap?: () => void;
  onOpenVideoPanel?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate, onGenerateRoadmap, onOpenVideoPanel }) => {
  
  const renderMenuItem = (id: string, label: string, Icon: React.ElementType, onClick?: () => void) => {
    const isActive = currentView === id;
    return (
      <button
        key={id}
        onClick={() => {
          playClick();
          if (onClick) onClick();
          else onNavigate(id as any);
          onClose();
        }}
        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl font-bold transition-all duration-200 group ${
          isActive 
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className="relative">
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`} />
            {id === 'video-studio' && (
                <Sparkles className="w-2.5 h-2.5 absolute -top-1.5 -right-1.5 text-yellow-400 animate-pulse" fill="currentColor" />
            )}
        </div>
        <span>{label}</span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {
            playClick();
            onClose();
        }}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 shadow-2xl z-[70] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-800 dark:text-white">Menu</span>
             </div>
             <button 
                onClick={() => {
                    playClick();
                    onClose();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
             >
                <X className="w-5 h-5" />
             </button>
        </div>

        {/* Generate Roadmap Hero Button */}
        {onGenerateRoadmap && (
            <div className="px-6 pt-6 pb-2 shrink-0">
                <button
                    onClick={() => {
                        playClick();
                        onGenerateRoadmap();
                        onClose();
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 
                            hover:from-purple-600 hover:to-pink-600 text-white font-bold text-sm
                            flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl
                            transform hover:scale-105 transition-all duration-200 group"
                >
                    <Sparkles className="w-5 h-5 animate-pulse" fill="currentColor" />
                    <span>Generate Roadmap</span>
                </button>
            </div>
        )}

        <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            {renderMenuItem('study', 'Study Studio', LayoutGrid)}
            
            {/* AI Animated Lesson Button - Positioned exactly as requested */}
            {onOpenVideoPanel && renderMenuItem('video-studio', 'AI Animated Lesson', Play, onOpenVideoPanel)}

            {renderMenuItem('library', 'Library', BookOpen)}
            {renderMenuItem('schedule', 'Timetable', Calendar)}
            {renderMenuItem('goals', 'Goals & Progress', Target)}
            {renderMenuItem('roadmap', 'Study Roadmap', Map)}
        </div>

        <div className="absolute bottom-8 left-0 w-full px-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pro Tip</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Use the Pomodoro timer to stay focused!
                </p>
            </div>
        </div>

      </div>
    </>
  );
};
