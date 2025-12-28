-- Migration: Add research analysis fields to trial_logs table
-- Purpose: Add fields for paper writing and advanced analysis
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ==========================================
-- Research Analysis Fields
-- ==========================================

-- Error classification (for SDT analysis)
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS error_type VARCHAR(20);

COMMENT ON COLUMN public.trial_logs.error_type IS
'Error classification: conservative_error (Type II), risky_error (Type I), correct_go, correct_nogo';

ALTER TABLE public.trial_logs
ADD CONSTRAINT IF NOT EXISTS trial_logs_error_type_check
CHECK (error_type IS NULL OR error_type IN ('conservative_error', 'risky_error', 'correct_go', 'correct_nogo'));

-- Temporal tracking (for priming effect decay)
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS trial_number_global INTEGER;

COMMENT ON COLUMN public.trial_logs.trial_number_global IS
'Global trial number across all blocks (1-indexed)';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS trials_since_priming INTEGER;

COMMENT ON COLUMN public.trial_logs.trials_since_priming IS
'Number of trials completed since priming screen was shown';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS time_since_priming_ms BIGINT;

COMMENT ON COLUMN public.trial_logs.time_since_priming_ms IS
'Milliseconds elapsed since priming screen was shown';

-- Sequential effects (for learning/adaptation analysis)
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS previous_trial_correct SMALLINT;

COMMENT ON COLUMN public.trial_logs.previous_trial_correct IS
'Whether the previous trial was correct (0 or 1)';

ALTER TABLE public.trial_logs
ADD CONSTRAINT IF NOT EXISTS trial_logs_previous_trial_correct_check
CHECK (previous_trial_correct IS NULL OR previous_trial_correct IN (0, 1));

-- Device/browser info (for methods section)
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS browser VARCHAR(50);

COMMENT ON COLUMN public.trial_logs.browser IS
'Browser name (Chrome, Firefox, Safari, Edge)';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS os VARCHAR(50);

COMMENT ON COLUMN public.trial_logs.os IS
'Operating system (Windows, macOS, Linux, iOS, Android)';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);

COMMENT ON COLUMN public.trial_logs.device_type IS
'Device type (desktop, tablet, mobile)';

ALTER TABLE public.trial_logs
ADD CONSTRAINT IF NOT EXISTS trial_logs_device_type_check
CHECK (device_type IS NULL OR device_type IN ('desktop', 'tablet', 'mobile'));

-- ==========================================
-- Performance Indexes
-- ==========================================

-- Index for error type analysis
CREATE INDEX IF NOT EXISTS idx_trial_logs_error_type
ON public.trial_logs (error_type)
WHERE error_type IS NOT NULL;

-- Index for temporal analysis
CREATE INDEX IF NOT EXISTS idx_trial_logs_trials_since_priming
ON public.trial_logs (trials_since_priming)
WHERE trials_since_priming IS NOT NULL;

-- Composite index for priming group × error type analysis
CREATE INDEX IF NOT EXISTS idx_trial_logs_priming_error
ON public.trial_logs (priming_group, error_type)
WHERE priming_group IS NOT NULL AND error_type IS NOT NULL;

-- Index for device-based filtering
CREATE INDEX IF NOT EXISTS idx_trial_logs_device_type
ON public.trial_logs (device_type)
WHERE device_type IS NOT NULL;

-- ==========================================
-- Verify Migration
-- ==========================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trial_logs'
  AND column_name IN (
    'error_type', 'trial_number_global', 'trials_since_priming',
    'time_since_priming_ms', 'previous_trial_correct',
    'browser', 'os', 'device_type'
  )
ORDER BY ordinal_position;

-- ==========================================
-- Sample Analysis Queries
-- ==========================================

-- Error distribution by priming group
-- SELECT
--   priming_group,
--   error_type,
--   COUNT(*) as count,
--   ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY priming_group), 2) as pct
-- FROM public.trial_logs
-- WHERE priming_group IS NOT NULL AND error_type IS NOT NULL
-- GROUP BY priming_group, error_type
-- ORDER BY priming_group, error_type;

-- Priming effect decay over trials
-- SELECT
--   priming_group,
--   CASE
--     WHEN trials_since_priming BETWEEN 0 AND 5 THEN '0-5'
--     WHEN trials_since_priming BETWEEN 6 AND 10 THEN '6-10'
--     WHEN trials_since_priming BETWEEN 11 AND 15 THEN '11-15'
--     ELSE '16+'
--   END as trial_bin,
--   AVG(correct) as accuracy,
--   AVG(rt_ms) as avg_rt
-- FROM public.trial_logs
-- WHERE priming_group IS NOT NULL AND trials_since_priming IS NOT NULL
-- GROUP BY priming_group, trial_bin
-- ORDER BY priming_group, trial_bin;

-- Sequential effects (accuracy after correct vs incorrect)
-- SELECT
--   previous_trial_correct,
--   AVG(correct) as current_trial_accuracy,
--   AVG(rt_ms) as current_trial_rt,
--   COUNT(*) as n
-- FROM public.trial_logs
-- WHERE previous_trial_correct IS NOT NULL
-- GROUP BY previous_trial_correct;

-- Device type distribution
-- SELECT
--   device_type,
--   COUNT(DISTINCT participant_id) as n_participants,
--   AVG(correct) as avg_accuracy,
--   AVG(rt_ms) as avg_rt
-- FROM public.trial_logs
-- WHERE device_type IS NOT NULL
-- GROUP BY device_type;
