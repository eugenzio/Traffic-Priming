import React from 'react'

export interface ConditionPillProps {
  condition: 'No prime' | 'Priming'
  primeId?: string | null
}

export default function ConditionPill({ condition, primeId }: ConditionPillProps) {
  const isPriming = condition === 'Priming'

  // Hide pill entirely for control trials
  if (!isPriming || !primeId) {
    return null
  }

  return (
    <div
      role="status"
      aria-label={primeId}
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        borderRadius: '9999px',
        padding: '4px 12px',
        background: 'var(--accent-priming-bg)',
        color: 'var(--accent-priming-fg)',
        border: '1px solid',
        borderColor: 'var(--accent-priming-border)',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 10,
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      {primeId}
    </div>
  )
}
