import React from 'react';
import { motion } from 'framer-motion';
import type { Trial, Choice } from '../types';
import { Kbd } from './ResearchUI';

interface PracticeFeedbackProps {
  trial: Trial;
  userChoice: Choice;
  onContinue: () => void;
  practiceNumber: number;
}

export default function PracticeFeedback({
  trial,
  userChoice,
  onContinue,
  practiceNumber
}: PracticeFeedbackProps) {
  const isCorrect = userChoice === trial.correct;

  // Generate explanation based on trial characteristics
  const getExplanation = (): string => {
    const parts: string[] = [];

    // Signal reasoning
    if (trial.signal === 'RED') {
      parts.push('Red signal prohibits left turns');
    } else if (trial.signal === 'NO_LEFT_TURN') {
      parts.push('No left turn sign prohibits the maneuver');
    } else if (trial.signal === 'GREEN_ARROW') {
      parts.push('Green arrow permits left turns');
    } else if (trial.signal === 'YELLOW_FLASH') {
      parts.push('Yellow flash requires yielding to oncoming traffic');
    }

    // Pedestrian reasoning
    if (trial.pedestrian === 'CROSSING' && trial.pedestrian_crosswalk === 'south') {
      parts.push('pedestrian is crossing in the turn path');
    }

    // TTC reasoning
    if (trial.oncoming_car_ttc < 3.0) {
      parts.push(`oncoming car is too close (${trial.oncoming_car_ttc.toFixed(1)}s)`);
    } else if (trial.oncoming_car_ttc > 5.0) {
      parts.push(`oncoming car has sufficient distance (${trial.oncoming_car_ttc.toFixed(1)}s)`);
    }

    return parts.join(', ');
  };

  const explanation = getExplanation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      style={{
        background: 'var(--bg-page)',
        color: 'var(--fg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        <div className="card-body" style={{ padding: 'var(--space-6)' }}>
          {/* Result icon and heading */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            {isCorrect ? (
              <div>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--success-bg)',
                    color: 'var(--success-fg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    fontSize: '32px'
                  }}
                >
                  ✓
                </div>
                <h2 style={{ margin: 0, color: 'var(--success-fg)' }}>Correct!</h2>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger-fg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    fontSize: '32px'
                  }}
                >
                  ✗
                </div>
                <h2 style={{ margin: 0, color: 'var(--danger-fg)' }}>Incorrect</h2>
              </div>
            )}
          </div>

          {/* Your answer */}
          <div
            style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: 'var(--panel)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--card-border)'
            }}
          >
            <div className="help" style={{ marginBottom: 'var(--space-2)' }}>
              Your answer
            </div>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 500 }}>
              {userChoice === 'turn_left' ? 'Turn left' : 'Wait'}
            </div>
          </div>

          {/* Correct answer */}
          <div
            style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: 'var(--success-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--success-border, var(--card-border))'
            }}
          >
            <div className="help" style={{ marginBottom: 'var(--space-2)', color: 'var(--success-fg)' }}>
              Correct answer
            </div>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 500, color: 'var(--success-fg)' }}>
              {trial.correct === 'turn_left' ? 'Turn left' : 'Wait'}
            </div>
          </div>

          {/* Explanation */}
          <div
            style={{
              marginBottom: 'var(--space-5)',
              padding: 'var(--space-3)',
              background: 'var(--panel)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--card-border)',
              textAlign: 'left'
            }}
          >
            <div className="help" style={{ marginBottom: 'var(--space-2)' }}>
              Why?
            </div>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', lineHeight: '1.6' }}>
              {explanation.charAt(0).toUpperCase() + explanation.slice(1)}.
            </p>
          </div>

          {/* Continue button */}
          <button
            onClick={onContinue}
            className="btn btn-primary"
            style={{ width: '100%' }}
            autoFocus
          >
            {practiceNumber < 3 ? 'Next practice trial' : 'Start real experiment'}
          </button>

          {/* Progress indicator */}
          <div className="help" style={{ marginTop: 'var(--space-3)' }}>
            Practice trial {practiceNumber} of 3
          </div>
        </div>
      </div>
    </motion.div>
  );
}
