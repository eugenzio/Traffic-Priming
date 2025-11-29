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
  message: string
  subtitle: string
  bgColor: string
  IconComponent: React.FC
}> = {
  'go_arrow': {
    title: 'GO SIGNALS',
    message: 'Focus on green signals',
    subtitle: 'Proceed when safe',
    bgColor: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    IconComponent: TrafficLightIcon
  },
  'caution_amber': {
    title: 'CAUTION',
    message: 'Exercise caution',
    subtitle: 'Safety first - watch for warnings',
    bgColor: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    IconComponent: TrafficLightIcon
  },
  'ped_salience': {
    title: 'PEDESTRIANS',
    message: 'Watch for pedestrians',
    subtitle: 'Pedestrian safety is priority',
    bgColor: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    IconComponent: PedestrianIcon
  },
  'oncoming_speed': {
    title: 'VEHICLE SPEED',
    message: 'Monitor oncoming traffic',
    subtitle: 'Watch for fast-moving vehicles',
    bgColor: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    IconComponent: TTCIcon
  },
  'time_pressure': {
    title: 'EFFICIENCY',
    message: 'Make efficient decisions',
    subtitle: 'Respond promptly when clear',
    bgColor: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    IconComponent: PatienceIcon
  },
  'social_norm': {
    title: 'TRAFFIC FLOW',
    message: 'Keep pace with traffic',
    subtitle: 'Others are waiting behind you',
    bgColor: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
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
        stroke="white"
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
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: !isControl && visual ? visual.bgColor : 'var(--bg)',
        padding: '48px 24px',
        position: 'relative'
      }}
    >
      {/* Subtle overlay for readability */}
      {!isControl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        />
      )}

      <div style={{ textAlign: 'center', maxWidth: '800px', position: 'relative', zIndex: 1 }}>
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
                  padding: '10px 28px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '40px',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)'
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
              style={{ marginBottom: '48px' }}
            >
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '24px',
                padding: '32px',
                display: 'inline-block',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
              }}>
                <visual.IconComponent />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{
                fontSize: 'clamp(40px, 8vw, 72px)',
                fontWeight: 800,
                color: 'white',
                marginBottom: '24px',
                letterSpacing: '0.02em',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              {visual.title}
            </motion.h1>

            {/* Main Message */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 600,
                color: 'white',
                lineHeight: '1.4',
                marginBottom: '16px',
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              {visual.message}
            </motion.p>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              style={{
                fontSize: 'clamp(16px, 2vw, 20px)',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: '1.6',
                maxWidth: '600px',
                margin: '0 auto',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {visual.subtitle}
            </motion.p>

            {/* Get Ready indicator */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{
                marginTop: '64px',
                padding: '16px 32px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                display: 'inline-block',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'white',
                margin: 0,
                letterSpacing: '0.05em'
              }}>
                Get ready for the next trials
              </p>
            </motion.div>
          </>
        )}

        {isControl && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontSize: '48px',
              fontWeight: 600,
              color: 'var(--fg-muted)'
            }}
          >
            Get ready...
          </motion.h1>
        )}

        {/* Auto-start indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isControl ? 0.5 : 1.5 }}
          style={{
            marginTop: isControl ? '32px' : '48px',
            color: isControl ? 'var(--fg-subtle)' : 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Starting automatically...
        </motion.div>
      </div>
    </motion.div>
  )
}
