'use client';

import { useEffect, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

export function useTextScramble(text: string, trigger: boolean, duration = 1200) {
  const [display, setDisplay] = useState(text);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!trigger) {
      setDisplay(text);
      setDone(false);
      return;
    }

    let startTime: number;
    let raf: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const result = text
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          const charProgress = Math.min(progress * text.length * 1.5 / (i + 1), 1);
          if (charProgress >= 1) return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');

      setDisplay(result);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setDisplay(text);
        setDone(true);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [trigger, text, duration]);

  return { display, done };
}
