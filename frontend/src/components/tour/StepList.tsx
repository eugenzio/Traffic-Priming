import React from 'react';
import { UI_LIGHT } from '../../styles/uiTheme';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  targetId: string;
  preferredSide?: 'n' | 's' | 'e' | 'w';
}

export interface StepListProps {
  steps: TourStep[];
  current: number;
  onChange: (stepIndex: number) => void;
}

/**
 * Right-side checklist of tour steps.
 * Users can click to jump to any step. Current step is highlighted.
 */
export function StepList({ steps, current, onChange }: StepListProps) {
  return (
    <div
      role="navigation"
      aria-label="Tour steps"
      className="tour-panel tour-checklist"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        padding: '16px'
      }}
    >
      <h3
        className="tour-step-title"
        style={{
          margin: 0,
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--fg-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        Interface Components
      </h3>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {steps.map((step, index) => {
          const isCurrent = index === current;
          const isCompleted = index < current;

          return (
            <li key={step.id}>
              <button
                onClick={() => onChange(index)}
                aria-current={isCurrent ? 'step' : undefined}
                className="row"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'var(--card-bg)',
                  border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                  borderRadius: '6px',
                  color: 'var(--fg)',
                  fontSize: '13px',
                  fontWeight: isCurrent ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = 'var(--input-disabled-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = 'var(--card-bg)';
                  }
                }}
              >
                {/* Checkbox/status indicator */}
                <div
                  className="radio"
                  aria-checked={isCompleted ? 'true' : undefined}
                  style={{
                    flexShrink: 0,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: isCompleted ? '2px solid var(--accent)' : '2px solid var(--card-border)',
                    background: isCompleted ? 'var(--accent)' : isCurrent ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'var(--card-bg)'
                  }}
                >
                  {isCompleted && '✓'}
                  {isCurrent && !isCompleted && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--card-bg)'
                      }}
                    />
                  )}
                </div>
                <span style={{ flex: 1 }}>{step.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
