import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageVariants, pageVariantsReduced, fadeUpVariants, fadeUpVariantsReduced, staggerContainer } from '../motion/tokens';

interface ReadyScreenProps {
  onBegin: () => void;
  onBack: () => void;
}

export default function ReadyScreen({ onBegin, onBack }: ReadyScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = prefersReducedMotion ? {} : staggerContainer;
  const itemVariants = prefersReducedMotion ? fadeUpVariantsReduced : fadeUpVariants;

  return (
    <motion.main
      className="page"
      variants={prefersReducedMotion ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        style={{ marginBottom: 'var(--space-6)' }}
        variants={itemVariants}
        initial="initial"
        animate="animate"
      >
        <h1 style={{ margin: 0 }}>Ready to Begin?</h1>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="section" variants={itemVariants}>
          <div className="card">
            <div className="card-body">
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    fontSize: '40px'
                  }}
                >
                  ✓
                </div>

                <h2 style={{ margin: '0 0 var(--space-3) 0' }}>
                  Practice Complete!
                </h2>

                <p style={{
                  color: 'var(--fg-muted)',
                  marginBottom: 'var(--space-6)',
                  fontSize: 'var(--fs-lg)',
                  lineHeight: 'var(--lh-relaxed)',
                  maxWidth: '500px',
                  margin: '0 auto var(--space-6)'
                }}>
                  You've completed the practice trials and are now familiar with the controls and interface.
                </p>

                <div
                  style={{
                    background: 'var(--panel)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-6)',
                    textAlign: 'left'
                  }}
                >
                  <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--fs-lg)' }}>
                    What to expect:
                  </h3>
                  <ul style={{
                    margin: 0,
                    paddingLeft: 'var(--space-4)',
                    lineHeight: 'var(--lh-relaxed)',
                    color: 'var(--fg-muted)'
                  }}>
                    <li>You will see traffic scenes similar to the practice trials</li>
                    <li>Use <kbd style={{
                      background: 'var(--kbd-bg)',
                      color: 'var(--kbd-fg)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '0.9em'
                    }}>←</kbd> to turn left, <kbd style={{
                      background: 'var(--kbd-bg)',
                      color: 'var(--kbd-fg)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '0.9em'
                    }}>Space</kbd> to wait</li>
                    <li>Make decisions as you would when driving in real life</li>
                    <li>The study takes approximately 3-5 minutes</li>
                  </ul>
                </div>

                <p style={{
                  fontSize: 'var(--fs-xl)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-6)',
                  color: 'var(--fg)'
                }}>
                  Are you ready to start the real experiment?
                </p>

                <div style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={onBack}
                    className="btn"
                  >
                    ← Go back to practice
                  </button>
                  <button
                    onClick={onBegin}
                    className="btn btn-primary"
                    style={{
                      fontSize: 'var(--fs-lg)',
                      padding: 'var(--space-3) var(--space-6)'
                    }}
                    autoFocus
                  >
                    Yes, start experiment →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
