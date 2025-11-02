import React from 'react';

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
      style={{
        padding: '16px',
        background: '#111827',
        borderRadius: '8px',
        border: '1px solid #374151'
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#9ca3af',
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
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: isCurrent ? '#1f2937' : 'transparent',
                  border: isCurrent ? '2px solid #60a5fa' : '1px solid #374151',
                  borderRadius: '6px',
                  color: isCurrent ? '#ffffff' : '#d1d5db',
                  fontSize: '13px',
                  fontWeight: isCurrent ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = '#1f2937';
                    e.currentTarget.style.borderColor = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#374151';
                  }
                }}
              >
                {/* Checkbox/status indicator */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: isCompleted ? '2px solid #10b981' : '2px solid #4b5563',
                    background: isCompleted ? '#10b981' : isCurrent ? '#60a5fa' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#ffffff'
                  }}
                >
                  {isCompleted && '✓'}
                  {isCurrent && !isCompleted && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ffffff'
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
