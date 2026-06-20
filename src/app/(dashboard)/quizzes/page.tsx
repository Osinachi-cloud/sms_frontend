'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { quizApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Quiz } from '@/types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Plus,
  Clock,
  Play,
  Eye,
  Trophy,
  CheckCircle,
  XCircle,
  BookOpen,
  GraduationCap,
  Calendar,
  Search,
  BarChart3,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function QuizzesPage() {
  const { currentSchool, user, hasPermission, isTeacher, isStudent, isPlatformAdmin } = useAuth();
  const schoolId = currentSchool?.id;
  const studentId = user?.studentId;

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXAM' | 'TEST' | 'QUIZ'>('ALL');

  const isAdmin = isPlatformAdmin() || currentSchool?.roleName === 'ADMIN' || currentSchool?.roleName === 'SUPER_ADMIN';
  const canManage = isAdmin || isTeacher() || hasPermission('cms.content.create');

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    loadQuizzes();
  }, [schoolId]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const params: any = { size: 100 };
      if (isStudent() && studentId) {
        params.studentId = studentId;
      }
      const res = await quizApi.getAll(schoolId!, params);
      const items = (res.data?.content || res.data || []) as Quiz[];
      setQuizzes(items);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (quiz: Quiz) => {
    if (!quiz.endTime) return false;
    return new Date() > new Date(quiz.endTime);
  };

  const isNotStarted = (quiz: Quiz) => {
    if (!quiz.startTime) return false;
    return new Date() < new Date(quiz.startTime);
  };

  const filtered = quizzes
    .filter((q) => {
      if (filterType !== 'ALL' && q.quizType !== filterType) return false;
      const qText = `${q.title} ${q.subjectName} ${q.className} ${q.description}`.toLowerCase();
      return qText.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Group by subject for display
  const grouped = filtered.reduce((acc, q) => {
    const key = q.subjectName || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {} as Record<string, Quiz[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Exams, Tests & Quizzes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Organized assessments by subject and class</p>
        </div>
        {canManage && (
          <Link href="/quizzes/create">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Create Assessment
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, subject, class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-9 w-full text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'EXAM', 'TEST', 'QUIZ'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === t
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 glass-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No assessments found</p>
          {canManage && (
            <Link href="/quizzes/create">
              <Button variant="secondary" size="sm" className="mt-3">Create your first assessment</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([subjectName, subjectQuizzes]) => (
            <div key={subjectName}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary-500" />
                <h2 className="text-lg font-semibold">{subjectName}</h2>
                <Badge variant="default" className="text-[10px]">{subjectQuizzes.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {subjectQuizzes.map((quiz, i) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    index={i}
                    isStudent={isStudent()}
                    canManage={canManage}
                    isExpired={isExpired(quiz)}
                    isNotStarted={isNotStarted(quiz)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizCard({
  quiz,
  index,
  isStudent,
  canManage,
  isExpired,
  isNotStarted,
}: {
  quiz: Quiz;
  index: number;
  isStudent: boolean;
  canManage: boolean;
  isExpired: boolean;
  isNotStarted: boolean;
}) {
  const disabled = quiz.isEnabled === false || isExpired;
  const attempted = quiz.hasAttempted;
  const attemptsRemaining = (quiz.maxAttempts || 1) - (quiz.attemptsUsed || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card rounded-2xl p-4 sm:p-5 ${disabled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{quiz.title}</h3>
          {attempted && (
            <Badge variant="success" className="text-[10px]">
              {quiz.bestScore}/{quiz.totalMarks}
            </Badge>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          quiz.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {quiz.status}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{quiz.description || 'No description'}</p>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.durationMinutes} min</span>
        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {quiz.questionCount} Qs</span>
        <span>{quiz.totalMarks} marks</span>
        {quiz.className && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {quiz.className}</span>}
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        <Badge variant="default" className="text-[10px]">{quiz.quizType || 'Quiz'}</Badge>
        {disabled && <Badge variant="error" className="text-[10px]"><Lock className="w-3 h-3 mr-0.5" /> {isExpired ? 'Expired' : 'Disabled'}</Badge>}
        {isNotStarted && <Badge variant="warning" className="text-[10px]"><Calendar className="w-3 h-3 mr-0.5" /> Upcoming</Badge>}
        {attempted && <Badge variant="info" className="text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5" /> Attempted</Badge>}
      </div>

      {/* Actions */}
      {isStudent ? (
        <div className="flex gap-2">
          {attempted && (
            <div className="flex-1 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
              <Trophy className="w-4 h-4 text-green-600 mx-auto mb-0.5" />
              <p className="text-xs font-medium text-green-700">{quiz.bestScore}/{quiz.totalMarks}</p>
            </div>
          )}
          {!disabled && !isNotStarted && attemptsRemaining > 0 ? (
            <Link href={`/quizzes/${quiz.id}/take`} className="flex-1">
              <Button size="sm" className="w-full">
                <Play className="w-3 h-3 mr-1" /> {attempted ? 'Retake' : 'Take'}
              </Button>
            </Link>
          ) : (
            <Button size="sm" className="w-full" disabled>
              <Lock className="w-3 h-3 mr-1" /> {isExpired ? 'Expired' : isNotStarted ? 'Not started' : 'No attempts left'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          {canManage && (
            <Link href={`/quizzes/${quiz.id}/results`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                <BarChart3 className="w-3 h-3 mr-1" /> Results
              </Button>
            </Link>
          )}
          <Link href={`/quizzes/${quiz.id}/take`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              <Eye className="w-3 h-3 mr-1" /> Preview
            </Button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
