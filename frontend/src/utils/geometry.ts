/**
 * Geometry utilities for intersection and collision detection
 */

export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Check if two axis-aligned bounding boxes (AABBs) intersect.
 * @param a First bounding box
 * @param b Second bounding box
 * @returns true if the boxes overlap, false otherwise
 */
export function aabbIntersects(a: AABB, b: AABB): boolean {
  return !(
    a.x + a.w < b.x ||  // a is left of b
    b.x + b.w < a.x ||  // b is left of a
    a.y + a.h < b.y ||  // a is above b
    b.y + b.h < a.y     // b is above a
  );
}
