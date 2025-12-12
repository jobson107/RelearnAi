
import React, { useState, useMemo } from 'react';
import { StudySession } from '../types';
import { Trash2, BookOpen, Calendar, ArrowRight, Search, Filter } from 'lucide-react';
import { deleteSession } from '../services/storageService';

interface LibraryProps {
  sessions: StudySession[];
  onLoadSession: (session: StudySession) => void;
  onRefresh: () => void;
  searchQuery?: string;
  onSearch: (query: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'title';

export const Library: React.FC<LibraryProps> = ({ sessions, onLoadSession, onRefresh, searchQuery = '', onSearch }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this study session?")) {
      setDeletingId(id);
      // Wait for animation to finish before actually deleting
      setTimeout(() => {
        deleteSession(id);
        setDeletingId(null);
        onRefresh();
      }, 600); // Matches the 0.6s CSS animation duration
    }
  };

  const filteredAndSortedSessions = useMemo(() => {
    let result = sessions.filter(session => {
      // Text Search
      const q = searchQuery.toLowerCase();
      const matchesText = !q || session.title.toLowerCase().includes(q) || session.previewText.toLowerCase().includes(q);

      // Date Range Search
      const sessionDate = new Date(session.date);
      let matchesDate = true;
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Reset time part
        if (sessionDate < start) matchesDate = false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        if (sessionDate > end) matchesDate = false;
      }

      return matchesText && matchesDate;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        // newest
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [sessions, searchQuery, startDate, endDate, sortBy]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-full">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Your Knowledge Library</h2>
            <p className="text-slate-500 dark:text-slate-400">Access your past study sessions and notes.</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                {/* Library-Specific Search Bar */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Filter sessions..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/50 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white placeholder:text-slate-400 shadow-sm transition-all"
                    />
                </div>
                
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-white/60 dark:bg-slate-800/60 border-white/50 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                    title="Toggle Filters"
                >
                    <Filter className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Extended Filters */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/40 dark:bg-slate-800/40 p-4 rounded-2xl border border-white/60 dark:border-slate-700 backdrop-blur-md transition-all duration-300 origin-top ${showFilters ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden'}`}>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">From Date</label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">To Date</label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Sort By</label>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                    <option value="newest">Date (Newest First)</option>
                    <option value="oldest">Date (Oldest First)</option>
                    <option value="title">Title (A-Z)</option>
                </select>
            </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-white/40 dark:bg-slate-800/40 rounded-[2.5rem] border border-white/60 dark:border-slate-700 shadow-sm backdrop-blur-md animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No saved sessions yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Generate summaries and quizzes in the Study Studio, then click "Save Session" to build your library.
            </p>
        </div>
      ) : filteredAndSortedSessions.length === 0 ? (
         <div className="text-center py-20 bg-white/40 dark:bg-slate-800/40 rounded-[2.5rem] border border-white/60 dark:border-slate-700 shadow-sm backdrop-blur-md">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No matching sessions</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 optimize-scroll">
          {filteredAndSortedSessions.map((session, index) => (
            <div 
                key={session.id}
                onClick={() => !deletingId && onLoadSession(session)}
                className={`group relative bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md rounded-[2rem] p-6 border border-white/60 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hardware-accelerated animate-in fade-in-up ${deletingId === session.id ? 'erasing-effect' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    {/* Delete Button */}
                    <button 
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete Session"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {session.title}
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {session.previewText}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center text-xs text-slate-400">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        {new Date(session.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                        OPEN
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
