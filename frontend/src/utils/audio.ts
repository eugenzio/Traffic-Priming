// frontend/src/utils/audio.ts
let _ctx: AudioContext | null = null;
let _toneNode: OscillatorNode | null = null;
let _gainNode: GainNode | null = null;
let _audioUnlocked = false;
let _unlockPromise: Promise<void> | null = null;
let _voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let _speakRunToken = 0;

/** Get a singleton AudioContext. */
export function getAudioContext(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _ctx!;
}

/** Ensure audio is unlocked (required on Safari/iOS/Chrome autoplay policies). */
export async function ensureAudioReady() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }
}

/** 
 * Audio unlock gate - must be called once from a user gesture.
 * All TTS/audio will wait for this before playing.
 */
export async function unlockAudio(): Promise<void> {
  if (_audioUnlocked) {
    console.log('[AUDIO] Already unlocked');
    return;
  }
  
  if (_unlockPromise) {
    console.log('[AUDIO] Waiting for existing unlock...');
    return _unlockPromise;
  }
  
  console.log('[AUDIO] Unlocking audio context + speech...');
  
  _unlockPromise = (async () => {
    try {
      // 1. Unlock AudioContext
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // 2. Prime speech synthesis by canceling (Safari requirement)
      try {
        speechSynthesis.cancel();
      } catch {}
      
      // 3. Load voices using stable waiter (no handler clobbering)
      const voices = await waitForVoicesStable();
      console.log('[AUDIO] Voices loaded via stable waiter:', voices.length);
      
      _audioUnlocked = true;
      console.log('[AUDIO] ✅ Audio fully unlocked');
      
      // 4. Handle tab visibility changes - resume audio context when tab becomes visible
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', async () => {
          if (!document.hidden && ctx.state === 'suspended') {
            console.log('[AUDIO] Tab visible, resuming context');
            try {
              await ctx.resume();
            } catch (e) {
              console.warn('[AUDIO] Failed to resume on visibility change:', e);
            }
          }
        });
      }
    } catch (e) {
      console.error('[AUDIO] ❌ Unlock failed:', e);
    }
  })();
  
  await _unlockPromise;
}

/** Wait for audio to be unlocked before proceeding */
export async function awaitAudioUnlock(): Promise<void> {
  if (_audioUnlocked) return;
  console.log('[AUDIO] Waiting for unlock...');
  
  // Wait up to 5 seconds for unlock
  const start = Date.now();
  while (!_audioUnlocked && Date.now() - start < 5000) {
    await new Promise(r => setTimeout(r, 50));
  }
  
  if (!_audioUnlocked) {
    console.warn('[AUDIO] ⚠️ Timeout waiting for unlock, proceeding anyway');
  }
}

/** Resolve when voices are available (event-safe, no handler overwrite). */
export function waitForVoicesStable(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (_voicesReadyPromise) return _voicesReadyPromise;

  _voicesReadyPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const done = () => {
      const voices = speechSynthesis.getVoices() || [];
      console.log('[AUDIO] Voices stable:', voices.length);
      resolve(voices);
    };
    
    const have = speechSynthesis.getVoices();
    if (have && have.length) return resolve(have);

    const onVoices = () => { 
      try {
        speechSynthesis.removeEventListener?.('voiceschanged', onVoices as any);
      } catch {}
      done(); 
    };
    
    try { 
      speechSynthesis.addEventListener?.('voiceschanged', onVoices as any); 
    } catch { 
      /* older browsers ok */ 
    }

    setTimeout(done, timeoutMs);
  });

  return _voicesReadyPromise;
}

/** Start a new speaking run; returns a token & a checker to ignore stale runs. */
export function beginSpeakRun(): { token: number; isStale: (t:number)=>boolean } {
  _speakRunToken += 1;
  const token = _speakRunToken;
  console.log('[AUDIO] Begin speak run token:', token);
  return { token, isStale: (t:number) => t !== _speakRunToken };
}

