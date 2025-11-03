import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { Participant, TrialBlock, LogRow } from '../types'
import { api } from '../services/api'
import { submitToDB, flushQueue } from '../lib/telemetry'
import { augmentTrialsWithPrimeDesign, validatePrimeDesign } from '../design/generator'

interface ExperimentContext {
  participant?: Participant
  blocks: TrialBlock[]
  logs: Omit<LogRow, 'created_at'>[]
  setParticipant: (p: Participant) => void
  addLog: (row: Omit<LogRow, 'created_at'>) => void
  submitLog: (row: Omit<LogRow, 'created_at'>) => Promise<void>
  exportData: () => Promise<void>
  // NEW exposures:
  clientLogs: LogRow[]
  pushLocalLog: (row: Omit<LogRow, 'created_at'> | LogRow) => void
  getParticipantSnapshot: () => Participant | undefined
  getSummary: () => { total: number; correct: number; incorrect: number; accuracy: number }
  downloadCSV: (filename?: string) => void
  getResearchDisclaimer: () => string
}

const ExperimentCtx = createContext<ExperimentContext | null>(null)

export const useExperiment = () => {
  const v = useContext(ExperimentCtx)
  if (!v) throw new Error('ExperimentProvider missing')
  return v
}

export const ExperimentProvider: React.FC<{
  children: React.ReactNode;
  blocks: TrialBlock[]
}> = ({ children, blocks: rawBlocks }) => {
  const [participant, setParticipant] = useState<Participant | undefined>()
  const [logs, setLogs] = useState<Omit<LogRow, 'created_at'>[]>([])

  // ADD: local client log buffer + helpers for summary & CSV
  const [clientLogs, setClientLogs] = useState<LogRow[]>([])

  // Augment trials with prime design on mount
  const blocks = useMemo(() => {
    const augmentedBlocks = rawBlocks.map(block => ({
      ...block,
      trials: augmentTrialsWithPrimeDesign([...block.trials])
    }));

    // Validate in development
    if (process.env.NODE_ENV === 'development') {
      const allTrials = augmentedBlocks.flatMap(b => b.trials);
      const validation = validatePrimeDesign(allTrials);
      if (!validation.valid) {
        console.error('[Prime Design] Validation errors:', validation.errors);
      } else {
        console.log('[Prime Design] ✅ Valid');
      }
    }

    return augmentedBlocks;
  }, [rawBlocks]);

  // Flush offline queue on mount
  useEffect(() => { flushQueue(); }, [])

  const addLog = (row: Omit<LogRow, 'created_at'>) => {
    setLogs(prev => [...prev, row])
  }

  /** Append a log row locally (created_at is auto-filled if missing). */
  function pushLocalLog(row: Omit<LogRow, 'created_at'> | LogRow) {
    const withTime: LogRow = {
      ...(row as LogRow),
      created_at: (row as LogRow).created_at || new Date().toISOString(),
    };
    setClientLogs(prev => [...prev, withTime]);
  }

  /** Participant snapshot for the results screen. */
  function getParticipantSnapshot() {
    return participant; // existing state from provider
  }

  /** Quick summary of accuracy for the end screen. */
  function getSummary() {
    const total = clientLogs.length;
    const correct = clientLogs.reduce((a, r) => a + (r.correct ? 1 : 0), 0);
    const incorrect = total - correct;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    return { total, correct, incorrect, accuracy };
  }

  /** CSV builder in the exact header order we use in the study. */
  function buildCSV(rows: LogRow[]) {
    const HEADER = [
      'participant_id','age','gender','drivers_license','learners_permit',
      'region_ga','county_ga','block_idx','prime_type','trial_idx','scene_id',
      'signal','oncoming_car_ttc','pedestrian','choice','correct','rt_ms',
      'displayed_at_ms','responded_at_ms','focus_lost','seed','created_at',
      'prime_condition','prime_id','prime_block_index','is_primed'
    ];
    const body = rows.map(r =>
      HEADER.map(k => (r as any)[k] ?? '').join(',')
    ).join('\n');
    return `${HEADER.join(',')}\n${body}`;
  }

  /** Download current client logs as a CSV (works in SPA without server). */
  function downloadCSV(filename?: string) {
    const csv = buildCSV(clientLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || `priming-${participant?.participant_id || 'anon'}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  /** Standard research-use disclaimer text for the end screen. */
  function getResearchDisclaimer() {
    return 'This data is collected and used for research purposes only.';
  }

  const submitLog = async (row: Omit<LogRow, 'created_at'>) => {
    await submitToDB(row); // Now persists to Supabase with offline queue
  }

  const exportData = async () => {
    try {
      if (participant) {
        const blob = await api.exportCSV(participant.participant_id)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `priming-experiment-${participant.participant_id}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      // Fallback: export local logs as CSV
      exportLocalCSV()
    }
  }

  const exportLocalCSV = () => {
    if (logs.length === 0) return
    
    const headers = [
      'participant_id', 'age', 'gender', 'drivers_license', 'learners_permit', 'region_ga', 'county_ga',
      'block_idx', 'prime_type', 'trial_idx', 'scene_id', 'signal', 
      'oncoming_car_ttc', 'pedestrian', 'choice', 'correct', 'rt_ms',
      'displayed_at_ms', 'responded_at_ms', 'focus_lost', 'seed', 'created_at'
    ]
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.participant_id,
        log.age,
        log.gender,
        log.drivers_license ? 1 : 0,
        log.learners_permit ? 1 : 0,
        log.region_ga,
        log.county_ga,
        log.block_idx,
        log.prime_type,
        log.trial_idx,
        log.scene_id,
        log.signal,
        log.oncoming_car_ttc,
        log.pedestrian,
        log.choice,
        log.correct,
        log.rt_ms,
        log.displayed_at_ms,
        log.responded_at_ms,
        log.focus_lost,
        log.seed,
        new Date().toISOString()
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `priming-experiment-local-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const value = useMemo(() => ({ 
    participant, 
    setParticipant, 
    blocks, 
    logs,
    addLog,
    submitLog, 
    exportData,
    // NEW exposures:
    clientLogs,
    pushLocalLog,
    getParticipantSnapshot,
    getSummary,
    downloadCSV,
    getResearchDisclaimer,
  }), [participant, blocks, logs, clientLogs])

  return (
    <ExperimentCtx.Provider value={value}>
      {children}
    </ExperimentCtx.Provider>
  )
}
