'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';

interface AliSimbiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  animated?: boolean;
}

export default function AliSimbiLogo({ size = 'md', showTagline = false, animated = false }: AliSimbiLogoProps) {
  const { isDark } = useTheme();

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated
    ? {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay: 0.2 },
      }
    : {};

  const iconBox = size === 'sm'
    ? 'w-8 h-8 rounded-xl'
    : size === 'lg'
    ? 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl'
    : 'w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl';

  const iconSvg = size === 'sm'
    ? 'w-[18px] h-[18px]'
    : size === 'lg'
    ? 'w-7 h-7'
    : 'w-5 h-5 sm:w-6 sm:h-6';

  const textSize = size === 'sm'
    ? 'text-sm sm:text-base'
    : size === 'lg'
    ? 'text-2xl sm:text-3xl'
    : 'text-base sm:text-xl';

  return (
    <Wrapper
      className="flex flex-col items-start"
      {...(wrapperProps as any)}
    >
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* House / school icon — matches the very first logo style */}
        <div className={`${iconBox} bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30`}>
          <svg
            className={`${iconSvg} text-white`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 10l8-6 8 6" />
            <path d="M20 10v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10" />
            <path d="M9 21V12h6v9" />
            <circle cx="12" cy="7" r="1" fill="white" stroke="none" />
          </svg>
        </div>

        {/* Wordmark using the page's own gradient */}
        <div className="flex items-baseline select-none gap-0.5">
          <span className={`font-extrabold tracking-tight bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent ${textSize}`}>
            Ali
          </span>
          <span className={`font-light text-slate-400 dark:text-slate-500 ${textSize}`}>&amp;</span>
          <span className={`font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent ${textSize}`}>
            Simbi
          </span>
        </div>
      </div>

      {showTagline && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[10px] text-slate-400 dark:text-slate-500 tracking-[0.25em] uppercase mt-0.5 pl-[42px] sm:pl-[46px]"
        >
          As clever as Ali, as caring as Simbi
        </motion.p>
      )}
    </Wrapper>
  );
}