/** Wait for Web Speech voices to be available. */
export function awaitVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const voices = speechSynthesis.getVoices();
    if (voices && voices.length) return resolve(voices);
    const t = setTimeout(() => resolve(speechSynthesis.getVoices() || []), timeoutMs);
    (window as any).onvoiceschanged = () => {
      clearTimeout(t);
      resolve(speechSynthesis.getVoices() || []);
    };
  });
}

/** Speak text once, with cancel+timeout protection. */
export async function speakOnce(text: string, opts?: {
  lang?: string; rate?: number; pitch?: number; volume?: number; timeoutMs?: number; voiceMatch?:(v:SpeechSynthesisVoice)=>boolean
}): Promise<void> {
  if (!text) return;
  await ensureAudioReady();
  speechSynthesis.cancel(); // stop anything pending

  const voices = await awaitVoices();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = opts?.lang ?? 'en-US';
  utter.rate = opts?.rate ?? 1.0;
  utter.pitch = opts?.pitch ?? 1.0;
  utter.volume = opts?.volume ?? 1.0;
  if (opts?.voiceMatch) {
    const v = voices.find(opts.voiceMatch);
    if (v) utter.voice = v;
  }

  return new Promise<void>((resolve, reject) => {
    const to = setTimeout(() => {
      speechSynthesis.cancel();
      reject(new Error('speakOnce timeout'));
    }, opts?.timeoutMs ?? 4000);
    utter.onend = () => { clearTimeout(to); resolve(); };
    utter.onerror = (e) => { clearTimeout(to); reject(e.error || new Error('speakOnce error')); };
    try { speechSynthesis.speak(utter); } catch (e) { clearTimeout(to); reject(e); }
  });
}

/** Short tone (beep) helper. */
export async function playTone(freq = 600, durMs = 400, gain = 0.06) {
  // Wait for audio unlock (beeps must also respect unlock gate)
  await awaitAudioUnlock();
  await ensureAudioReady();
  const ctx = getAudioContext();
  _toneNode?.stop(); _toneNode = null;
  _gainNode = ctx.createGain(); _gainNode.gain.value = gain;
  _toneNode = ctx.createOscillator(); _toneNode.type = 'sine'; _toneNode.frequency.value = freq;
  _toneNode.connect(_gainNode); _gainNode.connect(ctx.destination);
  _toneNode.start();
  await new Promise(r => setTimeout(r, durMs));
  _toneNode.stop(); _toneNode.disconnect(); _gainNode.disconnect();
  _toneNode = null; _gainNode = null;
}

/** Stop any ongoing tone/speech. Call on unmount. */
export function cancelAllAudio() {
  try { speechSynthesis.cancel(); } catch {}
  try { _toneNode?.stop(); _toneNode = null; _gainNode?.disconnect(); } catch {}
}

/** High-level: play prime audio reliably (beep + speech, with fallback). */
export async function playPrimeAudio(primeType: string) {
  const textMap: Record<string, string> = {
    AUDITORY_SAFETY: 'Wait until it is safe to turn. Confirm a green arrow, no pedestrians, and a safe gap.',
    AUDITORY_RISK: 'Turning now can cause an accident. If there is any doubt, do not turn.',
  };
  if (!(primeType in textMap)) return; // non-auditory: nothing to do

  try {
    await playTone(primeType === 'AUDITORY_RISK' ? 900 : 600, 350);
    await speakOnce(textMap[primeType], { lang: 'en-US', rate: 1.0, timeoutMs: 5000 });
  } catch {
    // Fallback: two beeps if speech fails
    await playTone(700, 250);
    await new Promise(r => setTimeout(r, 120));
    await playTone(700, 250);
  }
}

// --- ADD BELOW (functions only) ---

/** Flush any pending speech and wait until engine is idle. */
export async function flushSpeech(maxWaitMs = 800) {
  console.log('[TTS] Flushing speech...');
  try { speechSynthesis.cancel(); } catch {}
  const t0 = Date.now();
  while (speechSynthesis.speaking && Date.now() - t0 < maxWaitMs) {
    // tiny yield to let WebSpeech settle across browsers
    await new Promise(r => setTimeout(r, 30));
  }
  if (speechSynthesis.speaking) {
    console.warn('[TTS] ⚠️ Speech still active after flush timeout');
  }
}

