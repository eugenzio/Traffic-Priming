import React, { useEffect, useRef } from 'react'
import { CONFIG } from '../config'
import type { Trial } from '../types'

type Bounds = { x: number; y: number; w: number; h: number };

interface CanvasRendererProps {
  trial: Trial
  width?: number
  height?: number
  safeBounds?: Bounds
}

// ADD-ONLY HELPERS (Canvas UX improvements)

// --- DARK THEME HELPERS ---

// 1) Inject dark theme CSS once
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
function LeftTurnAffordance({ showPath = true }: { showPath?: boolean }) {
  return (
    <div aria-label="Your vehicle position" style={{ position:'absolute', left: 24, bottom: 32 }}>
      {/* Ego car marker */}
      <div style={{ 
        width: 24, 
        height: 36, 
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
          width: 16,
          height: 20,
          background: '#10b981',
          borderRadius: 3
        }} />
      </div>
      {/* Left turn path */}
      {showPath && (
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
  
  // Apply dark theme
  useDarkCanvasTheme(wrapperRef)

  // Derive safe bounds (fallback to full area if not provided)
  const container = wrapperRef.current;
  const fullBounds: Bounds = container
    ? { x: 0, y: 0, w: container.clientWidth || width, h: container.clientHeight || height }
    : { x: 0, y: 0, w: width, h: height };
  const B: Bounds = safeBounds && safeBounds.w > 0 ? safeBounds : fullBounds;

  // Calculate oncoming car position for overlays (within safe bounds)
  const maxDistance = B.w * 0.4
  const minDistance = B.w * 0.1
  const urgency = Math.max(0, Math.min(1, (CONFIG.TTC_THRESHOLD_SEC - trial.oncoming_car_ttc) / CONFIG.TTC_THRESHOLD_SEC))
  const distance = maxDistance - (urgency * (maxDistance - minDistance))
  
  // Base car position (centered in safe bounds)
  const carBaseX = B.x + B.w * 0.5 + distance
  const carBaseY = B.y + B.h * 0.5
  
  // Clamp car to safe bounds (car dimensions include halo)
  const CAR_W = 44, CAR_H = 22;
  const carClamped = clampRectToBounds(carBaseX - CAR_W/2, carBaseY - CAR_H/2, CAR_W, CAR_H, B);
  const carX = carClamped.x + CAR_W/2; // Center point
  const carY = carClamped.y + CAR_H/2;

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get dark theme colors
    const colors = getThemeColors(wrapperRef.current)

    // Clear canvas with dark background
    ctx.fillStyle = colors?.bg || '#0b0f14'
    ctx.fillRect(0, 0, width, height)

    // Set up drawing parameters
    ctx.lineWidth = 2.5 // Slightly thicker for dark theme
    ctx.font = '16px Arial'

    // Draw road intersection (with faint grid) - respects safe bounds
    drawIntersection(ctx, width, height, colors, B)
    
    // Draw traffic light (improved placement + glowing) - clamped
    drawTrafficLight(ctx, normalizedSignal, width, height, colors, B)
    
    // Draw oncoming car (with urgency indicator + glow) - clamped
    drawOncomingCar(ctx, trial.oncoming_car_ttc, width, height, colors, B)
    
    // Draw pedestrian if present - clamped
    if (trial.pedestrian === 'CROSSING') {
      drawPedestrian(ctx, width, height, colors, B)
    }

    // Draw crosswalk (bright but not glaring) - respects safe bounds
    drawCrosswalk(ctx, width, height, colors, B)

  }, [trial, width, height, normalizedSignal, B.x, B.y, B.w, B.h])

  const drawIntersection = (ctx: CanvasRenderingContext2D, w: number, h: number, colors: any, bounds: Bounds) => {
    // Center within safe bounds
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    
    // Main road (horizontal) - dark slate, respects bounds
    ctx.strokeStyle = colors?.road || '#1c2532'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(bounds.x, cy)
    ctx.lineTo(bounds.x + bounds.w, cy)
    ctx.stroke()

    // Cross road (vertical), respects bounds
    ctx.beginPath()
    ctx.moveTo(cx, bounds.y)
    ctx.lineTo(cx, bounds.y + bounds.h)
    ctx.stroke()

    // Lane markings (very faint - barely visible)
    ctx.strokeStyle = colors?.lane || '#3a4352'
    ctx.globalAlpha = 0.04 // Extremely faint
    ctx.lineWidth = 1
    ctx.setLineDash([10, 10])
    
    // Horizontal lane markings
    ctx.beginPath()
    ctx.moveTo(0, h * 0.4)
    ctx.lineTo(w, h * 0.4)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(0, h * 0.6)
    ctx.lineTo(w, h * 0.6)
    ctx.stroke()

    // Vertical lane markings
    ctx.beginPath()
    ctx.moveTo(w * 0.4, 0)
    ctx.lineTo(w * 0.4, h)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(w * 0.6, 0)
    ctx.lineTo(w * 0.6, h)
    ctx.stroke()

    ctx.setLineDash([])
    ctx.globalAlpha = 1.0 // Reset opacity
  }

  const drawTrafficLight = (ctx: CanvasRenderingContext2D, signal: string, w: number, h: number, colors: any, bounds: Bounds) => {
    // Position on ego approach side (top-left from ego POV), within safe bounds
    const SIG_W = 28, SIG_H = 95; // Signal dimensions including pole + label
    const desiredX = bounds.x + bounds.w * 0.35
    const desiredY = bounds.y + bounds.h * 0.15
    
    // Clamp signal to safe bounds
    const sigClamped = clampRectToBounds(desiredX - SIG_W/2, desiredY, SIG_W, SIG_H, bounds);
    const x = sigClamped.x + SIG_W/2; // Center X
    const y = sigClamped.y + 20; // Y for signal top
    
    const radius = 18 // Slightly larger

    // Traffic light pole (dark slate)
    ctx.strokeStyle = colors?.signalBody || '#0f172a'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(x, y + 60)
    ctx.lineTo(x, y - 20)
    ctx.stroke()

    // Traffic light box (very dark housing)
    ctx.fillStyle = colors?.signalBody || '#0f172a'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 2
    ctx.fillRect(x - 22, y - 22, 44, 88)
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Light circles
    const lights = [
      { color: '#ff0000', y: y - 10 }, // Red
      { color: '#ffff00', y: y + 10 }, // Yellow
      { color: '#00ff00', y: y + 30 }  // Green
    ]

    lights.forEach((light, index) => {
      // Determine which light is active based on signal
      let isActive = false
      if (signal === 'RED' && index === 0) isActive = true
      if (signal === 'YELLOW_FLASH' && index === 1) isActive = true
      if ((signal === 'GREEN_ARROW' || signal === 'GREEN') && index === 2) isActive = true
      if (signal === 'NO_LEFT_TURN' && index === 0) isActive = true

      ctx.beginPath()
      ctx.arc(x, light.y, radius, 0, 2 * Math.PI)

      if (isActive) {
        // Active lens - bright with glow halo
        const themeColor = index === 0 ? colors?.signalRed : 
                          index === 1 ? colors?.signalYellow : 
                          colors?.signalGreen;
        ctx.fillStyle = themeColor || light.color
        
        // Outer glow/halo
        ctx.shadowColor = themeColor || light.color
        ctx.shadowBlur = 16
        ctx.fill()
        
        // Inner bright fill
        ctx.shadowBlur = 0
        ctx.fillStyle = themeColor || light.color
        ctx.fill()
        
        // Subtle outline for definition
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else {
        // Inactive lens - dark
        ctx.fillStyle = '#1a1a1a'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })

    // Draw arrow for green arrow signal (shape + color + glow)
    if (signal === 'GREEN_ARROW') {
      const arrowColor = colors?.signalGreen || '#34d399'
      ctx.fillStyle = arrowColor
      ctx.shadowColor = arrowColor
      ctx.shadowBlur = 14
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('←', x, y + 54)
      ctx.shadowBlur = 0
      
      // Arrow label
      ctx.font = '10px Arial'
      ctx.fillStyle = colors?.text || '#e5e7eb'
      ctx.fillText('ARROW', x, y + 70)
    }

    // Draw "No Left Turn" sign (red ring + prohibition symbol + 🚫)
    if (signal === 'NO_LEFT_TURN') {
      const redColor = colors?.signalRed || '#f87171'
      ctx.strokeStyle = redColor
      ctx.shadowColor = redColor
      ctx.shadowBlur = 12
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.arc(x, y + 54, 20, 0, 2 * Math.PI)
      ctx.stroke()
      
      // Diagonal slash
      ctx.beginPath()
      ctx.moveTo(x - 14, y + 40)
      ctx.lineTo(x + 14, y + 68)
      ctx.stroke()
      ctx.shadowBlur = 0
      
      // Label text
      ctx.fillStyle = redColor
      ctx.font = 'bold 9px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('NO LEFT', x, y + 82)
    }
  }

  const drawOncomingCar = (ctx: CanvasRenderingContext2D, ttc: number, w: number, h: number, colors: any, bounds: Bounds) => {
    // Car position based on TTC (closer = more urgent), within safe bounds
    const maxDistance = bounds.w * 0.4
    const minDistance = bounds.w * 0.1
    const urgency = Math.max(0, Math.min(1, (CONFIG.TTC_THRESHOLD_SEC - ttc) / CONFIG.TTC_THRESHOLD_SEC))
    const distance = maxDistance - (urgency * (maxDistance - minDistance))
    
    const cx = bounds.x + bounds.w * 0.5;
    const cy = bounds.y + bounds.h * 0.5;
    
    // Desired position
    const desiredX = cx + distance
    const desiredY = cy
    
    // Clamp to bounds
    const carW = 44, carH = 22;
    const carClamped = clampRectToBounds(desiredX - carW/2, desiredY - carH/2, carW, carH, bounds);
    const x = carClamped.x + carW/2;
    const y = carClamped.y + carH/2;

    // Car color based on urgency (with theme colors)
    const carColor = urgency > 0.5 ? (colors?.carUrgent || '#ef4444') : (colors?.carSafe || '#60a5fa')
    
    // Subtle focus glow around car
    ctx.shadowColor = 'rgba(255,255,255,0.25)'
    ctx.shadowBlur = 10

    // Car body (slightly larger)
    ctx.fillStyle = carColor
    ctx.fillRect(x - 18, y - 10, 36, 20)

    // Car windows
    ctx.fillStyle = 'rgba(135, 206, 235, 0.4)'
    ctx.fillRect(x - 15, y - 8, 30, 16)
    
    ctx.shadowBlur = 0

    // Wheels
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.arc(x - 12, y + 10, 4, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 12, y + 10, 4, 0, 2 * Math.PI)
    ctx.fill()

    // Motion trail if urgent
    if (urgency > 0.3) {
      ctx.strokeStyle = carColor
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(x + 18, y)
      ctx.lineTo(x + 35, y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // TTC indicator removed from canvas (will be overlay badge)
  }

  const drawPedestrian = (ctx: CanvasRenderingContext2D, w: number, h: number, colors: any, bounds: Bounds) => {
    // Position within safe bounds
    const PED_W = 18, PED_H = 50; // Include CROSSING label
    const desiredX = bounds.x + bounds.w * 0.3
    const desiredY = bounds.y + bounds.h * 0.5
    
    // Clamp to bounds
    const pedClamped = clampRectToBounds(desiredX - PED_W/2, desiredY - PED_H/2, PED_W, PED_H, bounds);
    const x = pedClamped.x + PED_W/2;
    const y = pedClamped.y + PED_H/2;

    // Pedestrian stick figure (light color for dark background)
    ctx.strokeStyle = colors?.text || '#e5e7eb'
    ctx.lineWidth = 3.5

    // Head
    ctx.beginPath()
    ctx.arc(x, y - 20, 9, 0, 2 * Math.PI)
    ctx.stroke()

    // Body
    ctx.beginPath()
    ctx.moveTo(x, y - 11)
    ctx.lineTo(x, y + 12)
    ctx.stroke()

    // Arms
    ctx.beginPath()
    ctx.moveTo(x, y - 4)
    ctx.lineTo(x - 9, y + 3)
    ctx.moveTo(x, y - 4)
    ctx.lineTo(x + 9, y + 3)
    ctx.stroke()

    // Legs
    ctx.beginPath()
    ctx.moveTo(x, y + 12)
    ctx.lineTo(x - 7, y + 23)
    ctx.moveTo(x, y + 12)
    ctx.lineTo(x + 7, y + 23)
    ctx.stroke()

    // Walking indicator (bright but not glaring)
    const warningColor = colors?.carUrgent || '#ef4444'
    ctx.fillStyle = warningColor
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.shadowColor = warningColor
    ctx.shadowBlur = 8
    ctx.fillText('CROSSING', x, y + 38)
    ctx.shadowBlur = 0
  }

  const drawCrosswalk = (ctx: CanvasRenderingContext2D, w: number, h: number, colors: any, bounds: Bounds) => {
    // Clean zebra crosswalk: perpendicular stripes (not L-shape stack), within safe bounds
    const crosswalkColor = colors?.crosswalk || '#cbd5e1';
    
    // Horizontal zebra crossing (pedestrian crosses vertically)
    drawZebraStripesCanvas(ctx, {
      x: bounds.x + bounds.w * 0.35,
      y: bounds.y + bounds.h * 0.42,
      length: bounds.w * 0.30,
      depth: bounds.h * 0.16,
      orientation: 'horizontal',
      stripes: 7,
      stripe: 5,
      gap: 9,
      color: crosswalkColor
    });
    
    // Vertical zebra crossing (pedestrian crosses horizontally)
    drawZebraStripesCanvas(ctx, {
      x: bounds.x + bounds.w * 0.42,
      y: bounds.y + bounds.h * 0.35,
      length: bounds.h * 0.30,
      depth: bounds.w * 0.16,
      orientation: 'vertical',
      stripes: 7,
      stripe: 5,
      gap: 9,
      color: crosswalkColor
    });
  }

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
        width={width}
        height={height}
        style={{ 
          border: '2px solid #1f2937',
          borderRadius: '12px',
          background: '#0b0f14',
          display: 'block'
        }}
        aria-label={`Traffic scene: ${normalizedSignal} signal, ${trial.oncoming_car_ttc.toFixed(1)}s TTC, ${trial.pedestrian === 'CROSSING' ? 'pedestrian crossing' : 'no pedestrian'}`}
      />
      
      {/* Ego vehicle + left-turn path overlay */}
      <LeftTurnAffordance showPath />
      
      {/* Motion chevrons (show if car is approaching quickly) */}
      <MotionChevrons x={carX} y={carY} visible={urgency > 0.2} />
      
      {/* TTC badge near oncoming car (dark chip, light text) - clamped to bounds */}
      <div style={{ 
        ...HUD.badge, 
        position:'absolute', 
        left: Math.max(B.x, Math.min(carX + 22, B.x + B.w - 90)), // Clamp horizontally (badge width ~86px)
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
