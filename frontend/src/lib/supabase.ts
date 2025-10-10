import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
  global: {
    fetch,
    // Force headers even if someone mis-imports envs later
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  },
});

// Runtime sanity log (ADD-ONLY)
if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.error('[ENV] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Requests will 401.');
}

