
export type SoundType = 'click' | 'hover' | 'success' | 'error' | 'complete' | 'bubble';

let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx && typeof window !== 'undefined') {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, delay: number = 0, vol: number = 0.1) => {
  const ctx = getCtx();
  if (!ctx) return;
  // Resume context if suspended (browser policy)
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
};

export const playClick = () => {
    playTone(600, 'sine', 0.05, 0, 0.05);
};

export const playHover = () => {
    playTone(400, 'sine', 0.03, 0, 0.01);
};

export const playSuccess = () => {
  playTone(440, 'sine', 0.2, 0, 0.1);       // A4
  playTone(554.37, 'sine', 0.2, 0.1, 0.1);  // C#5
  playTone(659.25, 'sine', 0.4, 0.2, 0.1);  // E5
};

export const playError = () => {
  playTone(150, 'sawtooth', 0.2, 0, 0.08);
  playTone(110, 'sawtooth', 0.3, 0.1, 0.08);
};

export const playComplete = () => {
    playTone(523.25, 'triangle', 0.1, 0, 0.1); // C5
    playTone(659.25, 'triangle', 0.1, 0.1, 0.1); // E5
    playTone(783.99, 'triangle', 0.4, 0.2, 0.1); // G5
};

export const playBubble = () => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
};

export const playGlitter = () => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    // Play a sequence of high-pitched random notes
    for(let i=0; i<10; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = Math.random() * 0.4;
        
        osc.type = 'sine';
        // Frequencies between 1000Hz and 3000Hz
        osc.frequency.setValueAtTime(1000 + Math.random() * 2000, now + delay);
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.02, now + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.2);
    }
};
