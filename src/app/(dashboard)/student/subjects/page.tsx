'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { subjectApi, enrollmentApi, paymentGatewayApi } from '@/lib/api';
import { useInlinePayment } from '@/lib/payment-inline';
import { normalizeListResponse } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, Loader2 } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isFree: boolean;
  cost: number;
  classNames: string[];
  enrollmentCount: number;
}

interface Enrollment {
  subjectId: string;
  status: string;
}

export default function StudentSubjectsPage() {
  const { currentSchool, user } = useAuth();
  const schoolId = currentSchool?.id;
  const studentId = user?.studentId || user?.id;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  const { status: inlineStatus, startPayment } = useInlinePayment({
    schoolId: schoolId || '',
    onSuccess: () => {
      loadData();
    },
    onError: () => {
      setActiveSubjectId(null);
    },
  });

  useEffect(() => {
    if (!schoolId || !studentId) return;
    loadData();
  }, [schoolId, studentId]);

  useEffect(() => {
    if (!schoolId) return;
    paymentGatewayApi.getConfig(schoolId)
      .then((res: any) => setGatewayConfig(res.data))
      .catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    if (['idle', 'success', 'failed', 'cancelled'].includes(inlineStatus)) {
      setActiveSubjectId(null);
    }
  }, [inlineStatus]);

  const loadData = async () => {
    if (!schoolId || !studentId) return;
    try {
      const [subjectsRes, enrollmentsRes] = await Promise.all([
        subjectApi.getForStudent(schoolId, studentId),
        enrollmentApi.getStudentEnrollments(schoolId, studentId),
      ]);
      setSubjects(normalizeListResponse<Subject>(subjectsRes.data).items);
      setEnrollments(normalizeListResponse<Enrollment>(enrollmentsRes.data).items);
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (subjectId: string) => {
    return enrollments.some((e) => e.subjectId === subjectId && e.status === 'ENROLLED');
  };

  const handleEnroll = async (subject: Subject) => {
    if (!schoolId || !studentId) {
      toast.error('School or student not loaded');
      return;
    }
    try {
      if (subject.isFree) {
        await enrollmentApi.enroll(schoolId, studentId, subject.id);
        toast.success(`Registered for ${subject.name}`);
        loadData();
      } else {
        setActiveSubjectId(subject.id);
        const gateway = gatewayConfig?.activeGateway || 'PAYSTACK';
        await startPayment(
          gateway,
          {
            studentId,
            amount: subject.cost,
            subjectId: subject.id,
            currency: 'NGN',
          },
          user?.email || '',
          user?.fullName || ''
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
      setActiveSubjectId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-500" />
          My Subjects
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Register for your courses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {subjects.map((subject) => {
          const enrolled = isEnrolled(subject.id);
          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{subject.name}</span>
                    {subject.isFree ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Free</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">₦{subject.cost}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <p className="text-sm text-slate-500">{subject.description || 'No description'}</p>
                  <div className="text-xs text-slate-400">
                    Classes: {subject.classNames?.join(', ') || 'All'}
                  </div>
                  <div className="mt-auto pt-3">
                    {enrolled ? (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Registered
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleEnroll(subject)}
                        isLoading={activeSubjectId === subject.id}
                      >
                        {subject.isFree ? (
                          'Register'
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Pay & Register
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
