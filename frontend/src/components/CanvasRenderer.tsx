import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config'
import type { Trial } from '../types'

// --- Car sprite (primary URL + fallback) ---
// Use remote PNG; keep base64 as fallback
const CAR_SPRITE_URL =
  'https://static.vecteezy.com/system/resources/thumbnails/025/310/861/small/white-suv-on-transparent-background-3d-rendering-illustration-free-png.png';

// Take the long base64 string you currently set in image.src and place it here:
const FALLBACK_CAR_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGcSURBVGhD7dnBSsJAGEDx/6T1EqSP0IMIWvVSiCIILPaiizZ6Ed3qYfQiuu3LSAgiKAjio/+wM4uM2U0SY8EZiJ9/uFs2ASkppRQtYApYAn5bB8yBERgEFoFz4AwYBbbAhbAGXAILQBlYAx6BRWAX2AFnwApwCQyC+QJ/BYY9wBgYiVYBuyAXXATugbXgE/AZGAn3gC/gDjgBDgGfQBVYBWbBHfAZ2AUuAd+AY2BVaAGWwClwCRwCb4ElYG/dAmPAXfAVWAUWgYXgEjgEpgFvQLcO2AT2gsvgE7gElgGvwEbwCjgD2gWmgQ3gE/AamAXuAnuBRWAWeAV+A1eBfWAeWAWuAYPABLAF/ApqgTdgFrgC/ApogVfgBbgF/ApogVbgF/ApqAWPwC/wW6AFjsAv8FugBRbAL/BbYANmwC/wW2AD9sAv8FtgA3bAL/BbYAP+wC/wW2ADfsAv8FtgA3bAL/BbYAP2wC/wW2AD5sAv8FvQAk/gB3gt0AJH4Ad4LdACi+AHeC3QAj/gh3gt0AJ/4Id4LdACP+AHeC1eAHzf9z0/ABzpA1h0tN0ZKaWU/vIDbbwNMvP8MzoAAAAASUVORK5CYII=';

let CAR_IMG_CACHE: HTMLImageElement | null = null;

async function fetchCarImage(): Promise<HTMLImageElement> {
  if (CAR_IMG_CACHE) return CAR_IMG_CACHE;

  // Try remote CDN first
  const img = new Image();
  // Avoid referer-based 403s; do NOT set crossOrigin to keep canvas unblocked if CDN lacks CORS
  img.referrerPolicy = 'no-referrer';
  // img.crossOrigin = 'anonymous'; // leave commented unless CDN sends ACAO
  console.info('[CAR] sprite path:', CAR_SPRITE_URL);
  const tryLoad = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
  img.src = CAR_SPRITE_URL;

  try {
    const ok = await tryLoad;
    console.info('[CAR] sprite loaded', ok.width, ok.height);
    CAR_IMG_CACHE = ok;
    return ok;
  } catch {
    // Fallback to embedded base64 (always works)
    const fb = new Image();
    const fbLoad = new Promise<HTMLImageElement>((resolve) => {
      fb.onload = () => resolve(fb);
      fb.onerror = () => resolve(fb);
    });
    fb.src = FALLBACK_CAR_BASE64;
    const ok = await fbLoad;
    console.warn('[CAR] fallback sprite in use');
    CAR_IMG_CACHE = ok;
    return ok;
  }
}

type Bounds = { x: number; y: number; w: number; h: number };

// === NEW INTERSECTION LAYOUT TYPES ===
interface LaneGeometry {
  name: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'
  centerLine: { x: number; y: number }
  width: number
  startPoint: { x: number; y: number }
  endPoint: { x: number; y: number }
  direction: 'horizontal' | 'vertical'
  bounds: { x: number; y: number; width: number; height: number }
}

interface CrosswalkRegion {
  id: string
  centerX: number
  centerY: number
  width: number
  height: number
  angle: number
  bounds: { x: number; y: number; width: number; height: number }
}

interface IntersectionLayout {
  centerX: number
  centerY: number
  roadWidth: number
  laneWidth: number
  lanes: Map<string, LaneGeometry>
  crosswalks: CrosswalkRegion[]
  bounds: Bounds
  grassBounds: { x: number; y: number; width: number; height: number }[]
}

interface VehiclePosition {
  laneId: string
  distanceAlongLane: number
  x: number
  y: number
  urgency: number
  angle: number
}

interface PedestrianState {
  isOnCrosswalk: boolean
  crosswalkId: string
  progress: number // 0-1 progress along crossing
  x: number
  y: number
}

interface CanvasRendererProps {
  trial: Trial
  width?: number
  height?: number
  safeBounds?: Bounds
}

// === CAR IMAGE ORIENTATION ===
// The white sedan PNG faces EAST (right) at rest.
const CAR_IMAGE_ORIENTATION = 0;

// === EDGE BLEED ===
const EDGE_BLEED = 2; // px – draw roads past the canvas edge

function normalizeAngle(a: number) {
  while (a <= -Math.PI) a += Math.PI * 2;
  while (a >  Math.PI) a -= Math.PI * 2;
  return a;
}

// Convert a math heading (CCW+) to the Canvas 2D rotation (CW+).
// Canvas 2D uses clockwise-positive rotation, but our "angle" is in math coords (CCW positive).
// To convert: canvas_rotation = -(targetAngle - spriteBase)
function canvasRotationFromHeading(targetAngle: number, spriteBase: number) {
  return -normalizeAngle(targetAngle - spriteBase);
}

// === INTERSECTION CONFIGURATION ===
const INTERSECTION_CONFIG = {
  ROAD_WIDTH_RATIO: 0.3,      // Road width as % of canvas (reduced for grass areas)
  LANE_COUNT: 2,              // Lanes per direction
  VEHICLE_LENGTH: 72,         // NEW (length)
  VEHICLE_WIDTH: 36,          // NEW (width)
  PEDESTRIAN_RADIUS: 8,
  CROSSWALK_WIDTH: 60,        // Reduced crosswalk width
  CROSSWALK_HEIGHT: 12,       // Reduced crosswalk height
  TTC_MAX: 5,
  TTC_MIN: 0.5,
  URGENCY_THRESHOLD: 0.5,
  GRASS_MARGIN: 0.15,         // Increased grass area around roads
  LANE_EXTENSION: 50          // How far lanes extend beyond intersection
} as const;

