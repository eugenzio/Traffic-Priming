/**
 * Decision logic for left-turn maneuvers
 */

import type { Trial } from '../types';
import { CONFIG } from '../config';
import { aabbIntersects, type AABB } from './geometry';

/**
 * Define the left-turn corridor (simplified AABB)
 * This represents the path the ego vehicle would sweep through when turning left.
 * Origin: intersection center, approaching from west (left side of screen)
 *
 * Rough geometry:
 * - Starts in west lane (left approach)
 * - Sweeps through intersection center
 * - Ends in north lane (upward exit)
 */
export function leftTurnCorridor(
  intersectionCenterX: number,
  intersectionCenterY: number,
  roadWidth: number
): AABB {
  const halfRoad = roadWidth / 2;

  // The turn corridor spans from the west approach through the center to the north exit
  // A simple bounding box covering the turn path:
  return {
    x: intersectionCenterX - roadWidth * 0.7,  // Extend into west approach
    y: intersectionCenterY - roadWidth * 0.7,  // Extend into north exit
    w: roadWidth * 0.7,                         // Width of turn path
    h: roadWidth * 0.7                          // Height of turn path
  };
}

/**
 * Get pedestrian bounding box based on crosswalk location
 */
export function getPedestrianBounds(
  crosswalkId: string,
  intersectionCenterX: number,
  intersectionCenterY: number,
  roadWidth: number,
  crosswalkWidth: number = 60,
  crosswalkHeight: number = 12
): AABB {
  const halfRoad = roadWidth / 2;

  switch (crosswalkId) {
    case 'north':
      return {
        x: intersectionCenterX - crosswalkWidth / 2,
        y: intersectionCenterY - halfRoad - crosswalkHeight / 2,
        w: crosswalkWidth,
        h: crosswalkHeight
      };
    case 'south':
      return {
        x: intersectionCenterX - crosswalkWidth / 2,
        y: intersectionCenterY + halfRoad - crosswalkHeight / 2,
        w: crosswalkWidth,
        h: crosswalkHeight
      };
    case 'east':
      return {
        x: intersectionCenterX + halfRoad - crosswalkHeight / 2,
        y: intersectionCenterY - crosswalkWidth / 2,
        w: crosswalkHeight,
        h: crosswalkWidth
      };
    case 'west':
      return {
        x: intersectionCenterX - halfRoad - crosswalkHeight / 2,
        y: intersectionCenterY - crosswalkWidth / 2,
        w: crosswalkHeight,
        h: crosswalkWidth
      };
    default:
      // Fallback to north
      return {
        x: intersectionCenterX - crosswalkWidth / 2,
        y: intersectionCenterY - halfRoad - crosswalkHeight / 2,
        w: crosswalkWidth,
        h: crosswalkHeight
      };
  }
}

/**
 * Check if pedestrian blocks the left turn based on spatial intersection
 */
export function isPedBlockingLeftTurn(
  trial: Trial,
  intersectionCenterX: number,
  intersectionCenterY: number,
  roadWidth: number
): boolean {
  // No pedestrian present
  if (trial.pedestrian !== 'CROSSING') {
    return false;
  }

  // Determine which crosswalk the pedestrian is on
  let crosswalkId = 'east';  // default (safe - doesn't block)

  if (trial.pedestrian_side === 'left') {
    crosswalkId = 'west';
  } else if (trial.pedestrian_side === 'right') {
    crosswalkId = 'east';
  }

  // Get the turn corridor and pedestrian bounds
  const turnPath = leftTurnCorridor(intersectionCenterX, intersectionCenterY, roadWidth);
  const pedBounds = getPedestrianBounds(crosswalkId, intersectionCenterX, intersectionCenterY, roadWidth);

  // Check if pedestrian intersects with turn path
  return aabbIntersects(turnPath, pedBounds);
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
  // Rule 1: GREEN_ARROW always allows turn regardless of pedestrians or oncoming traffic
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
  if (isPedBlockingLeftTurn(trial, intersectionCenterX, intersectionCenterY, roadWidth)) {
    return false;
  }

  // All clear - safe to turn
  return true;
}
