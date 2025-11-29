import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader, FieldGroup } from './ResearchUI';
import { pageVariants, pageVariantsReduced, fadeUpVariants, fadeUpVariantsReduced, staggerContainer } from '../motion/tokens';

interface FeedbackData {
  difficulty: '' | '1' | '2' | '3' | '4' | '5';
  realism: '' | '1' | '2' | '3' | '4' | '5';
  clarity: '' | '1' | '2' | '3' | '4' | '5';
  comments: string;
}

interface FeedbackSurveyProps {
  onComplete: (feedback: FeedbackData) => void;
  onSkip: () => void;
}

export default function FeedbackSurvey({ onComplete, onSkip }: FeedbackSurveyProps) {
  const prefersReducedMotion = useReducedMotion();
  const [feedback, setFeedback] = useState<FeedbackData>({
    difficulty: '',
    realism: '',
    clarity: '',
    comments: ''
  });

  const canSubmit = feedback.difficulty && feedback.realism && feedback.clarity;

  const handleSubmit = () => {
    if (canSubmit) {
      onComplete(feedback);
    }
  };

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
        <h1 style={{ margin: 0 }}>Feedback Survey</h1>
        <p className="help" style={{ marginTop: 'var(--space-2)' }}>
          Please share your experience with this study (optional but appreciated)
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="section" variants={itemVariants}>
          <div className="card">
            <div className="card-body">
              <div className="form-grid">
                {/* Difficulty */}
                <FieldGroup label="How difficult were the trials?" htmlFor="difficulty" required>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <select
                      id="difficulty"
                      className="select"
                      value={feedback.difficulty}
                      onChange={e => setFeedback({ ...feedback, difficulty: e.target.value as any })}
                    >
                      <option value="">Select difficulty</option>
                      <option value="1">1 - Very easy</option>
                      <option value="2">2 - Easy</option>
                      <option value="3">3 - Moderate</option>
                      <option value="4">4 - Difficult</option>
                      <option value="5">5 - Very difficult</option>
                    </select>
                    <p className="help" style={{ margin: 0 }}>
                      How challenging was it to make decisions?
                    </p>
                  </div>
                </FieldGroup>

                {/* Realism */}
                <FieldGroup label="How realistic were the traffic scenes?" htmlFor="realism" required>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <select
                      id="realism"
                      className="select"
                      value={feedback.realism}
                      onChange={e => setFeedback({ ...feedback, realism: e.target.value as any })}
                    >
                      <option value="">Select realism</option>
                      <option value="1">1 - Not realistic at all</option>
                      <option value="2">2 - Somewhat unrealistic</option>
                      <option value="3">3 - Moderately realistic</option>
                      <option value="4">4 - Realistic</option>
                      <option value="5">5 - Very realistic</option>
                    </select>
                    <p className="help" style={{ margin: 0 }}>
                      Did the scenarios resemble real-world driving?
                    </p>
                  </div>
                </FieldGroup>

                {/* Clarity */}
                <FieldGroup label="How clear were the instructions?" htmlFor="clarity" required>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <select
                      id="clarity"
                      className="select"
                      value={feedback.clarity}
                      onChange={e => setFeedback({ ...feedback, clarity: e.target.value as any })}
                    >
                      <option value="">Select clarity</option>
                      <option value="1">1 - Very unclear</option>
                      <option value="2">2 - Somewhat unclear</option>
                      <option value="3">3 - Adequate</option>
                      <option value="4">4 - Clear</option>
                      <option value="5">5 - Very clear</option>
                    </select>
                    <p className="help" style={{ margin: 0 }}>
                      Did you understand what to do?
                    </p>
                  </div>
                </FieldGroup>

                {/* Comments */}
                <FieldGroup label="Additional comments (optional)" htmlFor="comments">
                  <textarea
                    id="comments"
                    className="input"
                    rows={4}
                    placeholder="Any other feedback, suggestions, or issues you encountered..."
                    value={feedback.comments}
                    onChange={e => setFeedback({ ...feedback, comments: e.target.value })}
                    style={{
                      resize: 'vertical',
                      minHeight: '100px',
                      fontFamily: 'inherit',
                      lineHeight: 'var(--lh-normal)'
                    }}
                  />
                </FieldGroup>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Submit feedback
                  </button>
                  <button
                    onClick={onSkip}
                    className="btn"
                    style={{ flex: 0, whiteSpace: 'nowrap' }}
                  >
                    Skip
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
