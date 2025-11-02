/**
 * Reusable research UI components
 * Clean, academic aesthetic with semantic naming
 */

import React from 'react';

/**
 * Section header with numbered title and optional aside
 */
export function SectionHeader({
  index,
  title,
  aside
}: {
  index?: number;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <h2 style={{ marginBottom: 'var(--space-2)' }}>
        {index !== undefined && `${index}. `}
        {title}
      </h2>
      {aside && <div className="help">{aside}</div>}
    </div>
  );
}

/**
 * Legend showing scene components with badges
 */
export function SceneLegend({ items }: { items: string[] }) {
  return (
    <div className="scene-legend">
      {items.map((item, i) => (
        <span key={i} className="badge">
          {item}
        </span>
      ))}
    </div>
  );
}

/**
 * Progress bar for trial/block progress
 */
export function ProgressBar({
  current,
  total,
  label
}: {
  current: number;
  total: number;
  label?: string;
}) {
  const percentage = (current / total) * 100;

  return (
    <div>
      {label && (
        <div
          className="help"
          style={{
            marginBottom: 'var(--space-2)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600
          }}
        >
          {label}
        </div>
      )}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={label || `Progress: ${current} of ${total}`}
        />
      </div>
    </div>
  );
}

/**
 * Notice/alert box for instructions or warnings
 */
export function Notice({
  title,
  children,
  variant = 'default'
}: {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'info' | 'warning';
}) {
  return (
    <div className="notice">
      {title && <div className="notice-title">{title}</div>}
      {children}
    </div>
  );
}

/**
 * Form field group with label
 */
export function FieldGroup({
  label,
  htmlFor,
  help,
  required,
  children
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <label htmlFor={htmlFor}>
        {label}
        {required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
      {help && <span className="help">{help}</span>}
    </div>
  );
}

/**
 * Keyboard shortcut display
 */
export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

/**
 * Export buttons group
 */
export function ExportButtons({
  onExportCSV,
  onExportPDF
}: {
  onExportCSV: () => void;
  onExportPDF?: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
      <button className="btn btn-ghost" onClick={onExportCSV}>
        Export CSV
      </button>
      {onExportPDF && (
        <button className="btn btn-ghost" onClick={onExportPDF}>
          Export PDF
        </button>
      )}
    </div>
  );
}

/**
 * Summary table for displaying trial results
 */
export function SummaryTable({
  data
}: {
  data: Array<{ label: string; value: string | number }>;
}) {
  return (
    <table className="table">
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td style={{ fontWeight: 600 }}>{row.label}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
