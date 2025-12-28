import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageVariants, pageVariantsReduced, fadeUpVariants, fadeUpVariantsReduced, staggerContainer } from '../motion/tokens';

interface PrimingScreenProps {
  group: 'A' | 'B' | 'C';
  onContinue: () => void;
}

export default function PrimingScreen({ group, onContinue }: PrimingScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = prefersReducedMotion ? {} : staggerContainer;
  const itemVariants = prefersReducedMotion ? fadeUpVariantsReduced : fadeUpVariants;

  // Group-specific content
  const content = {
    A: {
      emoji: '🚧',
      header: 'ATLANTA TRAFFIC ALERT',
      headerColor: 'var(--danger)',
      location: 'Typical Atlanta Intersection (Downtown)',
      situation: (
        <>
          You have been stuck at this light for <strong>3 cycles</strong> due to heavy rush hour traffic.
        </>
      ),
      status: (
        <>
          Drivers behind you are <strong>honking</strong>.
        </>
      ),
    },
    B: {
      emoji: '⚠️',
      header: 'DANGEROUS INTERSECTION',
      headerColor: 'var(--warning)',
      location: 'High-Risk Asymmetric Crossing',
      situation: (
        <>
          This intersection is notorious for <strong>blind spots</strong>. Oncoming cars appear suddenly at <strong>high speeds</strong>.
        </>
      ),
      status: (
        <>
          <strong>No protected turn signal</strong>. You are on your own.
        </>
      ),
    },
    C: {
      emoji: 'ℹ️',
      header: 'STANDARD DRIVE',
      headerColor: 'var(--accent)',
      location: 'Suburban Area',
      situation: (
        <>
          <strong>Light traffic</strong> flow. Weather is <strong>clear</strong>.
        </>
      ),
      status: <>Normal driving conditions.</>,
    },
  };

  const scenario = content[group];

  return (
    <motion.main
      className="page"
      variants={prefersReducedMotion ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="section" variants={itemVariants}>
          <div className="card">
            <div className="card-body">
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                {/* Icon/Emoji */}
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `${scenario.headerColor}15`,
                    color: scenario.headerColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    fontSize: '40px',
                    border: `2px solid ${scenario.headerColor}40`,
                  }}
                >
                  {scenario.emoji}
                </div>

                {/* Header */}
                <h2
                  style={{
                    margin: '0 0 var(--space-6) 0',
                    color: scenario.headerColor,
                    fontSize: 'var(--fs-2xl)',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                >
                  {scenario.header}
                </h2>

                {/* Content Box */}
                <div
                  style={{
                    background: 'var(--panel)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-5)',
                    marginBottom: 'var(--space-6)',
                    textAlign: 'left',
                    maxWidth: '600px',
                    margin: '0 auto var(--space-6)',
                    border: `1px solid ${scenario.headerColor}20`,
                  }}
                >
                  {/* Location */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <div
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 700,
                        color: 'var(--fg-subtle)',
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      LOCATION:
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--fs-lg)',
                        color: 'var(--fg)',
                        lineHeight: 'var(--lh-relaxed)',
                      }}
                    >
                      {scenario.location}
                    </div>
                  </div>

                  {/* Situation */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <div
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 700,
                        color: 'var(--fg-subtle)',
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      SITUATION:
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--fs-lg)',
                        color: 'var(--fg)',
                        lineHeight: 'var(--lh-relaxed)',
                      }}
                    >
                      {scenario.situation}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 700,
                        color: 'var(--fg-subtle)',
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      STATUS:
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--fs-lg)',
                        color: 'var(--fg)',
                        lineHeight: 'var(--lh-relaxed)',
                      }}
                    >
                      {scenario.status}
                    </div>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={onContinue}
                  className="btn btn-primary"
                  style={{
                    fontSize: 'var(--fs-xl)',
                    padding: 'var(--space-4) var(--space-8)',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                  autoFocus
                >
                  I UNDERSTAND
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
