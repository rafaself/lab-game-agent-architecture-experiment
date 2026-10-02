export const EVENT_CUES = Object.freeze({
  'run-started': 'start', 'player-attack': 'slash', 'player-damaged': 'hurt',
  'enemy-defeated': 'defeat', 'enemy-attack': 'warning', 'room-cleared': 'clear',
  'upgrade-selected': 'upgrade', 'game-over': 'loss', victory: 'win',
});

const TONES = Object.freeze({
  start: [330, 660, 0.16, 'sine', 0.06], slash: [620, 190, 0.10, 'triangle', 0.045],
  hurt: [105, 45, 0.24, 'sawtooth', 0.075], defeat: [390, 820, 0.16, 'sine', 0.04],
  warning: [160, 220, 0.12, 'square', 0.022], clear: [440, 880, 0.30, 'sine', 0.05],
  upgrade: [550, 1100, 0.32, 'triangle', 0.055], loss: [220, 55, 0.60, 'triangle', 0.08],
  win: [440, 1320, 0.65, 'sine', 0.07],
});

export function createAudio(Context = globalThis.AudioContext || globalThis.webkitAudioContext) {
  let context = null;
  let muted = false;
  let unavailable = !Context;
  async function unlock() {
    if (!Context) return false;
    try {
      context ||= new Context();
      if (context.state === 'suspended') await context.resume();
      return context.state === 'running';
    } catch { unavailable = true; return false; }
  }
  function play(cue) {
    if (muted || !context || context.state !== 'running' || !TONES[cue]) return false;
    const [start, end, duration, type, volume] = TONES[cue];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const time = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(start, time);
    oscillator.frequency.exponentialRampToValueAtTime(end, time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(time); oscillator.stop(time + duration + 0.02);
    return true;
  }
  return {
    unlock,
    consume(events) { for (const event of events) if (EVENT_CUES[event.type]) play(EVENT_CUES[event.type]); },
    setMuted(value) { muted = Boolean(value); },
    status() { return { muted, unlocked: context?.state === 'running', unavailable }; },
  };
}
