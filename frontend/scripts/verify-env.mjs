import process from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Try to load .env.local or .env file
try {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    try {
      const envPath = resolve(process.cwd(), file);
      const envContent = readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      console.log(`[ENV] Loaded ${file}`);
      break;
    } catch (e) {
      // File doesn't exist, try next
    }
  }
} catch (e) {
  // Ignore
}

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_USE_DB'];
const missing = required.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
if (missing.length) {
  console.error('[BUILD FAIL] Missing env(s):', missing.join(', '));
  console.error('[BUILD FAIL] Make sure .env.local or .env file exists with required variables');
  process.exit(1);
} else {
  console.log('[BUILD OK] All required envs present.');
}

