import React from 'react';

export default function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div aria-label="progress" style={{ width: '100%' }}>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      <div style={{ marginTop: 'var(--space-2)', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--fg-subtle)' }}>
        Progress {value} / {max}
      </div>
    </div>
  );
}
