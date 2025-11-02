/**
 * Decision logic for left-turn maneuvers with north/south pedestrian crosswalks
 */

import type { Trial } from '../types';
import { CONFIG } from '../config';
import { aabbIntersects, type AABB } from './geometry';

/**
 * Approximate the WEST->SOUTH left-turn sweep (southwest quadrant).
 * This represents the path the ego vehicle sweeps through when turning left.
 */
function leftTurnCorridor(
  intersectionCenterX: number,
  intersectionCenterY: number,
  roadWidth: number
): AABB {
  const halfRoad = roadWidth / 2;

  // The turn corridor spans the southwest quadrant
  return {
    x: intersectionCenterX - halfRoad,
    y: intersectionCenterY,
    w: halfRoad,
    h: halfRoad
  };
}

/**
 * Get crosswalk bounding box for north or south crosswalk
 */
function crosswalkRect(
  intersectionCenterX: number,
  intersectionCenterY: number,
  roadWidth: number,
  crosswalkId: 'north' | 'south',
  crosswalkWidth: number = 60,
  crosswalkHeight: number = 12
): AABB {
  const halfRoad = roadWidth / 2;

  if (crosswalkId === 'north') {
    return {
      x: intersectionCenterX - crosswalkWidth / 2,
      y: intersectionCenterY - halfRoad - crosswalkHeight / 2,
      w: crosswalkWidth,
      h: crosswalkHeight
    };
  } else {
    // south
    return {
      x: intersectionCenterX - crosswalkWidth / 2,
      y: intersectionCenterY + halfRoad - crosswalkHeight / 2,
      w: crosswalkWidth,
      h: crosswalkHeight
    };
  }
}

/**
 * Check if a pedestrian on the given crosswalk blocks the left turn.
 * Only south crosswalk intersects the turn corridor.
 */
function pedBlocksLeftTurn(
  intersectionCenterX: number,
  intersectionCenterY: number,
  roadWidth: number,
  crosswalkId: 'north' | 'south'
): boolean {
  const turnPath = leftTurnCorridor(intersectionCenterX, intersectionCenterY, roadWidth);
  const cwRect = crosswalkRect(intersectionCenterX, intersectionCenterY, roadWidth, crosswalkId);

  return aabbIntersects(turnPath, cwRect);
}

/**
 * Map legacy fields to north/south.
 * This duplicates the logic in CanvasRenderer for consistency.
 */
function getPedestrianCrosswalkId(trial: Trial): 'north' | 'south' {
  // 1) Explicit new field wins
  if (trial.pedestrian_crosswalk === 'north' || trial.pedestrian_crosswalk === 'south') {
    return trial.pedestrian_crosswalk;
  }

  // 2) Back-compat mappings
  if (trial.pedestrian_side === 'right') return 'north';
  if (trial.pedestrian_side === 'left') return 'south';

  if (trial.pedestrian_direction === 'east') return 'north';
  if (trial.pedestrian_direction === 'west') return 'south';
  if (trial.pedestrian_direction === 'south' || trial.pedestrian_direction === 'north') {
    return trial.pedestrian_direction;
  }

  // 3) Default to far side (non-blocking)
  return 'north';
}

/**
 * Main decision function: Can the ego vehicle turn left now?
 */
export function canLeftTurnNow(
  trial: Trial,
  intersectionCenterX: number,
  intersectionCenterY: number,
  roadWidth: number
): boolean {
  // Rule 1: GREEN_ARROW always allows turn (protected turn)
  if (trial.signal === 'GREEN_ARROW') {
    return true;
  }

  // Rule 2: NO_LEFT_TURN never allows turn
  if (trial.signal === 'NO_LEFT_TURN') {
    return false;
  }

  // Rule 3: RED signal blocks turn
  if (trial.signal === 'RED') {
    return false;
  }

  // Rule 4: Check oncoming car TTC
  if (trial.oncoming_car_ttc < CONFIG.TTC_THRESHOLD_SEC) {
    return false;
  }

  // Rule 5: Check pedestrian spatial conflict
  // Only block if pedestrian is CROSSING and on a crosswalk that intersects turn path
  if (trial.pedestrian === 'CROSSING') {
    const crosswalkId = getPedestrianCrosswalkId(trial);
    if (pedBlocksLeftTurn(intersectionCenterX, intersectionCenterY, roadWidth, crosswalkId)) {
      return false;
    }
  }

  // All clear - safe to turn
  return true;
}
