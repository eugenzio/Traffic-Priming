import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import StartScreen from './components/StartScreen'
import PreSurveyGuide from './routes/PreSurveyGuide'
import PrimeScreen from './components/PrimeScreen'
import TrialScreen from './components/TrialScreen'
import ResultScreen from './components/ResultScreen'
import ThemeToggle from './components/ThemeToggle'
import { SectionHeader, SummaryTable, ExportButtons, Notice } from './components/ResearchUI'
import { useExperiment } from './context/ExperimentProvider'
import type { TrialBlock } from './types'
import { pageVariants, pageVariantsReduced, fadeUpVariants, fadeUpVariantsReduced, staggerContainer } from './motion/tokens'

// Helper functions
function buildSequence(blocks: TrialBlock[]): number[] {
  // Neutral (no-prime) block first, then the rest in given order
  const idxs = blocks.map((_, i) => i)
  const neutral = blocks.findIndex(b => b.prime_type === 'NEUTRAL')
  return neutral >= 0 ? [neutral, ...idxs.filter(i => i !== neutral)] : idxs
}

function skipPrimeForBlock(block?: TrialBlock): boolean {
  return block?.prime_type === 'NEUTRAL'
}

function phaseForBlock(block?: TrialBlock): 'prime' | 'trial' {
  return skipPrimeForBlock(block) ? 'trial' : 'prime'
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

type Phase = 'start' | 'guide' | 'prime' | 'trial' | 'done'

export default function App() {
  const { blocks } = useExperiment()
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('start')
  const [bi, setBi] = useState(0) // index in 'sequence'
  const [ti, setTi] = useState(0) // trial index in current block

  // Build execution sequence: Neutral block first, then the rest
  const sequence = useMemo(() => buildSequence(blocks), [blocks])
  const curBlock = blocks[sequence[bi]]
  const curTrial = curBlock?.trials?.[ti]

  const goPrime = (nextBi: number) => { setBi(nextBi); setTi(0); setPhase('prime') }
  const goTrial = () => setPhase('trial')
  const finishExperiment = () => setPhase('done')

  const onPrimeDone = () => { 
    // After first prime screen, go directly to done phase instead of trial
    if (bi === 0) {
      finishExperiment()
    } else {
      setTi(0); goTrial() 
    }
  }

  const onTrialComplete = () => {
    const trialsInBlock = curBlock?.trials?.length ?? 0
    if (ti + 1 < trialsInBlock) {
      setTi(ti + 1)
    } else if (bi + 1 < sequence.length) {
      setBi(bi + 1); setTi(0);
      setPhase(phaseForBlock(blocks[sequence[bi + 1]])) // 'prime' for primed blocks
    } else {
      finishExperiment()
    }
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
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
              setBi(0);
              setTi(0);
              setPhase(phaseForBlock(blocks[sequence[0]]));
            }}
          />
        )}

        {phase === 'prime' && (
          <PrimeScreen
            key="prime"
            primeType={curBlock?.prime_type}
            durationSec={6}
            onDone={onPrimeDone}
          />
        )}

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

      {phase === 'done' && (
        (() => {
          const { getSummary, getParticipantSnapshot, downloadCSV, getResearchDisclaimer } = useExperiment();
          const { total, correct, incorrect, accuracy } = getSummary();
          const p = getParticipantSnapshot();
          const disclaimer = getResearchDisclaimer();

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
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}
                variants={itemVariants}
                initial="initial"
                animate="animate"
              >
                <h1 style={{ margin: 0 }}>Study Complete</h1>
                <ThemeToggle />
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
