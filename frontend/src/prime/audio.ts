/**
 * Audio Engine for Prime Effects
 * Uses Web Audio API for tones and beeps
 */

let ctx: AudioContext | null = null;

export function ensureAudio(gainDb = -10): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const master = ctx.createGain();
    master.gain.value = Math.pow(10, gainDb / 20);
    master.connect(ctx.destination);
    return { ctx, master };
  } catch {
    return null;
  }
}

function env(g: GainNode, ctx: AudioContext, a = 0.01, r = 0.06) {
  const t = ctx.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(1, t + a);
  return (holdMs: number) => g.gain.linearRampToValueAtTime(0.0001, t + a + holdMs / 1000 + r);
}

export function toneSlide(startHz: number, endHz: number, durMs: number, gain = 0.1) {
  const kit = ensureAudio();
  if (!kit) return;

  const { ctx, master } = kit;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  const g = ctx.createGain();
  g.gain.value = 0;

  osc.frequency.setValueAtTime(startHz, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(endHz, ctx.currentTime + durMs / 1000);
  osc.connect(g);
  g.connect(master);

  const release = env(g, ctx);
  release(durMs);

  osc.start();
  osc.stop(ctx.currentTime + durMs / 1000 + 0.1);
}

export function beepSeries(hz: number, count: number, eachMs: number, gapMs: number, gain = 0.1) {
  const kit = ensureAudio();
  if (!kit) return;

  const { ctx, master } = kit;
  for (let i = 0; i < count; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const g = ctx.createGain();
    g.gain.value = 0;

    osc.frequency.value = hz;
    osc.connect(g);
    g.connect(master);

    const start = ctx.currentTime + (i * (eachMs + gapMs)) / 1000;
    const end = start + eachMs / 1000;

    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.linearRampToValueAtTime(0.0001, end);

    osc.start(start);
    osc.stop(end + 0.05);
  }
}

export function doubleBeep(hz = 650, eachMs = 90, gapMs = 150, gain = 0.12) {
  beepSeries(hz, 2, eachMs, gapMs, gain);
}

export function tickPair(hz = 500, eachMs = 70, gapMs = 300, gain = 0.1) {
  beepSeries(hz, 2, eachMs, gapMs, gain);
}

export function hornSoft(eachMs = 120, gain = 0.12, hz = 520) {
  const kit = ensureAudio();
  if (!kit) return;

  const { ctx, master } = kit;
  const osc = ctx.createOscillator();
  osc.type = 'square';
  const g = ctx.createGain();
  g.gain.value = 0;

  const biquad = ctx.createBiquadFilter();
  biquad.type = 'lowpass';
  biquad.frequency.value = 1200;

  osc.connect(g);
  g.connect(biquad);
  biquad.connect(master);

  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + eachMs / 1000);

  osc.frequency.value = hz;
  osc.start(t);
  osc.stop(t + eachMs / 1000 + 0.05);
}

export const AudioFX = {
  toneSlide,
  beepSeries,
  doubleBeep,
  tickPair,
  hornSoft
};
