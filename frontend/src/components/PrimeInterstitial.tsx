import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Prime } from '../prime/types'

interface PrimeInterstitialProps {
  prime: Prime
  onContinue: () => void
  durationMs?: number
}

// Map prime IDs to visual content
const PRIME_VISUALS: Record<string, {
  title: string
  goal: string
  vibe: string
  IconComponent: React.FC
}> = {
  'social_ped': {
    title: 'Pedestrian',
    goal: 'Think about people on the road and protecting humans.',
    vibe: 'People first. Be careful for others.',
    IconComponent: PedestrianIcon
  },
  'signal_aware': {
    title: 'Traffic Lights',
    goal: 'Activate timing and signal awareness.',
    vibe: 'Follow signals. Wait for the right moment to act.',
    IconComponent: TrafficLightIcon
  },
  'timing_ttc': {
    title: 'TTC (Time To Collision)',
    goal: 'Make the brain estimate distance and timing to avoid hitting something.',
    vibe: 'Get ready fast. Pay attention to timing and space.',
    IconComponent: TTCIcon
  },
  'rule_follow': {
    title: 'Rules',
    goal: 'Remind them to follow laws and structure.',
    vibe: 'Do it correctly. Follow the system.',
    IconComponent: RulesIcon
  },
  'patience_wait': {
    title: 'Patience',
    goal: 'Slow down impulses and reduce rush.',
    vibe: 'Chill. Take your time. No hurry.',
    IconComponent: PatienceIcon
  },
  'responsibility': {
    title: 'Responsibility',
    goal: 'Remind them their decisions affect others.',
    vibe: 'Your actions matter. Be careful and responsible.',
    IconComponent: ResponsibilityIcon
  }
}

function PedestrianIcon() {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={{ margin: '0 auto' }}
    >
      {/* Parent and child crossing */}
      <motion.circle
        cx="70"
        cy="60"
        r="15"
        fill="var(--accent-priming)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      />
      <motion.rect
        x="55"
        y="80"
        width="30"
        height="50"
        rx="5"
        fill="var(--accent-priming)"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.5 }}
      />
      <motion.circle
        cx="120"
        cy="75"
        r="10"
        fill="var(--accent-priming-fg)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
      />
      <motion.rect
        x="110"
        y="88"
        width="20"
        height="35"
        rx="4"
        fill="var(--accent-priming-fg)"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.7 }}
      />
      {/* Hand holding */}
      <motion.line
        x1="85"
        y1="100"
        x2="110"
        y2="95"
        stroke="var(--accent-priming)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      />
      {/* Crosswalk stripes */}
      {[0, 1, 2, 3].map((i) => (
        <motion.rect
          key={i}
          x={40 + i * 35}
          y="150"
          width="20"
          height="8"
          fill="var(--fg-subtle)"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
        />
      ))}
    </motion.svg>
  )
}

function TrafficLightIcon() {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={{ margin: '0 auto' }}
    >
      {/* Traffic light housing */}
      <motion.rect
        x="75"
        y="30"
        width="50"
        height="140"
        rx="10"
        fill="var(--muted-8)"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ type: 'spring', stiffness: 150 }}
      />
      {/* Red light */}
      <motion.circle
        cx="100"
        cy="60"
        r="15"
        fill="#ef4444"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      />
      <motion.circle
        cx="100"
        cy="60"
        r="15"
        fill="#ef4444"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
      />
      {/* Yellow light */}
      <motion.circle
        cx="100"
        cy="100"
        r="15"
        fill="#f59e0b"
        initial={{ opacity: 0.3, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.5 }}
      />
      {/* Green light */}
      <motion.circle
        cx="100"
        cy="140"
        r="15"
        fill="#10b981"
        initial={{ opacity: 0.3, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.7 }}
      />
    </motion.svg>
  )
}

