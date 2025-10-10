// Visual-only prime copy for 6-second primes
export type PrimeCopy = { 
  title: string; 
  subtitle?: string; 
  bullets?: string[] 
};

export function getVisualPrimeCopy(prime: string): PrimeCopy {
  switch (prime) {
    case 'VISUAL_SCHEMA':
      return {
        title: 'Left Turn Allowed = 3 Checks',
        subtitle: 'Safe drivers verify all three conditions before turning.',
        bullets: [
          'Green arrow',
          'Clear crosswalk',
          'Safe oncoming gap (≥ 1.5 s)'
        ],
      };
    
    case 'VISUAL_PEDESTRIAN':
      return { 
        title: 'Pedestrians First', 
        subtitle: 'Crossing pedestrians → Wait.',
        bullets: [
          'If pedestrians are crossing, wait.',
          'Clear the crosswalk before turning.'
        ]
      };
    
    case 'VISUAL_TTC':
      return { 
        title: 'Judge the Gap',
        subtitle: 'Time-to-collision (TTC) determines safety.',
        bullets: [
          'TTC < 1.5 s → Do NOT turn',
          'Short gaps are dangerous.'
        ]
      };
    
    case 'VISUAL_SIGNAL':
      return { 
        title: 'Red / No Left Turn = WAIT',
        subtitle: 'Never turn on red or no-left-turn signals.',
        bullets: [
          'Red means WAIT.',
          'No Left Turn means WAIT.'
        ]
      };
    
    case 'VISUAL_SPOTLIGHT':
      return { 
        title: 'Clear the Crosswalk First',
        subtitle: 'Check for pedestrians before turning.',
        bullets: [
          'Look for pedestrians in the crosswalk.',
          'Wait until the path is clear.'
        ]
      };
    
    case 'VISUAL_NORM':
      return { 
        title: 'Most drivers wait', 
        subtitle: 'When unsure, wait.',
        bullets: [
          'Follow the safe norm.',
          'If in doubt, do not turn.'
        ]
      };
    
    case 'NEUTRAL':
    default:
      return { title: '' };
  }
}

