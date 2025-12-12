
import React from 'react';
import { AlertTriangle, RefreshCw, CloudOff, WifiOff } from 'lucide-react';

interface StatusBannerProps {
  isFallback: boolean;
  onRetry: () => void;
  isRetrying: boolean;
  className?: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ isFallback, onRetry, isRetrying, className }) => {
  if (!isFallback) return null;

  return (
    <div className={`w-full bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 ${className || ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-full text-amber-600 dark:text-amber-400">
          <CloudOff className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
            Offline / Fallback Mode Active
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-300">
            Results were generated locally. Connect to Gemini for enhanced AI reasoning.
          </p>
        </div>
      </div>

      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg text-sm font-bold text-amber-700 dark:text-amber-300 shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Retrying Cloud...' : 'Retry with Cloud'}
      </button>
    </div>
  );
};
