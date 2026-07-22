import React from 'react';
import { motion } from 'motion/react';

interface CircularProgressProps {
  /** 0 to 100 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Renders the checkmark ring once the transfer is done */
  complete?: boolean;
}

/**
 * Ring that fills clockwise as `progress` climbs. The stroke is driven by
 * strokeDashoffset so the fill tracks real transferred bytes, and motion
 * tweens between values to keep chunky updates from looking jumpy.
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 44,
  strokeWidth = 3,
  complete = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <defs>
          <linearGradient id="progress-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-blue)" />
            <stop offset="100%" stopColor="var(--color-accent-purple)" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-border)"
          strokeWidth={strokeWidth}
        />

        {/* Fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={
            complete ? 'var(--color-success)' : 'url(#progress-gradient)'
          }
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: complete ? 0 : offset }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size < 40 ? '0.6rem' : '0.7rem',
          fontWeight: 600,
          color: complete
            ? 'var(--color-success)'
            : 'var(--color-text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {complete ? '✓' : `${Math.round(clamped)}%`}
      </div>
    </div>
  );
};
