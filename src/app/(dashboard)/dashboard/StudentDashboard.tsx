'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { dashboardApi } from '@/lib/api';
import { StudentDashboard } from '@/types';
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
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!currentSchool) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await dashboardApi.getStudentDashboard(currentSchool.id);
        setDashboard(response.data);
      } catch (error) {
        console.error('Failed to fetch student dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [currentSchool]);

  if (isLoading) {
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

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Student Profile Not Found</h2>
          <p className="text-slate-500">Your student profile is not linked to your account.</p>
        </div>
      </div>
    );
  }

  const getGradeColor = (letter?: string) => {
    if (!letter) return 'text-slate-500';
    if (letter === 'A') return 'text-green-500';
    if (letter === 'B') return 'text-blue-500';
    if (letter === 'C') return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Welcome, {dashboard.student.fullName}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {dashboard.currentClass?.name || 'No class assigned'} • {dashboard.student.admissionNumber}
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
                    {dashboard.attendance.attendancePercentage}%
                  </p>
                  <p className="text-green-100 text-xs mt-2">
                    {dashboard.attendance.presentDays} / {dashboard.attendance.totalDays} days
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Subjects</p>
                  <p className="text-3xl font-bold mt-1">
                    {dashboard.subjects.length}
                  </p>
                  <p className="text-blue-100 text-xs mt-2">
                    Enrolled this term
                  </p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-200" />
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
                    ₦{dashboard.feeStatus.balance.toLocaleString()}
                  </p>
                  <p className="text-purple-100 text-xs mt-2">
                    {dashboard.feeStatus.pendingItems} pending items
                  </p>
                </div>
                <CreditCard className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

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
              {dashboard.subjects.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.subjects.map((subject) => (
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
                  <span className="font-bold text-green-600">{dashboard.attendance.presentDays} days</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>Absent</span>
                  </div>
                  <span className="font-bold text-red-600">{dashboard.attendance.absentDays} days</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span>Late</span>
                  </div>
                  <span className="font-bold text-yellow-600">{dashboard.attendance.lateDays} days</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span>Excused</span>
                  </div>
                  <span className="font-bold text-blue-600">{dashboard.attendance.excusedDays} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {dashboard.upcomingAssignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
                {dashboard.upcomingAssignments.map((assignment) => (
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