const LANE_CONFIG = {
  NORTH: { direction: 'south' as const, zIndex: 2, color: '#ddd' },
  SOUTH: { direction: 'north' as const, zIndex: 1, color: '#ddd' },
  EAST: { direction: 'west' as const, zIndex: 3, color: '#ddd' },
  WEST: { direction: 'east' as const, zIndex: 1, color: '#aaa' }
} as const;

// === LAYOUT UTILITY FUNCTIONS ===

/**
 * Initialize intersection layout with proper lane geometry
 */
function initializeIntersectionLayout(canvasWidth: number, canvasHeight: number, safeBounds: Bounds): IntersectionLayout {
  const centerX = safeBounds.x + safeBounds.w / 2;
  const centerY = safeBounds.y + safeBounds.h / 2;
  const roadWidth = Math.min(safeBounds.w, safeBounds.h) * INTERSECTION_CONFIG.ROAD_WIDTH_RATIO;
  const laneWidth = roadWidth / INTERSECTION_CONFIG.LANE_COUNT;
  
  const lanes = new Map<string, LaneGeometry>();
  
  // Calculate lane geometries
  lanes.set('NORTH', calculateLaneGeometry(centerX, centerY, roadWidth, laneWidth, 'NORTH'));
  lanes.set('SOUTH', calculateLaneGeometry(centerX, centerY, roadWidth, laneWidth, 'SOUTH'));
  lanes.set('EAST', calculateLaneGeometry(centerX, centerY, roadWidth, laneWidth, 'EAST'));
  lanes.set('WEST', calculateLaneGeometry(centerX, centerY, roadWidth, laneWidth, 'WEST'));
  
  // Calculate crosswalks
  const crosswalks = calculateCrosswalkRegions(centerX, centerY, roadWidth, laneWidth);
  
  // Calculate grass areas (4 corners)
  const grassBounds = calculateGrassBounds(centerX, centerY, roadWidth, safeBounds);
  
  return {
    centerX,
    centerY,
    roadWidth,
    laneWidth,
    lanes,
    crosswalks,
    bounds: safeBounds,
    grassBounds
  };
}

/**
 * Calculate geometry for a specific lane
 */
function calculateLaneGeometry(centerX: number, centerY: number, roadWidth: number, laneWidth: number, laneName: string): LaneGeometry {
  const halfRoad = roadWidth / 2;
  const halfLane = laneWidth / 2;
  const extension = INTERSECTION_CONFIG.LANE_EXTENSION; // Reduced from 100 to 50
  
  switch (laneName) {
    case 'NORTH':
      return {
        name: 'NORTH',
        centerLine: { x: centerX, y: centerY - halfRoad },
        width: laneWidth,
        startPoint: { x: centerX, y: centerY - halfRoad - extension },
        endPoint: { x: centerX, y: centerY - halfRoad },
        direction: 'vertical',
        bounds: { x: centerX - halfLane, y: centerY - halfRoad - extension, width: laneWidth, height: extension }
      };
    case 'SOUTH':
      return {
        name: 'SOUTH',
        centerLine: { x: centerX, y: centerY + halfRoad },
        width: laneWidth,
        startPoint: { x: centerX, y: centerY + halfRoad },
        endPoint: { x: centerX, y: centerY + halfRoad + extension },
        direction: 'vertical',
        bounds: { x: centerX - halfLane, y: centerY + halfRoad, width: laneWidth, height: extension }
      };
    case 'EAST':
      return {
        name: 'EAST',
        centerLine: { x: centerX + halfRoad, y: centerY },
        width: laneWidth,
        startPoint: { x: centerX + halfRoad + extension, y: centerY },
        endPoint: { x: centerX + halfRoad, y: centerY },
        direction: 'horizontal',
        bounds: { x: centerX + halfRoad, y: centerY - halfLane, width: extension, height: laneWidth }
      };
    case 'WEST':
      return {
        name: 'WEST',
        centerLine: { x: centerX - halfRoad, y: centerY },
        width: laneWidth,
        startPoint: { x: centerX - halfRoad - extension, y: centerY },
        endPoint: { x: centerX - halfRoad, y: centerY },
        direction: 'horizontal',
        bounds: { x: centerX - halfRoad - extension, y: centerY - halfLane, width: extension, height: laneWidth }
      };
    default:
      throw new Error(`Unknown lane: ${laneName}`);
  }
}

/**
 * Calculate crosswalk regions
 */
function calculateCrosswalkRegions(centerX: number, centerY: number, roadWidth: number, laneWidth: number): CrosswalkRegion[] {
  const halfRoad = roadWidth / 2;
  const crosswalkWidth = INTERSECTION_CONFIG.CROSSWALK_WIDTH;
  const crosswalkHeight = INTERSECTION_CONFIG.CROSSWALK_HEIGHT;
  
  return [
    {
      id: 'north',
      centerX,
      centerY: centerY - halfRoad,
      width: crosswalkWidth,
      height: crosswalkHeight,
      angle: 0,
      bounds: { x: centerX - crosswalkWidth/2, y: centerY - halfRoad - crosswalkHeight/2, width: crosswalkWidth, height: crosswalkHeight }
    },
    {
      id: 'south',
      centerX,
      centerY: centerY + halfRoad,
      width: crosswalkWidth,
      height: crosswalkHeight,
      angle: 0,
      bounds: { x: centerX - crosswalkWidth/2, y: centerY + halfRoad - crosswalkHeight/2, width: crosswalkWidth, height: crosswalkHeight }
    },
    {
      id: 'east',
      centerX: centerX + halfRoad,
      centerY,
      width: crosswalkHeight,
      height: crosswalkWidth,
      angle: 90,
      bounds: { x: centerX + halfRoad - crosswalkHeight/2, y: centerY - crosswalkWidth/2, width: crosswalkHeight, height: crosswalkWidth }
    },
    {
      id: 'west',
      centerX: centerX - halfRoad,
      centerY,
      width: crosswalkHeight,
      height: crosswalkWidth,
      angle: 90,
      bounds: { x: centerX - halfRoad - crosswalkHeight/2, y: centerY - crosswalkWidth/2, width: crosswalkHeight, height: crosswalkWidth }
    }
  ];
}

