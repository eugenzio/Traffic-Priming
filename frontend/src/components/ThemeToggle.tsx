import React from 'react';
import { useTheme } from '../context/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      style={{
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        color: 'var(--page-fg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span role="img" aria-hidden="true">
        {theme === 'light' ? '☀️' : '🌙'}
      </span>
      <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
