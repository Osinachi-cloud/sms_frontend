'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { attendanceApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { CalendarDays, Users, ChevronDown, ChevronUp, TrendingUp, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  remarks?: string;
  studentName?: string;
}

interface ChildAttendance {
  childId: string;
  childName: string;
  className?: string;
  records: AttendanceRecord[];
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendancePercentage: number;
  } | null;
}

export default function ParentAttendancePage() {
  const { currentSchool, user, isParent } = useAuth();
  const [childAttendance, setChildAttendance] = useState<ChildAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllChildrenAttendance() {
      if (!currentSchool || !user?.children) return;

      setIsLoading(true);
      try {
        const results: ChildAttendance[] = [];
        for (const child of user.children) {
          try {
            // Fetch attendance records
            const recordsRes = await attendanceApi.getStudentAttendance(currentSchool.id, child.id);
            // Fetch summary
            const summaryRes = await attendanceApi.getStudentAttendanceSummary(currentSchool.id, child.id);
            results.push({
              childId: child.id,
              childName: child.fullName,
              className: child.className,
              records: recordsRes.data || [],
              summary: summaryRes.data || null,
            });
          } catch {
            results.push({
              childId: child.id,
              childName: child.fullName,
              className: child.className,
              records: [],
              summary: null,
            });
          }
        }
        setChildAttendance(results);
        const firstWithRecords = results.find((r) => r.records.length > 0);
        if (firstWithRecords) setExpandedChild(firstWithRecords.childId);
      } catch (error) {
        console.error('Failed to fetch children attendance:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllChildrenAttendance();
  }, [currentSchool, user?.children]);

  const getStatusIcon = (status?: string) => {
    if (!status) return <AlertCircle className="w-4 h-4 text-slate-400" />;
    const s = status.toUpperCase();
    if (s === 'PRESENT') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (s === 'ABSENT') return <XCircle className="w-4 h-4 text-red-500" />;
    if (s === 'LATE') return <Clock className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-blue-500" />;
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-600';
    const s = status.toUpperCase();
    if (s === 'PRESENT') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s === 'ABSENT') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (s === 'LATE') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        </div>
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-16 bg-slate-200 dark:bg-slate-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!user?.children || user.children.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary-500" />
            My Children's Attendance
          </h1>
          <p className="text-slate-500 mt-1">View attendance records for all your children</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Children Found</h3>
            <p className="text-slate-500">Your children will appear here once linked to your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-primary-500" />
          My Children's Attendance
        </h1>
        <p className="text-slate-500 mt-1">View attendance records and statistics for all your children</p>
      </div>

      {childAttendance.map((child) => {
        const isExpanded = expandedChild === child.childId;
        const hasRecords = child.records.length > 0;
        const summary = child.summary;

        return (
          <motion.div
            key={child.childId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedChild(isExpanded ? null : child.childId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {child.childName.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{child.childName}</CardTitle>
                      <p className="text-xs text-slate-500">{child.className || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {summary && (
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30">
                        <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
                        <span className="text-xs font-semibold text-primary-600">
                          {summary.attendancePercentage}%
                        </span>
                      </div>
                    )}
                    {hasRecords && (
                      <Badge variant="info">{child.records.length} record(s)</Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  {!hasRecords ? (
                    <div className="text-center py-6 text-slate-400">
                      <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No attendance records available yet for {child.childName}.</p>
                      <p className="text-xs mt-1">Records will appear once teachers mark attendance.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary cards */}
                      {summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {[
                            { label: 'Total Days', value: summary.totalDays, color: 'text-slate-700 dark:text-slate-300' },
                            { label: 'Present', value: summary.presentDays, color: 'text-green-600' },
                            { label: 'Absent', value: summary.absentDays, color: 'text-red-600' },
                            { label: 'Late', value: summary.lateDays, color: 'text-yellow-600' },
                            { label: 'Excused', value: summary.excusedDays, color: 'text-blue-600' },
                          ].map((item) => (
                            <div key={item.label} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Attendance records table */}
                      <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Date</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Status</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {child.records.map((record) => (
                              <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-medium">{record.date}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(record.status)}
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                                      {record.status || 'Unknown'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-xs text-slate-500 max-w-[200px]">
                                  {record.remarks || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
