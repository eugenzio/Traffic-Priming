-- Migration: Complete database schema for trial_logs table
-- Purpose: Add ALL required columns (priming_group + research fields + missing CSV fields)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ==========================================
-- Step 1: Add priming_group column
-- ==========================================

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS priming_group VARCHAR(1);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_logs_priming_group_check'
  ) THEN
    ALTER TABLE public.trial_logs
    ADD CONSTRAINT trial_logs_priming_group_check
    CHECK (priming_group IS NULL OR priming_group IN ('A', 'B', 'C'));
  END IF;
END $$;

COMMENT ON COLUMN public.trial_logs.priming_group IS
'Between-subjects group assignment: A=Urgency, B=Safety, C=Control';

-- ==========================================
-- Step 2: Add research analysis fields
-- ==========================================

-- Error classification
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS error_type VARCHAR(20);

COMMENT ON COLUMN public.trial_logs.error_type IS
'Error classification: conservative_error (Type II), risky_error (Type I), correct_go, correct_nogo';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_logs_error_type_check'
  ) THEN
    ALTER TABLE public.trial_logs
    ADD CONSTRAINT trial_logs_error_type_check
    CHECK (error_type IS NULL OR error_type IN ('conservative_error', 'risky_error', 'correct_go', 'correct_nogo'));
  END IF;
END $$;

-- Temporal tracking
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

-- Sequential effects
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS previous_trial_correct SMALLINT;

COMMENT ON COLUMN public.trial_logs.previous_trial_correct IS
'Whether the previous trial was correct (0 or 1)';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_logs_previous_trial_correct_check'
  ) THEN
    ALTER TABLE public.trial_logs
    ADD CONSTRAINT trial_logs_previous_trial_correct_check
    CHECK (previous_trial_correct IS NULL OR previous_trial_correct IN (0, 1));
  END IF;
END $$;

-- Device/browser info
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_logs_device_type_check'
  ) THEN
    ALTER TABLE public.trial_logs
    ADD CONSTRAINT trial_logs_device_type_check
    CHECK (device_type IS NULL OR device_type IN ('desktop', 'tablet', 'mobile'));
  END IF;
END $$;

-- ==========================================
-- Step 3: Add missing CSV columns
-- ==========================================

-- Prime condition fields
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS prime_condition VARCHAR(50);

COMMENT ON COLUMN public.trial_logs.prime_condition IS
'Priming condition applied to this trial (e.g., "urgency", "safety", "control")';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS prime_id VARCHAR(50);

COMMENT ON COLUMN public.trial_logs.prime_id IS
'Unique identifier for the prime stimulus';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS prime_block_index INTEGER;

COMMENT ON COLUMN public.trial_logs.prime_block_index IS
'Block index within the priming sequence';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS is_primed BOOLEAN;

COMMENT ON COLUMN public.trial_logs.is_primed IS
'Whether this trial was preceded by a priming stimulus';

-- RT outlier detection fields
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS rt_outlier BOOLEAN;

COMMENT ON COLUMN public.trial_logs.rt_outlier IS
'Whether reaction time is a statistical outlier (beyond 3 SD from mean)';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS rt_too_fast BOOLEAN;

COMMENT ON COLUMN public.trial_logs.rt_too_fast IS
'Whether reaction time is suspiciously fast (< 200ms)';

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS rt_too_slow BOOLEAN;

COMMENT ON COLUMN public.trial_logs.rt_too_slow IS
'Whether reaction time is suspiciously slow (> 10000ms)';

-- Attention check field
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS is_attention_check BOOLEAN;

COMMENT ON COLUMN public.trial_logs.is_attention_check IS
'Whether this trial is an attention check (catch trial)';

-- ==========================================
-- Step 4: Create indexes for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_trial_logs_priming_group
ON public.trial_logs (priming_group)
WHERE priming_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_logs_error_type
ON public.trial_logs (error_type)
WHERE error_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_logs_trials_since_priming
ON public.trial_logs (trials_since_priming)
WHERE trials_since_priming IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_logs_priming_error
ON public.trial_logs (priming_group, error_type)
WHERE priming_group IS NOT NULL AND error_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_logs_device_type
ON public.trial_logs (device_type)
WHERE device_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_logs_rt_outlier
ON public.trial_logs (rt_outlier)
WHERE rt_outlier = true;

CREATE INDEX IF NOT EXISTS idx_trial_logs_attention_check
ON public.trial_logs (is_attention_check)
WHERE is_attention_check = true;

CREATE INDEX IF NOT EXISTS idx_trial_logs_is_primed
ON public.trial_logs (is_primed)
WHERE is_primed IS NOT NULL;

-- ==========================================
-- Step 5: Verify the migration
-- ==========================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trial_logs'
  AND column_name IN (
    'priming_group', 'error_type', 'trial_number_global',
    'trials_since_priming', 'time_since_priming_ms',
    'previous_trial_correct', 'browser', 'os', 'device_type',
    'prime_condition', 'prime_id', 'prime_block_index', 'is_primed',
    'rt_outlier', 'rt_too_fast', 'rt_too_slow', 'is_attention_check'
  )
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Complete migration finished successfully!';
  RAISE NOTICE '📊 Added 17 columns total:';
  RAISE NOTICE '   - 1 priming group column (priming_group)';
  RAISE NOTICE '   - 8 research analysis columns (error_type, trial_number_global, etc.)';
  RAISE NOTICE '   - 8 CSV compatibility columns (prime_condition, rt_outlier, etc.)';
  RAISE NOTICE '🔍 Created 8 indexes for query performance';
  RAISE NOTICE '✨ Your database is now fully ready!';
END $$;
