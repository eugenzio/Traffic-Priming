import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { Participant, TrialBlock, LogRow } from '../types'
import { api } from '../services/api'
import { submitToDB, flushQueue } from '../lib/telemetry'
import { augmentTrialsWithPrimeDesign, validatePrimeDesign, insertAttentionChecks, validateAttentionChecks } from '../design/generator'
import { collectDeviceInfo, type DeviceInfo } from '../utils/deviceInfo'

interface ExperimentContext {
  participant?: Participant
  blocks: TrialBlock[]
  logs: Omit<LogRow, 'created_at'>[]
  deviceInfo: DeviceInfo | null
  sessionMetadata: SessionMetadata
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
  getAttentionCheckResults: () => {
    passed: boolean;
    totalChecks: number;
    correctChecks: number;
    passRate: number;
  }
  clearSession: () => void
}

interface SessionMetadata {
  sessionId: string
  startTime: string
  endTime: string | null
  totalDurationMs: number
}

const ExperimentCtx = createContext<ExperimentContext | null>(null)

export const useExperiment = () => {
  const v = useContext(ExperimentCtx)
  if (!v) throw new Error('ExperimentProvider missing')
  return v
}

const SESSION_STORAGE_KEY = 'experiment_session_backup';

export const ExperimentProvider: React.FC<{
  children: React.ReactNode;
  blocks: TrialBlock[]
}> = ({ children, blocks: rawBlocks }) => {
  // Try to restore session from localStorage
  const restoreSession = () => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[Session Recovery] Restored session data:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('[Session Recovery] Failed to restore session:', error);
    }
    return null;
  };

  const savedSession = restoreSession();

  const [participant, setParticipant] = useState<Participant | undefined>(savedSession?.participant)
  const [logs, setLogs] = useState<Omit<LogRow, 'created_at'>[]>(savedSession?.logs || [])

  // ADD: local client log buffer + helpers for summary & CSV
  const [clientLogs, setClientLogs] = useState<LogRow[]>(savedSession?.clientLogs || [])

  // Collect device info once on mount
  const [deviceInfo] = useState<DeviceInfo>(() => {
    const info = collectDeviceInfo();
    console.log('[Device Info] Collected:', info);
    return info;
  })

  // Session metadata
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata>(() => ({
    sessionId: savedSession?.sessionMetadata?.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    startTime: savedSession?.sessionMetadata?.startTime || new Date().toISOString(),
    endTime: null,
    totalDurationMs: 0
  }))

  // Augment trials with prime design on mount
  const blocks = useMemo(() => {
    const augmentedBlocks = rawBlocks.map(block => {
      // First, augment with prime design
      const primedTrials = augmentTrialsWithPrimeDesign([...block.trials]);

      // Then, insert attention checks
      const trialsWithAttention = insertAttentionChecks(primedTrials);

      return {
        ...block,
        trials: trialsWithAttention
      };
    });

    // Validate in development
    if (process.env.NODE_ENV === 'development') {
      const allTrials = augmentedBlocks.flatMap(b => b.trials);
      const validation = validatePrimeDesign(allTrials);
      if (!validation.valid) {
        console.error('[Prime Design] Validation errors:', validation.errors);
      } else {
        console.log('[Prime Design] ✅ Valid');
      }

      // Log attention check info
      const attentionChecks = allTrials.filter(t => t.scene_id.startsWith('attention_check_'));
      console.log(`[Attention Checks] ${attentionChecks.length} checks inserted at positions:`,
        allTrials.map((t, i) => t.scene_id.startsWith('attention_check_') ? i : null).filter(i => i !== null)
      );
    }

    return augmentedBlocks;
  }, [rawBlocks]);

  // Flush offline queue on mount
  useEffect(() => { flushQueue(); }, [])

  // Auto-save session to localStorage whenever state changes
  useEffect(() => {
    try {
      const sessionData = {
        participant,
        logs,
        clientLogs,
        sessionMetadata,
        deviceInfo,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('[Session Recovery] Failed to save session:', error);
    }
  }, [participant, logs, clientLogs, sessionMetadata])

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
      'prime_condition','prime_id','prime_block_index','is_primed',
      'rt_outlier','rt_too_fast','rt_too_slow','is_attention_check'
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

  /** Get attention check validation results. */
  function getAttentionCheckResults() {
    return validateAttentionChecks(clientLogs);
  }

  /** Clear session data and start fresh. */
  function clearSession() {
    console.log('[Session] Clearing session data');
    setClientLogs([]);
    setLogs([]);
    setSessionMetadata({
      sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      startTime: new Date().toISOString(),
      endTime: null,
      totalDurationMs: 0
    });
    localStorage.removeItem(SESSION_STORAGE_KEY);
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
    deviceInfo,
    sessionMetadata,
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
    getAttentionCheckResults,
    clearSession,
  }), [participant, blocks, logs, clientLogs, deviceInfo, sessionMetadata])

  return (
    <ExperimentCtx.Provider value={value}>
      {children}
    </ExperimentCtx.Provider>
  )
}
