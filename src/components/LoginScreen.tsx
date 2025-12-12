
import React, { useState, useRef } from 'react';
import { Mail, Lock, ArrowRight, Loader2, User, LayoutGrid, Sparkles, Box } from 'lucide-react';
import { SuccessAnimation } from './SuccessAnimation';
import { Login3DAnimation } from './Login3DAnimation';

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
  const [triggerBurst, setTriggerBurst] = useState(false);

  // 3D Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  // Hardcoded Credentials
  const VALID_EMAIL = 'jobsonjoby9637@gmail.com';
  const VALID_PASS = '7025314115';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (max 10 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // RotateX is based on Y axis distance (inverted for natural tilt)
    const rotateX = ((y - centerY) / centerY) * -10; 
    const rotateY = ((x - centerX) / centerX) * 10;

    // Calculate glow position (percentage)
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    setRotation({ x: rotateX, y: rotateY });
    setGlowPos({ x: glowX, y: glowY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlowPos({ x: 50, y: 50 }); // Reset glow to center
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Trigger 3D Orb Burst Animation
    setTriggerBurst(true);
    // Reset trigger quickly so it can be re-triggered if needed (though we nav away usually)
    setTimeout(() => setTriggerBurst(false), 500);

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
    }, 1200); // Increased delay slightly to let particle animation play
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
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center relative z-50 perspective-[1000px]">
        {/* Ambient Animated Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
            
            {/* 3D Floating Elements in Background */}
            <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-blue-500/20 rounded-2xl blur-sm animate-[float_8s_ease-in-out_infinite] [transform-style:preserve-3d] rotate-12"></div>
            <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-md animate-[float_10s_ease-in-out_infinite_reverse] delay-1000"></div>
        </div>

        <div 
            className={`w-full max-w-md px-6 relative z-10 transition-all duration-300 ${shake ? 'animate-shake' : ''}`}
            style={{ perspective: '1000px' }}
        >
             <div 
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-white/50 dark:border-slate-800 relative overflow-visible transition-transform duration-100 ease-out"
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
                    transformStyle: 'preserve-3d'
                }}
             >
                {/* Dynamic Glare Effect */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay transition-opacity duration-300 rounded-[2.5rem]"
                    style={{
                        background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%)`
                    }}
                ></div>

                {/* Content Layer (lifted slightly in 3D space) */}
                <div style={{ transform: 'translateZ(20px)' }}>
                    
                    {/* Brand Header with 3D Orb */}
                    <div className="text-center mb-8 relative">
                        {/* 3D Orb Component - Replaces static icon */}
                        <Login3DAnimation triggerBurst={triggerBurst} />
                        
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2 mt-4">ReLearn AI</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Empower your relearning journey</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Input */}
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

                        {/* Password Input */}
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
                            style={{ transform: 'translateZ(10px)' }}
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
    </div>
  );
};
