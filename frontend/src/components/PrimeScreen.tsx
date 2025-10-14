import React, { useEffect, useState } from 'react'
import { CONFIG, PRIME_COPY } from '../config'
import type { PrimeType } from '../types'
import { getVisualPrimeCopy } from '../utils/primeCopy'

// Hide the "Visual Prime" eyebrow and tighten title spacing (no new CSS file)
function ensurePrimeEyebrowHidden() {
  if (document.getElementById('prime-eyebrow-css')) return;
  const s = document.createElement('style');
  s.id = 'prime-eyebrow-css';
  s.textContent = `
    .prime-eyebrow { display: none !important; }
    .prime-title { margin-top: 4px !important; }
    .prime-subtitle { margin-top: 8px !important; }
  `;
  document.head.appendChild(s);
}

export default function PrimeScreen({
  primeType,
  durationSec = CONFIG.PRIME_DURATION_SEC,
  onDone
}: {
  primeType: PrimeType
  durationSec?: number
  onDone: () => void
}) {
  const [t, setT] = useState(durationSec)

  // Hide eyebrow on mount
  useEffect(() => { ensurePrimeEyebrowHidden(); }, [])

  // Block keys during prime + auto-advance after duration
  useEffect(() => {
    const stopKeys = (e: KeyboardEvent) => e.preventDefault()
    window.addEventListener('keydown', stopKeys, { capture: true })
    const timer = setTimeout(onDone, durationSec * 1000)
    return () => { 
      window.removeEventListener('keydown', stopKeys, { capture: true } as any)
      clearTimeout(timer)
    }
  }, [onDone, durationSec])

  // Countdown timer (visual feedback)
  useEffect(() => {
    const interval = setInterval(() => setT(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(interval)
  }, [])

  // Use new PRIME_COPY map for improved visibility and layout
  const getPrimeCopy = (primeType: PrimeType) => {
    // Map prime types to new PRIME_COPY keys
    const primeMap: Record<string, keyof typeof PRIME_COPY> = {
      'VISUAL_PEDESTRIAN': 'PEDESTRIAN_FIRST',
      'VISUAL_SIGNAL': 'PROTECTED_ARROW', // Assuming green arrow case
      'VISUAL_TTC': 'GAP_RISK',
      'VISUAL_YELLOW': 'YELLOW_FLASH'
    };
    
    const copyKey = primeMap[primeType] || 'PEDESTRIAN_FIRST';
    return PRIME_COPY[copyKey];
  };

  const copy = getPrimeCopy(primeType);

  return (
    <div
      className="card"
      style={{
        padding: 24,
        minHeight: 300,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center'
      }}
    >
      <div>
        <div className="prime-eyebrow" aria-hidden="true" style={{ fontSize: 18, opacity: 0.8, marginBottom: 8 }}>Visual Prime</div>
        {copy.title && <h2 className="prime-title" style={{ fontSize: 28, margin: 0 }}>{copy.title}</h2>}
        {copy.bullets?.length ? (
          <ul style={{ textAlign: 'left', maxWidth: 620, margin: '12px auto', fontSize: 16, listStyle: 'none', padding: 0 }}>
            {copy.bullets.slice(0, 2).map((b, i) => (
              <li key={i} style={{ marginBottom: 8, position: 'relative', paddingLeft: 20 }}>
                <span style={{ position: 'absolute', left: 0, color: '#10b981' }}>•</span>
                {b}
              </li>
            ))}
          </ul>
        ) : null}
        <div style={{ marginTop: 20, fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>
          Showing for <strong>{t}s</strong>
        </div>
      </div>
    </div>
  )
}
