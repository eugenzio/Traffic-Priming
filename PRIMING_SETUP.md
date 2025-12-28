# Between-Subjects Priming Experiment Setup Guide

## Overview
This guide explains how to set up the between-subjects priming scenario feature that was added to the gap acceptance experiment.

## What Was Added

### 1. Priming Screen Component
After completing the 3 practice trials, participants are randomly assigned to one of three groups and shown a context-setting scenario:

- **Group A (Urgency/Time Pressure)**: Red alert theme about being stuck in Atlanta traffic with honking drivers
- **Group B (Safety/Risk Awareness)**: Amber warning theme about a dangerous intersection with blind spots
- **Group C (Control/Neutral)**: Blue info theme about normal suburban driving conditions

### 2. Data Collection
The participant's group assignment (A, B, or C) is:
- Stored in the participant's session data
- Persisted in localStorage for session recovery
- **Included in every trial log row** exported to CSV and database
- Used for between-subjects analysis

## Database Setup

### Step 1: Run the Migration

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
   - Or navigate to your project → SQL Editor

2. **Run the migration**:
   - Copy the contents of [`supabase_migration_priming_group.sql`](./supabase_migration_priming_group.sql)
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl/Cmd + Enter

3. **Verify the migration**:
   ```sql
   -- Check that the column exists
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'trial_logs' AND column_name = 'priming_group';
   ```

   Expected result:
   ```
   column_name   | data_type        | is_nullable
   --------------|------------------|-------------
   priming_group | character varying| YES
   ```

### Step 2: Verify RLS Policies

Ensure your Row Level Security (RLS) policies allow inserting the new column:

```sql
-- Check existing policies
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'trial_logs';

-- If needed, update the insert policy to allow the new column
-- (Usually not necessary if using "WITH CHECK (true)" for anon inserts)
```

### Step 3: Test the Setup

Run a test query to ensure everything works:

```sql
-- Test query: Check for any existing priming group data
SELECT
  priming_group,
  COUNT(*) as count,
  COUNT(DISTINCT participant_id) as unique_participants
FROM public.trial_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY priming_group
ORDER BY priming_group;
```

## Implementation Details

### Random Assignment Logic

Located in [`frontend/src/App.tsx`](./frontend/src/App.tsx):

```typescript
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
```

**Key Features:**
- Equal 1:1:1 randomization (33.3% each)
- Assignment happens **after** practice completion
- Only assigned **once per session** (tracked via `primingShown` flag)
- Persists across page refreshes (localStorage)

### Data Flow

1. **Participant starts experiment** → No group assigned yet
2. **Completes practice trial 3** → Random assignment to A/B/C
3. **Priming screen displays** → Shows scenario based on assigned group
4. **Real experiment begins** → Every trial log includes `priming_group` field
5. **Data exported** → CSV and database both contain group assignment

### File Changes

| File | Changes |
|------|---------|
| `frontend/src/types.ts` | Added `priming_group?: 'A' \| 'B' \| 'C'` to `Participant` and `LogRow` |
| `frontend/src/components/PrimingScreen.tsx` | New component (created) |
| `frontend/src/context/ExperimentProvider.tsx` | Added `primingShown` flag, updated CSV headers |
| `frontend/src/App.tsx` | Added phase flow, group assignment logic |
| `frontend/src/components/TrialScreen.tsx` | Added `priming_group` to log row creation |

## Data Analysis

### CSV Export Format

The exported CSV now includes a `priming_group` column:

```csv
participant_id,age,gender,drivers_license,learners_permit,region_ga,county_ga,priming_group,block_idx,prime_type,trial_idx,...
P7X4K2M9,25,Male,true,false,Metro Atlanta,Fulton County,A,0,NEUTRAL,0,...
P7X4K2M9,25,Male,true,false,Metro Atlanta,Fulton County,A,0,NEUTRAL,1,...
```

### Analysis Queries

**Check group distribution:**
```sql
SELECT
  priming_group,
  COUNT(DISTINCT participant_id) as n_participants,
  ROUND(100.0 * COUNT(DISTINCT participant_id) / SUM(COUNT(DISTINCT participant_id)) OVER (), 1) as pct
FROM public.trial_logs
WHERE priming_group IS NOT NULL
GROUP BY priming_group
ORDER BY priming_group;
```

**Compare accuracy by group:**
```sql
SELECT
  priming_group,
  COUNT(*) as total_trials,
  SUM(correct) as correct_trials,
  ROUND(100.0 * SUM(correct) / COUNT(*), 2) as accuracy_pct,
  ROUND(AVG(rt_ms), 0) as avg_rt_ms
FROM public.trial_logs
WHERE priming_group IS NOT NULL
GROUP BY priming_group
ORDER BY priming_group;
```

**Export data for statistical analysis (R, Python, etc.):**
```sql
SELECT
  participant_id,
  priming_group,
  age,
  gender,
  block_idx,
  trial_idx,
  signal,
  oncoming_car_ttc,
  pedestrian,
  choice,
  correct,
  rt_ms,
  created_at
FROM public.trial_logs
WHERE priming_group IS NOT NULL
ORDER BY participant_id, block_idx, trial_idx;
```

## Testing the Implementation

### Manual Testing Checklist

1. **Start a new experiment**:
   - Clear localStorage: Open DevTools → Application → Local Storage → Clear
   - Refresh the page
   - Generate a new participant ID

