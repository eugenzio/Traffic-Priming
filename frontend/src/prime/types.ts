/**
 * Prime Effect Types
 * Defines the psychological/behavioral effects we expect from each prime
 */

export type PrimeEffect = 'bias_turn_up' | 'bias_wait_up' | 'neutral';
export type PrimeModality = 'visual' | 'audio' | 'audiovisual';

export interface Prime {
  id: string;
  label: string;
  modality: PrimeModality;
  onsetMs: number;     // delay before start
  durationMs: number;  // total active window
  payload: Record<string, any>; // visual/audio params
  expectedEffect: PrimeEffect;
}
