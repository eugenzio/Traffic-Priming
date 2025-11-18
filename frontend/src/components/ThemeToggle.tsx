import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../context/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const iconVariants = {
    initial: { rotate: 0, scale: 1 },
    animate: {
      rotate: prefersReducedMotion ? 0 : 180,
      scale: prefersReducedMotion ? 1 : [1, 0.95, 1],
      transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] }
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      style={{
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        color: 'var(--fg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <motion.span
        key={theme}
        role="img"
        aria-hidden="true"
        variants={iconVariants}
        initial="initial"
        animate="animate"
        style={{ display: 'inline-block' }}
      >
        {theme === 'light' ? '☀️' : '🌙'}
      </motion.span>
      <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
