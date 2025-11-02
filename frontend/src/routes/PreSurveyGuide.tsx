import React, { useState, useRef, useEffect } from 'react';
import CanvasRenderer, { computeTourAnchors } from '../components/CanvasRenderer';
import { CanvasTourOverlay } from '../components/tour/CanvasTourOverlay';
import { StepList, type TourStep } from '../components/tour/StepList';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Trial } from '../types';

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
    title: 'Oncoming vehicle',
    targetId: 'oncomingCar',
    body: 'The white car approaches from the right (east) toward the intersection.',
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
    <div
      style={{
        minHeight: '100vh',
        background: '#0b0f14',
        color: '#e5e7eb',
        padding: '40px 20px'
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1
            id="tour-title"
            style={{
              margin: 0,
              marginBottom: '16px',
              fontSize: '32px',
              fontWeight: 700,
              color: '#ffffff'
            }}
          >
            How this interface works
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              color: '#9ca3af',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}
          >
            Take a quick tour to understand the traffic scene components you'll encounter in this
            study. Use the arrows to navigate, or click any item in the checklist to jump directly.
          </p>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth >= 1024 ? '1fr 320px' : '1fr',
            gap: '24px',
            marginBottom: '24px'
          }}
        >
          {/* Canvas container */}
          <div>
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
                height: '450px',
                background: '#1f2937',
                borderRadius: '12px',
                overflow: 'hidden'
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
          <div style={{ marginBottom: '24px' }}>
            <StepList steps={tourSteps} current={currentStep} onChange={setCurrentStep} />
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            background: '#111827',
            borderRadius: '8px',
            border: '1px solid #374151'
          }}
        >
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              background: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#e5e7eb',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#9ca3af',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={hasSeenTour}
              onChange={(e) => setHasSeenTour(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Don't show this guide again
          </label>

          <button
            onClick={handleSkip}
            style={{
              padding: '12px 24px',
              background: '#10b981',
              border: '1px solid #059669',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Start Survey →
          </button>
        </div>
      </div>
    </div>
  );
}
