
import React from 'react';
import { Play, Sparkles } from 'lucide-react';

interface SlidebarAnimateButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const SlidebarAnimateButton: React.FC<SlidebarAnimateButtonProps> = ({ onClick, isOpen }) => {
  return (
    <div className="px-6 py-2 shrink-0">
      <button
        onClick={onClick}
        className={`
          w-full px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 
          shadow-lg transform transition-all duration-200 group relative overflow-hidden
          ${isOpen 
            ? 'bg-indigo-600 text-white' 
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white hover:scale-105 active:scale-95'
          }
        `}
        aria-label="AI Animated Lesson"
        title="Create an AI animated lesson for the current topic"
      >
        <div className="relative flex items-center gap-2 z-10">
            <div className="relative">
                <Play className="w-4 h-4 fill-current" />
                <Sparkles className="w-3 h-3 absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
            </div>
            <span>AI Animated Lesson</span>
        </div>
        
        {/* Shine effect */}
        {!isOpen && (
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
        )}
      </button>
    </div>
  );
};
