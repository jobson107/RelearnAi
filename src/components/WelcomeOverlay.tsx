
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, GraduationCap } from 'lucide-react';
import { playGlitter } from '../utils/soundEffects';

interface WelcomeOverlayProps {
  onComplete: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onComplete }) => {
  useEffect(() => {
    // Trigger Sound
    playGlitter();

    // Trigger Glitter Animation
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#fbbf24'];

    (function frame() {
      // Launch confetti from left
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: colors,
        shapes: ['circle'],
        scalar: 0.8, // Smaller particles look more like glitter
        zIndex: 1000
      });
      // Launch confetti from right
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: colors,
        shapes: ['circle'],
        scalar: 0.8,
        zIndex: 1000
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Big Burst in center
    setTimeout(() => {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#ffffff'], // Gold and white glitter
            shapes: ['star', 'circle'],
            scalar: 0.6,
            zIndex: 1001,
            disableForReducedMotion: true
          });
    }, 500);

    // Unmount timer
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-xl animate-out fade-out duration-1000 delay-[2500ms] fill-mode-forwards">
      <div className="text-center relative">
        
        {/* Animated Icon */}
        <div className="relative inline-block mb-6 animate-in zoom-in-50 duration-700 ease-out">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
            <div className="relative p-6 bg-white rounded-full shadow-xl border border-indigo-100">
                <GraduationCap className="w-16 h-16 text-indigo-600" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce delay-100">
                <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
        </div>

        {/* Text Animation */}
        <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 tracking-tight animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-forwards opacity-0">
                Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Student!</span>
            </h1>
            <p className="text-xl text-slate-500 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-700 fill-mode-forwards opacity-0">
                Your learning journey continues.
            </p>
        </div>

      </div>
    </div>
  );
};
