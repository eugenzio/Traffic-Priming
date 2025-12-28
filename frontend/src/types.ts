export type Signal = 'GREEN_ARROW' | 'RED' | 'NO_LEFT_TURN' | 'YELLOW_FLASH';
export type Pedestrian = 'NONE' | 'CROSSING';
export type Choice = 'turn_left' | 'wait';
export type PrimeType = 
  | 'NEUTRAL'
  | 'VISUAL_SCHEMA'
  | 'VISUAL_PEDESTRIAN'
  | 'VISUAL_TTC'
  | 'VISUAL_SIGNAL'
  | 'VISUAL_SPOTLIGHT'
  | 'VISUAL_NORM'
  | 'VISUAL_SAFETY'
  | 'VISUAL_RISK'
  | 'AUDITORY_SAFETY'
  | 'AUDITORY_RISK'
  | 'SOCIAL_NORM'
  | 'POSITIVE_FRAME';

export type CountyGA =
  | 'Fulton County'
  | 'Gwinnett County'
  | 'Cobb County'
  | 'DeKalb County'
  | 'Chatham County'
  | 'Clayton County'
  | 'Cherokee County'
  | 'Forsyth County'
  | 'Henry County'
  | 'Hall County'
  | 'Fayette County'
  | 'Outside of Georgia';

export interface Trial {
  scene_id: string;
  signal: Signal;
  oncoming_car_ttc: number; // seconds
  pedestrian: Pedestrian;
  /**
   * NEW: restrict where pedestrians can appear.
   * Only 'north' (top) or 'south' (bottom) are valid.
   * - 'south' = blocks left turn (pedestrian in turn path)
   * - 'north' = does NOT block left turn (far side)
   */
  pedestrian_crosswalk?: 'north' | 'south';
  /**
   * LEGACY (backward compatibility): may still exist in older data.
   * Will be mapped to north/south in code.
   */
  pedestrian_side?: 'left' | 'right';
  pedestrian_direction?: 'west' | 'east' | 'north' | 'south';
  correct: Choice; // computed helper, also computed server-side
  // Prime experiment fields
  is_primed?: boolean;
  prime_id?: string;
  prime_block_index?: number | null;
  condition_label?: 'No prime' | 'Priming';
}

export interface TrialBlock { 
  prime_type: PrimeType; 
  trials: Trial[] 
}

export interface Participant {
  participant_id: string;
  age: number; // REQUIRED
  gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'; // REQUIRED
  drivers_license: boolean;
  learners_permit: boolean;
  region_ga: 'Metro Atlanta' | 'North Georgia' | 'Middle Georgia' | 'South Georgia' | 'Coastal Georgia' | 'Outside of Georgia';
  county_ga: CountyGA; // REQUIRED
  priming_group?: 'A' | 'B' | 'C'; // Between-subjects group assignment
  // Driving experience (for research analysis)
  years_driving?: number;
  weekly_driving_hours?: number;
  accident_count_5years?: number;
}

export interface LogRow {
  participant_id: string;
  age: number;
  gender: string;
  drivers_license: boolean;
  learners_permit: boolean;
  region_ga: string;
  county_ga: CountyGA;
  priming_group?: 'A' | 'B' | 'C'; // Between-subjects group assignment
  block_idx: number;
  prime_type: PrimeType;
  trial_idx: number;
  scene_id: string;
  signal: Signal;
  oncoming_car_ttc: number;
  pedestrian: Pedestrian;
  choice: Choice;
  correct: 0 | 1;
  rt_ms: number;
  displayed_at_ms: number;
  responded_at_ms: number;
  focus_lost: 0 | 1;
  seed: number;
  created_at: string;
  // Prime experiment fields
  prime_condition?: 'No prime' | 'Priming';
  prime_id?: string;
  prime_block_index?: number | null;
  is_primed?: boolean;
  // Research analysis fields
  error_type?: 'conservative_error' | 'risky_error' | 'correct_go' | 'correct_nogo';
  trial_number_global?: number;
  trials_since_priming?: number;
  time_since_priming_ms?: number;
  previous_trial_correct?: 0 | 1;
  browser?: string;
  os?: string;
  device_type?: 'desktop' | 'tablet' | 'mobile';
}

export interface ExperimentState {
  phase: 'start' | 'guide' | 'practice' | 'prime' | 'trial' | 'done';
  currentBlock: number;
  currentTrial: number;
  currentPractice: number; // Track which practice trial (0-2)
  logs: Omit<LogRow, 'created_at'>[];
}
