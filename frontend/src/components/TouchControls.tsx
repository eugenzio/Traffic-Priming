import React from 'react';
import type { Choice } from '../types';

interface TouchControlsProps {
  onChoice: (choice: Choice) => void;
  disabled?: boolean;
}

export default function TouchControls({ onChoice, disabled = false }: TouchControlsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-4)',
        width: '100%'
      }}
    >
      {/* Turn Left Button */}
      <button
        onClick={() => onChoice('turn_left')}
        disabled={disabled}
        className="btn btn-primary"
        style={{
          padding: 'var(--space-4)',
          fontSize: 'var(--fs-lg)',
          fontWeight: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          minHeight: '80px',
          touchAction: 'manipulation', // Optimize for touch
          WebkitTapHighlightColor: 'transparent', // Remove iOS tap highlight
          background: 'var(--success-bg)',
          color: 'var(--success-fg)',
          border: '2px solid var(--success-border, var(--success-fg))'
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Turn Left</span>
        <span style={{ fontSize: 'var(--fs-sm)', opacity: 0.8 }}>or press ←</span>
      </button>

      {/* Wait Button */}
      <button
        onClick={() => onChoice('wait')}
        disabled={disabled}
        className="btn"
        style={{
          padding: 'var(--space-4)',
          fontSize: 'var(--fs-lg)',
          fontWeight: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          minHeight: '80px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          background: 'var(--danger-bg)',
          color: 'var(--danger-fg)',
          border: '2px solid var(--danger-border, var(--danger-fg))'
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="6" width="12" height="12" />
        </svg>
        <span>Wait</span>
        <span style={{ fontSize: 'var(--fs-sm)', opacity: 0.8 }}>or press Space</span>
      </button>
    </div>
  );
}