/** Build spoken text directly from the prime copy shown on screen. */
export function buildPrimeSpeechFromCopy(copy: {
  title?: string; subtitle?: string; bullets?: string[];
}) {
  const parts: string[] = [];
  if (copy?.title) parts.push(copy.title);
  if (copy?.subtitle) parts.push(copy.subtitle);
  if (Array.isArray(copy?.bullets)) parts.push(copy!.bullets!.join('. '));
  const text = parts.join('. ').replace(/\s+/g, ' ').trim();
  // Keep it reasonable so iOS TTS won't bail out on long strings.
  return text.slice(0, 300);
}

/** Speak text with retries + voice-ready + timeout protections. */
export async function speakReliable(text: string, opts?: {
  lang?: string; rate?: number; pitch?: number; volume?: number;
  timeoutMs?: number; retries?: number; voiceMatch?:(v: SpeechSynthesisVoice)=>boolean;
}) {
  if (!text) return;

  // ensure audio context is allowed (call your ensureAudioReady() if you have one)
  try { (window as any).webkitAudioContext; } catch {}

  const retries = Math.max(1, (opts?.retries ?? 2));
  let lastError: any = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await flushSpeech(); // clear any previous utterances

      // Wait for voices to load (works across Safari/Chrome)
      const voicesReady = new Promise<void>(res => {
        const voices = speechSynthesis.getVoices();
        if (voices && voices.length) return res();
        const handler = () => { res(); speechSynthesis.onvoiceschanged = null as any; };
        speechSynthesis.onvoiceschanged = handler;
        // hard fallback
        setTimeout(() => res(), 700);
      });
      await voicesReady;

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = opts?.lang ?? 'en-US';
      utter.rate = opts?.rate ?? 1.0;
      utter.pitch = opts?.pitch ?? 1.0;
      utter.volume = opts?.volume ?? 1.0;

      const voices = speechSynthesis.getVoices() || [];
      if (opts?.voiceMatch) {
        const v = voices.find(opts.voiceMatch);
        if (v) utter.voice = v;
      } else {
        // Prefer an English voice if present
        const v = voices.find(v => /en[-_]/i.test(v.lang));
        if (v) utter.voice = v;
      }

      await new Promise<void>((resolve, reject) => {
        const to = setTimeout(() => { speechSynthesis.cancel(); reject(new Error('tts-timeout')); }, opts?.timeoutMs ?? 5000);
        utter.onend = () => { clearTimeout(to); resolve(); };
        utter.onerror = (e) => { clearTimeout(to); reject(e?.error || new Error('tts-error')); };
        // Small delay helps Safari start reliably on later primes
        setTimeout(() => speechSynthesis.speak(utter), 10);
      });

      return; // success
    } catch (e) {
      lastError = e;
      // tiny backoff before retry
      await new Promise(r => setTimeout(r, 120));
    }
  }
  throw lastError || new Error('speakReliable failed');
}

/** High-level: speak what the user actually sees in the prime copy. */
export async function speakPrimeFromCopy(copy: { title?: string; subtitle?: string; bullets?: string[] }) {
  const text = buildPrimeSpeechFromCopy(copy);
  // optional: short attention beep before speech (safe if you already have one)
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    g.gain.value = 0.05; osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 620; osc.start();
    await new Promise(r => setTimeout(r, 200));
    osc.stop(); osc.disconnect(); g.disconnect(); ctx.close();
  } catch {}
  await speakReliable(text, { lang: 'en-US', rate: 1.0, retries: 3, timeoutMs: 5500 });
}

// --- ADD: DOM→text extractor + reliable speech ---

/** Collect readable text from a container (current, on-screen copy). */
export function extractReadableText(root: Element, maxLen = 300): string {
  if (!root) return '';
  const parts: string[] = [];
  // Prefer headings, paragraphs, list items actually visible now
  root.querySelectorAll('h1,h2,h3,p,li').forEach(el => {
    const s = (el as HTMLElement).innerText?.trim() || '';
    if (s) parts.push(s);
  });
  const text = parts.join('. ').replace(/\s+/g, ' ').trim();
  return text.slice(0, maxLen);
}

