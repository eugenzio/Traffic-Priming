import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageVariants, pageVariantsReduced } from '../motion/tokens';

export default function SurveyLayout({
  title,
  subtitle,
  progress,
  children,
  footerLeft,
  footerRight,
}: {
  title: string;
  subtitle?: React.ReactNode;
  progress?: React.ReactNode;
  children: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="min-h-screen"
      variants={prefersReducedMotion ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ background: 'var(--bg-page)', color: 'var(--fg)' }}
    >
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ color: 'var(--fg)' }}>
            {title}
          </h1>
          {subtitle && <div className="mt-2">{subtitle}</div>}
          {progress && <div className="mt-3">{progress}</div>}
        </header>

        <main>{children}</main>

        <footer className="mt-8 md:mt-10 flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm" style={{ color: 'var(--fg-muted)' }}>{footerLeft}</div>
          <div>{footerRight}</div>
        </footer>
      </div>
    </motion.div>
  );
}
