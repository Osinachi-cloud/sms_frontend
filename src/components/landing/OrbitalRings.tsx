'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';

export default function OrbitalRings() {
  const { isDark } = useTheme();
  const rings = [
    { size: 280, duration: 20, direction: 1, opacity: isDark ? 0.3 : 0.18 },
    { size: 380, duration: 30, direction: -1, opacity: isDark ? 0.2 : 0.12 },
    { size: 480, duration: 40, direction: 1, opacity: isDark ? 0.15 : 0.08 },
    { size: 580, duration: 50, direction: -1, opacity: isDark ? 0.1 : 0.05 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: ring.size,
            height: ring.size,
            borderColor: `rgba(99, 102, 241, ${ring.opacity})`,
            borderWidth: 1,
          }}
          animate={{ rotate: 360 * ring.direction }}
          transition={{
            duration: ring.duration,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Orbiting dot */}
          <div
            className="absolute w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translateX(${ring.size / 2}px)`,
            }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translateX(-${ring.size / 2}px)`,
            }}
          />
        </motion.div>
      ))}

      {/* Central glow */}
      <div className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-primary-500/15 to-purple-500/15 dark:from-primary-500/20 dark:to-purple-500/20 blur-3xl" />
      <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-primary-400/20 to-purple-400/20 dark:from-primary-400/30 dark:to-purple-400/30 blur-2xl animate-pulse" />
    </div>
  );
}
