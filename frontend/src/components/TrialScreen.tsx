import React, { useEffect, useRef, useState } from 'react'
import type { TrialBlock, Trial, Choice } from '../types'
import { CONFIG } from '../config'
import { useExperiment } from '../context/ExperimentProvider'
import CanvasRenderer from './CanvasRenderer'

// ADD-ONLY HELPERS (UX improvements)

// 1) Progress label helper
function progressLabel(current: number, total: number) {
  return `Progress ${current} / ${total}`;
}

// 2) Auto-hide key-hint after first 3s (per block)
function useAutoHideHint(deps: any[] = [], ms = 3000) {
  const [show, setShow] = useState(true);
  useEffect(() => { 
    setShow(true); 
    const id = setTimeout(() => setShow(false), ms); 
    return () => clearTimeout(id); 
  }, deps);
  return { show, reveal: () => setShow(true) };
}

// 3) Style tokens (inline to avoid new CSS files)
const HUD = {
  hint: { fontSize: 14, opacity: 0.7, color: '#666' } as React.CSSProperties,
};

// 4) Compact header CSS helper - shrink top margins for full progress visibility
function ensureCompactTrialStyles() {
  if (document.getElementById('trial-compact-css')) return;
  const s = document.createElement('style');
  s.id = 'trial-compact-css';
  s.textContent = `
  .trial-header.compact h2 { margin: 8px 0 6px; }
  .trial-header.compact .progress-wrap { margin: 0 0 8px; }
  .trial-header.compact .progress-bar { height: 8px; }
  .trial-header.compact .progress-label { margin: 6px 0 0; }
  `;
  document.head.appendChild(s);
}

// 5) Viewport-aware height: compute remaining space from the scene's top
// Clamp to a sensible min and a vh-based cap to avoid oversized scenes
function useViewportAwareSceneHeight(
  sceneRef: React.RefObject<HTMLElement>,
  bottomGap = 24,   // breathing room (px)
  minPx = 420,      // minimum scene height (px)
  capVh = 0.68      // max height as a fraction of viewport height
) {
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    const apply = () => {
      const top = el.getBoundingClientRect().top;
      const avail = window.innerHeight - top - bottomGap;
      const maxByVh = Math.floor(window.innerHeight * capVh);
      const h = Math.max(minPx, Math.min(avail, maxByVh));
      el.style.height = `${h}px`;
      el.style.maxHeight = `${h}px`;
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, [sceneRef, bottomGap, minPx, capVh]);
}

// 6) Scene inset: add internal padding so nothing touches the rounded edges
function ensureSceneInsetStyles() {
  if (document.getElementById('scene-inset-css')) return;
  const s = document.createElement('style');
  s.id = 'scene-inset-css';
  s.textContent = `
    .canvas-container { position: relative; overflow: hidden; }
    .scene-inner {
      position: absolute;
      inset: var(--scene-inset, 16px);   /* top/right/bottom/left padding in one go */
      width: auto; height: auto;
    }
    .scene-inner > * { width: 100%; height: 100%; } /* CanvasRenderer/SVG fills inner box */
  `;
  document.head.appendChild(s);
}

// 7) Set the inset (px) via CSS var on the scene container
function applySceneInset(el: HTMLElement | null, inset = 16) {
  if (!el) return;
  el.style.setProperty('--scene-inset', `${inset}px`);
}

// 8) Clamp utility for overlay positions
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

// 9) Safe bounds type and computation
type Bounds = { x: number; y: number; w: number; h: number };

// Compute a hard "safe content" box inside the scene container
// Everything (cars, badges, signals, crosswalk ends) must stay within this box
function computeSafeBounds(container: HTMLElement, inset = 16, haloPad = 10): Bounds {
  const r = container.getBoundingClientRect();
  const pad = inset + haloPad; // leave space for glows/halos
  return { x: pad, y: pad, w: r.width - pad * 2, h: r.height - pad * 2 };
}

// 10) React hook: measure safe bounds and update on resize
function useSafeBounds(
  containerRef: React.RefObject<HTMLElement>,
  inset = 16,
  haloPad = 10
) {
  const [bounds, setBounds] = useState<Bounds>({ x: 0, y: 0, w: 0, h: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = () => setBounds(computeSafeBounds(el, inset, haloPad));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply, { passive: true });
    return () => { ro.disconnect(); window.removeEventListener('resize', apply); };
  }, [containerRef, inset, haloPad]);
  return bounds;
}

// 11) Clamp a rectangle into bounds (accounts for element size)
function clampRectToBounds(
  x: number, y: number, w: number, h: number, b: Bounds
) {
  const nx = clamp(x, b.x, b.x + b.w - w);
  const ny = clamp(y, b.y, b.y + b.h - h);
  return { x: nx, y: ny };
}

