'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { dashboardApi } from '@/lib/api';
import { TeacherDashboard, ClassAssignment } from '@/types';
import { motion } from 'framer-motion';
import {
  School,
  Users,
  BookOpen,
  GraduationCap,
  Star,
  Settings,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function TeacherClassesPage() {
  const { currentSchool } = useAuth();
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!currentSchool) return;

      try {
        const response = await dashboardApi.getTeacherDashboard(currentSchool.id);
        setDashboard(response.data);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [currentSchool]);

  if (isLoading) {
    return (
    <div className="space-y-4 sm:space-y-6" data-tour="classes-grid">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse h-32 bg-slate-200 dark:bg-slate-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const myClasses = dashboard?.myClasses || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <School className="w-7 h-7 text-primary-500" />
            My Classes
          </h1>
          <p className="text-slate-500 mt-1">
            {myClasses.length} classes assigned • {dashboard?.totalStudents || 0} total students
          </p>
        </div>
      </div>

      {myClasses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <School className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
            <p className="text-slate-500">You haven&apos;t been assigned to any classes yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myClasses.map((classItem, index) => (
            <motion.div
              key={`${classItem.classId}-${classItem.subjectId || index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      classItem.isClassTeacher
                        ? 'bg-gradient-to-br from-primary-500 to-purple-600'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    {classItem.isClassTeacher && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Class Teacher
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-1">{classItem.className}</h3>
                  <p className="text-slate-500 mb-4">
                    {classItem.subjectName || 'All Subjects'}
                  </p>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-500" />
                      <span className="text-sm text-slate-500">Students</span>
                    </div>
                    <span className="text-lg font-bold">{classItem.studentCount}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/students?class=${classItem.classId}${classItem.subjectId ? `&subject=${classItem.subjectId}` : ''}`} className="flex-1">
                      <Button variant="secondary" className="w-full text-sm">
                        View Students
                      </Button>
                    </Link>
                    <Link href={`/teacher/gradebook?class=${classItem.classId}&subject=${classItem.subjectId}`}>
                      <Button className="text-sm">
                        Grades
                      </Button>
                    </Link>
                    {classItem.isClassTeacher && (
                      <>
                        <Link href={`/teacher/my-subjects?class=${classItem.classId}`} className="w-full">
                          <Button variant="outline" size="sm" className="w-full text-sm mt-1">
                            <Settings className="w-3.5 h-3.5 mr-1" />
                            Manage Subjects
                          </Button>
                        </Link>
                        <Link href={`/teacher/my-students?class=${classItem.classId}`} className="w-full">
                          <Button variant="secondary" size="sm" className="w-full text-sm mt-1">
                            <Heart className="w-3.5 h-3.5 mr-1" />
                            Parents
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                <School className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{myClasses.length}</p>
                <p className="text-sm text-slate-500">Total Classes</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{dashboard?.totalStudents || 0}</p>
                <p className="text-sm text-slate-500">Total Students</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
                <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {myClasses.filter(c => c.isClassTeacher).length}
                </p>
                <p className="text-sm text-slate-500">Class Teacher For</p>
              </div>
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-center">
                <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {new Set(myClasses.map(c => c.subjectName)).size}
                </p>
                <p className="text-sm text-slate-500">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
