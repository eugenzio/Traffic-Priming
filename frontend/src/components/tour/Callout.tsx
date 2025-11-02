import React from 'react';

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
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        transform,
        width: `${cardWidth}px`,
        padding: `${cardPadding}px`,
        background: '#1f2937',
        border: '2px solid #60a5fa',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        color: '#e5e7eb',
        fontSize: '14px',
        lineHeight: '1.5',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      {stepNumber !== undefined && totalSteps !== undefined && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#9ca3af',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Step {stepNumber} of {totalSteps}
        </div>
      )}
      <h3
        style={{
          margin: 0,
          marginBottom: '8px',
          fontSize: '16px',
          fontWeight: 700,
          color: '#ffffff'
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: '14px',
          color: '#d1d5db'
        }}
      >
        {body}
      </p>
    </div>
  );
}
