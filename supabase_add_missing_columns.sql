-- Migration: Add missing columns to trial_logs table
-- Purpose: Add columns that exist in CSV but missing from database
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ==========================================
-- Add Missing Columns
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
-- Create Indexes for Performance
-- ==========================================

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
-- Verify Migration
-- ==========================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trial_logs'
  AND column_name IN (
    'prime_condition', 'prime_id', 'prime_block_index', 'is_primed',
    'rt_outlier', 'rt_too_fast', 'rt_too_slow', 'is_attention_check'
  )
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Missing columns added successfully!';
  RAISE NOTICE '📊 Added 8 columns: prime_condition, prime_id, prime_block_index, is_primed, rt_outlier, rt_too_fast, rt_too_slow, is_attention_check';
  RAISE NOTICE '🔍 Created 3 indexes for query performance';
  RAISE NOTICE '✨ Your CSV can now be imported!';
END $$;
