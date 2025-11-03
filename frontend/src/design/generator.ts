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
