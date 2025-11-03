/**
 * Prime Definitions
 * Six experimental primes + control condition
 */

import type { Prime } from './types';

export const PRIMES: Prime[] = [
  {
    id: 'go_arrow',
    label: 'Go-Arrow Prime',
    modality: 'audiovisual',
    onsetMs: 150,
    durationMs: 800,
    expectedEffect: 'bias_turn_up',
    payload: {
      visual: { type: 'signalGlow', lens: 'leftArrow', color: '#34d399', pulse: { cycles: 1, depth: 0.16 } },
      audio:  { type: 'toneSlide', startHz: 600, endHz: 900, durMs: 450, gain: 0.16 }
    }
  },
  {
    id: 'caution_amber',
    label: 'Caution-Amber Prime',
    modality: 'audiovisual',
    onsetMs: 150,
    durationMs: 600,
    expectedEffect: 'bias_wait_up',
    payload: {
      visual: { type: 'lensFlash', lens: 'amber', color: '#fbbf24', peak: 0.6, durMs: 500 },
      audio:  { type: 'toneSlide', startHz: 900, endHz: 600, durMs: 350, gain: 0.14 }
    }
  },
  {
    id: 'ped_salience',
    label: 'Pedestrian-Salience Prime',
    modality: 'audiovisual',
    onsetMs: 200,
    durationMs: 700,
    expectedEffect: 'bias_wait_up',
    payload: {
      visual: { type: 'pedBlink', crosswalk: 'active', blinks: 2, eachMs: 250 },
      audio:  { type: 'beepSeries', hz: 750, count: 2, eachMs: 80, gapMs: 120, gain: 0.12 }
    }
  },
  {
    id: 'oncoming_speed',
    label: 'Oncoming-Speed Prime',
    modality: 'audiovisual',
    onsetMs: 150,
    durationMs: 800,
    expectedEffect: 'bias_wait_up',
    payload: {
      visual: { type: 'chevronShimmer', near: 'oncoming', px: 8, loopMs: 1200 },
      audio:  { type: 'doubleBeep', hz: 650, eachMs: 90, gapMs: 150, gain: 0.12 }
    }
  },
  {
    id: 'time_pressure',
    label: 'Time-Pressure Prime',
    modality: 'audiovisual',
    onsetMs: 100,
    durationMs: 900,
    expectedEffect: 'bias_turn_up',
    payload: {
      visual: { type: 'egoProgressRing', shrinkMs: 900, width: 3 },
      audio:  { type: 'tickPair', hz: 500, eachMs: 70, gapMs: 300, gain: 0.10 }
    }
  },
  {
    id: 'social_norm',
    label: 'Social-Norm Nudge',
    modality: 'audiovisual',
    onsetMs: 180,
    durationMs: 400,
    expectedEffect: 'bias_turn_up',
    payload: {
      visual: { type: 'rearGlow', durMs: 400, alpha: 0.25 },
      audio:  { type: 'hornSoft', eachMs: 120, gain: 0.12 }
    }
  }
];

export const CONTROL_PRIME: Prime = {
  id: 'control_none',
  label: 'No Prime',
  modality: 'visual',
  onsetMs: 0,
  durationMs: 0,
  expectedEffect: 'neutral',
  payload: {}
};
