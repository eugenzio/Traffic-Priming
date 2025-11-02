import React, { useEffect, useCallback } from 'react';
import type { Anchor } from '../CanvasRenderer';
import { Callout } from './Callout';
import { UI_LIGHT } from '../../styles/uiTheme';
import type { TourStep } from './StepList';

export interface CanvasTourOverlayProps {
  anchors: Record<string, Anchor>;
  steps: TourStep[];
  current: number;
  onChange: (stepIndex: number) => void;
  onFinish: () => void;
  bounds: { x: number; y: number; w: number; h: number };
}

/**
 * SVG overlay that renders interactive tour callouts with arrows pointing to canvas elements.
 * Supports keyboard navigation and accessibility features.
 */
export function CanvasTourOverlay({
  anchors,
  steps,
  current,
  onChange,
  onFinish,
  bounds
}: CanvasTourOverlayProps) {
  const currentStep = steps[current];
  const anchor = currentStep ? anchors[currentStep.targetId] : null;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (current > 0) {
            onChange(current - 1);
            e.preventDefault();
          }
          break;
        case 'ArrowRight':
          if (current < steps.length - 1) {
            onChange(current + 1);
            e.preventDefault();
          }
          break;
        case 'Escape':
          onFinish();
          e.preventDefault();
          break;
      }
    },
    [current, steps.length, onChange, onFinish]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!currentStep || !anchor) return null;

  const side = currentStep.preferredSide || 'e';

  return (
    <div
      role="region"
      aria-labelledby="tour-title"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {/* SVG layer for arrows */}
      <svg
        width={bounds.w}
        height={bounds.h}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
            fill="#60a5fa"
          >
            <polygon points="0 0, 10 5, 0 10" />
          </marker>
        </defs>

        {/* Focus ring around target */}
        <circle
          cx={anchor.x}
          cy={anchor.y}
          r="32"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="3"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            values="28;36;28"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;0.8;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Arrow from callout to anchor */}
        <Arrow
          from={getCalloutAnchorPoint(anchor, side)}
          to={{ x: anchor.x, y: anchor.y }}
        />
      </svg>

      {/* Callout card */}
      <Callout
        title={currentStep.title}
        body={currentStep.body}
        x={anchor.x}
        y={anchor.y}
        side={side}
        stepNumber={current + 1}
        totalSteps={steps.length}
      />

      {/* Navigation controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={() => onChange(Math.max(0, current - 1))}
          disabled={current === 0}
          style={{
            padding: '10px 20px',
            background: current === 0 ? '#f9fafb' : '#ffffff',
            border: `1px solid ${UI_LIGHT.panelBorder}`,
            borderRadius: '6px',
            color: current === 0 ? UI_LIGHT.subtext : UI_LIGHT.text,
            fontSize: '14px',
            fontWeight: 600,
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            outline: 'none'
          }}
          onFocus={(e) => {
            if (current !== 0) {
              e.currentTarget.style.outlineColor = UI_LIGHT.focus;
              e.currentTarget.style.outline = `2px solid ${UI_LIGHT.focus}`;
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          ← Previous
        </button>

        <button
          onClick={onFinish}
          style={{
            padding: '10px 20px',
            background: '#ffffff',
            border: `1px solid ${UI_LIGHT.panelBorder}`,
            borderRadius: '6px',
            color: UI_LIGHT.text,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.currentTarget.style.outlineColor = UI_LIGHT.focus;
            e.currentTarget.style.outline = `2px solid ${UI_LIGHT.focus}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          Skip Guide
        </button>

        {current < steps.length - 1 ? (
          <button
            onClick={() => onChange(current + 1)}
            style={{
              padding: '10px 20px',
              background: '#ffffff',
              border: `1px solid ${UI_LIGHT.panelBorder}`,
              borderRadius: '6px',
              color: UI_LIGHT.text,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outlineColor = UI_LIGHT.focus;
              e.currentTarget.style.outline = `2px solid ${UI_LIGHT.focus}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={onFinish}
            style={{
              padding: '10px 20px',
              background: UI_LIGHT.chipBg,
              border: `1px solid ${UI_LIGHT.chipBg}`,
              borderRadius: '6px',
              color: UI_LIGHT.chipFg,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outlineColor = UI_LIGHT.focus;
              e.currentTarget.style.outline = `2px solid ${UI_LIGHT.focus}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            Start Survey →
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Calculate where the arrow should start from based on callout position
 */
function getCalloutAnchorPoint(
  anchor: { x: number; y: number },
  side: 'n' | 's' | 'e' | 'w'
): { x: number; y: number } {
  const offset = 24;

  switch (side) {
    case 'n':
      return { x: anchor.x, y: anchor.y - offset };
    case 's':
      return { x: anchor.x, y: anchor.y + offset };
    case 'e':
      return { x: anchor.x + offset, y: anchor.y };
    case 'w':
      return { x: anchor.x - offset, y: anchor.y };
  }
}

/**
 * SVG arrow component
 */
function Arrow({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  // Calculate control point for a slight curve
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const ctrlX = from.x + dx * 0.5;
  const ctrlY = from.y + dy * 0.5 - 20;

  return (
    <path
      d={`M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY}, ${to.x} ${to.y}`}
      stroke="#60a5fa"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
      opacity="0.8"
    />
  );
}