/** Wait for voices; cross-browser (Safari/Chrome). */
export function waitForVoices(timeoutMs = 1000): Promise<void> {
  return new Promise(res => {
    const ready = () => {
      const finalVoices = speechSynthesis.getVoices();
      console.log('[TTS] Voices ready:', finalVoices.length);
      res();
    };
    const v = speechSynthesis.getVoices();
    if (v && v.length) return ready();
    
    console.log('[TTS] Waiting for onvoiceschanged...');
    const t = setTimeout(() => {
      console.log('[TTS] Voice loading timeout reached');
      ready();
    }, timeoutMs);
    
    speechSynthesis.onvoiceschanged = () => { 
      clearTimeout(t); 
      ready(); 
      speechSynthesis.onvoiceschanged = null as any; 
    };
  });
}

/** Speak given text reliably with short timeout & fallback English voice. */
export async function speakText(text: string, opts?: { lang?: string; rate?: number; timeoutMs?: number }) {
  if (!text) {
    throw new Error('No text provided to speakText');
  }
  
  // Wait for voices to load (unified, event-safe)
  const voices = await waitForVoicesStable();
  if (voices.length === 0) {
    console.warn('[TTS] ⚠️ voices empty');
    throw new Error('voices empty');
  }
  console.log('[TTS] Available voices:', voices.length);
  
  // Flush previous speech
  await flushSpeech();
  
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts?.lang ?? 'en-US';
  u.rate = opts?.rate ?? 1.0;
  
  // Choose English voice if available
  const en = voices.find(v => /en[-_]/i.test(v.lang));
  if (en) {
    u.voice = en;
    console.log('[TTS] Using voice:', en.name);
  } else {
    console.log('[TTS] No English voice found, using default');
  }

  await new Promise<void>((resolve, reject) => {
    const to = setTimeout(() => { 
      try { speechSynthesis.cancel(); } catch {}
      console.warn('[TTS] ⚠️ timeout'); 
      reject(new Error('timeout')); 
    }, opts?.timeoutMs ?? 6000);
    
    u.onend = () => { 
      clearTimeout(to); 
      console.log('[TTS] onend fired');
      resolve(); 
    };
    
    u.onerror = e => { 
      clearTimeout(to); 
      console.error('[TTS] onerror fired:', e);
      reject(e?.error || new Error('tts-error')); 
    };
    
    // Defer start slightly (Safari/Chrome binding)
    setTimeout(() => {
      console.log('[TTS] speechSynthesis.speak() called');
      try {
        speechSynthesis.speak(u);
      } catch (err) {
        clearTimeout(to);
        reject(err);
      }
    }, 10);
  });
}

/** High-level: read whatever is visible inside this container. */
export async function speakFromContainer(container: Element, primeType?: string, copy?: any) {
  console.log(`[TTS] speakFromContainer called for ${primeType || 'unknown'}`);
  
  // Wait for audio unlock
  await awaitAudioUnlock();
  
  // Ensure audio context is ready (handles tab visibility)
  await ensureAudioReady();
  
  // Extract text from DOM (current, on-screen copy)
  const text = extractReadableText(container);
  console.log(`[TTS] Extracted text (${text.length} chars):`, text.slice(0, 100) + (text.length > 100 ? '...' : ''));
  
  if (!text) {
    const error = new Error('No text extracted from container');
    console.warn('[TTS] ⚠️ No text extracted, skipping speech');
    throw error;
  }
  
  try {
    await speakText(text, { lang: 'en-US', rate: 1.0, timeoutMs: 6500 });
  } catch (e: any) {
    // Add context to the error
    const errorMsg = e?.message || String(e);
    console.error('[TTS] ❌ Speech failed:', errorMsg);
    throw new Error(`TTS failed: ${errorMsg}`);
  }
}