/**
 * Calculate grass area bounds (4 corners)
 */
function calculateGrassBounds(centerX: number, centerY: number, roadWidth: number, safeBounds: Bounds) {
  const halfRoad = roadWidth / 2;
  const margin = INTERSECTION_CONFIG.GRASS_MARGIN * Math.min(safeBounds.w, safeBounds.h);
  
  return [
    // Top-left corner
    { x: safeBounds.x, y: safeBounds.y, width: centerX - halfRoad - safeBounds.x, height: centerY - halfRoad - safeBounds.y },
    // Top-right corner
    { x: centerX + halfRoad, y: safeBounds.y, width: safeBounds.x + safeBounds.w - (centerX + halfRoad), height: centerY - halfRoad - safeBounds.y },
    // Bottom-left corner
    { x: safeBounds.x, y: centerY + halfRoad, width: centerX - halfRoad - safeBounds.x, height: safeBounds.y + safeBounds.h - (centerY + halfRoad) },
    // Bottom-right corner
    { x: centerX + halfRoad, y: centerY + halfRoad, width: safeBounds.x + safeBounds.w - (centerX + halfRoad), height: safeBounds.y + safeBounds.h - (centerY + halfRoad) }
  ];
}

// === VEHICLE POSITIONING SYSTEM ===

/**
 * Calculate oncoming car position based on TTC in EAST lane
 */
function calculateOncomingCarPosition(layout: IntersectionLayout, ttc: number): VehiclePosition {
  const eastLane = layout.lanes.get('EAST')!;
  const urgency = Math.max(0, Math.min(1, (CONFIG.TTC_THRESHOLD_SEC - ttc) / CONFIG.TTC_THRESHOLD_SEC));
  
  // Distance along lane (0 = at intersection, 1 = far away)
  const maxDistance = INTERSECTION_CONFIG.LANE_EXTENSION * 0.8; // Use 80% of lane length
  const minDistance = 10;  // minimum distance from intersection
  const distanceAlongLane = minDistance + (1 - urgency) * (maxDistance - minDistance);
  
  // Calculate position along lane centerline
  const laneLength = Math.hypot(
    eastLane.endPoint.x - eastLane.startPoint.x,
    eastLane.endPoint.y - eastLane.startPoint.y
  );
  const progress = Math.min(0.95, distanceAlongLane / laneLength); // Cap at 95% to prevent overflow
  
  const x = eastLane.startPoint.x + (eastLane.endPoint.x - eastLane.startPoint.x) * progress;
  const y = eastLane.startPoint.y + (eastLane.endPoint.y - eastLane.startPoint.y) * progress;
  
  // Calculate angle based on lane direction - make car point left (west direction)
  const angle = Math.PI; // 180° → LEFT (west)
  
  return {
    laneId: 'EAST',
    distanceAlongLane: distanceAlongLane,
    x,
    y,
    urgency,
    angle
  };
}

/**
 * Calculate ego car position in WEST lane (for left turn)
 */
function calculateEgoCarPosition(layout: IntersectionLayout): VehiclePosition {
  const westLane = layout.lanes.get('WEST')!;
  
  // Position ego car at intersection edge for left turn
  const distanceFromIntersection = 30; // pixels from intersection center
  const laneLength = Math.hypot(
    westLane.endPoint.x - westLane.startPoint.x,
    westLane.endPoint.y - westLane.startPoint.y
  );
  const progress = Math.min(1, distanceFromIntersection / laneLength);
  
  const x = westLane.startPoint.x + (westLane.endPoint.x - westLane.startPoint.x) * progress;
  const y = westLane.startPoint.y + (westLane.endPoint.y - westLane.startPoint.y) * progress;
  
  const angle = Math.atan2(westLane.endPoint.y - westLane.startPoint.y, westLane.endPoint.x - westLane.startPoint.x);
  
  return {
    laneId: 'WEST',
    distanceAlongLane: distanceFromIntersection,
    x,
    y,
    urgency: 0,
    angle
  };
}

/**
 * Get position along lane centerline
 */
function getPositionAlongLane(lane: LaneGeometry, distance: number): { x: number; y: number } {
  const laneLength = Math.hypot(
    lane.endPoint.x - lane.startPoint.x,
    lane.endPoint.y - lane.startPoint.y
  );
  const progress = Math.min(1, distance / laneLength);
  
  return {
    x: lane.startPoint.x + (lane.endPoint.x - lane.startPoint.x) * progress,
    y: lane.startPoint.y + (lane.endPoint.y - lane.startPoint.y) * progress
  };
}

// === PEDESTRIAN POSITIONING SYSTEM ===

/**
 * Calculate pedestrian position based on crossing state
 */
function calculatePedestrianPosition(layout: IntersectionLayout, isCrossing: boolean, crosswalkId: string = 'north'): PedestrianState {
  if (!isCrossing) {
    // Position pedestrian waiting at crosswalk edge
    const crosswalk = layout.crosswalks.find(cw => cw.id === crosswalkId);
    if (!crosswalk) {
      return { isOnCrosswalk: false, crosswalkId, progress: 0, x: 0, y: 0 };
    }
    
    // Position at crosswalk edge (waiting)
    return {
      isOnCrosswalk: false,
      crosswalkId,
      progress: 0,
      x: crosswalk.centerX,
      y: crosswalk.centerY - crosswalk.height / 2 - 15 // 15px away from crosswalk
    };
  }
  
  // Pedestrian is crossing - move along crosswalk
  const crosswalk = layout.crosswalks.find(cw => cw.id === crosswalkId);
  if (!crosswalk) {
    return { isOnCrosswalk: true, crosswalkId, progress: 0.5, x: layout.centerX, y: layout.centerY };
  }
  
  // Simple crossing animation (could be enhanced with time-based progress)
  const progress = 0.5; // Mid-crossing for now
  const crosswalkLength = crosswalk.width;
  const startX = crosswalk.centerX - crosswalkLength / 2;
  const endX = crosswalk.centerX + crosswalkLength / 2;
  
  return {
    isOnCrosswalk: true,
    crosswalkId,
    progress,
    x: startX + (endX - startX) * progress,
    y: crosswalk.centerY
  };
}

