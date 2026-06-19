'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { dashboardApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { BookOpen, School, Star, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface MyAssignment {
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
  isClassTeacher: boolean;
  studentCount: number;
}

export default function TeacherSubjectsPage() {
  const { currentSchool } = useAuth();
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentSchool) return;
    fetchData();
  }, [currentSchool]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardApi.getTeacherDashboard(currentSchool!.id);
      const dashboard = res.data;
      setAssignments(dashboard?.myClasses || []);
    } catch {
      toast.error('Failed to load your subjects');
    } finally {
      setIsLoading(false);
    }
  };

  // Group by class
  const byClass = assignments.reduce((acc, a) => {
    if (!acc[a.classId]) {
      acc[a.classId] = {
        className: a.className,
        isClassTeacher: a.isClassTeacher,
        studentCount: a.studentCount,
        subjects: [] as { id?: string; name?: string }[],
      };
    }
    if (a.subjectId && a.subjectName) {
      acc[a.classId].subjects.push({ id: a.subjectId, name: a.subjectName });
    }
    return acc;
  }, {} as Record<string, { className: string; isClassTeacher: boolean; studentCount: number; subjects: { id?: string; name?: string }[] }>);

  const classList = Object.entries(byClass);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary-500" />
          My Subjects
        </h1>
        <p className="text-slate-500 mt-1">
          Subjects and classes assigned to you
        </p>
      </div>

      {classList.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <School className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
            <p className="text-slate-500">
              You haven&apos;t been assigned to any classes or subjects yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classList.map(([classId, cls], idx) => (
            <motion.div
              key={classId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <School className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cls.className}</CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          {cls.isClassTeacher && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold uppercase tracking-wide flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Class Teacher
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {cls.studentCount} students
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {cls.subjects.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No specific subjects assigned.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cls.subjects.map((s) => (
                        <div
                          key={s.id || s.name}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                            {s.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{s.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
