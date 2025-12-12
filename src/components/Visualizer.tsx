
import React, { useState } from 'react';
import { ImageIcon, RefreshCw, Maximize2, Sparkles, Wand2, X, Send, Loader2 } from 'lucide-react';
import { editImage } from '../services/geminiService';

interface VisualizerProps {
  imageUrl: string | null;
  prompt: string | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onImageUpdate?: (newUrl: string) => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ imageUrl, prompt, isLoading, onRegenerate, onImageUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !imageUrl || !onImageUpdate) return;
    
    setIsProcessingEdit(true);
    try {
        const newImage = await editImage(imageUrl, editPrompt);
        onImageUpdate(newImage);
        setIsEditing(false);
        setEditPrompt('');
    } catch (err) {
        console.error("Failed to edit image", err);
        // Could trigger a toast here in a real app
    } finally {
        setIsProcessingEdit(false);
    }
  };

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
                <div className="flex gap-2">
                    {onImageUpdate && (
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className={`p-2.5 rounded-xl border transition-all shadow-sm ${isEditing ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-slate-200 dark:border-slate-700'}`}
                            title="Edit with Gemini"
                        >
                            <Wand2 className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={onRegenerate}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                        title="Regenerate Image"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative rounded-2xl overflow-hidden group bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            
            {isLoading || isProcessingEdit ? (
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
                        <p className="text-slate-800 dark:text-white font-bold tracking-wide">
                            {isProcessingEdit ? 'Editing with Gemini...' : 'Visualizing Concept'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {isProcessingEdit ? 'Applying your changes...' : 'Applying visual metaphors...'}
                        </p>
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
                {!isEditing && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 pointer-events-none">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 block">Analogy Prompt</span>
                            <p className="text-sm text-white italic leading-relaxed line-clamp-3">"{prompt}"</p>
                        </div>
                    </div>
                )}

                <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/30 border border-white/20">
                    <Maximize2 className="w-4 h-4" />
                </button>

                {/* Edit Mode Overlay */}
                {isEditing && (
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-10">
                        <form onSubmit={handleEditSubmit} className="flex gap-2">
                            <input 
                                type="text" 
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="Describe changes (e.g. 'Add a retro filter')"
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                autoFocus
                            />
                            <button 
                                type="submit"
                                disabled={!editPrompt.trim()}
                                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                )}
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
        {!isLoading && imageUrl && !isEditing && (
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