/**
 * Determine pedestrian crosswalk from trial data
 */
function getPedestrianCrosswalkId(trial: any): string {
  // Check if trial has pedestrian direction info
  if (trial.pedestrian_direction) {
    return trial.pedestrian_direction.toLowerCase();
  }
  
  // Default to north crosswalk (most common scenario)
  return 'north';
}

// === LAYER-BASED DRAWING FUNCTIONS ===

/**
 * Draw background layer (grass areas)
 */
function drawLayer_Background(ctx: CanvasRenderingContext2D, layout: IntersectionLayout, colors: any) {
  // Fill entire canvas area (not just bounds) – transparent base now
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw grass only in corner regions (as we do now)
  ctx.fillStyle = '#1a4d1a';
  layout.grassBounds.forEach(grass => {
    ctx.fillRect(grass.x, grass.y, grass.width, grass.height);
  });
}

/**
 * Draw road layer (asphalt)
 */
function drawLayer_Road(ctx: CanvasRenderingContext2D, layout: IntersectionLayout, colors: any) {
  const { centerX, centerY, roadWidth } = layout;
  const halfRoad = roadWidth / 2;

  const leftEdge   = layout.bounds.x - EDGE_BLEED;
  const rightEdge  = layout.bounds.x + layout.bounds.w + EDGE_BLEED;
  const topEdge    = layout.bounds.y - EDGE_BLEED;
  const bottomEdge = layout.bounds.y + layout.bounds.h + EDGE_BLEED;

  ctx.fillStyle = colors?.road || '#1c2532';

  // Center square (slightly oversized so no seam)
  ctx.fillRect(centerX - halfRoad - EDGE_BLEED, centerY - halfRoad - EDGE_BLEED,
               roadWidth + EDGE_BLEED * 2, roadWidth + EDGE_BLEED * 2);

  // Horizontal roads to bleed out
  ctx.fillRect(leftEdge, centerY - halfRoad, (centerX - halfRoad) - leftEdge, roadWidth);
  ctx.fillRect(centerX + halfRoad, centerY - halfRoad, rightEdge - (centerX + halfRoad), roadWidth);

  // Vertical roads to bleed out
  ctx.fillRect(centerX - halfRoad, topEdge, roadWidth, (centerY - halfRoad) - topEdge);
  ctx.fillRect(centerX - halfRoad, centerY + halfRoad, roadWidth, bottomEdge - (centerY + halfRoad));

  // Keep border strokes but snap to pixels (optional)
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  // Horizontal borders
  ctx.moveTo(leftEdge,  Math.round(centerY - halfRoad) + 0.5);
  ctx.lineTo(centerX - halfRoad, Math.round(centerY - halfRoad) + 0.5);
  ctx.moveTo(centerX + halfRoad, Math.round(centerY - halfRoad) + 0.5);
  ctx.lineTo(rightEdge, Math.round(centerY - halfRoad) + 0.5);

  ctx.moveTo(leftEdge,  Math.round(centerY + halfRoad) + 0.5);
  ctx.lineTo(centerX - halfRoad, Math.round(centerY + halfRoad) + 0.5);
  ctx.moveTo(centerX + halfRoad, Math.round(centerY + halfRoad) + 0.5);
  ctx.lineTo(rightEdge, Math.round(centerY + halfRoad) + 0.5);

  // Vertical borders
  ctx.moveTo(Math.round(centerX - halfRoad) + 0.5, topEdge);
  ctx.lineTo(Math.round(centerX - halfRoad) + 0.5, centerY - halfRoad);
  ctx.moveTo(Math.round(centerX - halfRoad) + 0.5, centerY + halfRoad);
  ctx.lineTo(Math.round(centerX - halfRoad) + 0.5, bottomEdge);

  ctx.moveTo(Math.round(centerX + halfRoad) + 0.5, topEdge);
  ctx.lineTo(Math.round(centerX + halfRoad) + 0.5, centerY - halfRoad);
  ctx.moveTo(Math.round(centerX + halfRoad) + 0.5, centerY + halfRoad);
  ctx.lineTo(Math.round(centerX + halfRoad) + 0.5, bottomEdge);
  ctx.stroke();
}

/**
 * Draw lane markings
 */
function drawLayer_Lanes(ctx: CanvasRenderingContext2D, layout: IntersectionLayout, colors: any) {
  const { centerX, centerY, roadWidth, laneWidth } = layout;
  const halfRoad = roadWidth / 2;
  const halfLane = laneWidth / 2;
  
  // Lane centerlines (white dashed) - only on road segments, not in intersection
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  
  // Horizontal lane markings (left and right segments only)
  ctx.beginPath();
  ctx.moveTo(layout.bounds.x, centerY);
  ctx.lineTo(centerX - halfRoad, centerY);
  ctx.moveTo(centerX + halfRoad, centerY);
  ctx.lineTo(layout.bounds.x + layout.bounds.w, centerY);
  ctx.stroke();
  
  // Vertical lane markings (top and bottom segments only)
  ctx.beginPath();
  ctx.moveTo(centerX, layout.bounds.y);
  ctx.lineTo(centerX, centerY - halfRoad);
  ctx.moveTo(centerX, centerY + halfRoad);
  ctx.lineTo(centerX, layout.bounds.y + layout.bounds.h);
  ctx.stroke();
  
  ctx.setLineDash([]);
}

/**
 * Draw crosswalks
 */
