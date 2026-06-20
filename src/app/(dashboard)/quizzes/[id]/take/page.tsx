'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Quiz, QuizQuestion, QuizResult } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Trophy, XCircle, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { currentSchool, user } = useAuth();
  const quizId = params?.id as string;
  const schoolId = currentSchool?.id;
  const studentId = user?.studentId;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadQuiz = useCallback(async () => {
    if (!schoolId || !quizId || !studentId) return;
    try {
      const res = await quizApi.start(schoolId, quizId, studentId);
      setQuiz(res.data);
      const dur = res.data.durationMinutes || 30;
      setTimeLeft(dur * 60);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  }, [schoolId, quizId, studentId]);

  useEffect(() => {
    if (!schoolId || !quizId || !studentId) {
      setLoading(false);
      return;
    }
    loadQuiz();
  }, [schoolId, quizId, studentId, loadQuiz]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft]);

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

  const handleSubmit = async () => {
    if (!quiz || !schoolId || !quizId) return;
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
      toast.error(err?.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-16 text-slate-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Quiz not available</p>
      </div>
    );
  }

  if (result) {
    return <QuizResultView quiz={quiz} result={result} onBack={() => router.push('/quizzes')} />;
  }

  if (!started) {
    return <QuizIntro quiz={quiz} onStart={handleStart} />;
  }

  const questions = quiz.questions || [];
  const q = questions[currentIndex];
  const answeredCount = questions.filter((qq) => {
    const a = answers[qq.id || ''];
    if (qq.questionType === 'CHECKBOX') return Array.isArray(a) && a.length > 0;
    return a !== undefined && a !== '';
  }).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/quizzes" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3 h-3" /> Back to Quizzes
          </Link>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={timeLeft !== null && timeLeft < 60 ? 'error' : 'warning'} className="text-sm px-3 py-1">
            <Clock className="w-4 h-4 mr-1" />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </Badge>
          <span className="text-sm text-slate-500">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Q{currentIndex + 1} of {questions.length}</span>
                <span>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                <Badge variant="default" className="text-[10px]">{q.questionType.replace('_', ' ')}</Badge>
              </div>
              <h2 className="text-lg font-medium">{q.questionText}</h2>
              <QuestionInput question={q} value={answers[q.id || '']} onChange={(val) => setAnswer(q.id || '', val)} onToggle={(val) => toggleCheckbox(q.id || '', val)} />
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>
        <div className="flex gap-1 flex-wrap">
          {questions.map((qq, idx) => {
            const a = answers[qq.id || ''];
            const isAnswered = qq.questionType === 'CHECKBOX' ? Array.isArray(a) && a.length > 0 : a !== undefined && a !== '';
            return (
              <button
                key={qq.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  idx === currentIndex
                    ? 'bg-primary-500 text-white'
                    : isAnswered
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        {currentIndex < questions.length - 1 ? (
          <Button size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} isLoading={submitting}>
            <CheckCircle className="w-4 h-4 mr-1" /> Submit
          </Button>
        )}
      </div>
    </div>
  );
}

function QuestionInput({ question, value, onChange, onToggle }: {
  question: QuizQuestion;
  value: any;
  onChange: (v: any) => void;
  onToggle: (v: string) => void;
}) {
  const opts = question.options || [];
  const normalizedOpts = opts.map((o: any) => (typeof o === 'string' ? { label: o, value: o } : o));

  switch (question.questionType) {
    case 'MCQ':
    case 'TRUE_FALSE':
      return (
        <div className="space-y-2">
          {normalizedOpts.map((opt: any, i: number) => (
            <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input
                type="radio"
                name={question.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'CHECKBOX':
      return (
        <div className="space-y-2">
          {normalizedOpts.map((opt: any, i: number) => (
            <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                value={opt.value}
                checked={Array.isArray(value) && value.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
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
          className="glass-input w-full"
        />
      );

    case 'PARAGRAPH':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your answer here..."
          rows={5}
          className="glass-input w-full"
        />
      );

    default:
      return <p className="text-sm text-slate-400">Unsupported question type</p>;
  }
}

function QuizIntro({ quiz, onStart }: { quiz: Quiz; onStart: () => void }) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-slate-500 mt-1">{quiz.description || 'No description'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-400 text-xs">Duration</p>
              <p className="font-medium">{quiz.durationMinutes} min</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-400 text-xs">Questions</p>
              <p className="font-medium">{quiz.questionCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-400 text-xs">Total Marks</p>
              <p className="font-medium">{quiz.totalMarks}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-400 text-xs">Type</p>
              <p className="font-medium">{quiz.quizType || 'Quiz'}</p>
            </div>
          </div>
          {quiz.endTime && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
              Expires on {new Date(quiz.endTime).toLocaleString()}
            </p>
          )}
          <Button onClick={onStart} className="w-full">
            <Play className="w-4 h-4 mr-2" /> Start Quiz
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Play(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
  );
}

function QuizResultView({ quiz, result, onBack }: { quiz: Quiz; result: QuizResult; onBack: () => void }) {
  const correct = result.answers?.filter((a) => a.isCorrect).length || 0;
  const total = result.answers?.length || 0;
  const showCorrect = result.showCorrectAnswers;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mx-auto flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quiz Submitted!</h1>
            <p className="text-slate-500">{quiz.title}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <p className="text-2xl font-bold text-primary-600">{result.percentage?.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Score</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600">{correct}/{total}</p>
              <p className="text-xs text-slate-500">Correct</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600">{result.gradeLetter}</p>
              <p className="text-xs text-slate-500">Grade</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            You scored <span className="font-bold">{result.score}</span> out of <span className="font-bold">{result.totalMarks}</span> marks
          </p>
        </CardContent>
      </Card>

      {showCorrect && result.answers && (
        <div className="space-y-3">
          <h2 className="font-semibold">Review Answers</h2>
          {result.answers.map((ans, idx) => (
            <Card key={idx} className={ans.isCorrect ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  {ans.isCorrect ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{idx + 1}. {ans.questionText}</p>
                    <div className="mt-1 text-xs space-y-1">
                      <p className="text-slate-500">Your answer: <span className="font-medium">{Array.isArray(ans.selectedOptions) && ans.selectedOptions.length > 0 ? ans.selectedOptions.join(', ') : (ans.userAnswer || '—')}</span></p>
                      {!ans.isCorrect && (
                        <p className="text-green-600">Correct answer: <span className="font-medium">{Array.isArray(ans.correctAnswers) && ans.correctAnswers.length > 0 ? ans.correctAnswers.join(', ') : (ans.correctAnswer || '—')}</span></p>
                      )}
                      {ans.explanation && (
                        <p className="text-slate-400 italic">{ans.explanation}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={ans.isCorrect ? 'success' : 'error'} className="text-[10px]">
                    {ans.marksObtained}/{ans.totalMarks}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button onClick={onBack} className="w-full">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes
      </Button>
    </div>
  );
}
