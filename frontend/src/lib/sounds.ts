// Fun sound effects using Web Audio API

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Spinning wheel sound - exciting casino-style spinning
export function playSpinningSound(): { stop: () => void } {
  const ctx = getAudioContext();
  
  // Main spinning sound
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();
  
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(150, ctx.currentTime);
  
  filterNode.type = 'bandpass';
  filterNode.frequency.setValueAtTime(600, ctx.currentTime);
  filterNode.Q.setValueAtTime(2, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.2);
  
  oscillator.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start();
  
  // Add exciting wobble effect
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(12, ctx.currentTime);
  lfoGain.gain.setValueAtTime(30, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);
  lfo.start();
  
  // Add tick-tick rhythm
  const tickOsc = ctx.createOscillator();
  const tickGain = ctx.createGain();
  const tickFilter = ctx.createBiquadFilter();
  
  tickOsc.type = 'square';
  tickOsc.frequency.setValueAtTime(8, ctx.currentTime);
  tickFilter.type = 'highpass';
  tickFilter.frequency.setValueAtTime(1000, ctx.currentTime);
  tickGain.gain.setValueAtTime(0.08, ctx.currentTime);
  
  tickOsc.connect(tickFilter);
  tickFilter.connect(tickGain);
  tickGain.connect(ctx.destination);
  tickOsc.start();
  
  return {
    stop: () => {
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      tickGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => {
        oscillator.stop();
        lfo.stop();
        tickOsc.stop();
      }, 300);
    }
  };
}

// Tick sound for each segment pass
export function playTickSound(): void {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);
  
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.03);
}

// Win celebration sound - exciting jackpot fanfare!
export function playWinSound(): void {
  const ctx = getAudioContext();
  
  // Exciting ascending arpeggio
  const notes = [
    { freq: 523.25, time: 0 },      // C5
    { freq: 659.25, time: 0.08 },   // E5
    { freq: 783.99, time: 0.16 },   // G5
    { freq: 1046.50, time: 0.24 },  // C6
    { freq: 1318.51, time: 0.32 },  // E6
    { freq: 1567.98, time: 0.40 },  // G6
    { freq: 2093.00, time: 0.50 },  // C7 - big finish!
  ];
  
  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
    
    const duration = time === 0.50 ? 0.6 : 0.15;
    const volume = time === 0.50 ? 0.4 : 0.25;
    
    gain.gain.setValueAtTime(volume, ctx.currentTime + time);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + time);
    osc.stop(ctx.currentTime + time + duration);
  });
  
  // Add sparkle/shimmer effects
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + Math.random() * 3000, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }, 300 + i * 60);
  }
  
  // Add bass drop for impact
  setTimeout(() => {
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(80, ctx.currentTime);
    bassOsc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    
    bassGain.gain.setValueAtTime(0.4, ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    
    bassOsc.start();
    bassOsc.stop(ctx.currentTime + 0.3);
  }, 500);
  
  // Coin sounds
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const coinOsc = ctx.createOscillator();
      const coinGain = ctx.createGain();
      
      coinOsc.type = 'sine';
      const baseFreq = 2500 + Math.random() * 500;
      coinOsc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      coinOsc.frequency.setValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.02);
      coinOsc.frequency.setValueAtTime(baseFreq * 0.9, ctx.currentTime + 0.04);
      
      coinGain.gain.setValueAtTime(0.1, ctx.currentTime);
      coinGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      coinOsc.connect(coinGain);
      coinGain.connect(ctx.destination);
      
      coinOsc.start();
      coinOsc.stop(ctx.currentTime + 0.1);
    }, 600 + i * 100 + Math.random() * 50);
  }
}

// Slowdown sound - dramatic tension builder
export function playSlowdownSound(): void {
  const ctx = getAudioContext();
  
  // Descending whoosh
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(300, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 2.5);
  
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(1200, ctx.currentTime);
  filterNode.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 2.5);
  
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
  
  oscillator.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 2.5);
  
  // Add tension ticks that slow down
  const tickTimes = [0.2, 0.5, 0.9, 1.4, 2.0, 2.3];
  tickTimes.forEach((time) => {
    setTimeout(() => {
      const tickOsc = ctx.createOscillator();
      const tickGain = ctx.createGain();
      
      tickOsc.type = 'sine';
      tickOsc.frequency.setValueAtTime(600 - time * 100, ctx.currentTime);
      
      tickGain.gain.setValueAtTime(0.15, ctx.currentTime);
      tickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      tickOsc.connect(tickGain);
      tickGain.connect(ctx.destination);
      
      tickOsc.start();
      tickOsc.stop(ctx.currentTime + 0.08);
    }, time * 1000);
  });
}

// Click sound - satisfying pop
export function playClickSound(): void {
  const ctx = getAudioContext();
  
  // Pop sound
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
  
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.08);
  
  // Add a subtle high sparkle
  const sparkle = ctx.createOscillator();
  const sparkleGain = ctx.createGain();
  
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(2400, ctx.currentTime);
  
  sparkleGain.gain.setValueAtTime(0.1, ctx.currentTime);
  sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  
  sparkle.connect(sparkleGain);
  sparkleGain.connect(ctx.destination);
  
  sparkle.start();
  sparkle.stop(ctx.currentTime + 0.05);
}
