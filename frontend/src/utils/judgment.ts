import { CONFIG } from '../config'
import type { Trial, Choice, Signal, Pedestrian } from '../types'

export function judgeCorrect(trial: Trial): Choice {
  const { signal, oncoming_car_ttc, pedestrian } = trial

  // Rule 1: Red or "No Left Turn" signal → Not allowed
  if (signal === 'RED' || signal === 'NO_LEFT_TURN') {
    return 'wait'
  }

  // Rule 2: Oncoming car TTC < threshold → Not allowed
  if (oncoming_car_ttc < CONFIG.TTC_THRESHOLD_SEC) {
    return 'wait'
  }

  // Rule 3: Pedestrian crossing → Not allowed
  if (pedestrian === 'CROSSING') {
    return 'wait'
  }

  // Rule 4: Yellow flashing depends on other conditions
  if (signal === 'YELLOW_FLASH') {
    // If TTC is safe and no pedestrian, then allowed
    if (oncoming_car_ttc >= CONFIG.TTC_THRESHOLD_SEC && pedestrian === 'NONE') {
      return 'turn_left'
    } else {
      return 'wait'
    }
  }

  // Rule 5: Green arrow with safe conditions → Allowed
  if (signal === 'GREEN_ARROW') {
    return 'turn_left'
  }

  // Default: not allowed (conservative approach)
  return 'wait'
}

export function getSignalDescription(signal: Signal): string {
  switch (signal) {
    case 'GREEN_ARROW': return 'Green Arrow'
    case 'RED': return 'Red Light'
    case 'NO_LEFT_TURN': return 'No Left Turn Sign'
    case 'YELLOW_FLASH': return 'Yellow Flashing'
    default: return 'Unknown Signal'
  }
}

export function getPedestrianDescription(pedestrian: Pedestrian): string {
  switch (pedestrian) {
    case 'NONE': return 'No Pedestrian'
    case 'CROSSING': return 'Pedestrian Crossing'
    default: return 'Unknown'
  }
}
