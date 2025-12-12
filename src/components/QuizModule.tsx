
import React, { useState } from 'react';
import { BrainCircuit, Check, X, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { QuizData } from '../types';
import confetti from 'canvas-confetti';
import { MathText } from './MathText';

interface QuizModuleProps {
  quiz: QuizData | null;
  isLoading: boolean;
}

export const QuizModule: React.FC<QuizModuleProps> = ({ quiz, isLoading }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleOptionClick = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    
    if (index === quiz?.questions[currentQuestion].correctAnswerIndex) {
      setScore(s => s + 1);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#8b5cf6', '#ec4899']
      });
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
  };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col shadow-xl bg-white/40">
        <div className="bg-white/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent animate-pulse"></div>

            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping"></div>
                <div className="relative bg-white rounded-full p-6 border border-emerald-100 shadow-lg">
                    <BrainCircuit className="w-full h-full text-emerald-500 animate-pulse" />
                </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10">Generating Quiz...</h3>
            <p className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold animate-pulse relative z-10 border border-emerald-100">
                Thinking Budget: 2048 Tokens
            </p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col shadow-xl bg-white/40">
         <div className="bg-white/60 backdrop-blur-md rounded-[1.8rem] h-full flex items-center justify-center p-8 text-slate-400 font-medium">
            Waiting for content...
         </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isFinished = showResult && currentQuestion === quiz.questions.length - 1;
  const progress = ((currentQuestion + (showResult ? 1 : 0)) / quiz.questions.length) * 100;

  return (
    <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col animate-in slide-in-from-right-8 duration-500 shadow-xl bg-white/40">
      <div className="bg-white/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col p-8 overflow-hidden border border-white/50">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <BrainCircuit className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Socratic Quiz</h2>
            </div>
            <div className="flex items-center space-x-2 text-sm bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                <Trophy className="w-4 h-4 text-yellow-500" fill="currentColor" />
                <span className="font-mono text-slate-800 font-bold">{score}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-500">{quiz.questions.length}</span>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        {/* Question Container - Animated */}
        <div 
            key={currentQuestion} 
            className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 animate-slide-in"
        >
            <h3 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
            <span className="text-emerald-500 font-mono mr-2">Q{currentQuestion + 1}.</span>
            <MathText text={question.question} />
            </h3>

            <div className="space-y-3">
            {question.options.map((option, idx) => {
                let stateClass = "border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm";
                
                if (showResult) {
                if (idx === question.correctAnswerIndex) {
                    stateClass = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500 shadow-md";
                } else if (idx === selectedOption) {
                    stateClass = "border-red-500 bg-red-50 text-red-800 shadow-md";
                } else {
                    stateClass = "opacity-50 bg-slate-50 border-transparent";
                }
                } else if (selectedOption === idx) {
                    stateClass = "border-cyan-500 bg-cyan-50 text-cyan-800";
                }

                return (
                <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${stateClass}`}
                >
                    <span className="relative z-10 font-medium">
                        <MathText text={option} />
                    </span>
                    {showResult && idx === question.correctAnswerIndex && <Check className="w-5 h-5 text-emerald-500 relative z-10" />}
                    {showResult && idx === selectedOption && idx !== question.correctAnswerIndex && <X className="w-5 h-5 text-red-500 relative z-10" />}
                </button>
                );
            })}
            </div>

            {showResult && (
            <div className="mt-6 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Reasoning</h4>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                    <MathText text={question.explanation} />
                </p>
            </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-6 border-t border-slate-200/60 flex justify-end items-center">
            {isFinished ? (
            <button 
                onClick={resetQuiz}
                className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
            >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Challenge</span>
            </button>
            ) : (
            <button
                onClick={nextQuestion}
                disabled={!showResult}
                className={`
                flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all
                ${showResult 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                `}
            >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
            </button>
            )}
        </div>
      </div>
    </div>
  );
};
