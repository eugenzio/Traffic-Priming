import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import CanvasRenderer, { computeTourAnchors } from '../components/CanvasRenderer';
import { CanvasTourOverlay } from '../components/tour/CanvasTourOverlay';
import { StepList, type TourStep } from '../components/tour/StepList';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Trial } from '../types';
import { pageVariants, pageVariantsReduced } from '../motion/tokens';

const TOUR_VERSION = 'v1';
const TOUR_STORAGE_KEY = `tp.hasSeenTour.${TOUR_VERSION}`;

// Sample trial for the guide
const sampleTrial: Trial = {
  scene_id: 'guide-sample',
  signal: 'GREEN_ARROW',
  oncoming_car_ttc: 2.0,
  pedestrian: 'CROSSING',
  correct: 'wait' // With pedestrian crossing, should wait
};

// Define tour steps
const tourSteps: TourStep[] = [
  {
    id: 'light',
    title: 'Traffic light',
    targetId: 'trafficLight',
    body: 'This housing contains three lenses. Only one is active at a time.',
    preferredSide: 'e'
  },
  {
    id: 'state',
    title: 'Signal state',
    targetId: 'signalLens',
    body: 'Green arrow means protected left. Yellow warns of change. Red forbids proceeding. "No Left Turn" is a special prohibition.',
    preferredSide: 'e'
  },
  {
    id: 'car',
    title: 'Oncoming car',
    targetId: 'oncomingCar',
    body: 'This white car is coming from the opposite direction. You are the one making the left turn.',
    preferredSide: 's'
  },
  {
    id: 'ttc',
    title: 'TTC badge',
    targetId: 'ttcBadge',
    body: 'Time-to-Collision estimates seconds until the oncoming car reaches the conflict point.',
    preferredSide: 'n'
  },
  {
    id: 'chevrons',
    title: 'Motion chevrons',
    targetId: 'chevrons',
    body: 'These chevrons hint speed/urgency. They appear when approach is fast enough.',
    preferredSide: 'w'
  },
  {
    id: 'lanes',
    title: 'Lane centerlines',
    targetId: 'lanesH',
    body: 'Dashed white lines mark the center of each lane outside the intersection box.',
    preferredSide: 's'
  },
  {
    id: 'edges',
    title: 'Road edges',
    targetId: 'roadEdges',
    body: 'Yellow edge lines indicate pavement boundaries around the intersection.',
    preferredSide: 'e'
  },
  {
    id: 'cwN',
    title: 'North crosswalk',
    targetId: 'crosswalkN',
    body: 'Pedestrian path across the west–east lanes on the north side.',
    preferredSide: 'n'
  },
  {
    id: 'cwS',
    title: 'South crosswalk',
    targetId: 'crosswalkS',
    body: 'Mirror of the north crosswalk on the south side.',
    preferredSide: 's'
  },
  {
    id: 'ped',
    title: 'Pedestrian crossing',
    targetId: 'crossingTxt',
    body: 'When a pedestrian is mid-crossing, "CROSSING" shows. Yield appropriately.',
    preferredSide: 's'
  },
  {
    id: 'vignette',
    title: 'Attention vignette',
    targetId: 'vignette',
    body: 'A subtle vignette focuses your attention on the center of the scene.',
    preferredSide: 'e'
  }
];

interface PreSurveyGuideProps {
  onBack: () => void;
  onContinue: () => void;
}

export default function PreSurveyGuide({ onBack, onContinue }: PreSurveyGuideProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hasSeenTour, setHasSeenTour] = useLocalStorage(TOUR_STORAGE_KEY, false);
  const [currentStep, setCurrentStep] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 450 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure canvas container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Compute anchors
  const anchors = computeTourAnchors(canvasSize.width, canvasSize.height, sampleTrial);

  const handleFinish = () => {
    setHasSeenTour(true);
    onContinue();
  };

  const handleSkip = () => {
    setHasSeenTour(true);
    onContinue();
  };

  return (
    <motion.main
      className="page tour-shell"
      variants={prefersReducedMotion ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        background: 'var(--bg)',
        color: 'var(--fg)',
        minHeight: '100vh',
        padding: 'var(--space-8) var(--space-6)'
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1
            id="tour-title"
            style={{
              margin: 0,
              marginBottom: 'var(--space-4)',
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--fs-3xl)',
              fontWeight: 700,
              color: 'var(--fg)',
              letterSpacing: '-0.01em'
            }}
          >
            Interface Tour
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-md)',
              color: 'var(--fg-muted)',
              maxWidth: '720px',
              lineHeight: 'var(--lh-relaxed)'
            }}
          >
            Review the traffic scene components you will encounter in this study. Navigate using the
            arrows below, or click any item in the checklist to jump directly to that component.
          </p>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth >= 1024 ? '1fr 320px' : '1fr',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-6)'
          }}
        >
          {/* Canvas container */}
          <div>
            <div
              ref={containerRef}
              className="card"
              style={{
                position: 'relative',
                width: '100%',
                height: '450px',
                overflow: 'hidden',
                padding: 0
              }}
            >
              <CanvasRenderer
                trial={sampleTrial}
                width={canvasSize.width}
                height={canvasSize.height}
              />
              <CanvasTourOverlay
                anchors={anchors}
                steps={tourSteps}
                current={currentStep}
                onChange={setCurrentStep}
                onFinish={handleFinish}
                bounds={{ x: 0, y: 0, w: canvasSize.width, h: canvasSize.height }}
              />
            </div>
            <div className="help" style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
              Use arrow keys or click checklist items to navigate
            </div>
          </div>

          {/* Step list (desktop) */}
          {window.innerWidth >= 1024 && (
            <div>
              <StepList steps={tourSteps} current={currentStep} onChange={setCurrentStep} />
            </div>
          )}
        </div>

        {/* Step list (mobile/tablet) */}
        {window.innerWidth < 1024 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <StepList steps={tourSteps} current={currentStep} onChange={setCurrentStep} />
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-4)',
            background: 'var(--panel)',
            borderTop: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <button
            onClick={onBack}
            className="btn btn-ghost"
          >
            ← Back
          </button>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasSeenTour}
              onChange={(e) => setHasSeenTour(e.target.checked)}
            />
            Don't show guide again
          </label>

          <button
            onClick={handleSkip}
            className="btn btn-primary"
          >
            Start survey →
          </button>
        </div>
      </div>
    </motion.main>
  );
}
