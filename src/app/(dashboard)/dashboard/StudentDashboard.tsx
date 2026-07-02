'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { dashboardApi, paymentApi, settingsApi } from '@/lib/api';
import { StudentDashboard, Payment } from '@/types';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  GraduationCap,
  TrendingUp,
  User,
  XCircle,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function StudentDashboardView() {
  const { user, currentSchool } = useAuth();
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [isLoadingDash, setIsLoadingDash] = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  // Fetch dashboard and payments independently so a failure in one
  // doesn't block the other.
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!currentSchool) {
        setIsLoadingDash(false);
        setIsLoadingPayments(false);
        return;
      }

      // Fetch fee items for payment description lookup
      try {
        const settingsRes = await settingsApi.get(currentSchool.id);
        const settingsData = (settingsRes as any).data || {};
        if (!cancelled) setFeeItems(settingsData.feeItems || []);
      } catch {
        // silent
      }

      // 1. Fetch dashboard (subjects, attendance, feeStatus from backend)
      let dashData: StudentDashboard | null = null;
      try {
        const dashRes = await dashboardApi.getStudentDashboard(currentSchool.id);
        dashData = dashRes.data;
        if (!cancelled) setDashboard(dashData);
      } catch (error) {
        console.error('Failed to fetch student dashboard:', error);
      } finally {
        if (!cancelled) setIsLoadingDash(false);
      }

      // 2. Fetch payments using the canonical student ID.
      // Prefer the ID returned by the dashboard API (most reliable),
      // fall back to user.studentId from auth context.
      const canonicalStudentId = dashData?.student?.id || user?.studentId;
      if (canonicalStudentId) {
        try {
          const paymentRes = await paymentApi.getStudentPayments(
            currentSchool.id,
            canonicalStudentId,
            { size: 100 }
          );
          const fetched = ((paymentRes as any).data?.content || []) as Payment[];
          if (!cancelled) setPayments(fetched);

          // If backend returned no payments but we know some exist,
          // surface a subtle hint in the console for debugging.
          if (fetched.length === 0) {
            console.warn(
              `No payments returned for student ${canonicalStudentId}. ` +
              'If admin recorded payments, verify the backend returns them for this studentId.'
            );
          }
        } catch (err: any) {
          console.error('Failed to fetch student payments:', err);
          toast.error('Could not load payment records. Please try again later.');
        } finally {
          if (!cancelled) setIsLoadingPayments(false);
        }
      } else {
        console.warn('No studentId available to fetch payments. Dashboard student.id and user.studentId were both missing.');
        if (!cancelled) setIsLoadingPayments(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [currentSchool, user?.studentId]);

  // Show a unified loading state while either is still loading.
  if (isLoadingDash || isLoadingPayments) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse h-24 bg-slate-200 dark:bg-slate-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // We now show the Payment History even when dashboard data is missing,
  // so the page is never completely empty if payments exist.
  const hasDash = !!dashboard;

  const getGradeColor = (letter?: string) => {
    if (!letter) return 'text-slate-500';
    if (letter === 'A') return 'text-green-500';
    if (letter === 'B') return 'text-blue-500';
    if (letter === 'C') return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {hasDash
              ? `Welcome, ${dashboard!.student.fullName}!`
              : `Welcome${user?.fullName ? ', ' + user.fullName : ''}!`}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {hasDash ? (
              <>
                {dashboard!.currentClass?.name || 'No class assigned'}
                {dashboard!.currentClass?.classTeacher ? ` • Class Teacher: ${dashboard!.currentClass.classTeacher}` : ''}
                {' • '}{dashboard!.student.admissionNumber}
              </>
            ) : (
              'Your student dashboard'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats cards — use dashboard data when available, otherwise a friendlier empty state */}
      {hasDash ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={item}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Attendance Rate</p>
                    <p className="text-3xl font-bold mt-1">
                      {dashboard!.attendance.attendancePercentage}%
                    </p>
                    <p className="text-green-100 text-xs mt-2">
                      {dashboard!.attendance.presentDays} / {dashboard!.attendance.totalDays} days
                    </p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-gradient-to-br from-indigo-500 via-blue-500 to-blue-600 text-white border-none shadow-lg shadow-blue-500/20">
              <CardContent className="p-4 sm:p-6 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <BookOpen className="w-24 h-24 rotate-12" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Subjects</p>
                    <p className="text-3xl font-bold mt-1">
                      {dashboard!.subjects.length}
                    </p>
                    <p className="text-blue-100 text-xs mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Enrolled this term
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Fee Balance</p>
                    <p className="text-3xl font-bold mt-1">
                      ₦{dashboard!.feeStatus.balance.toLocaleString()}
                    </p>
                    <p className="text-purple-100 text-xs mt-2">
                      {dashboard!.feeStatus.pendingItems} pending items
                    </p>
                  </div>
                  <CreditCard className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Student profile data is temporarily unavailable.</p>
        </div>
      )}

      {/* Subjects & Attendance — only when dashboard loaded */}
      {hasDash && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary-500" />
                  My Subjects & Grades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard!.subjects.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard!.subjects.map((subject) => (
                      <div
                        key={subject.subjectId}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium">{subject.subjectName}</p>
                            <p className="text-xs text-slate-500">{subject.subjectCode} • {subject.termName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getGradeColor(subject.gradeLetter)}`}>
                            {subject.gradeLetter || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {subject.latestScore !== undefined ? `${subject.latestScore}/${subject.maxScore}` : 'No grade'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No subjects assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Present</span>
                    </div>
                    <span className="font-bold text-green-600">{dashboard!.attendance.presentDays} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span>Absent</span>
                    </div>
                    <span className="font-bold text-red-600">{dashboard!.attendance.absentDays} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span>Late</span>
                    </div>
                    <span className="font-bold text-yellow-600">{dashboard!.attendance.lateDays} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <span>Excused</span>
                    </div>
                    <span className="font-bold text-blue-600">{dashboard!.attendance.excusedDays} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Payment History — shown for ALL students, independent of dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-500" />
              Payment History
              <span className="text-xs font-normal text-slate-400 ml-auto">
                {payments.length} record{payments.length === 1 ? '' : 's'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No payment records found.</p>
                <p className="text-xs mt-1 text-slate-300">
                  If you believe this is an error, contact your school admin.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      {payment.status === 'SUCCESS' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : payment.status === 'PENDING' ? (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          ₦{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(payment.metadata?.description ? payment.metadata.description : (() => {
                            const feeId = payment.metadata?.studentFeeId;
                            if (feeId) {
                              const fee = feeItems.find((f: any) => f.id === feeId);
                              if (fee) return fee.name;
                            }
                            return 'School fees';
                          })())}
                          <span className="text-slate-400 ml-1">• {payment.paymentReference}</span>
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        payment.status === 'SUCCESS'
                          ? 'success'
                          : payment.status === 'PENDING'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Assignments */}
      {hasDash && dashboard!.upcomingAssignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Upcoming Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard!.upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-xs text-slate-500">{assignment.subjectName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={assignment.status === 'OVERDUE' ? 'error' : 'warning'}>
                        {assignment.dueDate}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
