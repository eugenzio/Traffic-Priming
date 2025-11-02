import React from 'react';
import { UI_LIGHT } from '../../styles/uiTheme';

export interface CalloutProps {
  title: string;
  body: string;
  x: number;
  y: number;
  side?: 'n' | 's' | 'e' | 'w';
  stepNumber?: number;
  totalSteps?: number;
}

/**
 * Callout card component that positions itself adjacent to a point based on the preferred side.
 * High-contrast styling for visibility over dark canvas backgrounds.
 */
export function Callout({ title, body, x, y, side = 'e', stepNumber, totalSteps }: CalloutProps) {
  const cardWidth = 280;
  const cardPadding = 16;
  const offset = 24; // Distance from anchor point

  // Calculate position based on side
  let left = x;
  let top = y;
  let transform = '';

  switch (side) {
    case 'n':
      left = x;
      top = y - offset;
      transform = 'translate(-50%, -100%)';
      break;
    case 's':
      left = x;
      top = y + offset;
      transform = 'translate(-50%, 0)';
      break;
    case 'e':
      left = x + offset;
      top = y;
      transform = 'translate(0, -50%)';
      break;
    case 'w':
      left = x - offset;
      top = y;
      transform = 'translate(-100%, -50%)';
      break;
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-atomic="true"
      className="tour-step-card"
      data-role="tour-card"
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        transform,
        maxWidth: '320px',
        padding: '14px',
        background: 'var(--card-bg)',
        color: 'var(--fg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        fontSize: '14px',
        lineHeight: '1.5',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      {stepNumber !== undefined && totalSteps !== undefined && (
        <div
          className="tour-hint"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--fg-subtle)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Step {stepNumber} of {totalSteps}
        </div>
      )}
      <h3
        className="tour-step-title"
        style={{
          margin: 0,
          marginBottom: '8px',
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--fg)'
        }}
      >
        {title}
      </h3>
      <p
        className="tour-desc"
        style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--fg-subtle)'
        }}
      >
        {body}
      </p>
    </div>
  );
}
