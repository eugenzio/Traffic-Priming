/**
 * Trial Deck Generator with Block Design
 *
 * Block Rule:
 * - First 3 trials: control_none (no prime)
 * - Remaining trials: chunked into blocks of 3
 * - Each priming block gets one prime (rotating through 6 primes)
 */

import { PRIMES, CONTROL_PRIME } from '../prime/primes';
import type { Prime } from '../prime/types';
import type { Trial } from '../types';

export function augmentTrialsWithPrimeDesign(trials: Trial[]): Trial[] {
  const total = trials.length;

  // First 3 trials: control
  for (let i = 0; i < Math.min(3, total); i++) {
    trials[i].is_primed = false;
    trials[i].prime_id = CONTROL_PRIME.id;
    trials[i].prime_block_index = null;
    trials[i].condition_label = 'No prime';
  }

  // Remaining trials: priming blocks of 3
  const primeStart = 3;
  let primingBlockCounter = 0;

  for (let i = primeStart; i < total; i += 3) {
    const blockPrime = PRIMES[primingBlockCounter % PRIMES.length];

    // Assign to block (up to 3 trials)
    for (let j = i; j < Math.min(i + 3, total); j++) {
      trials[j].is_primed = true;
      trials[j].prime_id = blockPrime.id;
      trials[j].prime_block_index = primingBlockCounter;
      trials[j].condition_label = 'Priming';
    }

    primingBlockCounter++;
  }

  return trials;
}

/**
 * Validate the prime design
 */
