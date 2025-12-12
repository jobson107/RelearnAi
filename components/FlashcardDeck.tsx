import React, { useState } from 'react';
import { Layers, RotateCw, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardDeckProps {
  flashcards: Flashcard[] | null;
  isLoading: boolean;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ flashcards, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleNext = () => {
    if (!flashcards) return;
    triggerSwap(() => {
        setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    });
  };

  const handlePrev = () => {
    if (!flashcards) return;
    triggerSwap(() => {
        setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    });
  };

  const triggerSwap = (callback: () => void) => {
    setIsSwapping(true);
    // Wait for exit animation
    setTimeout(() => {
        setIsFlipped(false);
        callback();
        // Allow state to update then trigger enter animation
        setTimeout(() => {
            setIsSwapping(false);
        }, 50);
    }, 200);
  };

  const handleFlip = () => {
    if (!isSwapping) {
        setIsFlipped(!isFlipped);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col shadow-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
         <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 animate-pulse"></div>
             <div className="relative z-10 flex flex-col items-center">
                 <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800">
                    <Layers className="w-8 h-8 text-blue-500 animate-bounce" />
                 </div>
                 <p className="text-blue-600 dark:text-blue-400 font-bold animate-pulse">Extracting Concepts...</p>
             </div>
         </div>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
     return (
        <div className="glass-panel rounded-[2rem] p-1 h-full flex items-center justify-center bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
            <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
                <BookOpen className="w-8 h-8 mb-2 opacity-50"/>
                <span className="text-sm font-medium">Flashcards ready for generation</span>
            </div>
        </div>
     );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col shadow-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col p-6 relative border border-white/50 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                    <Layers className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Rapid Review</h2>
                    <p className="text-[10px] text-blue-500 dark:text-blue-400 uppercase tracking-widest font-bold">Active Recall</p>
                </div>
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                {currentIndex + 1} / {flashcards.length}
            </div>
        </div>

        {/* 3D Card Area */}
        <div 
            className={`flex-1 relative perspective-1000 group cursor-pointer my-2 transition-all duration-300 ${isSwapping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} 
            onClick={handleFlip}
        >
            <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
                
                {/* Front */}
                <div className="flip-card-front bg-gradient-to-br from-slate-800 to-slate-900 rounded-[1.5rem] border border-slate-700/50 p-8 flex flex-col items-center justify-center shadow-2xl text-white">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                    <div className="w-full h-full flex flex-col items-center justify-center relative z-10 select-none">
                        <span className="absolute top-0 text-[10px] font-bold text-blue-300 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">
                            Question
                        </span>
                        <p className="text-xl md:text-2xl font-bold text-center leading-relaxed">
                            {currentCard.front}
                        </p>
                        <div className="absolute bottom-0 text-slate-400 text-xs flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <RotateCw className="w-3 h-3" />
                            <span>Click to flip</span>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div className="flip-card-back bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center shadow-2xl">
                    <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
                        <span className="absolute top-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                            Answer
                        </span>
                        <p className="text-lg text-slate-700 dark:text-slate-200 text-center leading-relaxed font-medium">
                            {currentCard.back}
                        </p>
                    </div>
                </div>

            </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mt-4 px-4">
            <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                disabled={isSwapping}
                className="p-3 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider select-none">Swipe or Click</span>
            <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                disabled={isSwapping}
                className="p-3 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>

      </div>
    </div>
  );
};