function drawLayer_Crosswalks(ctx: CanvasRenderingContext2D, layout: IntersectionLayout, colors: any) {
  const crosswalkColor = colors?.crosswalk || '#ffffff';
  
  // Only show north and south crosswalks (not east/west)
  const visibleCrosswalkIds = ['north', 'south'];
  
  layout.crosswalks
    .filter(crosswalk => visibleCrosswalkIds.includes(crosswalk.id))
    .forEach(crosswalk => {
      ctx.fillStyle = crosswalkColor;
      
      // Draw zebra stripes
      const stripeWidth = 6;
      const gapWidth = 6;
      const numStripes = Math.floor(crosswalk.width / (stripeWidth + gapWidth));
      
      for (let i = 0; i < numStripes; i++) {
        const x = crosswalk.bounds.x + i * (stripeWidth + gapWidth);
        ctx.fillRect(x, crosswalk.bounds.y, stripeWidth, crosswalk.bounds.height);
      }
    });
}

/**
 * Draw traffic light
 */
function drawLayer_SignalLight(ctx: CanvasRenderingContext2D, layout: IntersectionLayout, signal: string, colors: any) {
  const { centerX, centerY, roadWidth } = layout;
  const halfRoad = roadWidth / 2;
  
  // Position traffic light at corner (top-left from ego perspective) - dynamic based on layout
  const signalX = centerX - halfRoad - 30; // Reduced from -40
  const signalY = centerY - halfRoad - 30; // Reduced from -40
  const radius = 30; // 60px diameter
  
  // Traffic light pole
  ctx.strokeStyle = colors?.signalBody || '#0f172a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(signalX, signalY + 60);
  ctx.lineTo(signalX, signalY - 20);
  ctx.stroke();
  
  // Traffic light housing
  ctx.fillStyle = colors?.signalBody || '#0f172a';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillRect(signalX - 35, signalY - 35, 70, 140);
  ctx.shadowBlur = 0;
  
  // Light circles
  const lights = [
    { color: '#ff0000', y: signalY - 15 }, // Red
    { color: '#ffff00', y: signalY + 5 },  // Yellow
    { color: '#00ff00', y: signalY + 25 }  // Green
  ];
  
  lights.forEach((light, index) => {
    let isActive = false;
    if (signal === 'RED' && index === 0) isActive = true;
    if ((signal === 'YELLOW' || signal === 'YELLOW_FLASH') && index === 1) isActive = true; // steady yellow added
    if ((signal === 'GREEN_ARROW' || signal === 'GREEN') && index === 2) isActive = true;
    if (signal === 'NO_LEFT_TURN' && index === 0) isActive = true;
    
    ctx.beginPath();
    ctx.arc(signalX, light.y, radius, 0, 2 * Math.PI);
    
    if (isActive) {
      const themeColor = index === 0 ? colors?.signalRed : 
                        index === 1 ? colors?.signalYellow : 
                        colors?.signalGreen;
      
      ctx.shadowColor = themeColor || light.color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = themeColor || light.color;
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = themeColor || light.color;
      ctx.fill();
      
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
  
  // White arrow for green arrow signal
  if (signal === 'GREEN_ARROW') {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('←', signalX, signalY + 30);
  }
}

/**
 * Draw vehicles
 */
function drawLayer_Vehicles(
  ctx: CanvasRenderingContext2D,
  layout: IntersectionLayout,
  vehicles: VehiclePosition[],
  colors: any,
  carImage: HTMLImageElement | null
) {
  vehicles.forEach(vehicle => {
    const { x, y, angle, urgency } = vehicle;
    const carColor = urgency > 0.5 ? (colors?.carUrgent || '#ef4444') : (colors?.carSafe || '#60a5fa');
    const L = INTERSECTION_CONFIG.VEHICLE_LENGTH; // length (long side)
    const W = INTERSECTION_CONFIG.VEHICLE_WIDTH;  // width  (short side)

    ctx.save();
    ctx.translate(x, y);

    // Flip sprite 180° so the rear faces West at the current moment
    const rotationAngle = canvasRotationFromHeading(angle + Math.PI, CAR_IMAGE_ORIENTATION);

    // Debug logging to verify rotation (report canvas rotation)
    if (process.env.NODE_ENV !== 'production') {
      console.info('[CAR ROT]', {
        heading_rad: angle,
        sprite_base_rad: CAR_IMAGE_ORIENTATION,
        canvas_rot_rad: rotationAngle,
        canvas_rot_deg: (rotationAngle * 180 / Math.PI).toFixed(1)
      });
    }

    ctx.rotate(rotationAngle);

    if (carImage) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Scale so the longest side is 72px, preserving aspect ratio
      const natW = carImage.naturalWidth || 1;
      const natH = carImage.naturalHeight || 1;
      const longest = Math.max(natW, natH);
      const scale = 72 / longest;
      const drawW = Math.round(natW * scale);
      const drawH = Math.round(natH * scale);

      ctx.drawImage(carImage, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      // fallback render — base faces EAST at 0 rad (front marker to the RIGHT)
      ctx.fillStyle = carColor;
      ctx.fillRect(-W / 2, -L / 2, W, L);
      ctx.fillStyle = 'rgba(135,206,235,0.4)';
      ctx.fillRect(-W / 2 + 3, -L / 2 + 3, W - 6, L - 6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(W / 2, -3, 5, 6); // front marker
      ctx.fillStyle = '#1a1a1a';
      const r = 4, offX = W / 2 - 6, offY = L / 2 - 6;
      ctx.beginPath(); ctx.arc(-offX, -offY, r, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc( offX, -offY, r, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(-offX,  offY, r, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc( offX,  offY, r, 0, 2*Math.PI); ctx.fill();
    }

    ctx.restore();

    if (urgency > 0.3) {
      ctx.strokeStyle = carColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(angle) * (W / 2),
        y + Math.sin(angle) * (W / 2)
      );
      ctx.lineTo(
        x + Math.cos(angle) * (W / 2 + 20),
        y + Math.sin(angle) * (W / 2 + 20)
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

/**
 * Draw pedestrians
 */
function drawLayer_Pedestrians(ctx: CanvasRenderingContext2D, layout: IntersectionLayout, pedestrians: PedestrianState[], colors: any) {
  pedestrians.forEach(pedestrian => {
    const { x, y, isOnCrosswalk } = pedestrian;
    
    ctx.strokeStyle = colors?.text || '#e5e7eb';
    ctx.lineWidth = 3.5;
    
    // Head
    ctx.beginPath();
    ctx.arc(x, y - 20, 9, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(x, y - 11);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    
    // Arms
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x - 9, y + 3);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 9, y + 3);
    ctx.stroke();
    
    // Legs
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x - 7, y + 23);
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 7, y + 23);
    ctx.stroke();
    
    // Crossing indicator
    if (isOnCrosswalk) {
      const warningColor = colors?.carUrgent || '#ef4444';
      ctx.fillStyle = warningColor;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CROSSING', x, y + 38);
    }
  });
}

/**
 * Draw attention vignette
 */
function drawLayer_Vignette(ctx: CanvasRenderingContext2D, layout: IntersectionLayout, colors: any) {
  const { centerX, centerY } = layout;
  const radius = Math.min(layout.bounds.w, layout.bounds.h) * 0.4;
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, 'rgba(255,255,255,0.02)');
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.05)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.06)'); // Reduced from 0.15 to prevent edge halo
  
  ctx.fillStyle = gradient;
  ctx.fillRect(layout.bounds.x, layout.bounds.y, layout.bounds.w, layout.bounds.h);
}

// ADD-ONLY HELPERS (Canvas UX improvements)

// --- DARK THEME HELPERS ---

// 1) Inject dark theme CSS once with enhanced tokens for visibility
function ensureCanvasDarkStyles() {
  if (document.getElementById('canvas-dark-styles')) return;
  const style = document.createElement('style');
  style.id = 'canvas-dark-styles';
  style.textContent = `
  [data-canvas-theme="dark"]{
    --bg: #0b0f14;              /* asphalt */
    --road: #1c2532;
    --lane: #3a4352;
    --grid: rgba(255,255,255,0.04);
    --crosswalk: #cbd5e1;       /* slate-300 */
    --text: #e5e7eb;            /* light slate */
    --chip-bg: #111827;         /* badge */
    --chip-fg: #e5e7eb;
    --signal-body: #0f172a;
    --signal-red: #f87171;
    --signal-yellow: #fbbf24;
    --signal-green: #34d399;
    --halo-red: rgba(248,113,113,0.5);
    --halo-yellow: rgba(251,191,36,0.5);
    --halo-green: rgba(52,211,153,0.5);
    --car-urgent: #ef4444;
    --car-safe: #60a5fa;
    
    /* Enhanced visibility tokens */
    --lens-size: 60px;          /* Traffic light lens diameter */
    --lens-stroke: 2px;         /* Dark stroke width */
    --glow-intensity: 24px;     /* Soft glow blur radius */
    --ego-scale: 1.4;           /* Ego car scale factor */
    --ego-offset: 12%;          /* Ego car vertical offset */
    --badge-gap: 20px;          /* TTC badge gap from ego car */
    --contrast-ratio: 3.1;      /* Minimum contrast ratio */
    --vignette-opacity: 0.15;   /* Subtle vignette for focus */
  }
  `;
  document.head.appendChild(style);
}

// 2) Hook to apply dark theme
function useDarkCanvasTheme(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    ensureCanvasDarkStyles();
    const el = ref.current;
    if (!el) return;
    const prev = el.getAttribute('data-canvas-theme');
    el.setAttribute('data-canvas-theme', 'dark');
    return () => { 
      if (prev) el.setAttribute('data-canvas-theme', prev); 
      else el.removeAttribute('data-canvas-theme'); 
    };
  }, [ref]);
}

// 3) Read theme colors from CSS variables
function getThemeColors(root: HTMLElement | null) {
  if (!root) return null;
  const s = getComputedStyle(root);
  return {
    bg: s.getPropertyValue('--bg').trim() || '#0b0f14',
    road: s.getPropertyValue('--road').trim() || '#1c2532',
    lane: s.getPropertyValue('--lane').trim() || '#3a4352',
    grid: s.getPropertyValue('--grid').trim() || 'rgba(255,255,255,0.04)',
    crosswalk: s.getPropertyValue('--crosswalk').trim() || '#cbd5e1',
    text: s.getPropertyValue('--text').trim() || '#e5e7eb',
    signalBody: s.getPropertyValue('--signal-body').trim() || '#0f172a',
    signalRed: s.getPropertyValue('--signal-red').trim() || '#f87171',
    signalYellow: s.getPropertyValue('--signal-yellow').trim() || '#fbbf24',
    signalGreen: s.getPropertyValue('--signal-green').trim() || '#34d399',
    carUrgent: s.getPropertyValue('--car-urgent').trim() || '#ef4444',
    carSafe: s.getPropertyValue('--car-safe').trim() || '#60a5fa',
  };
}

// 4) Zebra crosswalk helper (canvas) - clean stripes, no thick L-stack
function drawZebraStripesCanvas(ctx: CanvasRenderingContext2D, opts: {
  x: number; y: number; length: number; depth?: number; orientation?: 'horizontal'|'vertical';
  stripes?: number; stripe?: number; gap?: number; color?: string;
}) {
  const { x, y, length, depth = 40, orientation = 'horizontal', stripes = 6, stripe = 5, gap = 9, color = '#cbd5e1' } = opts;
  const total = stripes * stripe + (stripes - 1) * gap;
  const start = (depth - total) / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  // crisp edges on dark: half-pixel alignment
  const px = (v: number) => Math.round(v) + 0.5;
  for (let i = 0; i < stripes; i++) {
    const offset = start + i * (stripe + gap);
    if (orientation === 'horizontal') {
      ctx.fillRect(px(x), px(y + offset), Math.round(length), Math.round(stripe));
    } else {
      ctx.fillRect(px(x + offset), px(y), Math.round(stripe), Math.round(length));
    }
  }
  ctx.restore();
}

// 5) Clamp utility
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

// 6) Clamp rectangle to bounds
function clampRectToBounds(x: number, y: number, w: number, h: number, b: Bounds) {
  const nx = clamp(x, b.x, b.x + b.w - w);
  const ny = clamp(y, b.y, b.y + b.h - h);
  return { x: nx, y: ny };
}

// 1) Normalize signal → icon shape
function normalizeSignal(signal?: string): 'GREEN'|'GREEN_ARROW'|'RED'|'NO_LEFT_TURN'|'YELLOW' {
  const s = (signal || '').toUpperCase().replace(/\s+/g,'_');
  if (s.includes('ARROW')) return 'GREEN_ARROW';
  if (s.includes('NO') && s.includes('LEFT')) return 'NO_LEFT_TURN';
  if (s.includes('RED')) return 'RED';
  if (s.includes('YELLOW') || s.includes('AMBER') || s.includes('FLASH')) return 'YELLOW';
  if (s.includes('GREEN')) return 'GREEN';
  return 'GREEN';
}

// 2) TTC badge formatter
function formatTTCBadge(ttc?: number|string) {
  const n = typeof ttc === 'string' ? parseFloat(ttc) : (ttc ?? 0);
  return `TTC ${n.toFixed(1)}s`;
}

// 3) Style tokens for HUD overlays
const HUD = {
  badge: { 
    padding: '3px 8px', 
    borderRadius: 6, 
    fontSize: 13, 
    fontWeight: 600,
    background: '#111827', 
    color: 'white', 
    opacity: 0.95,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  } as React.CSSProperties,
};

// 4) Ego + path overlay component
function LeftTurnAffordance({ showPath = true, canvasHeight = 450 }: { showPath?: boolean; canvasHeight?: number }) {
  // Move ego car up by 12% of canvas height and scale by 1.4x
  const moveUpBy = canvasHeight * 0.12; // 12% of canvas height
  const scale = 1.4;
  
  return (
    <div aria-label="Your vehicle position" style={{ 
      position:'absolute', 
      left: 24, 
      bottom: 32 + moveUpBy // Move up by 12% of canvas height
    }}>
      {/* Ego car marker - scaled by 1.4x */}
      <div style={{ 
        width: 24 * scale, // 33.6px
        height: 36 * scale, // 50.4px
        background:'#1f2937', 
        borderRadius: 6, 
        boxShadow:'0 0 0 3px #fff, 0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 16 * scale, // 22.4px
          height: 20 * scale, // 28px
          background: '#6b7280',
          borderRadius: 3
        }} />
      </div>
      {/* Left turn path - deprecated: do not render the LEFT widget group */}
      {false && showPath && (
        <svg width="140" height="100" style={{ position:'absolute', left: 12, bottom: 0, pointerEvents: 'none' }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
            </marker>
          </defs>
          <path 
            d="M10,80 Q30,65 50,50 T100,15" 
            stroke="#10b981" 
            strokeWidth="3" 
            strokeDasharray="8 6" 
            fill="none"
            markerEnd="url(#arrowhead)"
            opacity="0.8"
          />
          <text x="14" y="95" fontSize="11" fill="#10b981" fontWeight={700}>LEFT</text>
        </svg>
      )}
    </div>
  );
}

// 5) Motion chevrons for oncoming car
function MotionChevrons({ x = 0, y = 0, visible = true }: { x?: number; y?: number; visible?: boolean }) {
  if (!visible) return null;
  return (
    <div aria-hidden style={{ 
      position:'absolute', 
      left: x - 40, 
      top: y - 6, 
      pointerEvents:'none',
      fontSize: 20,
      opacity: 0.6
    }}>
      <span style={{ color:'#ef4444', fontWeight: 'bold' }}>{'››'}</span>
    </div>
  );
}

export default function CanvasRenderer({ 
  trial, 
  width = CONFIG.CANVAS_WIDTH * 1.2, // Scale up 20%
  height = CONFIG.CANVAS_HEIGHT * 1.2,
  safeBounds
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const normalizedSignal = normalizeSignal(trial.signal)
  
  // === 동적 캔버스 크기 및 자동차 이미지 상태 관리 ===
  const [canvasSize, setCanvasSize] = useState({ width, height })
  const [carImage, setCarImage] = useState<HTMLImageElement | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  // Apply dark theme
  useDarkCanvasTheme(wrapperRef)

  // === 자동차 이미지 로딩 ===
  useEffect(() => {
    let alive = true;
    setImageLoading(true);
    fetchCarImage()
      .then((img) => {
        if (!alive) return;
        setCarImage(img);
        setImageError(false);
        setImageLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setImageError(true);
        setImageLoading(false);
      });
    return () => { alive = false; };
  }, [])

  // === 동적 캔버스 크기 조정 ===
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = wrapperRef.current
      if (container) {
        const newWidth = container.clientWidth
        const newHeight = container.clientHeight
        
        if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
          setCanvasSize({ width: newWidth, height: newHeight })
        }
      }
    }

    // 초기 크기 설정
    updateCanvasSize()

    // ResizeObserver로 크기 변경 감지
    const resizeObserver = new ResizeObserver(updateCanvasSize)
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [canvasSize.width, canvasSize.height])

  // Derive safe bounds (fallback to full area if not provided)
  const container = wrapperRef.current;
  const fullBounds: Bounds = container
    ? { x: 0, y: 0, w: container.clientWidth || canvasSize.width, h: container.clientHeight || canvasSize.height }
    : { x: 0, y: 0, w: canvasSize.width, h: canvasSize.height };
  const B: Bounds = safeBounds && safeBounds.w > 0 ? safeBounds : fullBounds;

  // Calculate vehicle positions for overlays using new system
  const layout = initializeIntersectionLayout(canvasSize.width, canvasSize.height, B)
  const oncomingCarPos = calculateOncomingCarPosition(layout, trial.oncoming_car_ttc)
  const egoCarPos = calculateEgoCarPosition(layout)
  
  // Use new positioning for overlays
  const carX = oncomingCarPos.x
  const carY = oncomingCarPos.y
  const urgency = oncomingCarPos.urgency

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get dark theme colors
    const colors = getThemeColors(wrapperRef.current)

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)

    // Initialize intersection layout with dynamic size
    const layout = initializeIntersectionLayout(canvasSize.width, canvasSize.height, B)

    // === NEW LAYER-BASED RENDERING PIPELINE ===
    
    // 1. Background layer (grass areas)
    drawLayer_Background(ctx, layout, colors)
    
    // 2. Road layer (asphalt + borders)
    drawLayer_Road(ctx, layout, colors)
    
    // 3. Lane markings
    drawLayer_Lanes(ctx, layout, colors)
    
    // 4. Crosswalks
    drawLayer_Crosswalks(ctx, layout, colors)
    
    // 5. Calculate vehicle positions
    const oncomingCarPos = calculateOncomingCarPosition(layout, trial.oncoming_car_ttc)
    const egoCarPos = calculateEgoCarPosition(layout)
    
    // Debug crosshair at car position
    ctx.save();
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(oncomingCarPos.x - 6, oncomingCarPos.y);
    ctx.lineTo(oncomingCarPos.x + 6, oncomingCarPos.y);
    ctx.moveTo(oncomingCarPos.x, oncomingCarPos.y - 6);
    ctx.lineTo(oncomingCarPos.x, oncomingCarPos.y + 6);
    ctx.stroke();
    ctx.restore();
    
    // 6. Traffic light
    drawLayer_SignalLight(ctx, layout, normalizedSignal, colors)
    
    // 7. Vehicles (only oncoming car, ego car is handled by overlay) - 이미지 전달
    drawLayer_Vehicles(ctx, layout, [oncomingCarPos], colors, carImage)
    
    // 8. Pedestrians
    if (trial.pedestrian === 'CROSSING') {
      const crosswalkId = getPedestrianCrosswalkId(trial)
      const pedestrianState = calculatePedestrianPosition(layout, true, crosswalkId)
      drawLayer_Pedestrians(ctx, layout, [pedestrianState], colors)
    }
    
    // 9. Attention vignette
    drawLayer_Vignette(ctx, layout, colors)

  }, [trial, canvasSize.width, canvasSize.height, normalizedSignal, B.x, B.y, B.w, B.h, carImage])

  // Old drawing functions removed - now using layer-based system above

  return (
    <div 
      ref={wrapperRef}
      data-canvas-theme="dark"
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        overflow: 'hidden',
        background: 'transparent'
        // Removed scale transform - it interferes with viewport math
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ 
          border: '2px solid #1f2937',
          borderRadius: '12px',
          background: 'transparent', // Transparent background - no green bezel
          display: 'block',
          width: '100%',
          height: '100%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' // Add subtle shadow for depth
        }}
        aria-label={`Traffic scene: ${normalizedSignal} signal, ${trial.oncoming_car_ttc.toFixed(1)}s TTC, ${trial.pedestrian === 'CROSSING' ? 'pedestrian crossing' : 'no pedestrian'}`}
      />
      
      {/* Ego vehicle + left-turn path overlay - removed */}
      
      {/* Motion chevrons (show if car is approaching quickly) */}
      <MotionChevrons x={carX} y={carY} visible={urgency > 0.2} />
      
      {/* TTC badge near oncoming car (dark chip, light text) - clamped to bounds and positioned to avoid ego car */}
      <div style={{ 
        ...HUD.badge, 
        position:'absolute', 
        left: Math.max(B.x + 80, Math.min(carX + 40, B.x + B.w - 120)), // Move badge away from car
        top: Math.max(B.y + 10, Math.min(carY - 50, B.y + B.h - 40)), // Move badge above car
        background: '#111827',
        color: '#e5e7eb',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {formatTTCBadge(trial.oncoming_car_ttc)}
      </div>
      
    </div>
  )
}

