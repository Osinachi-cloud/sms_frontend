'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Quiz, QuizQuestion, QuizResult } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Trophy, XCircle,
  BookOpen, ArrowLeft, Eye, Play, Flag, Timer, Zap,
} from 'lucide-react';
import Link from 'next/link';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function isQuestionAnswered(q: QuizQuestion, answers: Record<string, any>) {
  const a = answers[q.id || ''];
  if (q.questionType === 'CHECKBOX') return Array.isArray(a) && a.length > 0;
  return a !== undefined && a !== '';
}

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { currentSchool, user, isTeacher, isPlatformAdmin } = useAuth();
  const quizId = params?.id as string;
  const schoolId = currentSchool?.id;
  const studentId = user?.studentId;

  const isAdmin = isPlatformAdmin() || currentSchool?.roleName === 'ADMIN' || currentSchool?.roleName === 'SUPER_ADMIN';
  const isPreview = isAdmin || isTeacher();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(isPreview);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Ref to always have latest handleSubmit in timer
  const handleSubmitRef = useRef<() => Promise<void>>(async () => {});

  const loadQuiz = useCallback(async () => {
    if (!schoolId || !quizId) return;
    try {
      if (isPreview) {
        const res = await quizApi.getOne(schoolId, quizId);
        setQuiz(res.data);
      } else if (studentId) {
        const res = await quizApi.start(schoolId, quizId, studentId);
        setQuiz(res.data);
        const dur = res.data.durationMinutes || 30;
        setTimeLeft(dur * 60);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [schoolId, quizId, studentId, isPreview]);

  useEffect(() => {
    if (!schoolId || !quizId) {
      setLoading(false);
      return;
    }
    loadQuiz();
  }, [schoolId, quizId, loadQuiz]);

  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && started && !autoSubmitted && !isPreview) {
      setAutoSubmitted(true);
      toast('Time is up! Auto-submitting your answers...', { icon: '⏰' });
      handleSubmitRef.current();
    }
  }, [timeLeft, started, autoSubmitted, isPreview]);

  const handleStart = () => setStarted(true);

  const setAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleCheckbox = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(value)) {
        return { ...prev, [questionId]: current.filter((v) => v !== value) };
      }
      return { ...prev, [questionId]: [...current, value] };
    });
  };

  const handleSubmit = async (force = false) => {
    if (!quiz || !schoolId || !quizId || !studentId) return;
    if (submitting || result) return; // Prevent double submit

    if (!force) {
      const unansweredRequired = (quiz.questions || [])
        .filter((qq) => qq.required && !isQuestionAnswered(qq, answers))
        .map((qq) => (quiz.questions || []).indexOf(qq) + 1);
      if (unansweredRequired.length > 0) {
        toast.error(`Please answer required questions: ${unansweredRequired.join(', ')}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        quizId,
        studentId,
        answers: (quiz.questions || []).map((q) => {
          const ans = answers[q.id || ''];
          if (q.questionType === 'CHECKBOX') {
            return { questionId: q.id, answer: '', selectedOptions: Array.isArray(ans) ? ans : [] };
          }
          return { questionId: q.id, answer: ans || '', selectedOptions: [] };
        }),
      };
      const res = await quizApi.submit(schoolId, quizId, payload);
      setResult(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keep ref always pointing to latest handleSubmit so timer can call it
  handleSubmitRef.current = () => handleSubmit(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-sm font-medium text-slate-500">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">Quiz not available</h3>
        <p className="text-sm text-slate-400 mb-5">This assessment may have expired or been disabled</p>
        <Link href="/quizzes">
          <Button size="sm" variant="secondary"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to quizzes</Button>
        </Link>
      </div>
    );
  }

  if (result) {
    return <QuizResultView quiz={quiz} result={result} onBack={() => router.push('/quizzes')} />;
  }

  if (!started) {
    return <QuizIntro quiz={quiz} onStart={handleStart} isPreview={isPreview} />;
  }

  const questions = quiz.questions || [];
  const q = questions[currentIndex];
  const answeredCount = questions.filter((qq) => isQuestionAnswered(qq, answers)).length;

  const isUrgent = timeLeft !== null && timeLeft < 300; // Less than 5 minutes
  const isCritical = timeLeft !== null && timeLeft < 60; // Less than 1 minute

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Preview banner */}
      {isPreview && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/20 text-amber-700 dark:text-amber-400 text-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">Preview Mode</span>
            <span className="text-xs opacity-80 ml-1">You are viewing this as a teacher. Correct answers are shown.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/quizzes" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{quiz.title}</h1>
          <p className="text-xs text-slate-500 mt-1">{quiz.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isPreview && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
              isCritical
                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/20 text-red-600 dark:text-red-400'
                : isUrgent
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/20 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              <Timer className={`w-4 h-4 ${isCritical ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-bold font-mono">
                {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
              </span>
            </div>
          )}
          <Badge variant="default" className="text-[11px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1">
            {answeredCount}/{questions.length} answered
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500">
                  {q.marks} mark{q.marks !== 1 ? 's' : ''}
                </span>
                <Badge variant="default" className="text-[10px] border-0 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400">
                  {q.questionType.replace('_', ' ')}
                </Badge>
                {q.required && (
                  <Badge variant="default" className="text-[10px] border-0 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400">
                    Required
                  </Badge>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                {q.questionText}
              </h2>

              <QuestionInput
                question={q}
                value={answers[q.id || '']}
                onChange={(val) => setAnswer(q.id || '', val)}
                onToggle={(val) => toggleCheckbox(q.id || '', val)}
                isPreview={isPreview}
              />

              {/* Preview: show correct answer */}
              {isPreview && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/20">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Correct answer
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">
                    {q.questionType === 'CHECKBOX'
                      ? (q.correctAnswers || []).join(', ') || 'Not set'
                      : (q.correctAnswer || 'Not set')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="border-slate-200 dark:border-slate-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Prev
        </Button>

        <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
          {questions.map((qq, idx) => {
            const hasAnswer = isQuestionAnswered(qq, answers);
            const missedRequired = qq.required && !hasAnswer;
            return (
              <button
                key={qq.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                  idx === currentIndex
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25 scale-110'
                    : hasAnswer
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/20'
                      : missedRequired
                        ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {currentIndex < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => {
              if (q.required && !isQuestionAnswered(q, answers)) {
                toast.error('This question is required. Please answer before moving on.');
                return;
              }
              setCurrentIndex((i) => i + 1);
            }}
            className="shadow-md shadow-primary-500/15"
          >
            Next <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : isPreview ? (
          <Link href="/quizzes">
            <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-700">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
          </Link>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              const unansweredRequired = questions
                .filter((qq) => qq.required && !isQuestionAnswered(qq, answers))
                .map((_, idx) => idx + 1);
              if (unansweredRequired.length > 0) {
                toast.error(`Please answer required questions: ${unansweredRequired.join(', ')}`);
                return;
              }
              setConfirmSubmit(true);
            }}
            className="shadow-md shadow-primary-500/15"
          >
            <Flag className="w-4 h-4 mr-1.5" /> Finish
          </Button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5"
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center mx-auto mb-4">
                <Flag className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Submit Quiz?</h3>
              <p className="text-sm text-slate-500">
                You have answered <span className="font-bold text-slate-700 dark:text-slate-300">{answeredCount}</span> of{' '}
                <span className="font-bold text-slate-700 dark:text-slate-300">{questions.length}</span> questions.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmSubmit(false)}>
                Review
              </Button>
              <Button size="sm" className="flex-1 shadow-lg shadow-primary-500/20" isLoading={submitting} onClick={() => { setConfirmSubmit(false); handleSubmit(); }}>
                <CheckCircle className="w-4 h-4 mr-1.5" /> Submit
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function QuestionInput({ question, value, onChange, onToggle, isPreview }: {
  question: QuizQuestion;
  value: any;
  onChange: (v: any) => void;
  onToggle: (v: string) => void;
  isPreview?: boolean;
}) {
  const opts = question.options || [];
  const normalizedOpts = opts.map((o: any) => (typeof o === 'string' ? { label: o, value: o } : o));

  switch (question.questionType) {
    case 'MCQ':
    case 'TRUE_FALSE':
      return (
        <div className="space-y-2.5">
          {normalizedOpts.map((opt: any, i: number) => {
            const selected = value === opt.value;
            return (
              <label
                key={i}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  selected
                    ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-300 dark:border-primary-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value}
                  checked={selected}
                  onChange={(e) => onChange(e.target.value)}
                  className="sr-only"
                />
                <span className={`text-sm font-medium ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      );

    case 'CHECKBOX':
      return (
        <div className="space-y-2.5">
          {normalizedOpts.map((opt: any, i: number) => {
            const selected = Array.isArray(value) && value.includes(opt.value);
            return (
              <label
                key={i}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  selected
                    ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-300 dark:border-primary-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={selected}
                  onChange={() => onToggle(opt.value)}
                  className="sr-only"
                />
                <span className={`text-sm font-medium ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      );

    case 'FILL_BLANK':
    case 'SHORT_ANSWER':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-slate-400"
        />
      );

    case 'PARAGRAPH':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your answer here..."
          rows={6}
          className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none placeholder:text-slate-400"
        />
      );

    default:
      return <p className="text-sm text-slate-400">Unsupported question type</p>;
  }
}

function QuizIntro({ quiz, onStart, isPreview }: { quiz: Quiz; onStart: () => void; isPreview?: boolean }) {
  return (
    <div className="max-w-lg mx-auto pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/20 overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-primary-400 via-violet-400 to-indigo-400" />
          <CardContent className="p-8 space-y-7">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/25">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{quiz.title}</h1>
              <p className="text-sm text-slate-500 leading-relaxed">{quiz.description || 'No description'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                <Clock className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{quiz.durationMinutes}</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Minutes</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                <BookOpen className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{quiz.questionCount}</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Questions</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                <Trophy className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{quiz.totalMarks}</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Total Marks</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                <Zap className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{quiz.quizType || 'Quiz'}</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Type</p>
              </div>
            </div>

            {quiz.endTime && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 text-xs text-amber-700 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Expires on {new Date(quiz.endTime).toLocaleString()}
              </div>
            )}

            {isPreview ? (
              <Button onClick={onStart} className="w-full shadow-lg shadow-primary-500/20">
                <Eye className="w-4 h-4 mr-2" /> Preview Quiz
              </Button>
            ) : (
              <Button onClick={onStart} className="w-full shadow-lg shadow-primary-500/20">
                <Play className="w-4 h-4 mr-2" /> Start Quiz
              </Button>
            )}

            <div className="text-center">
              <Link href="/quizzes">
                <span className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Cancel and go back</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function QuizResultView({ quiz, result, onBack }: { quiz: Quiz; result: QuizResult; onBack: () => void }) {
  // If results are hidden, show a pending message
  if (result.resultsVisible === false) {
    return (
      <div className="max-w-lg mx-auto pt-8 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/20 overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-primary-400 via-violet-400 to-indigo-400" />
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Submitted!</h1>
                <p className="text-sm text-slate-500 mt-1">{quiz.title}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {result.resultsAvailableText || "Your results are not available yet."}
                </p>
              </div>
              <Button onClick={onBack} className="w-full shadow-lg shadow-primary-500/20">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const correct = result.answers?.filter((a) => a.isCorrect).length || 0;
  const total = result.answers?.length || 0;
  const showCorrect = result.showCorrectAnswers;
  const percentage = result.percentage || 0;

  let resultColor = 'from-slate-400 to-slate-500';
  let resultBg = 'bg-slate-50 dark:bg-slate-800/50';
  let resultText = 'text-slate-600 dark:text-slate-400';
  let resultBorder = 'border-slate-200 dark:border-slate-700';
  let resultLabel = 'Completed';

  if (percentage >= 70) {
    resultColor = 'from-emerald-400 to-teal-500';
    resultBg = 'bg-emerald-50 dark:bg-emerald-900/10';
    resultText = 'text-emerald-600 dark:text-emerald-400';
    resultBorder = 'border-emerald-200 dark:border-emerald-800/20';
    resultLabel = 'Excellent!';
  } else if (percentage >= 50) {
    resultColor = 'from-blue-400 to-indigo-500';
    resultBg = 'bg-blue-50 dark:bg-blue-900/10';
    resultText = 'text-blue-600 dark:text-blue-400';
    resultBorder = 'border-blue-200 dark:border-blue-800/20';
    resultLabel = 'Good job!';
  } else {
    resultColor = 'from-amber-400 to-orange-500';
    resultBg = 'bg-amber-50 dark:bg-amber-900/10';
    resultText = 'text-amber-600 dark:text-amber-400';
    resultBorder = 'border-amber-200 dark:border-amber-800/20';
    resultLabel = 'Keep practicing';
  }

  return (
    <div className="max-w-2xl mx-auto space-y-7 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/20 overflow-hidden">
          <div className={`h-2 w-full bg-gradient-to-r ${resultColor}`} />
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${resultColor} mx-auto flex items-center justify-center shadow-lg`}>
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold uppercase tracking-widest ${resultText} mb-1`}>{resultLabel}</p>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Submitted!</h1>
              <p className="text-sm text-slate-500 mt-1">{quiz.title}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`p-4 rounded-xl ${resultBg} ${resultBorder} border`}>
                <p className={`text-2xl font-bold ${resultText}`}>{result.percentage?.toFixed(1)}%</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">Score</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/20">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{correct}/{total}</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">Correct</p>
              </div>
              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/20">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{result.gradeLetter}</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">Grade</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${resultBg} ${resultBorder} border`}>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You scored <span className="font-bold text-slate-800 dark:text-slate-200">{result.score}</span> out of{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{result.totalMarks}</span> marks
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {showCorrect && result.answers && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-500" /> Review Answers
          </h2>
          {result.answers.map((ans, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
            >
              <Card className={`border ${ans.isCorrect ? 'border-emerald-200 dark:border-emerald-800/20' : 'border-red-200 dark:border-red-800/20'} shadow-sm`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      ans.isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {ans.isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                        {ans.questionText}
                      </p>
                    </div>
                    <Badge variant={ans.isCorrect ? 'success' : 'error'} className="text-[10px] border-0 flex-shrink-0">
                      {ans.marksObtained}/{ans.totalMarks}
                    </Badge>
                  </div>

                  <div className="pl-11 space-y-1.5">
                    <p className="text-xs text-slate-500">
                      Your answer:{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {Array.isArray(ans.selectedOptions) && ans.selectedOptions.length > 0
                          ? ans.selectedOptions.join(', ')
                          : (ans.userAnswer || '—')}
                      </span>
                    </p>
                    {!ans.isCorrect && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Correct:{' '}
                        <span className="font-medium">
                          {Array.isArray(ans.correctAnswers) && ans.correctAnswers.length > 0
                            ? ans.correctAnswers.join(', ')
                            : (ans.correctAnswer || '—')}
                        </span>
                      </p>
                    )}
                    {ans.explanation && (
                      <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                        {ans.explanation}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Button onClick={onBack} className="w-full shadow-lg shadow-primary-500/20">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes
      </Button>
    </div>
  );
}
