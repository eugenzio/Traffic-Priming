import React, { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export interface PrimeBannerProps {
  mode: 'control' | 'priming'
  label: string
  durationMs: number
  onDone: () => void
}

export default function PrimeBanner({ mode, label, durationMs, onDone }: PrimeBannerProps) {
  const prefersReducedMotion = useReducedMotion()
  const [progress, setProgress] = useState(0)

  console.log('[PrimeBanner] Rendering:', { mode, label, durationMs })

  // Countdown timer
  useEffect(() => {
    const startTime = performance.now()
    let rafId: number

    const tick = () => {
      const elapsed = performance.now() - startTime
      const p = Math.min(1, elapsed / durationMs)
      setProgress(p)

      if (p < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        onDone()
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [durationMs, onDone])

  const containerVariants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }
    : {
        initial: { y: -18, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -18, opacity: 0 }
      }

  const containerTransition = prefersReducedMotion
    ? { duration: 0.2 }
    : { type: 'spring', stiffness: 420, damping: 32 }

  const isPriming = mode === 'priming'

  return (
    <motion.section
      role="status"
      aria-live="off"
      aria-label={isPriming && label ? label : 'Get ready'}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={containerTransition}
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        pointerEvents: 'none'
      }}
    >
      <div
        className="banner"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: '320px',
          maxWidth: '480px',
          textAlign: 'center'
        }}
      >
        {/* Label - only show for primed trials */}
        {isPriming && label && (
          <h2
            className="banner__title"
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--fg)',
              margin: '0 0 var(--space-3) 0'
            }}
          >
            {label}
          </h2>
        )}

        {/* Progress bar */}
        <div
          className="progress"
          aria-hidden="true"
          style={{
            height: '4px',
            background: 'var(--muted-2)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: isPriming && label ? 'var(--space-3)' : '0'
          }}
        >
          <motion.div
            className="bar"
            style={{
              height: '100%',
              background: isPriming ? 'var(--accent-priming)' : 'var(--muted-6)',
              width: `${progress * 100}%`
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress * 100}%` }}
            transition={prefersReducedMotion ? { duration: 0 } : { ease: 'linear' }}
          />
        </div>
      </div>
    </motion.section>
  )
}
