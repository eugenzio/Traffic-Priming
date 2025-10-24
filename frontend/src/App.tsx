import React, { useMemo, useState } from 'react'
import StartScreen from './components/StartScreen'
import PrimeScreen from './components/PrimeScreen'
import TrialScreen from './components/TrialScreen'
import ResultScreen from './components/ResultScreen'
import { useExperiment } from './context/ExperimentProvider'
import type { TrialBlock } from './types'

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

type Phase = 'start' | 'prime' | 'trial' | 'done'

export default function App() {
  const { blocks } = useExperiment()
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
      {/* Start: SKIP prime for the first (neutral) block — go straight to trials */}
      {phase === 'start' && (
        <StartScreen
          onBegin={() => { setBi(0); setTi(0); setPhase(phaseForBlock(blocks[sequence[0]])) }}
        />
      )}

      {phase === 'prime' && (
        <PrimeScreen
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
          // ADD at top of the end screen component:
          const { getSummary, getParticipantSnapshot, downloadCSV, getResearchDisclaimer } = useExperiment();
          const { total, correct, incorrect, accuracy } = getSummary();
          const p = getParticipantSnapshot();
          const disclaimer = getResearchDisclaimer();
          
          return (
            <div className="card">
              <h2>Thanks for participating!</h2>
              <p>You completed {total} trials (3 no-prime + 18 primed).</p>
              
              <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h3>Your Results</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#059669' }}>{accuracy}%</div>
                    <div style={{ color: '#666' }}>Accuracy</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#059669' }}>{correct}</div>
                    <div style={{ color: '#666' }}>Correct Answers</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  {correct} correct out of {total} total trials
                </div>
              </div>
              
              <div style={{ margin: '20px 0' }}>
                <h3>Participant Information</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <p><strong>ID:</strong> {p?.participant_id}</p>
                  <p><strong>Age:</strong> {p?.age}</p>
                  <p><strong>Gender:</strong> {p?.gender}</p>
                  <p><strong>Region:</strong> {(p as any)?.region_ga}</p>
                  <p><strong>County:</strong> {(p as any)?.county_ga}</p>
                </div>
              </div>
              
              <div style={{ margin: '20px 0' }}>
                <button 
                  onClick={() => downloadCSV()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Download Your Data (CSV)
                </button>
              </div>
              
              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '14px', color: '#92400e' }}>
                <strong>Research Notice:</strong> {disclaimer}
              </div>
            </div>
          );
        })()
      )}
    </div>
  )
}
