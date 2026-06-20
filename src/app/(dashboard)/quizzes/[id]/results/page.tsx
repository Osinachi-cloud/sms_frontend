'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { quizApi, studentApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Quiz, QuizSubmission } from '@/types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trophy, Users, XCircle, CheckCircle, ArrowLeft, Eye, GraduationCap, BookOpen, ToggleLeft, ToggleRight, Award } from 'lucide-react';
import Link from 'next/link';

export default function QuizResultsPage() {
  const params = useParams();
  const { currentSchool, hasPermission, isTeacher, isPlatformAdmin } = useAuth();
  const quizId = params?.id as string;
  const schoolId = currentSchool?.id;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<(QuizSubmission & { studentName?: string })[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId || !quizId) return;
    loadData();
  }, [schoolId, quizId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizRes, subRes] = await Promise.all([
        quizApi.getOne(schoolId!, quizId),
        quizApi.getSubmissions(schoolId!, quizId),
      ]);
      setQuiz(quizRes.data);

      const subs = subRes.data || [];
      // Fetch student names
      const studentIds = Array.from(new Set(subs.map((s: any) => s.studentId)));
      const studentMap: Record<string, any> = {};
      if (studentIds.length > 0) {
        try {
          const stdRes = await studentApi.getAll(schoolId!, { size: 500 });
          const students = (stdRes.data as any)?.content || [];
          students.forEach((s: any) => { studentMap[s.id] = s; });
        } catch { /* ignore */ }
      }
      setSubmissions(subs.map((s: any) => ({
        ...s,
        studentName: studentMap[s.studentId]?.fullName || 'Student',
      })));

      // Fetch students in target classes to find non-participants
      if (quizRes.data?.targetClassIds && quizRes.data.targetClassIds.length > 0) {
        try {
          const classStudents = await Promise.all(
            quizRes.data.targetClassIds.map((cid: string) =>
              studentApi.getAll(schoolId!, { classId: cid, size: 500 }).catch(() => ({ data: { content: [] } }))
            )
          );
          const allClassStudents = classStudents.flatMap((r: any) => (r.data?.content || []));
          const participantIds = new Set(subs.map((s: any) => s.studentId));
          setAllStudents(allClassStudents.filter((s: any) => !participantIds.has(s.id)));
        } catch { setAllStudents([]); }
      } else {
        setAllStudents([]);
      }
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
        <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Quiz not found</p>
      </div>
    );
  }

  const submittedSubs = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'TIMED_OUT');
  const avgScore = submittedSubs.length > 0
    ? (submittedSubs.reduce((acc, s) => acc + (s.score || 0), 0) / submittedSubs.length).toFixed(1)
    : '0';
  const passedCount = submittedSubs.filter((s) => s.percentage && s.percentage >= (quiz.passMark || 0)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/quizzes" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3 h-3" /> Back to Quizzes
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">{quiz.title} — Results</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            <Badge variant="default" className="text-[10px]">{quiz.quizType || 'Quiz'}</Badge>
            {quiz.subjectName && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {quiz.subjectName}</span>}
            {quiz.className && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {quiz.className}</span>}
            <Badge variant={quiz.isEnabled ? 'success' : 'error'} className="text-[10px]">{quiz.isEnabled ? 'Enabled' : 'Disabled'}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleToggle}>
            {quiz.isEnabled ? <ToggleRight className="w-4 h-4 mr-1" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
            {quiz.isEnabled ? 'Disable' : 'Enable'}
          </Button>
          <Button size="sm" onClick={handleAddToGrades}>
            <Award className="w-4 h-4 mr-1" /> Add to Grades
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{submittedSubs.length}</p>
            <p className="text-xs text-slate-500">Participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{avgScore}</p>
            <p className="text-xs text-slate-500">Avg Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{passedCount}</p>
            <p className="text-xs text-slate-500">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{allStudents.length}</p>
            <p className="text-xs text-slate-500">Not Taken</p>
          </CardContent>
        </Card>
      </div>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participants</CardTitle>
        </CardHeader>
        <CardContent>
          {submittedSubs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {submittedSubs.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {sub.studentName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{sub.studentName}</p>
                      <p className="text-xs text-slate-500">
                        {sub.status === 'TIMED_OUT' ? 'Timed out' : 'Submitted'} • {new Date(sub.submittedAt!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{sub.score}/{sub.totalMarks}</p>
                    <Badge variant={sub.percentage && sub.percentage >= (quiz.passMark || 0) ? 'success' : 'error'} className="text-[10px]">
                      {sub.percentage?.toFixed(1)}% — {sub.gradeLetter}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Not taken */}
      {allStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Not Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allStudents.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <XCircle className="w-3 h-3 text-red-400" />
                  {s.fullName}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
