'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { dashboardApi } from '@/lib/api';
import { TeacherDashboard } from '@/types';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  GraduationCap,
  Users,
  School,
  Edit,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
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

export function TeacherDashboardView() {
  const { user, currentSchool } = useAuth();
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!currentSchool) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await dashboardApi.getTeacherDashboard(currentSchool.id);
        setDashboard(response.data);
      } catch (error) {
        console.error('Failed to fetch teacher dashboard:', error);
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
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Teacher Profile Not Found</h2>
          <p className="text-slate-500">Your teacher profile is not linked to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Welcome, {dashboard.teacher.fullName}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {dashboard.teacher.specialization || 'Teacher'} • {dashboard.teacher.employeeId}
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
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">My Classes</p>
                  <p className="text-3xl font-bold mt-1">
                    {dashboard.myClasses.length}
                  </p>
                  <p className="text-blue-100 text-xs mt-2">
                    Assigned this session
                  </p>
                </div>
                <School className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Students</p>
                  <p className="text-3xl font-bold mt-1">
                    {dashboard.totalStudents}
                  </p>
                  <p className="text-green-100 text-xs mt-2">
                    Across all classes
                  </p>
                </div>
                <Users className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Pending Approvals</p>
                  <p className="text-3xl font-bold mt-1">
                    {dashboard.pendingContentApprovals}
                  </p>
                  <p className="text-orange-100 text-xs mt-2">
                    Content submissions
                  </p>
                </div>
                <Clock className="w-12 h-12 text-orange-200" />
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
                <School className="w-5 h-5 text-primary-500" />
                My Classes & Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.myClasses.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.myClasses.map((classItem, index) => (
                    <div
                      key={`${classItem.classId}-${classItem.subjectId || index}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          classItem.isClassTeacher
                            ? 'bg-gradient-to-br from-primary-500 to-purple-600 text-white'
                            : 'bg-primary-100 dark:bg-primary-900/30'
                        }`}>
                          <BookOpen className={`w-6 h-6 ${classItem.isClassTeacher ? 'text-white' : 'text-primary-500'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{classItem.className}</p>
                            {classItem.isClassTeacher && (
                              <Badge variant="success" className="text-xs">Class Teacher</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{classItem.subjectName || 'All Subjects'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">{classItem.studentCount}</p>
                        <p className="text-xs text-slate-500">students</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <School className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No classes assigned yet</p>
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
                <ClipboardList className="w-5 h-5 text-green-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/teacher/assessments">
                  <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                    <ClipboardList className="w-8 h-8 text-blue-500" />
                    <span className="text-sm font-medium">Assessments</span>
                  </div>
                </Link>
                <Link href="/teacher/attendance">
                  <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer">
                    <CheckSquare className="w-8 h-8 text-green-500" />
                    <span className="text-sm font-medium">Mark Attendance</span>
                  </div>
                </Link>
                <Link href="/content">
                  <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer">
                    <FileText className="w-8 h-8 text-purple-500" />
                    <span className="text-sm font-medium">Create Content</span>
                  </div>
                </Link>
                <Link href="/students">
                  <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer">
                    <Users className="w-8 h-8 text-orange-500" />
                    <span className="text-sm font-medium">View Students</span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {dashboard.recentSubmissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Recent Content Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.recentSubmissions.map((submission) => (
                  <div
                    key={submission.contentId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-medium">{submission.title}</p>
                      <p className="text-xs text-slate-500">{submission.submittedAt}</p>
                    </div>
                    <Badge
                      variant={
                        submission.status === 'APPROVED' ? 'success' :
                        submission.status === 'REJECTED' ? 'error' :
                        'warning'
                      }
                    >
                      {submission.status}
                    </Badge>
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