// === TOUR ANCHOR SYSTEM ===

export type Anchor = { id: string; x: number; y: number; label: string };

/**
 * Compute anchor points for the interactive tour overlay.
 * This mirrors the renderer's geometry without touching canvas internals.
 */
export function computeTourAnchors(
  canvasWidth: number,
  canvasHeight: number,
  trial: Trial,
  safeBounds?: { x: number; y: number; w: number; h: number }
): Record<string, Anchor> {
  const B = safeBounds ?? { x: 0, y: 0, w: canvasWidth, h: canvasHeight };
  const layout = initializeIntersectionLayout(canvasWidth, canvasHeight, B);
  const oncoming = calculateOncomingCarPosition(layout, trial.oncoming_car_ttc);

  const half = layout.roadWidth / 2;
  const cwNorth = layout.crosswalks.find(c => c.id === 'north')!;
  const cwSouth = layout.crosswalks.find(c => c.id === 'south')!;
  const signalX = layout.centerX - half - 30;
  const signalY = layout.centerY - half - 30;

  return {
    trafficLight: { id: 'trafficLight', x: signalX, y: signalY - 60, label: 'Traffic light' },
    signalLens:   { id: 'signalLens',   x: signalX, y: signalY,      label: 'Active lens' },
    oncomingCar:  { id: 'oncomingCar',  x: oncoming.x, y: oncoming.y, label: 'Oncoming vehicle' },
    ttcBadge:     { id: 'ttcBadge',     x: oncoming.x + 64, y: oncoming.y - 42, label: 'Time-to-Collision (TTC)' },
    chevrons:     { id: 'chevrons',     x: oncoming.x - 24, y: oncoming.y - 10, label: 'Motion chevrons' },
    lanesH:       { id: 'lanesH',       x: layout.centerX, y: layout.centerY + 6, label: 'Lane centerlines' },
    roadEdges:    { id: 'roadEdges',    x: layout.centerX + half + 6, y: layout.centerY + half + 6, label: 'Road edges' },
    grassNW:      { id: 'grassNW',      x: B.x + 40, y: B.y + 40, label: 'Corner grass' },
    crosswalkN:   { id: 'crosswalkN',   x: cwNorth.centerX, y: cwNorth.centerY, label: 'Crosswalk (north)' },
    crosswalkS:   { id: 'crosswalkS',   x: cwSouth.centerX, y: cwSouth.centerY, label: 'Crosswalk (south)' },
    crossingTxt:  { id: 'crossingTxt',  x: layout.centerX, y: layout.centerY + 40, label: 'Pedestrian "CROSSING"' },
    vignette:     { id: 'vignette',     x: layout.centerX, y: layout.centerY, label: 'Attention vignette' },
    debugMark:    { id: 'debugMark',    x: oncoming.x, y: oncoming.y - 16, label: 'Dev crosshair' }
  };
}
