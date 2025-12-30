import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ConsentScreen from './components/ConsentScreen'
import StartScreen from './components/StartScreen'
import PreSurveyGuide from './routes/PreSurveyGuide'
import PrimeInterstitial from './components/PrimeInterstitial'
import TrialScreen from './components/TrialScreen'
import PracticeTrialScreen from './components/PracticeTrialScreen'
import PrimingScreen from './components/PrimingScreen'
import FeedbackSurvey from './components/FeedbackSurvey'
import ResultScreen from './components/ResultScreen'
import { SectionHeader, SummaryTable, ExportButtons, Notice } from './components/ResearchUI'
import { useExperiment } from './context/ExperimentProvider'
import type { TrialBlock } from './types'
import { pageVariants, pageVariantsReduced, fadeUpVariants, fadeUpVariantsReduced, staggerContainer } from './motion/tokens'
import { getPrimeForTrial, generatePracticeTrials } from './design/generator'

// Helper functions
function buildSequence(blocks: TrialBlock[]): number[] {
  // Neutral (no-prime) block first, then the rest in given order
  const idxs = blocks.map((_, i) => i)
  const neutral = blocks.findIndex(b => b.prime_type === 'NEUTRAL')
  return neutral >= 0 ? [neutral, ...idxs.filter(i => i !== neutral)] : idxs
}

/** Progress across the *sequence* (not raw block indices). */
function computeProgress(
  sequence: number[],
  blocks: TrialBlock[],
  bi: number,      // index in sequence
  ti: number       // trial index within current block
) {
  const trialsPerBlock = sequence.map(i => blocks[i]?.trials?.length ?? 0);
  const total = trialsPerBlock.reduce((a, b) => a + b, 0);
  const completedBefore = trialsPerBlock.slice(0, bi).reduce((a, b) => a + b, 0);
  const currentIndex = completedBefore + ti + 1; // 1-based
  const percent = total > 0 ? (completedBefore + ti) / total : 0;
  const uiBlockNumber = bi + 1; // human-friendly block number in sequence
  return { total, completedBefore, currentIndex, percent, uiBlockNumber };
}

type Phase = 'consent' | 'start' | 'guide' | 'practice' | 'priming' | 'interstitial' | 'trial' | 'feedback' | 'done'

