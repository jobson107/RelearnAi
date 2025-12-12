
import React from 'react';
import { Sparkles } from 'lucide-react';

interface GenerateButtonProps {
  isLoading: boolean;
  onClick: () => void;
  label?: string;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ isLoading, onClick, label = "Generate Plan" }) => {
  return (
    <div className="flex justify-center w-full">
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`
          relative h-12 flex items-center justify-center font-bold text-white shadow-lg transition-all duration-300
          bg-gradient-to-r from-indigo-600 to-purple-600 hover:to-purple-700
          active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed
          roadmap-btn-morph ${isLoading ? 'loading' : 'w-full rounded-xl px-6'}
        `}
        aria-label={isLoading ? "Generating plan" : label}
      >
        {isLoading ? (
          <div className="roadmap-spinner" />
        ) : (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Sparkles className="w-5 h-5" />
            {label}
          </span>
        )}
      </button>
    </div>
  );
};
