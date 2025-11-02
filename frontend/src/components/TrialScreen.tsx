import React, { useEffect, useRef, useState } from 'react'
import type { TrialBlock, Trial, Choice } from '../types'
import { CONFIG } from '../config'
import { useExperiment } from '../context/ExperimentProvider'
import CanvasRenderer from './CanvasRenderer'
import SurveyLayout from './SurveyLayout'
import CanvasFrame from './CanvasFrame'
import ProgressBar from './ui/ProgressBar'
import Badge from './ui/Badge'
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
      title="Should you turn left now?"
      progress={<ProgressBar value={currentTotalIndex} max={totalTrials} />}
      footerLeft={
        <div className="flex items-center gap-3 text-sm">
          <kbd className="kbd">←</kbd>
          <span>Turn left</span>
          <span className="text-gray-300">·</span>
          <kbd className="kbd">Space</kbd>
          <span>Wait</span>
        </div>
      }
      footerRight={
        <div className="text-xs text-gray-400">
          Trial {currentTotalIndex} of {totalTrials}
        </div>
      }
    >
      {/* Scene info badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge
          label="Signal"
          value={formatSignal(trial.signal)}
          variant={getSignalVariant(trial.signal)}
        />
        <Badge
          label="TTC"
          value={`${trial.oncoming_car_ttc.toFixed(1)}s`}
          variant={trial.oncoming_car_ttc < CONFIG.TTC_THRESHOLD_SEC ? 'danger' : 'default'}
        />
        <Badge
          label="Pedestrian"
          value={trial.pedestrian === 'CROSSING' ? 'Crossing' : 'None'}
          variant={trial.pedestrian === 'CROSSING' ? 'warning' : 'default'}
        />
      </div>

      <CanvasFrame>
        <div className="w-full">
          <CanvasRenderer trial={trial} anchorX="left" maxRightCropPx={160} />
        </div>
      </CanvasFrame>

      <details className="mt-4 text-sm text-gray-500 cursor-pointer">
        <summary className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          Scene details (optional)
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
          <div><strong>Scene ID:</strong> {trial.scene_id}</div>
          <div><strong>Signal:</strong> {trial.signal.replace(/_/g, ' ')}</div>
          <div><strong>Oncoming Car TTC:</strong> {trial.oncoming_car_ttc.toFixed(1)}s</div>
          <div><strong>Pedestrian:</strong> {trial.pedestrian === 'CROSSING' ? 'Crossing' : 'None'}</div>
          <button
            onClick={handleDownloadSnapshot}
            className="mt-2 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Snapshot (PNG)
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
