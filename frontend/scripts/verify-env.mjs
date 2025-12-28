import process from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Try to load .env.local or .env file (for local development only)
// In production (Vercel), environment variables are injected by the platform
const isProduction = process.env.VERCEL || process.env.CI;

if (!isProduction) {
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
}

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_USE_DB'];
const missing = required.filter(k => !process.env[k] || String(process.env[k]).trim() === '');

if (missing.length) {
  console.error('[BUILD FAIL] Missing env(s):', missing.join(', '));
  if (isProduction) {
    console.error('[BUILD FAIL] In production: Set environment variables in Vercel dashboard');
    console.error('[BUILD FAIL] Go to: Settings → Environment Variables');
  } else {
    console.error('[BUILD FAIL] In development: Create .env.local or .env file with required variables');
  }
  console.error('[BUILD FAIL] Required variables:', required.join(', '));
  process.exit(1);
} else {
  console.log('[BUILD OK] All required envs present:', required.join(', '));
}

