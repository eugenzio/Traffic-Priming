import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config'
import type { Trial } from '../types'

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

// === INTERSECTION CONFIGURATION ===
const INTERSECTION_CONFIG = {
  ROAD_WIDTH_RATIO: 0.3,      // Road width as % of canvas (reduced for grass areas)
  LANE_COUNT: 2,              // Lanes per direction
  VEHICLE_WIDTH: 50,          // Increased from 40 to 50
  VEHICLE_HEIGHT: 30,         // Increased from 24 to 30
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
  
  // Calculate angle based on lane direction
  const angle = Math.atan2(eastLane.endPoint.y - eastLane.startPoint.y, eastLane.endPoint.x - eastLane.startPoint.x);
  
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
  // Fill entire canvas with grass background first
  ctx.fillStyle = '#1a4d1a'; // Dark green for grass
  ctx.fillRect(0, 0, layout.bounds.w, layout.bounds.h);
  
  // Then draw specific grass areas in corners (this will overlay on the full background)
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
  
  // Asphalt color
  ctx.fillStyle = colors?.road || '#2a2a2a';
  
  // Fill the central intersection so it connects visually with all roads
  ctx.fillRect(centerX - halfRoad, centerY - halfRoad, roadWidth, roadWidth);
  
  // Left horizontal road segment
  ctx.fillRect(
    layout.bounds.x,
    centerY - halfRoad,
    centerX - halfRoad - layout.bounds.x,
    roadWidth
  );
  
  // Right horizontal road segment
  ctx.fillRect(
    centerX + halfRoad,
    centerY - halfRoad,
    layout.bounds.x + layout.bounds.w - (centerX + halfRoad),
    roadWidth
  );
  
  // Top vertical road segment
  ctx.fillRect(
    centerX - halfRoad,
    layout.bounds.y,
    roadWidth,
    centerY - halfRoad - layout.bounds.y
  );
  
  // Bottom vertical road segment
  ctx.fillRect(
    centerX - halfRoad,
    centerY + halfRoad,
    roadWidth,
    layout.bounds.y + layout.bounds.h - (centerY + halfRoad)
  );
  
  // Road borders (yellow lines) - only around the road edges, not center
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  
  // Horizontal road borders
  ctx.beginPath();
  ctx.moveTo(layout.bounds.x, centerY - halfRoad);
  ctx.lineTo(centerX - halfRoad, centerY - halfRoad);
  ctx.moveTo(centerX + halfRoad, centerY - halfRoad);
  ctx.lineTo(layout.bounds.x + layout.bounds.w, centerY - halfRoad);
  
  ctx.moveTo(layout.bounds.x, centerY + halfRoad);
  ctx.lineTo(centerX - halfRoad, centerY + halfRoad);
  ctx.moveTo(centerX + halfRoad, centerY + halfRoad);
  ctx.lineTo(layout.bounds.x + layout.bounds.w, centerY + halfRoad);
  ctx.stroke();
  
  // Vertical road borders
  ctx.beginPath();
  ctx.moveTo(centerX - halfRoad, layout.bounds.y);
  ctx.lineTo(centerX - halfRoad, centerY - halfRoad);
  ctx.moveTo(centerX - halfRoad, centerY + halfRoad);
  ctx.lineTo(centerX - halfRoad, layout.bounds.y + layout.bounds.h);
  
  ctx.moveTo(centerX + halfRoad, layout.bounds.y);
  ctx.lineTo(centerX + halfRoad, centerY - halfRoad);
  ctx.moveTo(centerX + halfRoad, centerY + halfRoad);
  ctx.lineTo(centerX + halfRoad, layout.bounds.y + layout.bounds.h);
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
function drawLayer_Vehicles(ctx: CanvasRenderingContext2D, layout: IntersectionLayout, vehicles: VehiclePosition[], colors: any, carImage: HTMLImageElement | null) {
  vehicles.forEach(vehicle => {
    const { x, y, angle, urgency } = vehicle;
    
    // Car color based on urgency
    const carColor = urgency > 0.5 ? (colors?.carUrgent || '#ef4444') : (colors?.carSafe || '#60a5fa');
    
    const W = INTERSECTION_CONFIG.VEHICLE_WIDTH;
    const H = INTERSECTION_CONFIG.VEHICLE_HEIGHT;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // 자동차 이미지가 로드된 경우 이미지로 렌더링 (뒤집기 수정)
    if (carImage) {
      // 이미지를 수직으로 뒤집어서 올바른 방향으로 표시
      ctx.scale(1, -1);
      ctx.drawImage(carImage, -W/2, -H/2, W, H);
      ctx.scale(1, -1); // 원래 상태로 복원
    } else {
      // 이미지가 로드되지 않은 경우 기본 사각형으로 대체
      // Car body
      ctx.fillStyle = carColor;
      ctx.fillRect(-W/2, -H/2, W, H);
      
      // Car windows
      ctx.fillStyle = 'rgba(135, 206, 235, 0.4)';
      ctx.fillRect(-W/2 + 3, -H/2 + 3, W - 6, H - 6);
      
      // Wheels (four corners) — looks correct under rotation
      ctx.fillStyle = '#1a1a1a';
      const r = 4;
      const offX = W/2 - 6;
      const offY = H/2 - 6;
      ctx.beginPath(); ctx.arc(-offX, -offY, r, 0, 2*Math.PI); ctx.fill(); // front-left
      ctx.beginPath(); ctx.arc( offX, -offY, r, 0, 2*Math.PI); ctx.fill(); // front-right
      ctx.beginPath(); ctx.arc(-offX,  offY, r, 0, 2*Math.PI); ctx.fill(); // rear-left
      ctx.beginPath(); ctx.arc( offX,  offY, r, 0, 2*Math.PI); ctx.fill(); // rear-right
    }
    
    ctx.restore();
    
    // Motion trail for urgent vehicles
    if (urgency > 0.3) {
      ctx.strokeStyle = carColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * INTERSECTION_CONFIG.VEHICLE_WIDTH/2, 
                 y + Math.sin(angle) * INTERSECTION_CONFIG.VEHICLE_WIDTH/2);
      ctx.lineTo(x + Math.cos(angle) * (INTERSECTION_CONFIG.VEHICLE_WIDTH/2 + 20), 
                 y + Math.sin(angle) * (INTERSECTION_CONFIG.VEHICLE_WIDTH/2 + 20));
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
  gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
  
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
    const image = new Image()
    image.crossOrigin = 'anonymous' // CORS 설정
    
    image.onload = () => {
      setCarImage(image)
      setImageLoading(false)
      setImageError(false)
    }
    
    image.onerror = () => {
      setImageError(true)
      setImageLoading(false)
      console.warn('자동차 이미지 로딩 실패, 기본 사각형으로 대체됩니다.')
    }
    
    image.src = 'https://png.pngtree.com/png-vector/20230107/ourmid/pngtree-new-original-transparent-car-png-image_6554552.png'
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

    // Clear canvas with grass background (no more black edges)
    ctx.fillStyle = '#1a4d1a' // Dark green grass background
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

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
        display: 'inline-block'
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
          background: '#1a4d1a', // Grass background to match canvas content
          display: 'block',
          width: '100%',
          height: '100%'
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
        left: Math.max(B.x + 80, Math.min(carX + 22, B.x + B.w - 90)), // Ensure 16-20px gap from ego car (left: 24 + 50.4px + 20px = ~94px)
        top: Math.max(B.y, Math.min(carY - 30, B.y + B.h - 32)), // Clamp vertically (badge height ~28px)
        background: '#111827',
        color: '#e5e7eb',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {formatTTCBadge(trial.oncoming_car_ttc)}
      </div>
      
    </div>
  )
}