2. **Complete practice trials**:
   - Go through all 3 practice scenarios
   - After the 3rd trial, you should see the priming screen

3. **Verify randomization**:
   - Check browser console for: `[Priming] Assigned to group: X`
   - Note which group (A, B, or C) was assigned

4. **Check priming screen content**:
   - **Group A**: Should see red 🚧 "ATLANTA TRAFFIC ALERT" with "honking" and "3 cycles"
   - **Group B**: Should see amber ⚠️ "DANGEROUS INTERSECTION" with "blind spots" and "high speeds"
   - **Group C**: Should see blue ℹ️ "STANDARD DRIVE" with "light traffic" and "clear weather"

5. **Test one-time display**:
   - Complete the experiment or go back to practice
   - If you return to practice and complete it again, the priming screen should be **skipped**

6. **Verify data export**:
   - Complete at least one real trial
   - Download the CSV
   - Check that `priming_group` column exists and shows your assigned group

7. **Test session recovery**:
   - After assignment, refresh the page mid-experiment
   - Your group should be preserved (check localStorage)

### Automated Distribution Test

Run this in the browser console to simulate 1000 assignments:

```javascript
const counts = { A: 0, B: 0, C: 0 };
for (let i = 0; i < 1000; i++) {
  const groups = ['A', 'B', 'C'];
  const randomGroup = groups[Math.floor(Math.random() * 3)];
  counts[randomGroup]++;
}
console.table(counts);
console.log('Expected: ~333 each (±10)');
```

## Troubleshooting

### Issue: Column doesn't exist in database

**Symptoms**: Error when submitting trials: `column "priming_group" does not exist`

**Solution**:
1. Run the migration SQL from Step 1
2. Verify with: `\d trial_logs` or the verification query above

### Issue: Priming screen doesn't appear

**Possible causes**:
1. Already shown in current session → Check localStorage for `primingShown: true`
2. Participant not set → Check console for participant object
3. Practice not completed → Ensure all 3 practice trials are done

**Debug**:
```javascript
// In browser console
const session = JSON.parse(localStorage.getItem('experiment_session_backup'));
console.log('Priming shown:', session?.sessionMetadata?.primingShown);
console.log('Group:', session?.participant?.priming_group);
```

### Issue: Same group every time

**Symptoms**: Always assigned to the same group (not random)

**Debug**:
1. Check if localStorage has cached group → Clear localStorage
2. Verify randomization works:
   ```javascript
   // Run multiple times in console
   const groups = ['A', 'B', 'C'];
   console.log(groups[Math.floor(Math.random() * 3)]);
   ```

### Issue: Group not appearing in CSV export

**Possible causes**:
1. Trials completed before group was assigned
2. Group assigned but not saved to logs

**Solution**:
1. Check TrialScreen.tsx includes `priming_group: participant?.priming_group` in logRow
2. Verify participant object has the group set:
   ```javascript
   // In React DevTools or console
   console.log(participant?.priming_group);
   ```

## Deployment Notes

### Environment Variables

No new environment variables needed! The feature uses existing Supabase configuration.

### Database Migration on Production

**Before deploying frontend code:**
1. Run the migration on your **production** Supabase instance
2. Test with a sample insert to verify the column exists
3. Then deploy the updated frontend code

**Migration command (production):**
```bash
# Option 1: Via Supabase Dashboard
# Copy/paste SQL from supabase_migration_priming_group.sql

# Option 2: Via Supabase CLI (if using)
supabase db push
```

### Vercel Deployment

No changes needed to Vercel configuration. The existing build process works as-is.

## Research Considerations

### Sample Size Recommendations

For a between-subjects design with 3 groups:
- **Minimum**: 30 participants per group (90 total)
- **Recommended**: 50-100 participants per group (150-300 total)
- **Well-powered**: 100+ participants per group (300+ total)

### Balancing Groups

The randomization is **probabilistic**, not **deterministic**. With small samples, you might get imbalance (e.g., 12/15/18 instead of 15/15/15).

If you need **exact** balanced groups, you could implement:
1. **Block randomization**: Assign in blocks of 3 (A, B, C in random order)
2. **Stratified randomization**: Balance by demographics (age, gender, etc.)

### Data Quality Checks

Before analysis, check:
```sql
-- Completeness: Do all participants have a group?
SELECT
  COUNT(*) as total_participants,
  COUNT(DISTINCT CASE WHEN priming_group IS NOT NULL THEN participant_id END) as with_group,
  COUNT(DISTINCT CASE WHEN priming_group IS NULL THEN participant_id END) as without_group
FROM (
  SELECT DISTINCT participant_id, priming_group
  FROM public.trial_logs
) t;

-- Attention checks by group
SELECT
  priming_group,
  SUM(CASE WHEN is_attention_check = 1 AND correct = 1 THEN 1 ELSE 0 END)::float /
    NULLIF(SUM(CASE WHEN is_attention_check = 1 THEN 1 ELSE 0 END), 0) as attention_pass_rate
FROM public.trial_logs
GROUP BY priming_group;
```

## Contact & Support

For issues or questions about this implementation:
1. Check the [main README](./README.md) for general setup
2. Review the code comments in the modified files
3. Check browser console for `[Priming]` log messages
4. Inspect localStorage: `experiment_session_backup` key

---

**Implementation Date**: 2025-12-28
**Version**: 1.0
**Status**: ✅ Production Ready
