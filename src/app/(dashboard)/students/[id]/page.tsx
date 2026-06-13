'use client';

import { useAuth } from '@/lib/auth';
import { studentApi, paymentApi, gradeApi, attendanceApi, reportCardApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  CreditCard,
  FileText,
  Award,
  Activity,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { StudentDetail, Payment, Grade } from '@/types';
import toast from 'react-hot-toast';
import { normalizeListResponse } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  date: string;
  status: string;
  remarks?: string;
}

const tabs = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'payments', label: 'Payments & Fees', icon: CreditCard },
  { key: 'performance', label: 'Performance', icon: Award },
  { key: 'report-cards', label: 'Report Cards', icon: FileText },
  { key: 'attendance', label: 'Attendance', icon: Activity },
];

export default function StudentDetailPage() {
  const { currentSchool } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const fetchStudent = async () => {
    if (!currentSchool || !studentId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await studentApi.getOne(currentSchool.id, studentId);
      // Merge with placeholder arrays for now until backend returns nested data
      setStudent({
        ...res.data,
        parents: res.data.parents || [],
        payments: res.data.payments || [],
        feesDue: res.data.feesDue || [],
        grades: res.data.grades || [],
        reportCards: res.data.reportCards || [],
        attendanceSummary: res.data.attendanceSummary,
      } as StudentDetail);
    } catch {
      toast.error('Failed to load student details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTabData = async () => {
    if (!currentSchool || !studentId) return;
    setIsDataLoading(true);
    try {
      if (activeTab === 'payments') {
        const [paymentsRes, feesRes] = await Promise.allSettled([
          paymentApi.getStudentPayments(currentSchool.id, studentId, { page: 0, size: 50 }),
          // fees endpoint may not exist, wrap in settled
          Promise.resolve({ data: [] }),
        ]);
        if (paymentsRes.status === 'fulfilled') {
          setPayments(normalizeListResponse<any>((paymentsRes.value as any).data).items);
        }
      } else if (activeTab === 'performance') {
        const res = await gradeApi.getStudentGrades(currentSchool.id, studentId);
        setGrades((res.data as any) || []);
      } else if (activeTab === 'attendance') {
        const [recordsRes, summaryRes] = await Promise.allSettled([
          attendanceApi.getStudentAttendance(currentSchool.id, studentId),
          attendanceApi.getStudentAttendanceSummary(currentSchool.id, studentId),
        ]);
        if (recordsRes.status === 'fulfilled') {
          setAttendanceRecords((recordsRes.value as any).data || []);
        }
        if (summaryRes.status === 'fulfilled') {
          const summary = (summaryRes.value as any).data;
          if (summary) {
            setStudent((prev) => (prev ? { ...prev, attendanceSummary: summary } : prev));
          }
        }
      }
    } catch {
      // silent for tab data
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [currentSchool, studentId]);

  useEffect(() => {
    if (activeTab !== 'overview') {
      fetchTabData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (student?.limitedView && activeTab !== 'overview' && activeTab !== 'performance') {
      setActiveTab('overview');
    }
  }, [student?.limitedView]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Student not found.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      INACTIVE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      GRADUATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/students')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{student.fullName}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {student.admissionNumber} &middot; {student.className || 'No class'}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {(student?.limitedView
            ? tabs.filter((t) => t.key === 'overview' || t.key === 'performance')
            : tabs
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Full Name</p>
                      <p className="font-medium">{student.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Admission Number</p>
                      <p className="font-medium">{student.admissionNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-medium">{student.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium">{student.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Date of Birth</p>
                      <p className="font-medium">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Gender</p>
                      <p className="font-medium">{student.gender || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="font-medium">{student.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Summary */}
            {!student.limitedView && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary-500" />
                    Academic Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {student.className || '-'}
                      </p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">Current Class</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {student.grades?.length || 0}
                      </p>
                      <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Total Grades</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {student.reportCards?.length || 0}
                      </p>
                      <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">Report Cards</p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-center">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {student.attendanceSummary?.attendancePercentage ?? '-'}%
                      </p>
                      <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">Attendance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parents */}
            {!student.limitedView && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-500" />
                      Parents / Guardians
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {student.parents && student.parents.length > 0 ? (
                      <div className="space-y-4">
                        {student.parents.map((parent, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <p className="font-medium">{parent.fullName}</p>
                            <p className="text-xs text-slate-500">{parent.relationship || 'Guardian'}</p>
                            {parent.phone && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {parent.phone}
                              </p>
                            )}
                            {parent.email && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" /> {parent.email}
                              </p>
                            )}
                            {parent.address && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" /> {parent.address}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No parent/guardian records</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary-500" />
                      Fee Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                      <span className="text-sm text-green-700 dark:text-green-400">Total Paid</span>
                      <span className="font-bold text-green-700 dark:text-green-400">
                        ₦{(student.payments?.reduce((sum, p) => sum + (p.status === 'SUCCESS' ? p.amount : 0), 0) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                      <span className="text-sm text-red-700 dark:text-red-400">Fees Owed</span>
                      <span className="font-bold text-red-700 dark:text-red-400">
                        ₦{(student.feesDue?.reduce((sum, f) => sum + (f.status === 'PENDING' || f.status === 'OVERDUE' ? f.amount : 0), 0) || 0).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₦{payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">Total Paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  ₦{payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
                <p className="text-xs text-slate-500 mt-1">Transactions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'paymentReference', header: 'Reference' },
                  { key: 'amount', header: 'Amount', render: (p: Payment) => `₦${p.amount.toLocaleString()}` },
                  { key: 'status', header: 'Status', render: (p: Payment) => (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                      p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{p.status}</span>
                  )},
                  { key: 'paymentMethod', header: 'Method', render: (p: Payment) => p.paymentMethod || 'N/A' },
                  { key: 'createdAt', header: 'Date', render: (p: Payment) => new Date(p.createdAt).toLocaleDateString() },
                ]}
                data={payments}
                keyField="id"
                isLoading={isDataLoading}
                emptyMessage="No payment records found"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grades & Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'subjectName', header: 'Subject', render: (g: Grade) => g.subjectName || 'N/A' },
                  { key: 'termName', header: 'Term', render: (g: Grade) => g.termName || 'N/A' },
                  { key: 'assessmentType', header: 'Type' },
                  { key: 'score', header: 'Score', render: (g: Grade) => (
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{g.score}</span>
                      <span className="text-xs text-slate-500">/ {g.maxScore}</span>
                    </div>
                  )},
                  { key: 'gradeLetter', header: 'Grade', render: (g: Grade) => (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      (g.gradeLetter || '').startsWith('A') ? 'bg-green-100 text-green-700' :
                      (g.gradeLetter || '').startsWith('B') ? 'bg-blue-100 text-blue-700' :
                      (g.gradeLetter || '').startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{g.gradeLetter || 'N/A'}</span>
                  )},
                  { key: 'remarks', header: 'Remarks', render: (g: Grade) => g.remarks || '-' },
                  { key: 'createdAt', header: 'Date', render: (g: Grade) => new Date(g.createdAt).toLocaleDateString() },
                ]}
                data={grades}
                keyField="id"
                isLoading={isDataLoading}
                emptyMessage="No grade records found"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Report Cards Tab */}
      {activeTab === 'report-cards' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Cards</CardTitle>
            </CardHeader>
            <CardContent>
              {student.reportCards && student.reportCards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {student.reportCards.map((rc) => (
                    <div key={rc.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{rc.termName}</h3>
                        <span className="text-xs text-slate-500">{rc.year}</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-primary-600">{rc.overallAverage}%</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                          (rc.gradeLetter || '').startsWith('A') ? 'bg-green-100 text-green-700' :
                          (rc.gradeLetter || '').startsWith('B') ? 'bg-blue-100 text-blue-700' :
                          (rc.gradeLetter || '').startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{rc.gradeLetter || 'N/A'}</span>
                      </div>
                      {rc.position && rc.totalStudents && (
                        <p className="text-sm text-slate-500">Position: {rc.position} of {rc.totalStudents}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        Generated on {new Date(rc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No report cards available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {student.attendanceSummary ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{student.attendanceSummary.totalDays}</p>
                    <p className="text-xs text-slate-500 mt-1">Total Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{student.attendanceSummary.presentDays}</p>
                    <p className="text-xs text-slate-500 mt-1">Present</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{student.attendanceSummary.absentDays}</p>
                    <p className="text-xs text-slate-500 mt-1">Absent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{student.attendanceSummary.lateDays}</p>
                    <p className="text-xs text-slate-500 mt-1">Late</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Attendance Rate</h3>
                    <span className="text-2xl font-bold text-primary-600">{student.attendanceSummary.attendancePercentage}%</span>
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-primary-500 transition-all duration-500"
                      style={{ width: `${Math.min(student.attendanceSummary.attendancePercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>Excused: {student.attendanceSummary.excusedDays} days</span>
                    <span>Rate: {student.attendanceSummary.attendancePercentage}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={[
                      { key: 'date', header: 'Date', render: (r: AttendanceRecord) => new Date(r.date).toLocaleDateString() },
                      { key: 'status', header: 'Status', render: (r: AttendanceRecord) => (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                          r.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                          r.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                          r.status === 'EXCUSED' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{r.status}</span>
                      )},
                      { key: 'remarks', header: 'Remarks', render: (r: AttendanceRecord) => r.remarks || '-' },
                    ]}
                    data={attendanceRecords}
                    keyField="id"
                    isLoading={isDataLoading}
                    emptyMessage="No attendance records found"
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No attendance records available</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
