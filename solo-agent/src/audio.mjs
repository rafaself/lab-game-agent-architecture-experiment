const CUES = Object.freeze({
  attack: { frequency: 470, endFrequency: 190, duration: 0.075, type: 'triangle', gain: 0.11 },
  enemy: { frequency: 245, endFrequency: 510, duration: 0.14, type: 'sawtooth', gain: 0.09 },
  damage: { frequency: 155, endFrequency: 72, duration: 0.19, type: 'square', gain: 0.12 },
  defeat: { frequency: 640, endFrequency: 940, duration: 0.14, type: 'triangle', gain: 0.08 },
  reward: { frequency: 470, endFrequency: 790, duration: 0.24, type: 'sine', gain: 0.09 },
  victory: { frequency: 420, endFrequency: 960, duration: 0.58, type: 'sine', gain: 0.12 },
});

export class AudioCues {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  async unlock() {
    if (!this.enabled) return;
    const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    if (this.context.state === 'suspended') await this.context.resume();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  play(name) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const cue = CUES[name];
    if (!cue) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = cue.type;
    oscillator.frequency.setValueAtTime(cue.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(cue.endFrequency, now + cue.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(cue.gain, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + cue.duration + 0.015);
  }
}
