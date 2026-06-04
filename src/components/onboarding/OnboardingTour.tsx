'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onboardingApi } from '@/lib/api';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface OnboardingStep {
  id: string;
  stepKey: string;
  targetSelector: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  stepOrder: number;
  isCompleted?: boolean;
}

export function OnboardingTour() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const loadSteps = useCallback(async () => {
    try {
      const res = await onboardingApi.getSteps(pathname, user?.platformRole || 'STUDENT');
      const data = res.data as OnboardingStep[];
      const incomplete = data.filter((s) => !s.isCompleted);
      if (incomplete.length > 0) {
        setSteps(incomplete);
        // Wait for elements to render, then show
        setTimeout(() => setIsVisible(true), 800);
      }
      setHasChecked(true);
    } catch {
      setHasChecked(true);
    }
  }, [pathname, user]);

  useEffect(() => {
    if (!hasChecked && user) {
      loadSteps();
    }
  }, [hasChecked, loadSteps, user, pathname]);

  const currentStep = steps[currentIndex];

  const handleNext = async () => {
    if (currentStep) {
      await onboardingApi.completeStep(currentStep.stepKey);
    }
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsVisible(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!currentStep?.targetSelector || !isVisible) return;
    const target = document.querySelector(currentStep.targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isVisible, currentIndex, pathname]);

  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const padding = 12;
    const pos = currentStep?.position || 'bottom';
    switch (pos) {
      case 'top':
        return {
          top: `${targetRect.top - padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left - padding}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translate(0, -50%)',
        };
      case 'center':
      default:
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  if (!isVisible || !currentStep) return null;

  const pos = getTooltipPosition();

  return (
    <>
      {/* Backdrop / Spotlight */}
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {targetRect && (
          <div
            className="absolute border-2 border-primary-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] animate-pulse"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20 }}
          className="absolute pointer-events-auto w-[90vw] max-w-[320px] sm:max-w-[380px]"
          style={{ top: pos.top, left: pos.left, transform: pos.transform }}
        >
          <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-2xl border border-primary-200 dark:border-primary-800">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                  {currentStep.title}
                </h3>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {currentStep.content}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentIndex
                        ? 'bg-primary-500'
                        : i < currentIndex
                        ? 'bg-primary-300'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
                >
                  {currentIndex === steps.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
