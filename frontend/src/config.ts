export const CONFIG = {
  PRIME_DURATION_SEC: 6, // visual-only experiment: 6s per prime
  TTC_THRESHOLD_SEC: 1.5,
  API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:5174',
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 450,
  TOTAL_TRIALS: 21, // 7 blocks × 3 trials each
  EXPERIMENT_DURATION_MIN: 3.5 // estimated total time
} as const;

// PRIME_COPY map for improved visibility and layout
export const PRIME_COPY = {
  PEDESTRIAN_FIRST: { 
    title: 'Pedestrians First', 
    bullets: ['If anyone is in the crosswalk, wait.', 'Turn only after the crosswalk is clear.'] 
  },
  PROTECTED_ARROW: { 
    title: 'Protected Green Arrow', 
    bullets: ['Green arrow means a protected left.', 'Go if crosswalk is clear.'] 
  },
  GAP_RISK: { 
    title: 'Oncoming Risk (Gap)', 
    bullets: ['If the oncoming car is close (<3 s), wait.', 'Turn with a safe gap only.'] 
  },
  YELLOW_FLASH: { 
    title: 'Yellow Flash (Unprotected)', 
    bullets: ['Yield to oncoming traffic and pedestrians.', 'Turn only with a safe gap.'] 
  }
} as const;
