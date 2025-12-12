
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, FileText, Pause, Loader2 } from 'lucide-react';
import { playTextToSpeech } from '../services/geminiService';
import { StudyAdvice } from '../types';

interface SummaryCardProps {
  summary: string;
  advice?: StudyAdvice | null;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, advice }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
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
    // If playing, stop it
    if (isPlaying) {
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch(e) {}
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
        return;
    }

    // If not playing, start it
    setIsLoadingAudio(true);
    try {
        const source = await playTextToSpeech(summary);
        audioSourceRef.current = source;
        setIsPlaying(true);
        
        // Handle auto-stop when audio finishes
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

  // Improved Markdown parser for Light Theme
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.trim().startsWith('###')) {
        return <h3 key={index} className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-6 mb-3 uppercase tracking-wider">{line.replace(/#/g, '').trim()}</h3>;
      }
      if (line.trim().startsWith('##')) {
        return <h2 key={index} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {line.replace(/#/g, '').trim()}
        </h2>;
      }
      // Bold
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="my-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            {parts.map((part, i) => i % 2 === 1 ? <span key={i} className="font-bold text-slate-800 dark:text-white bg-yellow-100/50 dark:bg-yellow-900/30 px-1 rounded">{part}</span> : part)}
          </p>
        );
      }
      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={index} className="flex items-start space-x-3 my-2 pl-2 group">
             <div className="min-w-[6px] min-h-[6px] w-[6px] h-[6px] rounded-full bg-indigo-400 mt-2.5 group-hover:bg-indigo-600 transition-colors"></div>
             <p className="text-slate-600 dark:text-slate-300 leading-relaxed group-hover:text-slate-800 dark:group-hover:text-white transition-colors">{line.replace(/^[-*]\s/, '')}</p>
          </div>
        );
      }
      // Numbered lists
      if (/^\d+\./.test(line.trim())) {
         return (
            <div key={index} className="flex items-start space-x-3 my-3 pl-2 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                <span className="font-mono text-indigo-500 font-bold">{line.split('.')[0]}.</span>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{line.replace(/^\d+\.\s/, '')}</p>
            </div>
         )
      }
      
      if (line.trim() === '') return <div key={index} className="h-2"></div>;
      
      return <p key={index} className="text-slate-600 dark:text-slate-300 leading-relaxed my-2">{line}</p>;
    });
  };

  return (
    <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col animate-in fade-in duration-700 shadow-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col p-8 overflow-hidden border border-white/50 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-700">
            <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Smart Summary</h2>
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
            <span>{isLoadingAudio ? 'Loading...' : (isPlaying ? 'Stop' : 'Play Summary')}</span>
            </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 -mr-2">
            <div className="prose prose-slate max-w-none text-sm">
            {renderMarkdown(summary)}
            </div>
        </div>
      </div>
    </div>
  );
};
