'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { quizApi, studentApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Quiz, QuizParticipant, QuizAttemptInfo } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, XCircle, CheckCircle, ArrowLeft, GraduationCap, BookOpen,
  ToggleLeft, ToggleRight, Award, Search, Filter, ChevronDown, ChevronUp,
  Clock, Calendar, TrendingUp, BarChart3, Sparkles, Layers, Target,
} from 'lucide-react';
import Link from 'next/link';

interface StudentRecord {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  className?: string;
  attempts: QuizAttemptInfo[];
  bestScore?: number;
  bestPercentage?: number;
}

export default function QuizResultsPage() {
  const params = useParams();
  const { currentSchool } = useAuth();
  const quizId = params?.id as string;
  const schoolId = currentSchool?.id;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [notTaken, setNotTaken] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (!schoolId || !quizId) return;
    loadData();
  }, [schoolId, quizId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch quiz info separately so participants failure doesn't kill the whole page
      let quizData: Quiz | null = null;
      try {
        const quizRes = await quizApi.getOne(schoolId!, quizId);
        quizData = quizRes.data;
        setQuiz(quizData);
      } catch (err: any) {
        toast.error('Failed to load quiz details');
        setLoading(false);
        return;
      }

      // Fetch participants (pre-aggregated with names and best scores)
      let participants: QuizParticipant[] = [];
      try {
        const partRes = await quizApi.getParticipants(schoolId!, quizId);
        participants = partRes.data || [];
      } catch (err: any) {
        toast.error('Failed to load submissions');
      }

      const mappedRecords: StudentRecord[] = participants.map((p) => ({
        studentId: p.studentId,
        studentName: p.studentName,
        admissionNumber: p.admissionNumber,
        className: p.className,
        attempts: p.attempts || [],
        bestScore: p.bestScore,
        bestPercentage: p.bestPercentage,
      }));
      setRecords(mappedRecords);

      // Not taken: fetch all students in target classes and subtract participants
      const participantIds = new Set(participants.map((p) => p.studentId));
      let allClassStudents: any[] = [];
      if (quizData?.targetClassIds && quizData.targetClassIds.length > 0) {
        try {
          const classStudents = await Promise.all(
            quizData.targetClassIds.map((cid: string) =>
              studentApi.getAll(schoolId!, { classId: cid, size: 500 }).catch(() => ({ data: { content: [] } }))
            )
          );
          allClassStudents = classStudents.flatMap((r: any) => (r.data?.content || []));
        } catch { /* ignore */ }
      }
      setNotTaken(allClassStudents.filter((s: any) => !participantIds.has(s.id)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!schoolId || !quizId) return;
    try {
      await quizApi.toggleEnabled(schoolId, quizId);
      setQuiz((prev) => prev ? { ...prev, isEnabled: !prev.isEnabled } : prev);
      toast.success(`Quiz ${quiz?.isEnabled ? 'disabled' : 'enabled'}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to toggle');
    }
  };

  const handleAddToGrades = async () => {
    if (!schoolId || !quizId) return;
    try {
      await quizApi.addToGrades(schoolId, quizId);
      toast.success('Scores added to gradebook');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add to grades');
    }
  };

  const handleReleaseResults = async () => {
    if (!schoolId || !quizId) return;
    setReleasing(true);
    try {
      await quizApi.releaseResults(schoolId, quizId);
      setQuiz((prev) => prev ? { ...prev, resultsReleased: true } : prev);
      toast.success('Results released to students');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to release results');
    } finally {
      setReleasing(false);
    }
  };

  const toggleExpand = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const text = `${rec.studentName} ${rec.admissionNumber} ${rec.className}`.toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;

      if (statusFilter === 'PASSED') {
        if (!rec.bestPercentage || rec.bestPercentage < (quiz?.passMark || 0)) return false;
      }
      if (statusFilter === 'FAILED') {
        if (!rec.bestPercentage || rec.bestPercentage >= (quiz?.passMark || 0)) return false;
      }

      if (minScoreFilter) {
        const min = parseFloat(minScoreFilter);
        if (!isNaN(min) && (rec.bestScore === undefined || rec.bestScore < min)) return false;
      }

      return true;
    });
  }, [records, searchQuery, statusFilter, minScoreFilter, quiz]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BarChart3 className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">Quiz not found</h3>
        <p className="text-sm text-slate-400 mb-5">The assessment you are looking for does not exist</p>
        <Link href="/quizzes">
          <Button size="sm" variant="secondary"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to quizzes</Button>
        </Link>
      </div>
    );
  }

  const totalStudents = records.length + notTaken.length;
  const avgBestScore = records.length > 0
    ? (records.reduce((acc, r) => acc + (r.bestScore || 0), 0) / records.length).toFixed(1)
    : '0';
  const passedCount = records.filter((r) => r.bestPercentage && r.bestPercentage >= (quiz.passMark || 0)).length;
  const passRate = records.length > 0 ? ((passedCount / records.length) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/quizzes" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to quizzes
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{quiz.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {quiz.quizType || 'Quiz'}
                </Badge>
                {quiz.subjectName && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {quiz.subjectName}</span>}
                {quiz.className && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {quiz.className}</span>}
                <Badge variant={quiz.isEnabled ? 'success' : 'error'} className="text-[10px] border-0">
                  {quiz.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Badge variant="default" className="text-[10px] border-0 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400">
                  {quiz.resultVisibilityType === 'NEVER' ? 'Results: Hidden' :
                    quiz.resultVisibilityType === 'IMMEDIATELY' ? 'Results: Immediate' :
                    quiz.resultVisibilityType === 'AFTER_ALL_SUBMITTED' ? 'Results: After All Submit' :
                    quiz.resultVisibilityType === 'AFTER_DEADLINE' ? 'Results: After Deadline' :
                    quiz.resultVisibilityType === 'MANUAL' ? (quiz.resultsReleased ? 'Results: Released' : 'Results: Manual') :
                    'Results: Hidden'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/quizzes/${quizId}/edit`}>
            <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleToggle} className="border-slate-200 dark:border-slate-700">
            {quiz.isEnabled ? <ToggleRight className="w-4 h-4 mr-1" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
            {quiz.isEnabled ? 'Disable' : 'Enable'}
          </Button>
          {quiz.resultVisibilityType === 'MANUAL' && !quiz.resultsReleased && (
            <Button size="sm" variant="secondary" onClick={handleReleaseResults} isLoading={releasing}>
              <CheckCircle className="w-4 h-4 mr-1" /> Release Results
            </Button>
          )}
          <Button size="sm" onClick={handleAddToGrades} className="shadow-md shadow-primary-500/15">
            <Award className="w-4 h-4 mr-1" /> Add to Grades
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-primary-500" />}
          value={records.length}
          label="Participated"
          color="from-primary-400 to-violet-500"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          value={`${passRate}%`}
          label="Pass Rate"
          color="from-emerald-400 to-teal-500"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-amber-500" />}
          value={`${avgBestScore}/${quiz.totalMarks}`}
          label="Avg Best Score"
          color="from-amber-400 to-orange-500"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-rose-500" />}
          value={notTaken.length}
          label="Not Taken"
          color="from-rose-400 to-pink-500"
        />
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
        <CardHeader className="pb-0">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <CardContent className="space-y-3 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    />
                  </div>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="ALL">All Results</option>
                    <option value="PASSED">Passed Only</option>
                    <option value="FAILED">Failed Only</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Min score (e.g., 30)"
                    value={minScoreFilter}
                    onChange={(e) => setMinScoreFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredRecords.length}</span> of {records.length} students
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Participants Table */}
      <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-500" />
            Student Attempts & Scores
            <span className="text-xs font-normal text-slate-400 ml-auto">
              {filteredRecords.length} student{filteredRecords.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No matching results</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecords.map((rec, i) => {
                const isExpanded = expandedStudents.has(rec.studentId);
                const best = rec.attempts.reduce((b, a) => ((a.score || 0) > (b.score || 0) ? a : b), rec.attempts[0]);
                const hasPassed = rec.bestPercentage && rec.bestPercentage >= (quiz.passMark || 0);
                return (
                  <motion.div
                    key={rec.studentId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    {/* Summary row */}
                    <button
                      onClick={() => toggleExpand(rec.studentId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                          {rec.studentName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{rec.studentName}</p>
                          <p className="text-[11px] text-slate-500">
                            {rec.admissionNumber || 'No admission #'} • {rec.attempts.length} attempt{rec.attempts.length !== 1 ? 's' : ''}
                            {rec.className && ` • ${rec.className}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{best.score}/{best.totalMarks}</p>
                          <Badge variant={hasPassed ? 'success' : 'error'} className="text-[10px] border-0 mt-0.5">
                            {rec.bestPercentage?.toFixed(1)}% — {best.gradeLetter}
                          </Badge>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">All Attempts</p>
                            <div className="space-y-2">
                              {rec.attempts.map((attempt, idx) => (
                                <div
                                  key={attempt.submissionId}
                                  className={`flex items-center justify-between p-3 rounded-xl text-sm ${
                                    attempt.submissionId === best?.submissionId
                                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30'
                                      : 'bg-slate-50 dark:bg-slate-800/20'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                                    {attempt.submissionId === best?.submissionId && (
                                      <Badge variant="success" className="text-[9px] px-1.5 py-0 border-0">
                                        <Trophy className="w-2.5 h-2.5 mr-0.5" /> BEST
                                      </Badge>
                                    )}
                                    {attempt.status === 'TIMED_OUT' && (
                                      <Badge variant="warning" className="text-[9px] px-1.5 py-0 border-0">TIMED OUT</Badge>
                                    )}
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}
                                    </span>
                                    {attempt.startedAt && (
                                      <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {Math.round((new Date(attempt.submittedAt!).getTime() - new Date(attempt.startedAt).getTime()) / 60000)} min
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{attempt.score}/{attempt.totalMarks}</span>
                                    <span className="text-xs text-slate-500 ml-2">({attempt.percentage?.toFixed(1)}%)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Not taken */}
      {notTaken.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Not Taken <span className="text-slate-400 font-normal">({notTaken.length})</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {notTaken.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                >
                  <XCircle className="w-3 h-3 text-red-400" />
                  {s.fullName}
                  {s.admissionNumber && <span className="text-slate-400">({s.admissionNumber})</span>}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r ${color}" style={{ backgroundImage: `linear-gradient(to right, ${color.replace('from-', '').replace(' to-', ', ')})` }} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
