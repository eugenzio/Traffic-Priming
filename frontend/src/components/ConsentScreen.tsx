import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { pageVariants, pageVariantsReduced, fadeUpVariants, fadeUpVariantsReduced, staggerContainer } from '../motion/tokens'

interface ConsentScreenProps {
  onAgree: () => void
  onDecline: () => void
}

export default function ConsentScreen({ onAgree, onDecline }: ConsentScreenProps) {
  const prefersReducedMotion = useReducedMotion()
  const [hasRead, setHasRead] = useState(false)

  const containerVariants = prefersReducedMotion ? {} : staggerContainer
  const itemVariants = prefersReducedMotion ? fadeUpVariantsReduced : fadeUpVariants

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
        <h1 style={{ margin: 0 }}>Informed Consent</h1>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="section" variants={itemVariants}>
          <div className="card">
            <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }} onScroll={(e) => {
              const element = e.currentTarget
              const hasScrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10
              if (hasScrolledToBottom) setHasRead(true)
            }}>
              <h2 style={{ marginTop: 0 }}>Informed Consent for Research Participation</h2>

              <h3>Study Title</h3>
              <p>Decision-Making in Left-Turn Intersection Scenarios</p>

              <h3>Purpose of the Study</h3>
              <p>
                This is an academic research study designed to understand how drivers make decisions
                in left-turn intersection scenarios. You will be presented with various traffic situations
                and will choose whether to turn left or wait in each scenario.
              </p>

              <h3>Study Procedures</h3>
              <p>The experiment will proceed as follows:</p>
              <ol>
                <li>Demographic information collection (age, gender, driving experience, region)</li>
                <li>Experimental instructions and task explanation</li>
                <li>Practice trials (3 trials)</li>
                <li>Main experiment trials (approximately 21 trials)</li>
                <li>Feedback</li>
              </ol>
              <p>The entire experiment will take approximately <strong>10-15 minutes</strong>.</p>

              <h3>Data Confidentiality and Anonymity</h3>
              <p>
                No personally identifiable information (name, email address, etc.) will be collected.
                All data will be processed anonymously and used solely for research purposes.
                Collected data will be securely encrypted and stored.
              </p>

              <h3>Voluntary Participation and Right to Withdraw</h3>
              <p>
                Participation in this study is completely voluntary. You may withdraw from the experiment
                at any time without penalty. Closing your browser will automatically terminate the experiment.
              </p>

              <h3>Principal Investigator Contact Information</h3>
              <p>
                If you have any questions about this study, please contact:
              </p>
              <ul>
                <li>Principal Investigator: [Researcher Name]</li>
                <li>Institution: [University/Research Institute]</li>
                <li>Email: [Researcher Email]</li>
              </ul>

              <div style={{
                marginTop: 'var(--space-6)',
                padding: 'var(--space-4)',
                background: 'var(--panel)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--accent)'
              }}>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  I have read and understood the above information and voluntarily agree to participate in this research study.
                </p>
              </div>

              {!hasRead && (
                <p className="help" style={{ marginTop: 'var(--space-4)', textAlign: 'center', color: 'var(--warning-fg)' }}>
                  ⬇ Please scroll to the bottom to read all content
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="section"
          variants={itemVariants}
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={onAgree}
            className="btn btn-primary"
            disabled={!hasRead}
            style={{
              fontSize: 'var(--fs-lg)',
              padding: 'var(--space-3) var(--space-6)',
              minWidth: '180px'
            }}
          >
            동의함 (I Agree)
          </button>
          <button
            onClick={onDecline}
            className="btn"
            style={{
              fontSize: 'var(--fs-lg)',
              padding: 'var(--space-3) var(--space-6)',
              minWidth: '180px',
              background: 'var(--panel)',
              color: 'var(--fg-muted)'
            }}
          >
            동의하지 않음 (Decline)
          </button>
        </motion.div>
      </motion.div>
    </motion.main>
  )
}