export default function App() {
  const { blocks, sessionMetadata, participant, setParticipant, setSessionMetadata } = useExperiment()
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('consent')
  const [bi, setBi] = useState(0) // index in 'sequence'
  const [ti, setTi] = useState(0) // trial index in current block
  const [pi, setPi] = useState(0) // practice trial index (0-2)
  const [feedbackData, setFeedbackData] = useState<any>(null)

  // Random group assignment function for between-subjects priming
  const assignPrimingGroup = () => {
    if (!participant?.priming_group) {
      const groups: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
      const randomGroup = groups[Math.floor(Math.random() * 3)];
      setParticipant({
        ...participant!,
        priming_group: randomGroup
      });
      console.log('[Priming] Assigned to group:', randomGroup);
    }
  }

  // Generate practice trials
  const practiceTrials = useMemo(() => generatePracticeTrials(), [])

  // Build execution sequence: Neutral block first, then the rest
  const sequence = useMemo(() => buildSequence(blocks), [blocks])
  const curBlock = blocks[sequence[bi]]
  const curTrial = curBlock?.trials?.[ti]

  const finishExperiment = () => {
    // Log session completion
    const endTime = new Date().toISOString();
    const startTime = new Date(sessionMetadata.startTime).getTime();
    const duration = Date.now() - startTime;
    console.log('[Session] Experiment completed:', {
      sessionId: sessionMetadata.sessionId,
      startTime: sessionMetadata.startTime,
      endTime,
      durationMs: duration,
      durationMinutes: (duration / 60000).toFixed(2)
    });
    setPhase('feedback');
  }

  const onTrialComplete = () => {
    const trialsInBlock = curBlock?.trials?.length ?? 0
    const totalTrialsSoFar = sequence.slice(0, bi).reduce((sum, idx) => sum + (blocks[idx]?.trials?.length ?? 0), 0) + ti + 1

    // Check if we just completed a multiple of 3 trials
    const shouldShowInterstitial = totalTrialsSoFar % 3 === 0 && totalTrialsSoFar > 0

    // Advance to next trial
    if (ti + 1 < trialsInBlock) {
      setTi(ti + 1)
    } else if (bi + 1 < sequence.length) {
      setBi(bi + 1)
      setTi(0)
    } else {
      finishExperiment()
      return
    }

    // Show interstitial if needed
    if (shouldShowInterstitial) {
      setPhase('interstitial')
    }
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {/* Consent: Informed consent screen */}
        {phase === 'consent' && (
          <ConsentScreen
            key="consent"
            onAgree={() => setPhase('start')}
            onDecline={() => {
              alert('실험 참여에 동의하지 않으셨습니다. 브라우저를 닫아주세요.\n\nYou have declined to participate. Please close this browser window.');
            }}
          />
        )}

        {/* Start: Collect participant info, then show guide */}
        {phase === 'start' && (
          <StartScreen
            key="start"
            onBegin={() => setPhase('guide')}
          />
        )}

        {/* Guide: Interactive tour of the canvas interface */}
        {phase === 'guide' && (
          <PreSurveyGuide
            key="guide"
            onBack={() => setPhase('start')}
            onContinue={() => {
              setPi(0);
              setPhase('practice');
            }}
          />
        )}

        {/* Practice: 3 practice trials with feedback */}
        {phase === 'practice' && (
          <PracticeTrialScreen
            key={`practice-${pi}`}
            trial={practiceTrials[pi]}
            practiceNumber={pi + 1}
            onComplete={() => {
              if (pi + 1 < practiceTrials.length) {
                setPi(pi + 1);
              } else {
                // Practice complete - check if priming already shown
                if (!sessionMetadata.primingShown) {
                  assignPrimingGroup();
                  setSessionMetadata({ ...sessionMetadata, primingShown: true });
                  setPhase('priming');
                } else {
                  // Skip priming, go directly to trial
                  setBi(0);
                  setTi(0);
                  setPhase('trial');
                }
              }
            }}
          />
        )}

        {/* Priming: Show between-subjects scenario after practice */}
        {phase === 'priming' && participant?.priming_group && (
          <PrimingScreen
            key="priming"
            group={participant.priming_group}
            onContinue={() => {
              setBi(0);
              setTi(0);
              setPhase('trial');
            }}
          />
        )}

        {/* Interstitial: Show priming info between every 3 trials */}
        {phase === 'interstitial' && curTrial && (() => {
          const prime = getPrimeForTrial(curTrial);
          console.log('[Interstitial] Showing prime:', prime.id, 'for trial:', curTrial.scene_id, curTrial);
          return (
            <PrimeInterstitial
              key={`interstitial-${bi}-${ti}`}
              prime={prime}
              onContinue={() => setPhase('trial')}
              durationMs={3000}
            />
          );
        })()}

        {/* Trial phase */}
        {phase === 'trial' && (
          (() => {
            const prog = computeProgress(sequence, blocks, bi, ti);
            return (
              <TrialScreen
                key={`trial-${bi}-${ti}`}
                block={curBlock}
                trial={curTrial}
                blockIdx={sequence[bi]}  // keep original block index for logs
                trialIdx={ti}
                onNext={onTrialComplete}
                uiBlockNumber={prog.uiBlockNumber}
                currentTotalIndex={prog.currentIndex}
                totalTrials={prog.total}
                progressPercent={prog.percent}
              />
            );
          })()
        )}

        {/* Feedback: Post-experiment survey */}
        {phase === 'feedback' && (
          <FeedbackSurvey
            key="feedback"
            onComplete={(data) => {
              setFeedbackData(data);
              console.log('Feedback received:', data);
              setPhase('done');
            }}
            onSkip={() => {
              console.log('Feedback skipped');
              setPhase('done');
            }}
          />
        )}

      {phase === 'done' && (
        (() => {
          const { getSummary, getParticipantSnapshot, downloadCSV, getResearchDisclaimer, getAttentionCheckResults } = useExperiment();
          const { total, correct, incorrect, accuracy } = getSummary();
          const p = getParticipantSnapshot();
          const disclaimer = getResearchDisclaimer();
          const attentionResults = getAttentionCheckResults();

          const containerVariants = prefersReducedMotion ? {} : staggerContainer;
          const itemVariants = prefersReducedMotion ? fadeUpVariantsReduced : fadeUpVariants;

          return (
            <motion.main
              key="done"
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
                <h1 style={{ margin: 0 }}>Study Complete</h1>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
              >
              <motion.div className="section" variants={itemVariants}>
                <p>
                  Thank you for participating in this research study. You completed {total} trials examining
                  left-turn decision-making under various traffic conditions.
                </p>
              </motion.div>

              <motion.div className="section" variants={itemVariants}>
                <SectionHeader title="Response Summary" />
                <div className="card">
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--panel)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 'var(--fs-3xl)', fontWeight: 700, color: 'var(--success)', marginBottom: 'var(--space-2)' }}>
                          {accuracy}%
                        </div>
                        <div className="help">Accuracy</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--panel)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 'var(--fs-3xl)', fontWeight: 700, color: 'var(--fg)', marginBottom: 'var(--space-2)' }}>
                          {correct}
                        </div>
                        <div className="help">Correct responses</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--panel)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 'var(--fs-3xl)', fontWeight: 700, color: 'var(--fg)', marginBottom: 'var(--space-2)' }}>
                          {total}
                        </div>
                        <div className="help">Total trials</div>
                      </div>
                    </div>
                    <p className="help" style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
                      {correct} correct out of {total} trials
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div className="section" variants={itemVariants}>
                <SectionHeader title="Participant Information" />
                <div className="card">
                  <div className="card-body">
                    <SummaryTable
                      data={[
                        { label: 'Participant ID', value: p?.participant_id || 'N/A' },
                        { label: 'Age', value: p?.age || 'N/A' },
                        { label: 'Gender', value: p?.gender || 'N/A' },
                        { label: 'Region', value: (p as any)?.region_ga || 'N/A' },
                        { label: 'County', value: (p as any)?.county_ga || 'N/A' },
                      ]}
                    />
                  </div>
                </div>
              </motion.div>

              {attentionResults.totalChecks > 0 && (
                <motion.div className="section" variants={itemVariants}>
                  <SectionHeader title="Data Quality" />
                  <div className="card">
                    <div className="card-body">
                      <p className="help" style={{ marginBottom: 'var(--space-3)' }}>
                        Attention checks help ensure data quality by including obvious scenarios throughout the experiment.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
                        <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--panel)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{
                            fontSize: 'var(--fs-2xl)',
                            fontWeight: 700,
                            color: attentionResults.passed ? 'var(--success)' : 'var(--danger)',
                            marginBottom: 'var(--space-2)'
                          }}>
                            {attentionResults.passed ? '✓' : '✗'}
                          </div>
                          <div className="help">Status</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--panel)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--fg)', marginBottom: 'var(--space-2)' }}>
                            {attentionResults.correctChecks}/{attentionResults.totalChecks}
                          </div>
                          <div className="help">Correct</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--panel)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--fg)', marginBottom: 'var(--space-2)' }}>
                            {Math.round(attentionResults.passRate * 100)}%
                          </div>
                          <div className="help">Pass Rate</div>
                        </div>
                      </div>
                      {!attentionResults.passed && (
                        <p className="help" style={{ marginTop: 'var(--space-3)', color: 'var(--warning-fg)', textAlign: 'center' }}>
                          Note: Some attention checks were missed. This may affect data quality.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div className="section" variants={itemVariants}>
                <SectionHeader title="Export Data" />
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                  <button
                    onClick={() => downloadCSV()}
                    className="btn btn-primary"
                    style={{ fontSize: 'var(--fs-md)', padding: 'var(--space-3) var(--space-6)' }}
                  >
                    Download data (CSV)
                  </button>
                  <p className="help" style={{ marginTop: 'var(--space-2)' }}>
                    Export your trial responses for personal records
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Notice title="Research Use">
                  <p>{disclaimer}</p>
                </Notice>
              </motion.div>
              </motion.div>
            </motion.main>
          );
        })()
      )}
      </AnimatePresence>
    </div>
  )
}
