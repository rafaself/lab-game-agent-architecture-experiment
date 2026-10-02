export function createAudio() {
  let context;
  let enabled = true;
  const cueCounts = {};
  async function unlock() {
    context ??= new AudioContext();
    await context.resume();
  }
  function tone(frequency, endFrequency, duration, type, volume, delay = 0) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }
  function play(event) {
    if (!enabled || context?.state !== 'running') return;
    cueCounts[event] = (cueCounts[event] || 0) + 1;
    if (event === 'attack') tone(740, 360, .07, 'triangle', .10);
    if (event === 'damage') tone(135, 40, .23, 'sawtooth', .11);
    if (event === 'enemyDefeat') tone(280, 85, .15, 'square', .06);
    if (event === 'enemyAttack') tone(160, 200, .1, 'sine', .07);
    if (['upgrade', 'roomClear', 'victory'].includes(event)) [330, 440, 660].forEach((f, i) => tone(f, f * 1.02, .25, 'sine', .1, i * .11));
    if (event === 'gameover') [220, 165, 110].forEach((f, i) => tone(f, f * .8, .3, 'triangle', .1, i * .15));
  }
  return { unlock, play, toggle: () => (enabled = !enabled), status: () => ({ enabled, state: context?.state || 'locked', cueCounts: { ...cueCounts } }) };
}
