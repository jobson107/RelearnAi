import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../types';
import { getSchedule, addScheduleItem, deleteScheduleItem, DAYS_OF_WEEK, COLORS } from '../services/storageService';
import { Calendar, Plus, Trash2, Clock, X, CheckCircle2, Bell, BellRing, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Schedule: React.FC = () => {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Form State
  const [subject, setSubject] = useState('');
  const [day, setDay] = useState(DAYS_OF_WEEK[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState(COLORS[0].value);

  useEffect(() => {
    refreshSchedule();
    if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
    }
  }, []);

  const refreshSchedule = () => {
    setItems(getSchedule());
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        alert("This browser does not support desktop notifications");
        return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
        new Notification("Notifications Enabled", {
            body: "Synapse will now remind you when your classes start!",
            icon: '/favicon.ico'
        });
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject) {
      setIsSaving(true);

      // Simulate network/processing delay for effect
      setTimeout(() => {
          addScheduleItem({ subject, day, startTime, endTime, color });
          setIsSaving(false);
          setIsSuccess(true);
          
          // Trigger Confetti
          const modalRect = document.getElementById('add-modal')?.getBoundingClientRect();
          const originX = modalRect ? (modalRect.left + modalRect.width / 2) / window.innerWidth : 0.5;
          const originY = modalRect ? (modalRect.top + modalRect.height / 2) / window.innerHeight : 0.5;

          confetti({
            particleCount: 150,
            spread: 70,
            origin: { x: originX, y: originY },
            zIndex: 9999,
            colors: ['#6366f1', '#10b981', '#f43f5e']
          });

          // Wait for success animation then close
          setTimeout(() => {
            setIsAdding(false);
            setIsSuccess(false);
            refreshSchedule();
            // Reset form
            setSubject('');
            setStartTime('09:00');
            setEndTime('10:00');
          }, 1500);
      }, 800);
    }
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Remove this class?')) {
        deleteScheduleItem(id);
        refreshSchedule();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Study Timetable</h2>
           <p className="text-slate-500 dark:text-slate-400">Plan your week for maximum productivity.</p>
        </div>
        
        <div className="flex items-center gap-3">
            {notificationPermission !== 'granted' && (
                <button
                    onClick={requestNotificationPermission}
                    className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    title="Enable Reminders"
                >
                    <Bell className="w-5 h-5" />
                    <span className="text-sm font-bold hidden sm:inline">Enable Reminders</span>
                </button>
            )}

            <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            >
                <Plus className="w-5 h-5" />
                <span>Add Class</span>
            </button>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {DAYS_OF_WEEK.map((dayName) => {
            const dayItems = items
                .filter(i => i.day === dayName)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
                <div key={dayName} className="flex flex-col gap-3">
                    <div className="text-center py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/60 dark:border-slate-700">
                        <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">{dayName.substring(0,3)}</span>
                    </div>
                    
                    <div className="space-y-3 min-h-[200px] p-2 rounded-2xl bg-white/20 dark:bg-slate-900/20 border border-white/30 dark:border-slate-800 backdrop-blur-sm">
                        {dayItems.map(item => (
                            <div key={item.id} className={`${item.color} p-4 rounded-xl text-white shadow-sm relative group transition-transform hover:scale-[1.02]`}>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="absolute top-2 right-2 p-1 bg-black/10 hover:bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                                <div className="font-bold text-sm mb-1">{item.subject}</div>
                                <div className="flex items-center text-xs opacity-90">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {item.startTime} - {item.endTime}
                                </div>
                            </div>
                        ))}
                        {dayItems.length === 0 && (
                            <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs py-8">
                                Free
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm p-4">
            <div id="add-modal" className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 relative border border-slate-100 dark:border-slate-700 overflow-hidden">
                <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                    <X className="w-6 h-6" />
                </button>
                
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Saved!</h3>
                        <p className="text-slate-500 dark:text-slate-400">Class added to your schedule.</p>
                    </div>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Add Schedule Block</h3>
                        
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Subject</label>
                                <input 
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="e.g. Advanced Math"
                                    className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Day</label>
                                    <select 
                                        value={day} 
                                        onChange={e => setDay(e.target.value)}
                                        className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    >
                                        {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Color</label>
                                    <div className="flex gap-2 mt-2">
                                        {COLORS.map(c => (
                                            <button 
                                                key={c.name}
                                                type="button"
                                                onClick={() => setColor(c.value)}
                                                className={`w-6 h-6 rounded-full ${c.value} ${color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500' : ''}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Start</label>
                                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white" required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">End</label>
                                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white" required />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4 transition-colors flex items-center justify-center space-x-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Add to Schedule</span>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};