-- Migration: Add priming_group column to trial_logs table
-- Purpose: Store between-subjects group assignment (A/B/C) for priming experiment
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add priming_group column to trial_logs table
ALTER TABLE public.trial_logs
ADD COLUMN IF NOT EXISTS priming_group VARCHAR(1);

-- Add CHECK constraint to ensure valid values (A, B, or C)
ALTER TABLE public.trial_logs
ADD CONSTRAINT IF NOT EXISTS trial_logs_priming_group_check
CHECK (priming_group IS NULL OR priming_group IN ('A', 'B', 'C'));

-- Add comment to document the column
COMMENT ON COLUMN public.trial_logs.priming_group IS
'Between-subjects group assignment: A=Urgency, B=Safety, C=Control';

-- Create index for performance when filtering by priming group
CREATE INDEX IF NOT EXISTS idx_trial_logs_priming_group
ON public.trial_logs (priming_group)
WHERE priming_group IS NOT NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trial_logs' AND column_name = 'priming_group';

-- Sample query to test filtering by priming group
-- SELECT participant_id, priming_group, COUNT(*) as trial_count
-- FROM public.trial_logs
-- WHERE priming_group IS NOT NULL
-- GROUP BY participant_id, priming_group;
