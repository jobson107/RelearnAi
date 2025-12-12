
// src/components/RoadmapResult.tsx
import React, { useState, useEffect } from 'react';
import { RoadmapNode } from '../utils/roadmapGenerator';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, GripVertical, Download, Calendar, ArrowUp, ArrowDown, RotateCcw, Trophy, Sparkles, Play, FileText, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoadmapResultProps {
  nodes: RoadmapNode[];
  onUpdateNodes: (nodes: RoadmapNode[]) => void;
  onRegenerate: () => void;
  onAddXP: (amount: number) => void;
}

export const RoadmapResult: React.FC<RoadmapResultProps> = ({ nodes, onUpdateNodes, onRegenerate, onAddXP }) => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleExpand = (id: string) => {
    const newNodes = nodes.map(n => n.id === id ? { ...n, isExpanded: !n.isExpanded } : n);
    onUpdateNodes(newNodes);
  };

  const moveNode = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= nodes.length) return;
    
    const newNodes = [...nodes];
    [newNodes[index], newNodes[newIndex]] = [newNodes[newIndex], newNodes[index]];
    onUpdateNodes(newNodes);
  };

  const toggleMicrotask = (nodeId: string, taskId: string) => {
    const newNodes = nodes.map(n => {
      if (n.id !== nodeId) return n;
      
      const newMicrotasks = n.microtasks.map(t => {
        if (t.id === taskId) {
          const wasComplete = t.isComplete;
          if (!wasComplete) onAddXP(10); // Gamification hook
          return { ...t, isComplete: !wasComplete };
        }
        return t;
      });

      // Recalculate progress
      const completedCount = newMicrotasks.filter(t => t.isComplete).length;
      const progressPct = Math.round((completedCount / newMicrotasks.length) * 100);

      return { ...n, microtasks: newMicrotasks, progressPct };
    });
    onUpdateNodes(newNodes);
  };

  const markNodeComplete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newNodes = nodes.map(n => {
      if (n.id !== id) return n;
      const isComplete = n.progressPct < 100;
      if (isComplete) {
          onAddXP(n.xpValue);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
      }
      return { 
        ...n, 
        progressPct: isComplete ? 100 : 0, 
        microtasks: n.microtasks.map(t => ({ ...t, isComplete: isComplete })) 
      };
    });
    onUpdateNodes(newNodes);
  };

  const simulateExport = (type: 'PDF' | 'Calendar') => {
    showToast(`Exporting to ${type}...`);
    setTimeout(() => {
        showToast(`${type} Export Successful!`);
    }, 1500);
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-700">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl z-[60] flex items-center gap-2 animate-[toastSlideUp_0.3s_ease-out]">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-white/60 dark:border-slate-700 backdrop-blur-sm">
         <div className="flex items-center gap-2">
            <button onClick={() => simulateExport('PDF')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => simulateExport('Calendar')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                <Calendar className="w-4 h-4" /> Calendar
            </button>
         </div>
         <button onClick={onRegenerate} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">
            <RotateCcw className="w-4 h-4" /> Regenerate Plan
         </button>
      </div>

      {/* Nodes List */}
      <div className="relative pl-4 sm:pl-8 space-y-6">
        {/* Timeline Line */}
        <div className="absolute left-[1.35rem] sm:left-[2.35rem] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>

        {nodes.map((node, index) => (
          <div 
            key={node.id} 
            className="group relative node-enter"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Timeline Connector */}
            <div className={`absolute left-0 sm:left-4 top-6 w-11 h-11 rounded-full border-4 z-10 flex items-center justify-center bg-white dark:bg-slate-900 transition-colors ${node.progressPct === 100 ? 'border-emerald-500 text-emerald-500' : 'border-indigo-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'}`}>
               <div className="relative w-full h-full p-0.5">
                   {/* SVG Progress Ring */}
                   <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100 dark:text-slate-800"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className={`progress-ring__circle ${node.progressPct === 100 ? 'text-emerald-500' : 'text-indigo-500'}`}
                        strokeDasharray={`${node.progressPct}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                       {node.progressPct === 100 ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                   </div>
               </div>
            </div>

            {/* Card */}
            <div className="ml-12 sm:ml-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div 
                    className="p-5 cursor-pointer flex items-start justify-between gap-4"
                    onClick={() => toggleExpand(node.id)}
                >
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                 node.type === 'Learn' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                                 node.type === 'Revise' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 
                                 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                             }`}>
                                {node.type}
                             </span>
                             <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {node.estMinutes}m
                             </span>
                             {node.progressPct === 100 && (
                                 <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                     <Sparkles className="w-3 h-3" /> +{node.xpValue} XP
                                 </span>
                             )}
                        </div>
                        <h3 className={`text-lg font-bold text-slate-800 dark:text-slate-100 ${node.progressPct === 100 ? 'line-through opacity-50' : ''}`}>
                            {node.title}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                         {/* Reorder Buttons */}
                         <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                             <button 
                                onClick={() => moveNode(index, -1)} 
                                disabled={index === 0}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"
                             >
                                <ArrowUp className="w-3 h-3" />
                             </button>
                             <button 
                                onClick={() => moveNode(index, 1)} 
                                disabled={index === nodes.length - 1}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"
                             >
                                <ArrowDown className="w-3 h-3" />
                             </button>
                         </div>

                         <div className={`transition-transform duration-300 ${node.isExpanded ? 'rotate-180' : ''}`}>
                             <ChevronDown className="w-5 h-5 text-slate-400" />
                         </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {node.isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-700/50">
                        {/* Microtasks */}
                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Microtasks</p>
                            {node.microtasks.map(task => (
                                <div 
                                    key={task.id} 
                                    onClick={() => toggleMicrotask(node.id, task.id)}
                                    className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                                        task.isComplete 
                                        ? 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60' 
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                                        task.isComplete 
                                        ? 'bg-emerald-500 border-emerald-500' 
                                        : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                        {task.isComplete && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={`text-sm ${task.isComplete ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {task.text}
                                    </span>
                                    <span className="ml-auto text-xs text-slate-400">{task.estMin}m</span>
                                </div>
                            ))}
                        </div>

                        {/* Resources Section */}
                        {node.resources && node.resources.length > 0 && (
                            <div className="mt-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Resources</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {node.resources.map((res, i) => (
                                        <a 
                                            key={i} 
                                            href={res.uri} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                                                {res.type === 'video' ? <Play className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{res.title}</p>
                                                <p className="text-xs text-slate-400 truncate capitalize">{res.type}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Complete Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={(e) => markNodeComplete(e, node.id)}
                                disabled={node.progressPct === 100}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    node.progressPct === 100 
                                    ? 'bg-emerald-100 text-emerald-600 cursor-default' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                                }`}
                            >
                                {node.progressPct === 100 ? 'Completed' : 'Mark Topic Complete'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
