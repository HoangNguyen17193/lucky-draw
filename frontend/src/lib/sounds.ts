// Sound effects using Web Audio API

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Spinning wheel sound - continuous whirring
export function playSpinningSound(): { stop: () => void } {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();
  
  // Low frequency noise-like sound
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(80, ctx.currentTime);
  
  // Filter to make it less harsh
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(400, ctx.currentTime);
  
  // Start quiet and ramp up
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3);
  
  oscillator.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start();
  
  // Add slight pitch variation for realism
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(8, ctx.currentTime);
  lfoGain.gain.setValueAtTime(10, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);
  lfo.start();
  
  return {
    stop: () => {
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(() => {
        oscillator.stop();
        lfo.stop();
      }, 500);
    }
  };
}

// Tick sound for each segment pass
export function playTickSound(): void {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
  
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.05);
}

// Win celebration sound - triumphant fanfare
export function playWinSound(): void {
  const ctx = getAudioContext();
  
  // Play a sequence of notes for celebration
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 - major chord arpeggio
  const durations = [0.15, 0.15, 0.15, 0.4];
  
  let startTime = ctx.currentTime;
  
  notes.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, startTime);
    
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + durations[i]);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + durations[i]);
    
    startTime += durations[i] * 0.7; // Slight overlap for smoother sound
  });
  
  // Add a shimmer effect
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random() * 2000, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }, i * 80);
    }
  }, 400);
}

// Slowdown sound - decreasing pitch whoosh
export function playSlowdownSound(): void {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 2);
  
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(800, ctx.currentTime);
  filterNode.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 2);
  
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
  
  oscillator.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 2);
}

// Click sound for button interactions
export function playClickSound(): void {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.1);
}
