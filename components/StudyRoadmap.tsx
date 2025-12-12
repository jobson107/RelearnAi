
import React, { useState } from 'react';
import { RoadmapData, ExamType, StudyStrategy, RoadmapItem } from '../types';
import { Map, CheckCircle2, Circle, Clock, Gauge, Trophy, Layers, List, Calendar, Download, Sparkles, ChevronDown, ChevronUp, LayoutGrid, ListTree } from 'lucide-react';

interface StudyRoadmapProps {
    data: RoadmapData | null;
    isLoading: boolean;
    onGenerate: (config: { examType: ExamType, strategy: StudyStrategy }) => void;
}

export const StudyRoadmap: React.FC<StudyRoadmapProps> = ({ data, isLoading, onGenerate }) => {
    const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
    const [config, setConfig] = useState<{ examType: ExamType, strategy: StudyStrategy }>({
        examType: 'General',
        strategy: 'Balanced'
    });
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const toggleNode = (id: string) => {
        const newSet = new Set(expandedNodes);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedNodes(newSet);
    };

    if (isLoading) {
        return (
            <div className="glass-panel rounded-[2rem] p-8 h-full flex flex-col items-center justify-center bg-white/40 dark:bg-slate-800/40">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                    <Map className="w-16 h-16 text-indigo-500 animate-bounce relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-6 mb-2">Architecting Your Success</h3>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Calculating optimal learning path...</p>
                <div className="mt-8 flex gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-0"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-300"></span>
                </div>
            </div>
        );
    }

    if (!data || data.items.length === 0) {
        return (
            <div className="glass-panel rounded-[2rem] p-8 h-full flex flex-col items-center justify-center bg-white/40 dark:bg-slate-800/40 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 rotate-3">
                    <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Create Your Study Roadmap</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                    Let AI build a personalized schedule tailored to your exam goals and learning style.
                </p>

                <div className="bg-white/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-white/60 dark:border-slate-700 shadow-lg w-full max-w-md text-left space-y-6 backdrop-blur-sm">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Exam Goal</label>
                        <select 
                            value={config.examType}
                            onChange={(e) => setConfig({...config, examType: e.target.value as ExamType})}
                            className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-medium"
                        >
                            <option value="General">General Study</option>
                            <option value="NEET">NEET (Medical)</option>
                            <option value="JEE">JEE (Engineering)</option>
                            <option value="SAT">SAT</option>
                            <option value="University">University Semester</option>
                            <option value="IELTS">IELTS / TOEFL</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Strategy</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Fast Track', 'Balanced', 'Mastery'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setConfig({...config, strategy: s as StudyStrategy})}
                                    className={`p-2 rounded-lg text-sm font-bold border transition-all ${
                                        config.strategy === s 
                                        ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => onGenerate(config)}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Map className="w-5 h-5" />
                        Generate Plan
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-[2rem] p-6 bg-white/40 dark:bg-slate-800/40 h-full flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 shadow-sm">
                        <Map className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Study Roadmap</h2>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <span className="text-indigo-500">{data.examType}</span>
                            <span>•</span>
                            <span>{data.strategy}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-white/60 dark:border-slate-700">
                    <button 
                        onClick={() => setViewMode('timeline')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Timeline View"
                    >
                        <ListTree className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white/50 transition-all" title="Export PDF">
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 pb-10 custom-scrollbar optimize-scroll">
                
                {viewMode === 'timeline' ? (
                    <div className="space-y-0 relative pl-8">
                        {/* Timeline Line */}
                        <div className="absolute left-3.5 top-2 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-transparent dark:from-indigo-800 dark:via-slate-800"></div>

                        {data.items.map((item, index) => (
                            <div key={item.id} className="relative pb-8 group">
                                {/* Node Indicator */}
                                <div className={`absolute left-[-1.15rem] top-0 w-8 h-8 rounded-full border-4 z-10 flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 ${item.status === 'completed' ? 'border-emerald-500 text-emerald-500' : 'border-indigo-100 dark:border-slate-700 text-indigo-600'}`}>
                                    {item.status === 'completed' ? <CheckCircle2 className="w-4 h-4 fill-emerald-100" /> : <Circle className="w-3 h-3 fill-indigo-500" />}
                                </div>
                                
                                {/* Card */}
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                    {/* Card Header */}
                                    <div 
                                        className="p-5 cursor-pointer flex items-start justify-between"
                                        onClick={() => toggleNode(item.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">{item.week} • {item.day}</span>
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                                    item.difficulty === 'Advanced' ? 'bg-rose-100 text-rose-600' : 
                                                    item.difficulty === 'Intermediate' ? 'bg-amber-100 text-amber-600' : 
                                                    'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                    {item.difficulty}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs font-bold text-indigo-500">
                                                    <Trophy className="w-3 h-3" /> {item.xp} XP
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{item.topic}</h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                                                    <Clock className="w-3 h-3" /> {item.estimatedMinutes} mins
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded-full bg-slate-50 dark:bg-slate-700/50 transition-transform duration-300 ${expandedNodes.has(item.id) ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedNodes.has(item.id) && (
                                        <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-700/50 animate-in slide-in-from-top-2 duration-300">
                                            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                                                {item.description}
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <List className="w-3 h-3" /> Microtasks
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {item.microtasks.map((task, i) => (
                                                            <label key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'}`}>
                                                                    {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <span className={`text-sm font-medium transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                    {task.text}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <Layers className="w-3 h-3" /> Prerequisites
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.prerequisites.length > 0 ? item.prerequisites.map((req, i) => (
                                                                <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-100 dark:border-amber-800/50">
                                                                    {req}
                                                                </span>
                                                            )) : <span className="text-xs text-slate-400 italic">None required</span>}
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <Gauge className="w-3 h-3" /> Focus
                                                        </h4>
                                                        <span className="inline-block px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800/50">
                                                            {item.taskType} Mode
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.items.map((item) => (
                            <div key={item.id} className="bg-white/60 dark:bg-slate-800/60 p-5 rounded-[2rem] border border-white/60 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {item.week}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                        <Clock className="w-3 h-3" /> {item.estimatedMinutes}m
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">{item.topic}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 flex-1">{item.description}</p>
                                
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {/* Avatar placeholders or icons could go here */}
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-white dark:border-slate-800 text-[10px] font-bold text-emerald-600">L</div>
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white dark:border-slate-800 text-[10px] font-bold text-blue-600">R</div>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-500 flex items-center gap-1">
                                        {item.microtasks.length} Tasks <ChevronDown className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};