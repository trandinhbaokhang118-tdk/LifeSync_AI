import { motion, useReducedMotion } from 'framer-motion';

interface ClockLoaderProps {
  size?: number;
  onComplete?: () => void;
}

/**
 * Animated clock face loader — the Login button morphs into this.
 * Hour hand spins fast, minute hand spins faster, over 1.5s total.
 */
export function ClockLoader({ size = 48, onComplete }: ClockLoaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-center"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Clock body */}
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          fill="var(--color-paper-2)"
          stroke="var(--color-accent)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* Inner ring */}
        <circle cx="32" cy="32" r="24" fill="var(--color-paper-2)" stroke="var(--color-rule)" strokeWidth="1" />

        {/* Hour markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const inner = 20;
          const outer = 23;
          return (
            <line
              key={angle}
              x1={32 + inner * Math.sin(rad)}
              y1={32 - inner * Math.cos(rad)}
              x2={32 + outer * Math.sin(rad)}
              y2={32 - outer * Math.cos(rad)}
              stroke={angle % 90 === 0 ? 'var(--color-accent)' : 'var(--color-neutral)'}
              strokeWidth={angle % 90 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour hand — slower spin */}
        <motion.line
          x1="32"
          y1="32"
          x2="32"
          y2="18"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ originX: '32px', originY: '32px', transformOrigin: '32px 32px' }}
          animate={{ rotate: [0, 720] }}
          transition={{
            duration: reduceMotion ? 0.01 : 1.35,
            ease: 'easeInOut',
            repeat: 0,
          }}
          onAnimationComplete={onComplete}
        />

        {/* Minute hand — faster spin */}
        <motion.line
          x1="32"
          y1="32"
          x2="32"
          y2="12"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ originX: '32px', originY: '32px', transformOrigin: '32px 32px' }}
          animate={{ rotate: [0, 2160] }}
          transition={{
            duration: reduceMotion ? 0.01 : 1.35,
            ease: 'easeInOut',
            repeat: 0,
          }}
        />

        {/* Center dot */}
        <motion.circle
          cx="32"
          cy="32"
          r="3"
          fill="var(--color-accent)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.16, duration: reduceMotion ? 0.01 : 0.2 }}
        />
      </svg>
    </motion.div>
  );
}