function TTCIcon() {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={{ margin: '0 auto' }}
    >
      {/* Car silhouette */}
      <motion.rect
        x="30"
        y="90"
        width="60"
        height="30"
        rx="5"
        fill="var(--accent-priming)"
        initial={{ x: -100 }}
        animate={{ x: 30 }}
        transition={{ duration: 1, type: 'spring' }}
      />
      {/* Target/object */}
      <motion.circle
        cx="170"
        cy="105"
        r="15"
        fill="none"
        stroke="var(--danger)"
        strokeWidth="3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />
      <motion.circle
        cx="170"
        cy="105"
        r="25"
        fill="none"
        stroke="var(--danger)"
        strokeWidth="2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 0.5, 0] }}
        transition={{ delay: 0.7, duration: 1, repeat: Infinity }}
      />
      {/* Distance lines */}
      {[0, 1, 2].map((i) => (
        <motion.line
          key={i}
          x1={100 + i * 20}
          y1="105"
          x2={110 + i * 20}
          y2="105"
          stroke="var(--accent-priming-fg)"
          strokeWidth="2"
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 0.8 + i * 0.2, duration: 1.5, repeat: Infinity }}
        />
      ))}
      {/* TTC countdown */}
      <motion.text
        x="100"
        y="75"
        textAnchor="middle"
        fill="var(--danger)"
        fontSize="24"
        fontWeight="bold"
        initial={{ opacity: 0, scale: 2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        2.5s
      </motion.text>
    </motion.svg>
  )
}

function RulesIcon() {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={{ margin: '0 auto' }}
    >
      {/* Stop sign */}
      <motion.polygon
        points="100,40 130,55 145,85 145,115 130,145 100,160 70,145 55,115 55,85 70,55"
        fill="#dc2626"
        stroke="#ffffff"
        strokeWidth="4"
        initial={{ scale: 0, rotate: 45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      />
      <motion.text
        x="100"
        y="110"
        textAnchor="middle"
        fill="white"
        fontSize="28"
        fontWeight="bold"
        fontFamily="Arial"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        STOP
      </motion.text>
      {/* Yield sign */}
      <motion.polygon
        points="50,170 80,170 65,145"
        fill="none"
        stroke="var(--warning)"
        strokeWidth="3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      />
      {/* Checkmark for compliance */}
      <motion.path
        d="M 130 155 L 140 165 L 160 140"
        fill="none"
        stroke="var(--success)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      />
    </motion.svg>
  )
}

function PatienceIcon() {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={{ margin: '0 auto' }}
    >
      {/* Clock circle */}
      <motion.circle
        cx="100"
        cy="100"
        r="60"
        fill="none"
        stroke="var(--accent-priming)"
        strokeWidth="4"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150 }}
      />
      {/* Hour markers */}
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={100 + 50 * Math.cos((i * Math.PI) / 2 - Math.PI / 2)}
          cy={100 + 50 * Math.sin((i * Math.PI) / 2 - Math.PI / 2)}
          r="3"
          fill="var(--accent-priming-fg)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + i * 0.1 }}
        />
      ))}
      {/* Hour hand */}
      <motion.line
        x1="100"
        y1="100"
        x2="100"
        y2="65"
        stroke="var(--accent-priming)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ rotate: -90 }}
        animate={{ rotate: 0 }}
        transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
        style={{ transformOrigin: '100px 100px' }}
      />
      {/* Minute hand */}
      <motion.line
        x1="100"
        y1="100"
        x2="130"
        y2="100"
        stroke="var(--accent-priming-fg)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ delay: 0.7, duration: 3, ease: 'linear', repeat: Infinity }}
        style={{ transformOrigin: '100px 100px' }}
      />
      {/* Center dot */}
      <motion.circle
        cx="100"
        cy="100"
        r="5"
        fill="var(--accent-priming)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
      />
      {/* Calm waves */}
      <motion.path
        d="M 40 160 Q 70 150 100 160 T 160 160"
        fill="none"
        stroke="var(--accent-priming-fg)"
        strokeWidth="2"
        opacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1, duration: 1.5 }}
      />
    </motion.svg>
  )
}

