import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false }, global: { fetch } }
);

// --- ENV sanity log (ADD-ONLY, idempotent) ---
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error('[ENV] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase requests will 401.');
}

