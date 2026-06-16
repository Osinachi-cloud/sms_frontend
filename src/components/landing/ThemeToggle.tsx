'use client';

import { useTheme } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({
  className = '',
}: {
  className?: string;
}) {
  const { isDark, toggleDark } = useTheme();

  return (
    <button
      onClick={toggleDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative p-2.5 rounded-xl border transition-all duration-300 ${
        isDark
          ? 'bg-slate-800/50 border-slate-700 text-amber-300 hover:bg-slate-700/60 hover:border-slate-600'
          : 'bg-white/70 border-slate-200 text-amber-600 hover:bg-white hover:border-slate-300 shadow-sm'
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