export default function TrialScreen({
  block,
  trial,
  blockIdx,
  trialIdx,
  onNext,
  uiBlockNumber,
  currentTotalIndex,
  totalTrials,
  progressPercent
}: {
  block: TrialBlock
  trial: Trial
  blockIdx: number
  trialIdx: number
  onNext: () => void
  uiBlockNumber: number
  currentTotalIndex: number
  totalTrials: number
  progressPercent: number
}) {
  const { submitLog, participant, pushLocalLog } = useExperiment()
  const rtStart = useRef<number | null>(null)
  const { show: showHint, reveal } = useAutoHideHint([blockIdx])
  
  // Ref for viewport-aware scene sizing
  const sceneRef = useRef<HTMLDivElement | null>(null)
  
  // Measure safe content area (hard bounds for all visual elements)
  const safeBounds = useSafeBounds(sceneRef, 16, 10)
  
  // Apply compact header styles and scene inset on mount
  useEffect(() => {
    ensureCompactTrialStyles();
    ensureSceneInsetStyles();
  }, [])
  
  // Apply inset to scene container
  useEffect(() => {
    applySceneInset(sceneRef.current, 16);
  }, [])
  
  // Viewport-aware sizing: calculate from scene's actual top position
  // Account for inset in bottom gap
  useViewportAwareSceneHeight(sceneRef, 40, 420, 0.68)

  useEffect(() => {
    rtStart.current = performance.now()
    const onKey = async (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.code !== 'Space' && e.key !== ' ') return
      const choice: Choice = e.key === 'ArrowLeft' ? 'turn_left' : 'wait'
      const rt = rtStart.current ? Math.round(performance.now() - rtStart.current) : 0
      const correctChoice = judgeCorrect(trial)
      const logRow = {
        participant_id: participant?.participant_id || 'anon',
        age: (participant?.age ?? 0) as number,
        gender: (participant?.gender ?? 'Prefer not to say') as string,
        drivers_license: (participant?.drivers_license ?? false) as boolean,
        learners_permit: (participant?.learners_permit ?? false) as boolean,
        region_ga: ((participant as any)?.region_ga ?? 'Outside of Georgia') as string,
        county_ga: ((participant as any)?.county_ga ?? 'Outside of Georgia') as any,

        block_idx: blockIdx,
        prime_type: block.prime_type,
        trial_idx: trialIdx,
        scene_id: trial.scene_id,
        signal: trial.signal,
        oncoming_car_ttc: trial.oncoming_car_ttc,
        pedestrian: trial.pedestrian,
        choice,
        correct: (choice === correctChoice ? 1 : 0) as 0 | 1,
        rt_ms: rt,
        displayed_at_ms: Math.round(rtStart.current!),
        responded_at_ms: Math.round(performance.now()),
        focus_lost: (document.hasFocus() ? 0 : 1) as 0 | 1,
        seed: 0
      };
      await submitLog(logRow)
      
      // Mirror log locally
      pushLocalLog(logRow);
      
      onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [block, trial, blockIdx, trialIdx, participant, submitLog, onNext])

  return (
    <div className="card">
      <div className="trial-header compact" style={{ marginTop: 4, marginBottom: 6 }}>
        <h2 style={{ margin: '6px 0 4px' }}>Should you turn left now?</h2>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e5e7eb', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.round(progressPercent * 100)}%`,
              height: '100%',
              backgroundColor: '#059669',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p className="progress-label" style={{ textAlign: 'center', margin: '6px 0 0', fontSize: '14px', color: '#666' }}>
            {progressLabel(currentTotalIndex, totalTrials)}
          </p>
        </div>
      </div>

      <div ref={sceneRef} className="canvas-container" style={{ overflow: 'hidden' }}>
        <div className="scene-inner">
          <CanvasRenderer trial={trial} safeBounds={safeBounds} />
        </div>
      </div>

      {showHint && (
        <div 
          style={{...HUD.hint, textAlign: 'center', marginTop: 12}}
          onMouseEnter={reveal}
        >
          Press ← to turn left · Space to wait
        </div>
      )}

      <details style={{ marginTop: 12, fontSize: 13, opacity: 0.7, cursor: 'pointer' }}>
        <summary style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          Scene details (optional)
        </summary>
        <div style={{ 
          marginTop: '8px', 
          padding: '12px', 
          backgroundColor: '#f8fafc', 
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666'
        }}>
          <strong>Signal:</strong> {trial.signal.replace('_', ' ')}<br />
          <strong>Oncoming Car TTC:</strong> {trial.oncoming_car_ttc.toFixed(1)}s<br />
          <strong>Pedestrian:</strong> {trial.pedestrian === 'CROSSING' ? 'Crossing' : 'None'}
        </div>
      </details>
    </div>
  )
}

// Keep rule logic (unchanged)
function judgeCorrect(trial: Trial): Choice {
  if (trial.signal === 'RED' || trial.signal === 'NO_LEFT_TURN') return 'wait'
  if (trial.oncoming_car_ttc < CONFIG.TTC_THRESHOLD_SEC) return 'wait'
  if (trial.pedestrian === 'CROSSING') return 'wait'
  return 'turn_left'
}