export function validatePrimeDesign(trials: Trial[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const total = trials.length;

  // Check first 3 are control
  for (let i = 0; i < Math.min(3, total); i++) {
    if (trials[i].is_primed !== false) {
      errors.push(`Trial ${i}: Expected is_primed=false, got ${trials[i].is_primed}`);
    }
    if (trials[i].prime_id !== CONTROL_PRIME.id) {
      errors.push(`Trial ${i}: Expected prime_id='control_none', got '${trials[i].prime_id}'`);
    }
  }

  // Check priming blocks
  if (total > 3) {
    let currentPrimeId: string | undefined;
    let blockSize = 0;

    for (let i = 3; i < total; i++) {
      const trial = trials[i];

      if (!trial.is_primed) {
        errors.push(`Trial ${i}: Expected is_primed=true in priming section`);
      }

      if (trial.prime_id === CONTROL_PRIME.id) {
        errors.push(`Trial ${i}: Should not use control_none in priming section`);
      }

      // Check block consistency
      if (currentPrimeId === undefined) {
        currentPrimeId = trial.prime_id;
        blockSize = 1;
      } else if (trial.prime_id === currentPrimeId) {
        blockSize++;
        if (blockSize > 3) {
          errors.push(`Trial ${i}: Block size exceeds 3 for prime '${currentPrimeId}'`);
        }
      } else {
        // New block starts
        currentPrimeId = trial.prime_id;
        blockSize = 1;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get summary stats for debugging
 */
export function getPrimeDesignSummary(trials: Trial[]): {
  total: number;
  controlCount: number;
  primedCount: number;
  primeRotation: string[];
  blockSizes: number[];
} {
  const controlCount = trials.filter(t => !t.is_primed).length;
  const primedCount = trials.filter(t => t.is_primed).length;

  const primeRotation: string[] = [];
  const blockSizes: number[] = [];
  let currentPrimeId: string | undefined;
  let blockSize = 0;

  for (let i = 3; i < trials.length; i++) {
    const trial = trials[i];

    if (currentPrimeId === undefined) {
      currentPrimeId = trial.prime_id;
      blockSize = 1;
      primeRotation.push(trial.prime_id || 'unknown');
    } else if (trial.prime_id === currentPrimeId) {
      blockSize++;
    } else {
      blockSizes.push(blockSize);
      currentPrimeId = trial.prime_id;
      blockSize = 1;
      primeRotation.push(trial.prime_id || 'unknown');
    }
  }

  if (blockSize > 0) {
    blockSizes.push(blockSize);
  }

  return {
    total: trials.length,
    controlCount,
    primedCount,
    primeRotation,
    blockSizes
  };
}

/**
 * Get the Prime object for a given trial
 */
export function getPrimeForTrial(t: Trial): Prime {
  return (t.prime_id && t.prime_id !== 'control_none')
    ? PRIMES.find(p => p.id === t.prime_id) ?? CONTROL_PRIME
    : CONTROL_PRIME;
}

/**
 * Generate 3 practice trials with clear correct answers
 * Practice trials should cover key decision factors:
 * 1. Obvious WAIT: Red signal + pedestrian
 * 2. Obvious TURN: Green arrow + high TTC + no pedestrian
 * 3. Borderline: Yellow flash + moderate TTC
 */
export function generatePracticeTrials(): Trial[] {
  return [
    {
      scene_id: 'practice_1_wait',
      signal: 'RED',
      oncoming_car_ttc: 2.0,
      pedestrian: 'CROSSING',
      pedestrian_crosswalk: 'south', // blocks turn path
      correct: 'wait',
      is_primed: false,
      prime_id: CONTROL_PRIME.id,
      prime_block_index: null,
      condition_label: 'No prime'
    },
    {
      scene_id: 'practice_2_turn',
      signal: 'GREEN_ARROW',
      oncoming_car_ttc: 6.5,
      pedestrian: 'NONE',
      correct: 'turn_left',
      is_primed: false,
      prime_id: CONTROL_PRIME.id,
      prime_block_index: null,
      condition_label: 'No prime'
    },
    {
      scene_id: 'practice_3_wait',
      signal: 'YELLOW_FLASH',
      oncoming_car_ttc: 2.5,
      pedestrian: 'NONE',
      correct: 'wait',
      is_primed: false,
      prime_id: CONTROL_PRIME.id,
      prime_block_index: null,
      condition_label: 'No prime'
    }
  ];
}

/**
 * Generate attention check trials with obvious correct answers
 * These are inserted throughout the experiment to detect inattentive participants
 *
 * Attention checks:
 * 1. NO_LEFT_TURN sign + pedestrian crossing = must wait
 * 2. GREEN_ARROW + no traffic + no pedestrian = must turn
 * 3. RED signal + very low TTC = must wait
 */
export function generateAttentionChecks(): Trial[] {
  return [
    {
      scene_id: 'attention_check_1',
      signal: 'NO_LEFT_TURN',
      oncoming_car_ttc: 8.0,
      pedestrian: 'CROSSING',
      pedestrian_crosswalk: 'south',
      correct: 'wait',
      is_primed: false,
      prime_id: CONTROL_PRIME.id,
      prime_block_index: null,
      condition_label: 'No prime'
    },
    {
      scene_id: 'attention_check_2',
      signal: 'GREEN_ARROW',
      oncoming_car_ttc: 8.0,
      pedestrian: 'NONE',
      correct: 'turn_left',
      is_primed: false,
      prime_id: CONTROL_PRIME.id,
      prime_block_index: null,
      condition_label: 'No prime'
    },
    {
      scene_id: 'attention_check_3',
      signal: 'RED',
      oncoming_car_ttc: 1.5,
      pedestrian: 'CROSSING',
      pedestrian_crosswalk: 'south',
      correct: 'wait',
      is_primed: false,
      prime_id: CONTROL_PRIME.id,
      prime_block_index: null,
      condition_label: 'No prime'
    }
  ];
}

/**
 * Insert attention checks at strategic positions in the trial sequence
 * Inserts one check roughly every 6-8 trials
 *
 * @param trials - Original trial sequence
 * @returns New sequence with attention checks inserted
 */
export function insertAttentionChecks(trials: Trial[]): Trial[] {
  const attentionChecks = generateAttentionChecks();
  const result: Trial[] = [];

  // Insert positions: roughly every 6-8 trials
  // For a 24-trial experiment: positions 6, 14, 22
  const insertPositions = [6, 14, 22];

  let checkIdx = 0;
  let insertIdx = 0;

  for (let i = 0; i < trials.length; i++) {
    // Check if we should insert an attention check at this position
    if (insertIdx < insertPositions.length && i === insertPositions[insertIdx]) {
      if (checkIdx < attentionChecks.length) {
        result.push(attentionChecks[checkIdx]);
        checkIdx++;
        insertIdx++;
      }
    }

    result.push(trials[i]);
  }

  return result;
}

/**
 * Check if a trial is an attention check
 */
export function isAttentionCheck(trial: Trial): boolean {
  return trial.scene_id.startsWith('attention_check_');
}

/**
 * Validate attention check performance
 * Returns true if participant passed enough attention checks
 *
 * @param logs - All trial logs
 * @param minimumPassRate - Minimum pass rate (default 0.67 = 2 out of 3)
 */
export function validateAttentionChecks(
  logs: Array<{ scene_id: string; correct: 0 | 1 }>,
  minimumPassRate: number = 0.67
): {
  passed: boolean;
  totalChecks: number;
  correctChecks: number;
  passRate: number;
} {
  const attentionCheckLogs = logs.filter(log =>
    log.scene_id.startsWith('attention_check_')
  );

  const totalChecks = attentionCheckLogs.length;
  const correctChecks = attentionCheckLogs.filter(log => log.correct === 1).length;
  const passRate = totalChecks > 0 ? correctChecks / totalChecks : 1;

  return {
    passed: passRate >= minimumPassRate,
    totalChecks,
    correctChecks,
    passRate
  };
}
