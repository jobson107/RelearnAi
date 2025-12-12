
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Timer, Settings, CheckCircle2, Volume2, VolumeX, Coffee, BrainCircuit, Maximize2, Minimize2, MoreVertical, Bell } from 'lucide-react';
import { PomodoroSettings, PomodoroStats } from '../types';
import { getPomodoroSettings, savePomodoroSettings, getPomodoroStats, updatePomodoroStats, getSessions } from '../services/storageService';
import confetti from 'canvas-confetti';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export const PomodoroTimer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [sessionCount, setSessionCount] = useState(0); // Total sessions in current streak
  
  // Settings & Stats
  const [settings, setSettings] = useState<PomodoroSettings>(getPomodoroSettings());
  const [stats, setStats] = useState<PomodoroStats>(getPomodoroStats());
  
  // Task Integration
  const [task, setTask] = useState('');
  const [recentTopics, setRecentTopics] = useState<string[]>([]);

  useEffect(() => {
    // Initialize timer duration
    resetTimer(mode, false);
    // Load recent topics from library for quick selection
    const sessions = getSessions();
    setRecentTopics(sessions.slice(0, 3).map(s => s.title));
  }, []);

  useEffect(() => {
    let interval: any = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Update stats on complete
  const handleTimerComplete = () => {
    setIsActive(false);
    
    // Play Sound
    if (settings.soundEnabled) {
       playNotificationSound(mode === 'focus' ? 'complete' : 'start');
    }

    // Send Notification
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
       new Notification("Synapse Timer", {
           body: mode === 'focus' ? "Focus session complete! Time for a break." : "Break is over! Time to focus.",
           icon: '/favicon.ico'
       });
    }

    if (mode === 'focus') {
        const newTotal = stats.sessionsCompleted + 1;
        
        // Update Persistent Stats
        const newStats = updatePomodoroStats({ 
            sessionsCompleted: newTotal,
            totalFocusTime: stats.totalFocusTime + settings.focusDuration
        });
        setStats(newStats);
        setSessionCount(prev => prev + 1);

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8, x: 0.1 }, // Confetti near timer
            colors: ['#8b5cf6', '#ec4899'],
            zIndex: 10000
        });

        // Determine next mode
        if ((sessionCount + 1) % settings.sessionsUntilLongBreak === 0) {
            setMode('longBreak');
            resetTimer('longBreak', settings.autoStartBreaks);
        } else {
            setMode('shortBreak');
            resetTimer('shortBreak', settings.autoStartBreaks);
        }
    } else {
        // Break is over
        setMode('focus');
        resetTimer('focus', settings.autoStartPomodoros);
    }
  };

  const playNotificationSound = (type: 'complete' | 'start') => {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'complete') {
          // Melodic sequence
          const now = audioCtx.currentTime;
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523.25, now); // C5
          oscillator.frequency.setValueAtTime(659.25, now + 0.2); // E5
          oscillator.frequency.setValueAtTime(783.99, now + 0.4); // G5
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          oscillator.start(now);
          oscillator.stop(now + 0.8);
      } else {
          // Simple beep
          oscillator.type = 'sine';
          oscillator.frequency.value = 880;
          gainNode.gain.value = 0.1;
          oscillator.start();
          setTimeout(() => oscillator.stop(), 200);
      }
  };

  const resetTimer = (newMode: TimerMode = mode, autoStart: boolean = false) => {
    setIsActive(autoStart);
    let duration = settings.focusDuration;
    if (newMode === 'shortBreak') duration = settings.shortBreakDuration;
    if (newMode === 'longBreak') duration = settings.longBreakDuration;
    
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getProgress = () => {
      let total = settings.focusDuration * 60;
      if (mode === 'shortBreak') total = settings.shortBreakDuration * 60;
      if (mode === 'longBreak') total = settings.longBreakDuration * 60;
      return ((total - timeLeft) / total) * 100;
  };

  const updateSetting = (key: keyof PomodoroSettings, value: any) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      savePomodoroSettings(newSettings);
      
      // If updating duration of current mode, reset timer if not active
      if (!isActive) {
          if (key === 'focusDuration' && mode === 'focus') setTimeLeft(value * 60);
          if (key === 'shortBreakDuration' && mode === 'shortBreak') setTimeLeft(value * 60);
          if (key === 'longBreakDuration' && mode === 'longBreak') setTimeLeft(value * 60);
      }
  };

  const requestNotificationPermission = () => {
      if ('Notification' in window) {
          Notification.requestPermission();
      }
  };

  // --- Render Helpers ---
  const radius = 80;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (getProgress() / 100) * circumference;

  const modeColors = {
      focus: {
          text: 'text-purple-500',
          bg: 'bg-purple-500',
          gradient: 'from-purple-500 to-pink-500',
          shadow: 'shadow-purple-500/30'
      },
      shortBreak: {
          text: 'text-emerald-500',
          bg: 'bg-emerald-500',
          gradient: 'from-emerald-500 to-teal-500',
          shadow: 'shadow-emerald-500/30'
      },
      longBreak: {
          text: 'text-blue-500',
          bg: 'bg-blue-500',
          gradient: 'from-blue-500 to-cyan-500',
          shadow: 'shadow-blue-500/30'
      }
  };

  const currentTheme = modeColors[mode];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 p-4 rounded-full bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 group border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-10"
      >
        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" hidden={!isActive}></div>
        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" hidden={!isActive}></div>
        <Timer className={`w-6 h-6 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 left-6 z-50 animate-in zoom-in duration-300 origin-bottom-left transition-all ${isMinimized ? 'w-auto' : 'w-80 md:w-96'}`}>
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
                <BrainCircuit className={`w-5 h-5 ${currentTheme.text}`} />
                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                    {mode === 'focus' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                    <Settings className="w-4 h-4" />
                </button>
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Main Content */}
        {!isMinimized && !showSettings && (
            <div className="p-6 flex flex-col items-center">
                {/* Circular Timer */}
                <div className="relative w-56 h-56 flex items-center justify-center mb-6">
                    {/* Outer Glow */}
                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${currentTheme.bg} ${isActive ? 'animate-pulse' : ''}`}></div>
                    
                    <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 relative z-10">
                        <circle
                            stroke="currentColor"
                            fill="transparent"
                            strokeWidth={stroke}
                            r={normalizedRadius}
                            cx={radius}
                            cy={radius}
                            className="text-slate-100 dark:text-slate-700"
                        />
                        <circle
                            stroke="currentColor"
                            fill="transparent"
                            strokeWidth={stroke}
                            strokeDasharray={circumference + ' ' + circumference}
                            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
                            r={normalizedRadius}
                            cx={radius}
                            cy={radius}
                            className={`${currentTheme.text} transition-colors duration-500 drop-shadow-md`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <span className={`text-5xl font-mono font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br ${currentTheme.gradient}`}>
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                            {isActive ? 'Running' : 'Paused'}
                        </span>
                    </div>
                </div>

                {/* Task Input */}
                <div className="w-full mb-6 relative group">
                    <input 
                        type="text" 
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        placeholder="What are you focusing on?"
                        className="w-full text-center bg-transparent border-b-2 border-slate-100 dark:border-slate-700 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder:text-slate-400 transition-colors"
                    />
                    {/* Quick Pick Dropdown on Focus (Simulated) */}
                    {recentTopics.length > 0 && !task && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 shadow-xl rounded-b-xl border border-slate-100 dark:border-slate-700 z-20 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
                            {recentTopics.map((topic, i) => (
                                <div key={i} onClick={() => setTask(topic)} className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer truncate">
                                    {topic}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    <button 
                        onClick={resetTimer.bind(null, mode, false)}
                        className="p-3 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:rotate-[-45deg]"
                        title="Reset"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={`p-5 rounded-full text-white shadow-xl transition-all transform hover:scale-110 active:scale-95 bg-gradient-to-br ${currentTheme.gradient} ${currentTheme.shadow}`}
                    >
                        {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>

                    <button 
                        onClick={() => {
                            // Skip logic
                            if (mode === 'focus') {
                                setMode('shortBreak');
                                resetTimer('shortBreak', settings.autoStartBreaks);
                            } else {
                                setMode('focus');
                                resetTimer('focus', settings.autoStartPomodoros);
                            }
                        }}
                        className="p-3 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:translate-x-1"
                        title="Skip"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats Footer */}
                <div className="w-full mt-8 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5" title="Sessions until long break">
                        <div className="flex gap-0.5">
                            {[...Array(settings.sessionsUntilLongBreak)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < (sessionCount % settings.sessionsUntilLongBreak) ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                            ))}
                        </div>
                        <span>{sessionCount}/{settings.dailyGoal}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5" />
                        <span>{(stats.totalFocusTime / 60).toFixed(1)}h Focused</span>
                    </div>
                </div>
            </div>
        )}

        {/* Minimized View */}
        {isMinimized && !showSettings && (
            <div className="p-4 flex items-center justify-between w-64">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="font-mono font-bold text-xl text-slate-800 dark:text-white">{formatTime(timeLeft)}</span>
                </div>
                <button 
                    onClick={() => setIsActive(!isActive)}
                    className={`p-2 rounded-full text-white shadow-sm bg-gradient-to-br ${currentTheme.gradient}`}
                >
                    {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
            </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
            <div className="p-6 animate-in slide-in-from-right duration-300 bg-slate-50/50 dark:bg-slate-900/50 h-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white">Timer Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-indigo-500 text-xs font-bold hover:underline bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">Done</button>
                </div>
                
                <div className="space-y-6">
                    {/* Durations */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Focus Duration</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[15, 25, 45, 60].map(val => (
                                <button
                                    key={val}
                                    onClick={() => updateSetting('focusDuration', val)}
                                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${settings.focusDuration === val ? 'bg-purple-500 border-purple-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-purple-300'}`}
                                >
                                    {val}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Break Duration</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[3, 5, 10].map(val => (
                                <button
                                    key={val}
                                    onClick={() => updateSetting('shortBreakDuration', val)}
                                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${settings.shortBreakDuration === val ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300'}`}
                                >
                                    {val}m
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-1 bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${settings.soundEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sound Effects</span>
                            </div>
                            <button 
                                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                                className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${settings.soundEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${settings.notificationsEnabled ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Bell className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notifications</span>
                            </div>
                            <button 
                                onClick={() => {
                                    updateSetting('notificationsEnabled', !settings.notificationsEnabled);
                                    if (!settings.notificationsEnabled) requestNotificationPermission();
                                }}
                                className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${settings.notificationsEnabled ? 'bg-pink-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${settings.autoStartBreaks ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Coffee className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-start Breaks</span>
                            </div>
                            <button 
                                onClick={() => updateSetting('autoStartBreaks', !settings.autoStartBreaks)}
                                className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${settings.autoStartBreaks ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${settings.autoStartBreaks ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
