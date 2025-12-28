-- Migration: Add all research fields to trial_logs table (Fixed version)
-- Purpose: Add priming_group and research analysis fields
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ==========================================
-- Step 1: Add priming_group column
-- ==========================================

ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS priming_group VARCHAR(1);

-- Add CHECK constraint (without IF NOT EXISTS)
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
-- Step 3: Create indexes for performance
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

-- ==========================================
-- Step 4: Verify the migration
-- ==========================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trial_logs'
  AND column_name IN (
    'priming_group', 'error_type', 'trial_number_global',
    'trials_since_priming', 'time_since_priming_ms',
    'previous_trial_correct', 'browser', 'os', 'device_type'
  )
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Added 9 new columns to trial_logs table';
  RAISE NOTICE '🔍 Created 5 indexes for query performance';
END $$;
