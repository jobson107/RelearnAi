import React from 'react';
import { ImageIcon, RefreshCw, Maximize2, Sparkles } from 'lucide-react';

interface VisualizerProps {
  imageUrl: string | null;
  prompt: string | null;
  isLoading: boolean;
  onRegenerate: () => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ imageUrl, prompt, isLoading, onRegenerate }) => {
  return (
    <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col animate-in fade-in duration-700 delay-100 shadow-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col p-6 relative overflow-hidden border border-white/50 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400">
                <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Visual Analogy</h2>
            </div>
            {!isLoading && imageUrl && (
                <button 
                    onClick={onRegenerate}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                    title="Regenerate Image"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative rounded-2xl overflow-hidden group bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            
            {isLoading ? (
            <>
                {/* Skeleton Background */}
                <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50 animate-pulse"></div>
                
                {/* Loader Content */}
                <div className="flex flex-col items-center space-y-4 relative z-10">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto text-purple-500 w-6 h-6 animate-ping" />
                    </div>
                    <div className="text-center p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50 shadow-sm">
                        <p className="text-slate-800 dark:text-white font-bold tracking-wide">Visualizing Concept</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Applying visual metaphors...</p>
                    </div>
                </div>
            </>
            ) : imageUrl ? (
            <>
                <img 
                src={imageUrl} 
                alt="AI Generated Educational Analogy" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 block">Analogy Prompt</span>
                        <p className="text-sm text-white italic leading-relaxed line-clamp-3">"{prompt}"</p>
                    </div>
                </div>

                <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/30 border border-white/20">
                    <Maximize2 className="w-4 h-4" />
                </button>
            </>
            ) : (
                <div className="text-center p-8 max-w-sm">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 font-medium">Content visualization will appear here.</p>
                </div>
            )}
        </div>
        
        {/* Caption */}
        {!isLoading && imageUrl && (
            <div className="mt-4 flex items-start gap-3 p-3 bg-purple-50/80 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" fill="currentColor" />
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="text-purple-700 dark:text-purple-400">Why this image?</strong> Visual metaphors increase retention by leveraging spatial memory.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};