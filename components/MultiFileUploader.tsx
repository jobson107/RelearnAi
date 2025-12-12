
import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2, File, Loader2 } from 'lucide-react';
import { extractTextFromPDF } from '../services/geminiService';
import { useToast } from './Toast';

interface FileData {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  extractedText?: string;
}

interface MultiFileUploaderProps {
  onContentReady: (mergedContent: string, fileCount: number) => void;
  isProcessing: boolean;
}

export const MultiFileUploader: React.FC<MultiFileUploaderProps> = ({ onContentReady, isProcessing }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (newFiles: File[]) => {
    // Filter duplicates or unsupported
    const validFiles = newFiles.filter(f => 
      f.type === 'application/pdf' || f.type === 'text/plain' || f.name.endsWith('.md')
    );

    if (validFiles.length < newFiles.length) {
      addToast("Some files were skipped (unsupported format).", 'error');
    }

    if (validFiles.length === 0) return;

    const newFileEntries: FileData[] = validFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFileEntries]);

    // Process each file
    for (const entry of newFileEntries) {
      updateFileStatus(entry.id, 'processing');
      try {
        let text = "";
        if (entry.file.type === 'application/pdf') {
          text = await extractTextFromPDF(entry.file);
        } else {
          text = await entry.file.text();
        }
        
        // Basic cleaning
        text = text.replace(/\s+/g, ' ').trim();
        
        updateFileStatus(entry.id, 'done', text);
      } catch (error) {
        console.error("Extraction error", error);
        updateFileStatus(entry.id, 'error');
        addToast(`Failed to read ${entry.file.name}`, 'error');
      }
    }
  };

  const updateFileStatus = (id: string, status: FileData['status'], text?: string) => {
    setFiles(prev => {
      const next = prev.map(f => f.id === id ? { ...f, status, extractedText: text } : f);
      
      // Check if all done
      const allDone = next.every(f => f.status === 'done' || f.status === 'error');
      const hasSuccess = next.some(f => f.status === 'done');
      
      if (allDone && hasSuccess) {
        // Debounce slightly to let UI settle
        setTimeout(() => {
            const merged = next
                .filter(f => f.status === 'done' && f.extractedText)
                .map(f => `--- SOURCE: ${f.file.name} ---\n${f.extractedText}`)
                .join('\n\n');
            onContentReady(merged, next.filter(f => f.status === 'done').length);
        }, 500);
      }
      return next;
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
        const next = prev.filter(f => f.id !== id);
        // Re-merge remaining
        const merged = next
          .filter(f => f.status === 'done' && f.extractedText)
          .map(f => `--- SOURCE: ${f.file.name} ---\n${f.extractedText}`)
          .join('\n\n');
        onContentReady(merged, next.filter(f => f.status === 'done').length);
        return next;
    });
  };

  return (
    <div className="w-full space-y-4">
      <div 
        className={`
          relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer
          ${isDragging ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[1.02] dropzone-active' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect}
          accept=".pdf,.txt,.md"
        />
        
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
            <Upload className={`w-8 h-8 text-indigo-600 dark:text-indigo-400 ${isDragging ? 'animate-bounce' : ''}`} />
        </div>
        
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
          {isDragging ? 'Drop files here' : 'Click or Drag files to upload'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          Supports multiple PDF, TXT, or MD files. Synapse will merge and analyze them to build your roadmap.
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 animate-in slide-in-from-top-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Uploaded Files ({files.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map(file => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm group">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            {file.file.type.includes('pdf') ? <FileText className="w-4 h-4 text-red-500" /> : <File className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.file.name}</p>
                            <p className="text-xs text-slate-400">{(file.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div className="shrink-0">
                            {file.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                            {file.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {file.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
