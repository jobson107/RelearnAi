
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, FileText, Pause, Loader2, Lightbulb, Compass, ChevronRight } from 'lucide-react';
import { playTextToSpeech } from '../services/geminiService';
import { StudyAdvice } from '../types';
import { MathText } from './MathText';

interface SummaryCardProps {
  summary: string;
  advice?: StudyAdvice | null;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, advice }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'strategy'>('summary');
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch(e) {}
        }
    };
  }, []);

  const handleToggleAudio = async () => {
    if (isPlaying) {
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch(e) {}
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
        return;
    }

    setIsLoadingAudio(true);
    try {
        const source = await playTextToSpeech(summary);
        audioSourceRef.current = source;
        setIsPlaying(true);
        source.onended = () => {
            setIsPlaying(false);
            audioSourceRef.current = null;
        };
    } catch (error) {
        console.error("Failed to play audio", error);
    } finally {
        setIsLoadingAudio(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.trim().startsWith('###')) {
        return (
          <h3 key={index} className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-6 mb-3 uppercase tracking-wider">
            <MathText text={line.replace(/#/g, '').trim()} />
          </h3>
        );
      }
      if (line.trim().startsWith('##')) {
        return (
          <h2 key={index} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <MathText text={line.replace(/#/g, '').trim()} />
          </h2>
        );
      }
      // Bold handling is a bit complex with MathText mixed in, simplify by using MathText to handle string segments if possible,
      // but MathText does not parse Markdown bold. 
      // Strategy: Split by bold, then wrap each part in MathText.
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="my-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 1 ? (
                <span key={i} className="font-bold text-slate-800 dark:text-white bg-yellow-100/50 dark:bg-yellow-900/30 px-1 rounded">
                  <MathText text={part} />
                </span>
              ) : (
                <MathText key={i} text={part} />
              )
            )}
          </p>
        );
      }
      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={index} className="flex items-start space-x-3 my-2 pl-2 group">
             <div className="min-w-[6px] min-h-[6px] w-[6px] h-[6px] rounded-full bg-indigo-400 mt-2.5 group-hover:bg-indigo-600 transition-colors"></div>
             <p className="text-slate-600 dark:text-slate-300 leading-relaxed group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
               <MathText text={line.replace(/^[-*]\s/, '')} />
             </p>
          </div>
        );
      }
      // Numbered lists
      if (/^\d+\./.test(line.trim())) {
         return (
            <div key={index} className="flex items-start space-x-3 my-3 pl-2 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                <span className="font-mono text-indigo-500 font-bold">{line.split('.')[0]}.</span>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    <MathText text={line.replace(/^\d+\.\s/, '')} />
                </p>
            </div>
         )
      }
      
      if (line.trim() === '') return <div key={index} className="h-2"></div>;
      
      return (
        <p key={index} className="text-slate-600 dark:text-slate-300 leading-relaxed my-2">
            <MathText text={line} />
        </p>
      );
    });
  };

  return (
    <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col animate-in fade-in duration-700 shadow-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col p-8 overflow-hidden border border-white/50 dark:border-slate-800">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-700">
            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    <FileText className="w-4 h-4" /> Summary
                </button>
                {advice && (
                    <button 
                        onClick={() => setActiveTab('strategy')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'strategy' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <Compass className="w-4 h-4" /> Coach's Plan
                    </button>
                )}
            </div>

            <button
                onClick={handleToggleAudio}
                disabled={isLoadingAudio}
                className={`
                    flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm
                    ${isPlaying 
                    ? 'bg-indigo-500 text-white animate-pulse shadow-indigo-500/25' 
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700'}
                `}
            >
                {isLoadingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : (isPlaying ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />)}
                <span>{isLoadingAudio ? 'Loading...' : (isPlaying ? 'Stop' : 'Listen')}</span>
            </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 -mr-2">
            {activeTab === 'summary' ? (
                <div className="prose prose-slate max-w-none text-sm">
                    {renderMarkdown(summary)}
                </div>
            ) : advice ? (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                        <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400 font-bold text-sm uppercase tracking-wide">
                            <Lightbulb className="w-4 h-4" />
                            Micro Advice
                        </div>
                        <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed italic">
                            "<MathText text={advice.microAdvice} />"
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Meta-Learning Strategies</h3>
                        <div className="space-y-3">
                            {advice.strategies.map((strat, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        <MathText text={strat} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
      </div>
    </div>
  );
};
