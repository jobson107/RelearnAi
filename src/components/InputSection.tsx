
import React, { useRef, useState, useEffect } from 'react';
import { FileText, Upload, Sparkles, X, Loader2, Globe, ScrollText, Sun, Moon, History, ImageIcon, EyeOff, Mic, MicOff, Cloud, CloudOff } from 'lucide-react';
import { extractTextFromPDF } from '../services/geminiService';
import { AnalysisDepth } from '../types';

interface InputSectionProps {
  onAnalyze: (text: string, depth: AnalysisDepth, includeVisuals: boolean) => void;
  isProcessing: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onViewLibrary?: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isProcessing, isDarkMode, onToggleTheme, onViewLibrary }) => {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [depth, setDepth] = useState<AnalysisDepth>(AnalysisDepth.NOTES_ONLY);
  const [includeVisuals, setIncludeVisuals] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [cloudAssist, setCloudAssist] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Init Cloud Consent
  useEffect(() => {
    const consent = localStorage.getItem('relearn_cloud_consent');
    if (consent === null) {
        setShowConsentModal(true);
    } else {
        setCloudAssist(consent === 'true');
    }
  }, []);

  const handleConsent = (allowed: boolean) => {
      localStorage.setItem('relearn_cloud_consent', String(allowed));
      setCloudAssist(allowed);
      setShowConsentModal(false);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           setText(prev => prev + ' ' + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
         setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Speech recognition not supported in this browser.");
        return;
    }
    
    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        recognitionRef.current.start();
        setIsListening(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsReadingFile(true);

    try {
      let content = "";
      if (file.type === "application/pdf") {
        content = await extractTextFromPDF(file);
      } else {
        // Fallback for txt/md
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsText(file);
        });
      }
      setText(content);
    } catch (error) {
      console.error("File reading error:", error);
      alert("Error reading file. Please try again.");
      setFileName(null);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyze(text, depth, includeVisuals);
    }
  };

  const handleClear = () => {
    setText('');
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel rounded-[2rem] p-8 shadow-xl border border-white/60 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden bg-white/40 dark:bg-slate-800/40">
       
       {/* Consent Modal */}
       {showConsentModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-300">
                   <div className="flex justify-center mb-6">
                       <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600">
                           <Cloud className="w-10 h-10" />
                       </div>
                   </div>
                   <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">Enable Cloud Assist?</h3>
                   <p className="text-center text-slate-600 dark:text-slate-300 mb-8">
                       This allows ReLearn to send your notes to Gemini 3 Pro for advanced reasoning, quizzing, and visual generation. <br/><br/>
                       <span className="text-xs text-slate-400">If disabled, we'll use a basic local offline generator.</span>
                   </p>
                   <div className="flex gap-4">
                       <button onClick={() => handleConsent(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                           Use Offline
                       </button>
                       <button onClick={() => handleConsent(true)} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all">
                           Enable Cloud
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Background Glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-md border border-slate-100 dark:border-slate-600">
            <Sparkles className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="currentColor" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Input Learning Material</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Upload PDF notes, transcripts, or paste text to begin.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* View Library Button */}
            {onViewLibrary && (
              <button
                type="button"
                onClick={onViewLibrary}
                className="bg-slate-100/80 dark:bg-slate-900/50 p-2 rounded-xl flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="View Previous Notes"
              >
                <History className="w-4 h-4" />
                <span className="text-sm font-bold pr-2">History</span>
              </button>
            )}

            {/* Cloud Toggle */}
            <button
                type="button"
                onClick={() => {
                    const newState = !cloudAssist;
                    setCloudAssist(newState);
                    localStorage.setItem('relearn_cloud_consent', String(newState));
                }}
                className={`p-2 rounded-xl flex items-center gap-2 border transition-all ${cloudAssist ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}
                title={cloudAssist ? "Cloud Assist Enabled" : "Offline Mode"}
            >
                {cloudAssist ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
            </button>

            {/* Visuals Toggle */}
            <button
                type="button"
                onClick={() => setIncludeVisuals(!includeVisuals)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all text-sm font-bold ${includeVisuals 
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400' 
                    : 'bg-slate-100/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                title="Toggle AI Visual Analogy"
            >
                {includeVisuals ? <ImageIcon className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{includeVisuals ? 'Visuals On' : 'Visuals Off'}</span>
            </button>

            {/* Theme Toggle Buttons */}
            {onToggleTheme && (
                <div className="bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={() => isDarkMode && onToggleTheme()}
                        className={`p-2 rounded-lg transition-all ${!isDarkMode ? 'bg-white text-yellow-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Light Mode"
                    >
                        <Sun className="w-4 h-4" fill={!isDarkMode ? "currentColor" : "none"} />
                    </button>
                    <button
                        type="button"
                        onClick={() => !isDarkMode && onToggleTheme()}
                        className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Dark Mode"
                    >
                        <Moon className="w-4 h-4" fill={isDarkMode ? "currentColor" : "none"} />
                    </button>
                </div>
            )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div className="relative group">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-40 bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50 transition-all resize-none font-mono text-sm leading-relaxed backdrop-blur-sm shadow-sm"
            placeholder={isReadingFile ? "Reading file..." : "Paste your study notes here or use the microphone..."}
            disabled={isProcessing || isReadingFile}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            {recognitionRef.current && (
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    title="Voice Input"
                >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
            )}
            {text && (
                <button
                type="button"
                onClick={handleClear}
                className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                <X className="w-4 h-4" />
                </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all text-sm font-semibold px-6 py-3.5 rounded-xl shadow-sm hover:shadow-md group"
              disabled={isProcessing || isReadingFile}
            >
              {isReadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
              <span>{fileName || "Upload PDF / Text"}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isProcessing || isReadingFile}
            className={`
              w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-white shadow-lg 
              transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
              ${!text.trim() || isProcessing || isReadingFile
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-indigo-500/25'}
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Transforming...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Generate Content</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
