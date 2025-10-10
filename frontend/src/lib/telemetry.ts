import { supabase } from './supabase';

const KEY = 'triallogs_offline_v1';

function loadQueue(): any[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function saveQueue(q: any[]) {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch {}
}

async function insertBatch(rows: any[]) {
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    // IMPORTANT: no .select() here (prevents ?columns=... & read perms)
    const { error } = await supabase
      .from('trial_logs')
      .upsert(slice, {
        onConflict: 'participant_id,block_idx,trial_idx',
        ignoreDuplicates: true,
      });
    if (error) throw error;
  }
}

/** Persist a single trial row; falls back to offline queue on error. */
export async function submitToDB(row: any) {
  const payload = { ...row, created_at: row.created_at ?? new Date().toISOString() };
  try {
    // IMPORTANT: never chain .select() on writes (prevents read perms requirement)
    const { error } = await supabase
      .from('trial_logs')
      .upsert(payload, {
        onConflict: 'participant_id,block_idx,trial_idx',
        ignoreDuplicates: true,
      });
    if (error) throw error;
  } catch (e: any) {
    // If we hit 401 or "No API key" message, make it explicit in console
    const msg = e?.message || String(e);
    if (/401|No API key/i.test(msg)) {
      // eslint-disable-next-line no-console
      console.error('[DB] 401/No API key: check .env.local (dev) or Vercel env (prod), then restart/redeploy.');
    }
    const q = loadQueue(); q.push(payload); saveQueue(q);
  }
}

/** Flush queued rows when online. Safe to call repeatedly. */
export async function flushQueue() {
  const q = loadQueue();
  if (!q.length) return;
  try {
    await insertBatch(q);
    saveQueue([]);
    // console.info('[DB] flushed', q.length);
  } catch {
    // keep queue; will retry next time
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushQueue(); });
}

if (typeof document !== 'undefined') {
  const flushOnHide = () => { try { flushQueue(); } catch {} };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnHide();
  });
  window.addEventListener('pagehide', flushOnHide);
}

