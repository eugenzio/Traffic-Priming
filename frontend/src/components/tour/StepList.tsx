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
      style={{
        background: UI_LIGHT.panelBg,
        border: `1px solid ${UI_LIGHT.panelBorder}`,
        borderRadius: '12px',
        boxShadow: UI_LIGHT.shadow,
        padding: '16px'
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 600,
          color: UI_LIGHT.subtext,
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
                  background: isCurrent ? '#ffffff' : '#ffffff',
                  border: isCurrent ? `2px solid ${UI_LIGHT.focus}` : `1px solid ${UI_LIGHT.panelBorder}`,
                  borderRadius: '6px',
                  color: UI_LIGHT.text,
                  fontSize: '13px',
                  fontWeight: isCurrent ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = UI_LIGHT.panelBorder;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = UI_LIGHT.panelBorder;
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
                    border: isCompleted ? '2px solid #10b981' : `2px solid ${UI_LIGHT.panelBorder}`,
                    background: isCompleted ? '#10b981' : isCurrent ? UI_LIGHT.focus : 'transparent',
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
