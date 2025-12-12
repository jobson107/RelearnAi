
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GraduationCap, Sparkles } from 'lucide-react';
import { playSuccess, playGlitter } from '../utils/soundEffects';

interface SuccessAnimationProps {
  onComplete: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ onComplete }) => {
  useEffect(() => {
    // Play sounds
    playSuccess();
    setTimeout(() => playGlitter(), 200);

    // Sequence Configuration
    const duration = 2200;
    const end = Date.now() + duration;

    // Initial Confetti Burst
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'],
      zIndex: 1000,
    });

    // Continuous confetti fall for a short duration
    const interval = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#8b5cf6'],
        zIndex: 1000,
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ec4899', '#10b981'],
        zIndex: 1000,
      });
    }, 250);

    const timer = setTimeout(() => {
        onComplete();
    }, duration);

    return () => {
        clearInterval(interval);
        clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center">
        <div className="relative">
             {/* Glowing Background Effect */}
             <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 rounded-full animate-pulse"></div>
             
             {/* Icon Container */}
             <div className="relative p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-indigo-100 dark:border-slate-700 animate-bounce-slow">
                <GraduationCap className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
             </div>
             
             {/* Floating Sparkle */}
             <div className="absolute -top-4 -right-4 animate-ping">
                 <Sparkles className="w-8 h-8 text-yellow-400" fill="currentColor" />
             </div>
        </div>
        
        <h2 className="mt-8 text-4xl font-black text-slate-800 dark:text-white tracking-tight animate-in slide-in-from-bottom-8 duration-700">
            Welcome to ReLearn
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-lg animate-in slide-in-from-bottom-4 duration-700 delay-150 font-medium">
            Preparing your study environment...
        </p>
      </div>
    </div>
  );
};
