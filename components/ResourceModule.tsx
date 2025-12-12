import React from 'react';
import { Globe, ExternalLink, Search, BookOpenCheck, ArrowUpRight } from 'lucide-react';
import { DeepDiveData } from '../types';

interface ResourceModuleProps {
  data: DeepDiveData | null;
  isLoading: boolean;
}

export const ResourceModule: React.FC<ResourceModuleProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col shadow-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent animate-pulse"></div>
            <div className="relative z-10 flex flex-col items-center">
                 <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-4 border border-orange-100 dark:border-orange-800">
                    <Search className="w-8 h-8 text-orange-500 animate-pulse" />
                 </div>
                 <p className="text-orange-600 dark:text-orange-400 font-bold animate-pulse">Scouring Knowledge Base...</p>
            </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
        <div className="glass-panel rounded-[2rem] p-1 h-full flex items-center justify-center min-h-[200px] bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
             <div className="text-slate-400 dark:text-slate-500 text-sm flex items-center gap-2 font-medium">
                <Globe className="w-4 h-4 opacity-50"/>
                <span>Deep Dive Resources</span>
             </div>
        </div>
    );
  }

  return (
    <div className="glass-panel rounded-[2rem] p-1 h-full flex flex-col animate-in slide-in-from-bottom-4 duration-700 shadow-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700">
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] h-full flex flex-col p-6 border border-white/50 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400">
                <Globe className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Deep Dive</h2>
                <p className="text-[10px] text-orange-500 dark:text-orange-400 uppercase tracking-widest font-bold">Research & Context</p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            {/* AI Insight */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <BookOpenCheck className="w-4 h-4 text-orange-500" />
                    Advanced Insight
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-orange-200 dark:border-orange-800/50 pl-4 bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-r-xl">
                    {data.content}
                </p>
            </div>

            {/* Resources List */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ExternalLink className="w-3 h-3" />
                    Verified Sources
                </h3>
                <div className="space-y-3">
                    {data.resources.length > 0 ? (
                        data.resources.map((res, idx) => (
                            <a 
                                key={idx}
                                href={res.uri}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block group relative"
                            >
                                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50 transition-all shadow-sm hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 pr-6">
                                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 mb-1">
                                                {res.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate group-hover:text-slate-500 dark:group-hover:text-slate-400 font-mono">
                                                {new URL(res.uri).hostname}
                                            </p>
                                        </div>
                                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))
                    ) : (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">No external links found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};