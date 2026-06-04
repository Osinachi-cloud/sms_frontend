'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { studentApi } from '@/lib/api';
import { Student } from '@/types';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Clock, Search, Save, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export default function TeacherAttendancePage() {
  const { currentSchool } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    async function fetchData() {
      if (!currentSchool) return;
      try {
        const res = await studentApi.getAll(currentSchool.id, { page: 0, size: 50 });
        const list = (res.data as any).content || [];
        setStudents(list);
        const initial: Record<string, AttendanceStatus> = {};
        list.forEach((s: Student) => {
          initial[s.id] = 'PRESENT';
        });
        setAttendance(initial);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load students');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentSchool]);

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (s.admissionNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    toast.success(`Attendance saved for ${selectedDate}`);
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="w-4 h-4" />;
      case 'ABSENT':
        return <XCircle className="w-4 h-4" />;
      case 'LATE':
        return <Clock className="w-4 h-4" />;
      case 'EXCUSED':
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      case 'ABSENT':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
    }
  };

  const stats = {
    present: Object.values(attendance).filter((s) => s === 'PRESENT').length,
    absent: Object.values(attendance).filter((s) => s === 'ABSENT').length,
    late: Object.values(attendance).filter((s) => s === 'LATE').length,
    excused: Object.values(attendance).filter((s) => s === 'EXCUSED').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary-500" />
            Mark Attendance
          </h1>
          <p className="text-slate-500 mt-1">Record daily attendance for your class</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Attendance
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="sm:col-span-1">
          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="glass-input w-full"
              />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="sm:col-span-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Present</p>
                  <p className="font-bold">{stats.present}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Absent</p>
                  <p className="font-bold">{stats.absent}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Late</p>
                  <p className="font-bold">{stats.late}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Excused</p>
                  <p className="font-bold">{stats.excused}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => {
                const status = attendance[student.id] || 'PRESENT';
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {student.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.fullName}</p>
                        <p className="text-xs text-slate-500">{student.admissionNumber} • {student.className}</p>
                      </div>
                    </div>
                     <div className="flex items-center gap-1 sm:gap-2">
                       {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((s) => (
                         <button
                           key={s}
                           onClick={() => handleStatusChange(student.id, s)}
                           className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium border transition-colors flex items-center gap-1 ${
                            status === s
                              ? getStatusColor(s)
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {getStatusIcon(s)}
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No students found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
