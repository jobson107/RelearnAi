
import React, { useRef, useEffect } from 'react';
import { X, Check, ExternalLink } from 'lucide-react';
import { VideoResult } from '../types';

interface VideoPreviewModalProps {
  video: VideoResult | null;
  onClose: () => void;
  onInsert: (video: VideoResult) => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ video, onClose, onInsert }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!video) return null;

  const isYouTube = video.source === 'youtube';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
        role="dialog"
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate pr-4">{video.title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="aspect-video bg-black relative">
          {isYouTube ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              ref={videoRef}
              src={video.url}
              controls
              autoPlay
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase tracking-wider text-xs mr-2">{video.source}</span>
            {video.duration && <span>• {video.duration}</span>}
          </div>
          
          <div className="flex gap-3">
             {isYouTube && (
                 <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center gap-2 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                 >
                     <ExternalLink className="w-4 h-4" />
                     Open in YouTube
                 </a>
             )}
             <button
                onClick={() => onInsert(video)}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
             >
                <Check className="w-4 h-4" />
                Add to Node
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
