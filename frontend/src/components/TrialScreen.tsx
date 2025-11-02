import React, { useEffect, useRef, useState } from 'react'
import type { TrialBlock, Trial, Choice } from '../types'
import { CONFIG } from '../config'
import { useExperiment } from '../context/ExperimentProvider'
import CanvasRenderer from './CanvasRenderer'
import SurveyLayout from './SurveyLayout'
import CanvasFrame from './CanvasFrame'
import ProgressBar from './ui/ProgressBar'
import Badge from './ui/Badge'
import { SceneLegend, Kbd } from './ResearchUI'
import { canLeftTurnNow } from '../utils/decision'
import { downloadCanvasSnapshot } from '../utils/canvasSnapshot'

// Safe bounds type for CanvasRenderer
type Bounds = { x: number; y: number; w: number; h: number };

// Helper to get signal badge variant
function getSignalVariant(signal: string): 'success' | 'warning' | 'danger' | 'default' {
  if (signal === 'GREEN_ARROW') return 'success';
  if (signal === 'YELLOW_FLASH') return 'warning';
  if (signal === 'RED' || signal === 'NO_LEFT_TURN') return 'danger';
  return 'default';
}

// Helper to format signal display
function formatSignal(signal: string): string {
  return signal.replace(/_/g, ' ');
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

  // Handler to download canvas snapshot
  const handleDownloadSnapshot = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const filename = `scene-${trial.scene_id}-${Date.now()}.png`
      downloadCanvasSnapshot(canvas, filename)
    }
  }

  // Initialize RT start time
  useEffect(() => {
    rtStart.current = performance.now()
  }, [trial])

  // Keyboard handler
  useEffect(() => {
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
  }, [block, trial, blockIdx, trialIdx, participant, submitLog, pushLocalLog, onNext])

  return (
    <SurveyLayout
      title="Turn left?"
      subtitle={
        <p className="help" style={{ marginTop: 'var(--space-2)' }}>
          Indicate your decision for this traffic scene
        </p>
      }
      progress={<ProgressBar value={currentTotalIndex} max={totalTrials} />}
      footerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--fs-sm)' }}>
          <Kbd>←</Kbd>
          <span>Turn left</span>
          <span style={{ color: 'var(--fg-subtle)' }}>·</span>
          <Kbd>Space</Kbd>
          <span>Wait</span>
        </div>
      }
      footerRight={
        <div className="help">
          Trial {currentTotalIndex} of {totalTrials}
        </div>
      }
    >
      {/* Scene info badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <Badge
          label="Signal"
          value={formatSignal(trial.signal)}
          variant={getSignalVariant(trial.signal)}
        />
        <Badge
          label="TTC"
          value={`${trial.oncoming_car_ttc.toFixed(1)} s`}
          variant={trial.oncoming_car_ttc < CONFIG.TTC_THRESHOLD_SEC ? 'danger' : 'default'}
        />
        <Badge
          label="Pedestrian"
          value={trial.pedestrian === 'CROSSING' ? 'Crossing' : 'None'}
          variant={trial.pedestrian === 'CROSSING' ? 'warning' : 'default'}
        />
      </div>

      <CanvasFrame>
        <div style={{ width: '100%' }}>
          <CanvasRenderer trial={trial} anchorX="left" maxRightCropPx={160} />
        </div>
      </CanvasFrame>

      <details style={{ marginTop: 'var(--space-4)', cursor: 'pointer' }}>
        <summary
          className="help"
          style={{
            padding: 'var(--space-2)',
            background: 'var(--panel)',
            borderRadius: 'var(--radius-sm)',
            listStylePosition: 'inside'
          }}
        >
          Scene details (optional)
        </summary>
        <div
          style={{
            marginTop: 'var(--space-2)',
            padding: 'var(--space-3)',
            background: 'var(--panel)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--card-border)'
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--fs-sm)' }}>
            <div><strong>Scene ID:</strong> {trial.scene_id}</div>
            <div><strong>Signal:</strong> {trial.signal.replace(/_/g, ' ')}</div>
            <div><strong>Oncoming vehicle TTC:</strong> {trial.oncoming_car_ttc.toFixed(1)} s</div>
            <div><strong>Pedestrian:</strong> {trial.pedestrian === 'CROSSING' ? 'Crossing' : 'None'}</div>
          </div>
          <button
            onClick={handleDownloadSnapshot}
            className="btn"
            style={{
              marginTop: 'var(--space-3)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download snapshot (PNG)
          </button>
        </div>
      </details>
    </SurveyLayout>
  )
}

/**
 * Determine the correct choice for a trial using improved spatial logic
 */
function judgeCorrect(trial: Trial): Choice {
  // Use typical canvas dimensions to compute intersection geometry
  // These values match the default canvas size in CanvasRenderer
  const canvasWidth = CONFIG.CANVAS_WIDTH * 1.2;
  const canvasHeight = CONFIG.CANVAS_HEIGHT * 1.2;
  const intersectionCenterX = canvasWidth / 2;
  const intersectionCenterY = canvasHeight / 2;

  // Road width as configured in CanvasRenderer
  const ROAD_WIDTH_RATIO = 0.3;
  const roadWidth = Math.min(canvasWidth, canvasHeight) * ROAD_WIDTH_RATIO;

  // Use new spatial decision logic
  const canTurn = canLeftTurnNow(trial, intersectionCenterX, intersectionCenterY, roadWidth);

  return canTurn ? 'turn_left' : 'wait';
}
