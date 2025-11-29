import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Trial, Choice } from '../types';
import { CONFIG } from '../config';
import CanvasRenderer from './CanvasRenderer';
import SurveyLayout from './SurveyLayout';
import CanvasFrame from './CanvasFrame';
import Badge from './ui/Badge';
import TouchControls from './TouchControls';
import { Kbd } from './ResearchUI';
import PracticeFeedback from './PracticeFeedback';

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

export default function PracticeTrialScreen({
  trial,
  practiceNumber,
  onComplete
}: {
  trial: Trial;
  practiceNumber: number;
  onComplete: () => void;
}) {
  const [userChoice, setUserChoice] = useState<Choice | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const rtStart = useRef<number | null>(null);

  // Prime state (always inactive for practice)
  const [primeActive] = useState(false);

  // Initialize RT start time when trial loads
  useEffect(() => {
    rtStart.current = performance.now();
    setUserChoice(null);
    setShowFeedback(false);
  }, [trial]);

  // Handle choice (keyboard or touch)
  const handleChoice = (choice: Choice) => {
    if (showFeedback) return; // Disable input during feedback
    setUserChoice(choice);
    setShowFeedback(true);
  };

  // Keyboard handler
  useEffect(() => {
    if (showFeedback) return; // Disable input during feedback

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.code !== 'Space' && e.key !== ' ') return;
      e.preventDefault();
      const choice: Choice = e.key === 'ArrowLeft' ? 'turn_left' : 'wait';
      handleChoice(choice);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFeedback]);

  const handleContinue = () => {
    onComplete();
  };

  // Show feedback screen after user responds
  if (showFeedback && userChoice) {
    return (
      <PracticeFeedback
        trial={trial}
        userChoice={userChoice}
        onContinue={handleContinue}
        practiceNumber={practiceNumber}
      />
    );
  }

  // Show trial screen
  return (
    <SurveyLayout
      title="Practice Trial"
      subtitle={
        <p className="help" style={{ marginTop: 'var(--space-2)' }}>
          This is a practice trial. Make your decision, then you'll see if you were correct.
        </p>
      }
      progress={
        <div
          style={{
            display: 'inline-block',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--panel)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--fs-sm)',
            border: '1px solid var(--card-border)'
          }}
        >
          Practice {practiceNumber} of 3
        </div>
      }
      footerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--fs-sm)' }}>
          <Kbd>←</Kbd>
          <span>Turn left</span>
          <span style={{ color: 'var(--fg-subtle)' }}>·</span>
          <Kbd>Space</Kbd>
          <span>Wait</span>
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
        <div style={{ width: '100%', position: 'relative' }}>
          <CanvasRenderer
            trial={trial}
            anchorX="left"
            maxRightCropPx={160}
            primeActive={primeActive}
          />
        </div>
      </CanvasFrame>

      {/* Touch controls for mobile */}
      <div className="mobile-only" style={{ marginTop: 'var(--space-4)' }}>
        <TouchControls onChoice={handleChoice} disabled={showFeedback} />
      </div>
    </SurveyLayout>
  );
}
