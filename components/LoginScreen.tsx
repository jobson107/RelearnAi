import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, User, LayoutGrid, Sparkles } from 'lucide-react';
import { SuccessAnimation } from './SuccessAnimation';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<'form' | 'success' | 'dashboard'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  // Hardcoded Credentials
  const VALID_EMAIL = 'jobsonjoby9637@gmail.com';
  const VALID_PASS = '7025314115';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate verification delay
    setTimeout(() => {
      if (email === VALID_EMAIL && password === VALID_PASS) {
        setView('success');
      } else {
        setError('Invalid credentials');
        setShake(true);
        // Reset shake after animation
        setTimeout(() => setShake(false), 500);
      }
      setIsLoading(false);
    }, 600);
  };

  const fillDemo = () => {
    setEmail(VALID_EMAIL);
    setPassword(VALID_PASS);
  };

  if (view === 'success') {
    return <SuccessAnimation onComplete={() => setView('dashboard')} />;
  }

  if (view === 'dashboard') {
    return (
       // Dashboard View State
       <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 animate-in fade-in duration-500 z-50">
           {/* Summary Card & CTA */}
           <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-white/50 dark:border-slate-700 relative overflow-hidden">
               {/* Decorative Gradient Blob */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
               
               <div className="relative z-10 text-center">
                   <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
                        <User className="w-10 h-10 text-white" />
                   </div>
                   <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome Back!</h2>
                   <p className="text-slate-500 dark:text-slate-400 mb-8">
                       You have <strong className="text-indigo-500">3 pending sessions</strong> and a roadmap waiting for you.
                   </p>

                   <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-8 text-left border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                             <Sparkles className="w-5 h-5 text-yellow-500" fill="currentColor" />
                             <h4 className="font-bold text-slate-700 dark:text-slate-200">Daily Insight</h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                            "Consistency is not about perfection. It's about refusing to give up."
                        </p>
                   </div>

                   <button 
                    onClick={onLogin}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
                   >
                       <span>Go to Study Studio</span>
                       <ArrowRight className="w-5 h-5" />
                   </button>
               </div>
           </div>
       </div>
    );
  }

  // Login Form View
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center relative z-50">
        {/* Ambient Animated Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div className={`w-full max-w-md px-6 relative z-10 transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
             <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/50 dark:border-slate-800 relative overflow-hidden">
                
                {/* Brand Header */}
                <div className="text-center mb-10">
                     <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                         <LayoutGrid className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                     </div>
                     <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">Synapse AI</h1>
                     <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sign in to continue learning</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Email Input with Floating Label */}
                    <div className="relative group input-group">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 z-10 ${email ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <input 
                            type="email"
                            id="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-800 dark:text-white placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all peer font-medium"
                            placeholder="Email Address"
                            required
                        />
                        <label 
                            htmlFor="email"
                            className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-all duration-300 pointer-events-none 
                            peer-focus:-translate-y-[2.2rem] peer-focus:text-xs peer-focus:text-indigo-500 peer-focus:left-4 peer-focus:font-bold
                            peer-[&:not(:placeholder-shown)]:-translate-y-[2.2rem] peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:font-bold"
                        >
                            Email Address
                        </label>
                    </div>

                    {/* Password Input with Floating Label */}
                    <div className="relative group input-group">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 z-10 ${password ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <input 
                            type="password" 
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-800 dark:text-white placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all peer font-medium"
                            placeholder="Password"
                            required
                        />
                        <label 
                            htmlFor="password"
                            className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-all duration-300 pointer-events-none 
                            peer-focus:-translate-y-[2.2rem] peer-focus:text-xs peer-focus:text-indigo-500 peer-focus:left-4 peer-focus:font-bold
                            peer-[&:not(:placeholder-shown)]:-translate-y-[2.2rem] peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:font-bold"
                        >
                            Password
                        </label>
                    </div>

                    {/* Error Message Pill */}
                    <div className={`h-6 flex items-center justify-center transition-opacity duration-300 ${error ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-800/30 shadow-sm" role="alert" aria-live="assertive">
                            {error}
                        </p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:to-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span className="relative z-10">Sign In</span>
                                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                        {/* Button Shine Effect */}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button 
                        onClick={fillDemo}
                        className="text-xs font-medium text-slate-400 hover:text-indigo-500 transition-colors underline decoration-dotted underline-offset-4"
                        type="button"
                    >
                        Use demo user
                    </button>
                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-300 dark:text-slate-600 uppercase tracking-widest font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>Powered by Client-Side AI</span>
                    </div>
                </div>

             </div>
        </div>
    </div>
  );
};