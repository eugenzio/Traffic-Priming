import process from 'node:process';

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_USE_DB'];
const missing = required.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
if (missing.length) {
  console.error('[BUILD FAIL] Missing env(s):', missing.join(', '));
  process.exit(1);
} else {
  console.log('[BUILD OK] All required envs present.');
}

