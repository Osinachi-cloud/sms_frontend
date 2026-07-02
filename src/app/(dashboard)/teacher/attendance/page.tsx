'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth';
import { attendanceApi, classApi, dashboardApi, holidayApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { normalizeListResponse } from '@/lib/utils';

interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  status: string | null;
  remarks: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
  section?: string;
}

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  { value: 'ABSENT', label: 'Absent', icon: XCircle, color: 'text-red-600 bg-red-100' },
  { value: 'LATE', label: 'Late', icon: Clock, color: 'text-amber-600 bg-amber-100' },
  { value: 'EXCUSED', label: 'Excused', icon: AlertCircle, color: 'text-blue-600 bg-blue-100' },
];

export default function TeacherAttendancePage() {
  const { currentSchool, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState('');

  useEffect(() => {
    if (!currentSchool) return;
    fetchClasses();
    fetchHolidays();
  }, [currentSchool]);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      fetchAttendance();
    }
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    const match = holidays.find((h) => h.date === selectedDate);
    if (match) {
      setIsHoliday(true);
      setHolidayName(match.name);
    } else {
      setIsHoliday(false);
      setHolidayName('');
    }
  }, [selectedDate, holidays]);

  const fetchClasses = async () => {
    try {
      const res = await dashboardApi.getTeacherDashboard(currentSchool!.id);
      const myClasses = res.data?.myClasses || [];
      const uniqueClasses: ClassInfo[] = [];
      const seen = new Set<string>();
      for (const mc of myClasses) {
        if (!seen.has(mc.classId)) {
          seen.add(mc.classId);
          uniqueClasses.push({ id: mc.classId, name: mc.className });
        }
      }
      setClasses(uniqueClasses);
      if (uniqueClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(uniqueClasses[0].id);
      }
    } catch {
      toast.error('Failed to load classes');
    }
  };

  const fetchAttendance = async () => {
    if (!currentSchool || !selectedClassId || !selectedDate) return;
    setIsLoading(true);
    try {
      const res = await attendanceApi.getClassAttendance(currentSchool.id, selectedClassId, selectedDate);
      const data = res.data || [];
      setStudents(data.map((d: any) => ({
        id: d.id || '',
        studentId: d.studentId,
        studentName: d.studentName,
        admissionNumber: d.admissionNumber || '',
        status: d.status || null,
        remarks: d.remarks || null,
      })));
    } catch {
      toast.error('Failed to load attendance');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  const handleSubmit = async () => {
    if (!currentSchool || !selectedClassId || !selectedDate) return;
    if (students.length === 0) return;

    setIsSubmitting(true);
    try {
      const records = students.map((s) => ({
        studentId: s.studentId,
        status: s.status || 'ABSENT',
        remarks: s.remarks || undefined,
      }));

      await attendanceApi.mark(currentSchool.id, {
        date: selectedDate,
        classId: selectedClassId,
        records,
      });
      toast.success('Attendance saved successfully');
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    if (direction === 'prev') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleBulkUpload = async () => {
    if (!currentSchool || !file) return;
    try {
      await attendanceApi.bulkUpload(currentSchool.id, file);
      toast.success('Bulk attendance uploaded');
      setIsBulkUploadOpen(false);
      setFile(null);
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload attendance');
    }
  };

  const handleDownloadTemplate = async () => {
    if (!currentSchool) return;
    attendanceApi.downloadTemplate(currentSchool.id);
  };

  const fetchHolidays = async () => {
    if (!currentSchool) return;
    try {
      const res = await holidayApi.getAll(currentSchool.id);
      const items = normalizeListResponse<any>(res.data).items;
      setHolidays(items.map((h: any) => ({ date: h.date, name: h.name })));
    } catch {
      // silent
    }
  };

  const isFutureDate = selectedDate > new Date().toISOString().split('T')[0];

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;
  const excusedCount = students.filter((s) => s.status === 'EXCUSED').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary-500" />
            Mark Attendance
          </h1>
          <p className="text-slate-500 mt-1">Record daily attendance for your students</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setIsBulkUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Bulk Upload
          </Button>
          <Button size="sm" onClick={() => setIsReportOpen(true)}>
            <BarChart3 className="w-4 h-4 mr-1" />
            Reports
          </Button>
        </div>
      </div>

      {/* Date & Class Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleDateChange('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="glass-input"
              />
              <Button variant="ghost" size="sm" onClick={() => handleDateChange('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="glass-input flex-1"
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{presentCount}</p>
            <p className="text-xs text-slate-500">Present</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{absentCount}</p>
            <p className="text-xs text-slate-500">Absent</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{lateCount}</p>
            <p className="text-xs text-slate-500">Late</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
            <AlertCircle className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{excusedCount}</p>
            <p className="text-xs text-slate-500">Excused</p>
          </div>
        </div>
      )}

      {/* Future Date Warning */}
      {isFutureDate && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 dark:text-red-400">
            You cannot mark attendance for future dates.
          </p>
        </div>
      )}

      {/* Holiday Warning */}
      {isHoliday && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
          <Sun className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">{holidayName}</span> — Attendance cannot be marked on public holidays.
          </p>
        </div>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            Student Attendance
            <span className="text-sm font-normal text-slate-500 ml-2">
              {students.length} students
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-3 font-medium text-slate-500">Student</th>
                <th className="text-center p-3 font-medium text-slate-500">Present</th>
                <th className="text-center p-3 font-medium text-slate-500">Absent</th>
                <th className="text-center p-3 font-medium text-slate-500">Late</th>
                <th className="text-center p-3 font-medium text-slate-500">Excused</th>
                <th className="text-left p-3 font-medium text-slate-500">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {selectedClassId ? 'No students found in this class.' : 'Select a class to mark attendance.'}
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.studentId} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3">
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                    </td>
                    {STATUS_OPTIONS.map((status) => {
                      const Icon = status.icon;
                      const isSelected = student.status === status.value;
                      return (
                        <td key={status.value} className="p-3 text-center">
                          <button
                            onClick={() => handleStatusChange(student.studentId, status.value)}
                            disabled={isFutureDate || isHoliday}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? `${status.color} ring-2 ring-offset-1 ring-slate-300`
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                            } disabled:opacity-50`}
                          >
                            <Icon className="w-3.5 h-3.5 inline mr-1" />
                            {isSelected ? status.label : ''}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-3">
                      <input
                        value={student.remarks || ''}
                        onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                        disabled={isFutureDate || isHoliday}
                        placeholder="Optional remark"
                        className="glass-input text-xs w-full"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {students.length > 0 && !isFutureDate && !isHoliday && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Save Attendance
          </Button>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={isBulkUploadOpen}
        onClose={() => { setIsBulkUploadOpen(false); setFile(null); }}
        title="Bulk Upload Attendance"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Upload a CSV or Excel file with columns: <code>date,student_email,admission_number,status,remarks</code>
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Status values: PRESENT, ABSENT, LATE, EXCUSED. Future dates will be skipped automatically.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4 mr-1" />
            Download Template
          </Button>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Upload File
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="glass-input w-full"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setIsBulkUploadOpen(false); setFile(null); }}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpload} disabled={!file}>
              <Upload className="w-4 h-4 mr-1" />
              Upload & Process
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
