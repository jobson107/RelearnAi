
import React, { useState, useEffect } from 'react';
import { X, Search, Youtube, Sparkles, Film, Loader2, PlayCircle, Plus, Layout, Video } from 'lucide-react';
import { VideoResult, AppState } from '../types';
import { searchLocalAssets, searchYouTube, generateGeminiAnimation } from '../utils/videoUtils';
import { VideoPreviewModal } from './VideoPreviewModal';
import confetti from 'canvas-confetti';

interface VideoSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onInsertVideo: (video: VideoResult) => void;
}

type Tab = 'search' | 'generate';

export const VideoSearchPanel: React.FC<VideoSearchPanelProps> = ({ isOpen, onClose, appState, onInsertVideo }) => {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [enableYouTube, setEnableYouTube] = useState(false);
  const [apiKey, setApiKey] = useState(''); 
  const [previewVideo, setPreviewVideo] = useState<VideoResult | null>(null);
  const [generationStatus, setGenerationStatus] = useState('');

  useEffect(() => {
    if (isOpen && appState.content) {
        const seed = appState.roadmap?.items[0]?.topic || appState.content.split('\n')[0].substring(0, 30);
        setQuery(seed);
        handleSearch(seed, false); 
    }
  }, [isOpen, appState]);

  const handleSearch = async (searchQuery: string, includeExternal: boolean = true) => {
    setLoading(true);
    setResults([]);
    
    const localResults = await searchLocalAssets(searchQuery, appState);
    let allResults = [...localResults];

    if (includeExternal && enableYouTube) {
        const ytResults = await searchYouTube(searchQuery, apiKey);
        allResults = [...allResults, ...ytResults];
    }

    setResults(allResults);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerationStatus('Scripting & Rendering...');
    setLoading(true);

    const result = await generateGeminiAnimation(
        { topic: query, summary: appState.summary || query }, 
        true, // Always enabled in this tab
        async () => true // Implicit confirmation by clicking the button
    );

    if (result) {
        setResults(prev => [result, ...prev]);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setActiveTab('search'); // Switch back to show result
    }
    setGenerationStatus('');
    setLoading(false);
  };

  const handleInsert = (video: VideoResult) => {
      onInsertVideo(video);
      setPreviewVideo(null);
      confetti({ particleCount: 50, spread: 50, origin: { x: 1 } });
      onClose();
  };

  return (
    <>
      <div className={`fixed inset-y-0 right-0 w-full md:w-[520px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[80] flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                        <Film className="w-5 h-5" />
                    </div>
                    Video & Animation Studio
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-11">Enhance your roadmap with visual explainers.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 flex gap-4 border-b border-slate-100 dark:border-slate-700">
            <button 
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'search' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Search className="w-4 h-4" />
                Find Assets
            </button>
            <button 
                onClick={() => setActiveTab('generate')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Sparkles className="w-4 h-4" />
                Gemini Create
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/20">
            
            {/* SEARCH TAB */}
            {activeTab === 'search' && (
                <div className="p-6 space-y-6">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="Search topic or concept..."
                            className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 rounded-xl outline-none transition-all dark:text-white shadow-sm"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <button onClick={() => handleSearch(query)} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg hover:bg-indigo-200 transition-colors">Search</button>
                    </div>

                    {/* YouTube Toggle */}
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                                <Youtube className="w-4 h-4" />
                            </div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Include YouTube
                            </div>
                        </div>
                        <button onClick={() => setEnableYouTube(!enableYouTube)} className={`w-11 h-6 rounded-full relative transition-colors ${enableYouTube ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${enableYouTube ? 'translate-x-6' : 'translate-x-1'}`}></div>
                        </button>
                    </div>
                    {enableYouTube && (
                        <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter YouTube API Key (Optional)" className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500" />
                    )}

                    {/* Results Grid */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Results ({results.length})</h3>
                        
                        {loading ? (
                            <div className="flex flex-col items-center py-12 space-y-3">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                <p className="text-sm text-slate-500">Searching knowledge base...</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                <Film className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                <p className="text-sm text-slate-500">No videos found. Try a different term or generate one.</p>
                            </div>
                        ) : (
                            results.map((video) => (
                                <div key={video.id} className="flex gap-4 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group shadow-sm">
                                    <div className="relative w-32 h-20 rounded-xl overflow-hidden shrink-0 bg-black">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                                            <PlayCircle className="w-8 h-8 text-white drop-shadow-md" />
                                        </div>
                                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">{video.duration}</span>
                                    </div>
                                    <div className="flex flex-col justify-between flex-1 py-1">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 leading-tight">{video.title}</h4>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${video.source === 'gemini' ? 'bg-purple-100 text-purple-600' : video.source === 'youtube' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {video.source}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{video.description}</p>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => setPreviewVideo(video)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200">Preview</button>
                                            <button onClick={() => handleInsert(video)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* GENERATE TAB */}
            {activeTab === 'generate' && (
                <div className="p-6 flex flex-col h-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4 rotate-3">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">AI Explainer Studio</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                            Generate a custom 15s animated explanation for <span className="font-bold text-purple-600">"{query || 'your topic'}"</span> using Gemini 3 Pro & Veo.
                        </p>
                    </div>

                    <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Concept to Visualize</label>
                            <input 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full mt-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                            <div className="flex gap-3 mb-2">
                                <Layout className="w-4 h-4 text-purple-600" />
                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Process</span>
                            </div>
                            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-5 list-decimal">
                                <li>Gemini 3 Pro drafts a visual script.</li>
                                <li>Veo generates keyframes & interpolation.</li>
                                <li>Audio narration is synthesized.</li>
                            </ol>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={loading || !query}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {generationStatus}</> : <><Video className="w-5 h-5" /> Generate Animation</>}
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
      <VideoPreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} onInsert={handleInsert} />
    </>
  );
};