function ResponsibilityIcon() {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={{ margin: '0 auto' }}
    >
      {/* Steering wheel */}
      <motion.circle
        cx="100"
        cy="100"
        r="50"
        fill="none"
        stroke="var(--accent-priming)"
        strokeWidth="6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150 }}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="15"
        fill="var(--accent-priming)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      />
      {/* Spokes */}
      {[0, 1, 2].map((i) => (
        <motion.line
          key={i}
          x1="100"
          y1="100"
          x2={100 + 50 * Math.cos((i * 2 * Math.PI) / 3)}
          y2={100 + 50 * Math.sin((i * 2 * Math.PI) / 3)}
          stroke="var(--accent-priming)"
          strokeWidth="4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
        />
      ))}
      {/* Hands on wheel */}
      <motion.path
        d="M 60 95 Q 55 100 60 105"
        fill="var(--accent-priming-fg)"
        stroke="var(--accent-priming-fg)"
        strokeWidth="3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9 }}
      />
      <motion.path
        d="M 140 95 Q 145 100 140 105"
        fill="var(--accent-priming-fg)"
        stroke="var(--accent-priming-fg)"
        strokeWidth="3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9 }}
      />
      {/* Focus indicator */}
      <motion.circle
        cx="100"
        cy="100"
        r="70"
        fill="none"
        stroke="var(--accent-priming-border)"
        strokeWidth="2"
        strokeDasharray="10 10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0], rotate: 360 }}
        transition={{ delay: 1.2, duration: 3, repeat: Infinity }}
        style={{ transformOrigin: '100px 100px' }}
      />
    </motion.svg>
  )
}

export default function PrimeInterstitial({ prime, onContinue, durationMs = 5000 }: PrimeInterstitialProps) {
  const isControl = prime.id === 'control_none'
  const visual = PRIME_VISUALS[prime.id]

  // Auto-advance after duration
  useEffect(() => {
    const timer = setTimeout(onContinue, durationMs)
    return () => clearTimeout(timer)
  }, [onContinue, durationMs])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)', padding: '48px 24px' }}
    >
      <div className="text-center max-w-3xl">
        {!isControl && visual && (
          <>
            {/* Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  background: 'var(--accent-priming-bg)',
                  color: 'var(--accent-priming-fg)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '32px',
                  border: '2px solid',
                  borderColor: 'var(--accent-priming-border)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                Focus Area
              </div>
            </motion.div>

            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{ marginBottom: '32px' }}
            >
              <visual.IconComponent />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3 }}
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: 'var(--fg)',
                marginBottom: '24px',
                fontFamily: 'var(--font-serif)',
                letterSpacing: '-0.02em'
              }}
            >
              {visual.title}
            </motion.h1>

            {/* Goal */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
              style={{
                fontSize: '18px',
                color: 'var(--fg-muted)',
                lineHeight: '1.7',
                marginBottom: '20px',
                maxWidth: '600px',
                margin: '0 auto 20px'
              }}
            >
              {visual.goal}
            </motion.p>

            {/* Mental Vibe */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.7 }}
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: 'var(--muted-2)',
                border: '2px solid var(--accent-priming-border)',
                borderRadius: '12px',
                marginTop: '16px'
              }}
            >
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--accent-priming)',
                  margin: 0,
                  fontStyle: 'italic'
                }}
              >
                "{visual.vibe}"
              </p>
            </motion.div>
          </>
        )}

        {isControl && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontSize: '40px',
              fontWeight: 600,
              color: 'var(--fg-muted)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            Get ready...
          </motion.h1>
        )}

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isControl ? 0.5 : 2 }}
          style={{
            marginTop: '64px',
            color: 'var(--fg-subtle)',
            fontSize: '14px'
          }}
        >
          Starting next trials shortly...
        </motion.div>
      </div>
    </motion.div>
  )
}
