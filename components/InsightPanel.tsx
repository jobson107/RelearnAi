
import React from 'react';
import { ContentAnalysis } from '../utils/roadmapGenerator';
import { BrainCircuit, Activity, Tag, AlertTriangle, Lightbulb } from 'lucide-react';

interface InsightPanelProps {
  analysis: ContentAnalysis;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({ analysis }) => {
  return (
    <div className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-[2rem] border border-white/60 dark:border-slate-700 p-6 shadow-xl mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Content Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Complexity Score */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Complexity Level</span>
               <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                   <svg className="w-full h-full transform -rotate-90">
                       <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                       <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className={`${analysis.complexityScore > 7 ? 'text-rose-500' : analysis.complexityScore > 4 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000`} strokeDasharray={`${analysis.complexityScore * 10 * 1.75}, 175`} strokeLinecap="round" />
                   </svg>
                   <span className="absolute text-xl font-bold text-slate-700 dark:text-slate-200">{analysis.complexityScore}/10</span>
               </div>
               <p className="text-xs text-slate-500 dark:text-slate-400">
                   {analysis.complexityScore > 7 ? "High density academic text" : "Moderate reading level"}
               </p>
          </div>

          {/* Key Topics */}
          <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
               <div className="flex items-center gap-2 mb-3">
                   <Tag className="w-4 h-4 text-indigo-500" />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detected Clusters</span>
               </div>
               <div className="flex flex-wrap gap-2">
                   {analysis.topics.slice(0, 6).map((topic, i) => (
                       <span key={i} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                           {topic}
                       </span>
                   ))}
               </div>
               <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                   <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                       <Lightbulb className="w-3 h-3 text-yellow-500" />
                       <span>Suggested: Focus heavily on the first 3 clusters.</span>
                   </p>
               </div>
          </div>

          {/* Risk Areas */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
               <div className="flex items-center gap-2 mb-3">
                   <AlertTriangle className="w-4 h-4 text-rose-500" />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Concepts</span>
               </div>
               <div className="space-y-2">
                   {analysis.riskAreas.length > 0 ? analysis.riskAreas.slice(0, 3).map((risk, i) => (
                       <div key={i} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-rose-50 dark:bg-rose-900/10 px-2 py-1.5 rounded">
                           <span>{risk}</span>
                           <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                       </div>
                   )) : (
                       <p className="text-xs text-slate-400 italic">No high-risk terms detected.</p>
                   )}
               </div>
          </div>
      </div>
    </div>
  );
};
