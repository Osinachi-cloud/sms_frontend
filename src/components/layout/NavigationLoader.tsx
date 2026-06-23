'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function NavigationLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setIsLoading(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isLoading) return;
    // Hide loader immediately after the next frame so navigation feels instant.
    const raf = requestAnimationFrame(() => {
      setIsLoading(false);
    });
    return () => cancelAnimationFrame(raf);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary-500/20 overflow-hidden"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              ease: 'linear',
            }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary-500 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
