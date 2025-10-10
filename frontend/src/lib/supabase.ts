import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Dev-only header logger to verify actual headers on /rest/v1/* calls
function devFetchLogger(input: RequestInfo | URL, init?: RequestInit) {
  const u = typeof input === 'string' ? input : (input as URL).toString?.() ?? '';
  if (import.meta.env.DEV && typeof u === 'string' && u.includes('/rest/v1/')) {
    // Log the actual merged headers (including global.headers from createClient)
    const headers = init?.headers;
    const headersObj = headers instanceof Headers 
      ? Object.fromEntries(headers.entries())
      : headers;
    // eslint-disable-next-line no-console
    console.log('[SUPABASE fetch]', u.split('/rest/v1/')[1]?.split('?')[0], 'headers=', headersObj);
  }
  return fetch(input as any, init);
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
  global: {
    // Use a dev-logger fetch wrapper so we can see headers locally
    fetch: devFetchLogger as any,
    // Force headers so even if envs are mis-wired elsewhere, requests still include creds
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  },
});

// Runtime sanity log: make missing env super obvious in console
if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.error('[ENV] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Requests will 401.');
} else if (import.meta.env.DEV) {
  const mask = (s: string) => (s?.length >= 12 ? `${s.slice(0,6)}…${s.slice(-6)}` : s);
  // eslint-disable-next-line no-console
  console.log('[ENV] Supabase URL:', url, '| Key:', mask(anon));
}

// Debug helper: test Supabase connection and auth (dev-only)
export async function debugSupabaseSetup() {
  if (!import.meta.env.DEV) return;
  
  console.group('[SUPABASE DEBUG]');
  
  try {
    // 1. Check environment
    console.log('✓ URL:', url);
    console.log('✓ Anon Key (first 20):', anon?.substring(0, 20));
    console.log('✓ Environment:', import.meta.env.MODE);
    
    // 2. Test minimal insert (will be caught by RLS if policies missing)
    const testRow = {
      participant_id: 'debug_test_' + Date.now(),
      block_idx: 999,
      trial_idx: 999,
      prime_type: 'DEBUG_TEST',
      scene_id: 'test',
      signal: 'GREEN_ARROW',
      oncoming_car_ttc: 3.0,
      pedestrian: 'NONE',
      choice: 'wait' as const,
      correct: 1 as const,
      rt_ms: 0,
      displayed_at_ms: 0,
      responded_at_ms: 0,
      focus_lost: 0 as const,
      seed: 0,
      age: 0,
      gender: 'Test',
      drivers_license: false,
      learners_permit: false,
    };
    
    console.log('→ Testing insert...');
    const { data, error } = await supabase
      .from('trial_logs')
      .upsert(testRow, { onConflict: 'participant_id,block_idx,trial_idx', ignoreDuplicates: true });
    
    if (error) {
      console.error('✗ Insert failed:', error.message);
      console.error('  Code:', error.code);
      console.error('  Hint:', error.hint);
      if (error.code === '42501') {
        console.error('  → RLS POLICY MISSING: Run the SQL in README to create insert policy');
      } else if (error.message.includes('JWT') || error.code === 'PGRST301') {
        console.error('  → AUTH ERROR: Check .env.local has correct VITE_SUPABASE_ANON_KEY');
      }
    } else {
      console.log('✓ Insert successful');
      // Clean up test row
      await supabase.from('trial_logs').delete().eq('participant_id', testRow.participant_id);
    }
  } catch (err: any) {
    console.error('✗ Unexpected error:', err?.message || err);
  }
  
  console.groupEnd();
}

// Auto-run debug on dev startup (call this from your main.tsx or App.tsx)
if (import.meta.env.DEV) {
  setTimeout(() => debugSupabaseSetup(), 1000);
}

