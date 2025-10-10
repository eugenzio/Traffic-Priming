export const CONFIG = {
  PRIME_DURATION_SEC: 6, // visual-only experiment: 6s per prime
  TTC_THRESHOLD_SEC: 1.5,
  API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:5174',
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 450,
  TOTAL_TRIALS: 21, // 7 blocks × 3 trials each
  EXPERIMENT_DURATION_MIN: 3.5 // estimated total time
} as const;
