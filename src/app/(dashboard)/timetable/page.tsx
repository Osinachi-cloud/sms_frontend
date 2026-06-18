'use client';

import { timetableApi, classApi, subjectApi, teacherApi, dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, X, Trash2, BookOpen, Users, GraduationCap, DoorOpen, Pencil, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';
import { ClassAssignment } from '@/types';
import toast from 'react-hot-toast';
import Link from 'next/link';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayValueMap: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};
const dayBackendMap: Record<string, string> = {
  Monday: 'MONDAY',
  Tuesday: 'TUESDAY',
  Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY',
  Friday: 'FRIDAY',
  Saturday: 'SATURDAY',
};

interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  periodOrder: number;
  isBreak: boolean;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  fullName: string;
}

interface Entry {
  id: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  periodId: string;
  periodName: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  room: string;
  link?: string;
}

export default function TimetablePage() {
  const { currentSchool, hasPermission, user, isStudent, isTeacher } = useAuth();
  const canCreate =
    currentSchool?.roleName?.toLowerCase().includes('admin') || hasPermission('timetable.create');

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [teacherMyClasses, setTeacherMyClasses] = useState<ClassAssignment[]>([]);
  const [myTeacherId, setMyTeacherId] = useState('');
  const [myClass, setMyClass] = useState<ClassOption | null>(null);

  const [form, setForm] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    periodId: '',
    dayOfWeek: 1,
    room: '',
    link: '',
  });

  useEffect(() => {
    if (currentSchool?.id) {
      loadPeriods();
      if (isStudent()) {
        loadStudentClass();
      } else {
        loadClasses();
      }
      loadSubjects();
      if (!isTeacher()) {
        loadTeachers();
      }
      if (isTeacher()) {
        loadTeacherDashboard();
      }
    }
  }, [currentSchool]);

  useEffect(() => {
    if (currentSchool?.id && selectedClass) {
      loadTimetable();
    }
  }, [currentSchool, selectedClass]);

  useEffect(() => {
    if (myClass) {
      setSelectedClass(myClass.id);
    }
  }, [myClass]);

  const loadStudentClass = async () => {
    if (!currentSchool) return;
    try {
      const res = await dashboardApi.getStudentDashboard(currentSchool.id);
      const dashboard = res.data;
      if (dashboard?.currentClass) {
        setMyClass({ id: dashboard.currentClass.id, name: dashboard.currentClass.name });
      }
    } catch {
      setMyClass(null);
    }
  };

  const loadClasses = async () => {
    if (!currentSchool) return;
    try {
      const res = await classApi.getAll(currentSchool.id, { size: 1000 });
      const data = normalizeListResponse<ClassOption>(res.data);
      setClasses(data.items);
    } catch {
      setClasses([]);
    }
  };

  const loadSubjects = async () => {
    if (!currentSchool) return;
    try {
      const res = await subjectApi.getAll(currentSchool.id, { size: 1000 });
      const data = normalizeListResponse<SubjectOption>(res.data);
      setSubjects(data.items);
    } catch {
      setSubjects([]);
    }
  };

  const loadTeachers = async () => {
    if (!currentSchool) return;
    try {
      const res = await teacherApi.getAll(currentSchool.id, { size: 1000 });
      const data = normalizeListResponse<TeacherOption>(res.data);
      setTeachers(data.items.map((t: any) => ({ id: t.id, fullName: t.fullName })));
    } catch {
      setTeachers([]);
    }
  };

  const loadTeacherDashboard = async () => {
    if (!currentSchool) return;
    try {
      const res = await dashboardApi.getTeacherDashboard(currentSchool.id);
      const dashboard = res.data;
      if (dashboard?.teacher) {
        setMyTeacherId(dashboard.teacher.id);
      }
      if (dashboard?.myClasses) {
        setTeacherMyClasses(dashboard.myClasses);
      }
    } catch {
      setMyTeacherId('');
      setTeacherMyClasses([]);
    }
  };

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const res = await timetableApi.getPeriods(currentSchool!.id, { size: 100 });
      setPeriods(normalizeListResponse<Period>(res.data).items);
    } catch {
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeDayOfWeek = (day: any): string => {
    if (typeof day === 'number') {
      const map = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayBackendMap[map[day]] || String(day).toUpperCase();
    }
    if (typeof day === 'string') {
      const trimmed = day.trim();
      if (dayValueMap[trimmed]) return dayBackendMap[trimmed];
      const upper = trimmed.toUpperCase();
      if (['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'].includes(upper)) return upper;
      // Try converting from number string
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= 6) {
        const map = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayBackendMap[map[num]];
      }
    }
    return String(day || '').toUpperCase();
  };

  const loadTimetable = async () => {
    if (!selectedClass) return;
    try {
      const res = await timetableApi.getClassTimetable(currentSchool!.id, selectedClass);
      const raw = res.data;
      const items: any[] = Array.isArray(raw) ? raw : (raw?.content || []);
      setEntries(
        items.map((e) => ({
          ...e,
          periodId: String(e.periodId ?? ''),
          dayOfWeek: normalizeDayOfWeek(e.dayOfWeek),
        }))
      );
    } catch {
      setEntries([]);
    }
  };

  const openAddModal = (prefillDay?: string, prefillPeriodId?: string) => {
    setIsEditing(false);
    setEditingEntryId('');
    setForm({
      classId: selectedClass || '',
      subjectId: '',
      teacherId: isTeacher() ? myTeacherId : '',
      periodId: prefillPeriodId || '',
      dayOfWeek: prefillDay ? dayValueMap[prefillDay] : 1,
      room: '',
      link: '',
    });
    setShowEntryModal(true);
  };

  const openEditModal = (entry: Entry) => {
    setIsEditing(true);
    setEditingEntryId(entry.id);
    setForm({
      classId: entry.classId || selectedClass || '',
      subjectId: entry.subjectId || '',
      teacherId: entry.teacherId || '',
      periodId: entry.periodId || '',
      dayOfWeek: (() => {
        const key = Object.keys(dayBackendMap).find((k) => dayBackendMap[k] === entry.dayOfWeek);
        return key ? dayValueMap[key] : 1;
      })(),
      room: entry.room || '',
      link: entry.link || '',
    });
    setShowEntryModal(true);
  };

  const handleSubmit = async () => {
    if (!currentSchool) return;
    if (!form.classId || !form.subjectId || !form.teacherId || !form.periodId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const className = isTeacher()
        ? teacherMyClasses.find((a) => a.classId === form.classId)?.className
        : classes.find((c) => c.id === form.classId)?.name;

      const payload = {
        classId: form.classId,
        subjectId: form.subjectId,
        teacherId: form.teacherId,
        periodId: form.periodId,
        dayOfWeek: form.dayOfWeek,
        room: form.room,
        link: form.link || undefined,
        className,
      };

      if (isEditing && editingEntryId) {
        await timetableApi.updateEntry(currentSchool.id, editingEntryId, payload);
        toast.success('Timetable entry updated');
      } else {
        await timetableApi.createEntry(currentSchool.id, payload);
        toast.success('Timetable entry added');
      }

      setShowEntryModal(false);
      setIsEditing(false);
      setEditingEntryId('');
      if (selectedClass === form.classId) {
        loadTimetable();
      } else {
        setSelectedClass(form.classId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} entry`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!currentSchool || !confirm('Delete this timetable entry?')) return;
    try {
      await timetableApi.deleteEntry(currentSchool.id, entryId);
      toast.success('Entry deleted');
      loadTimetable();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const getEntriesForDay = (day: string) =>
    entries.filter((e) => e.dayOfWeek === dayBackendMap[day]);

  const teacherClasses = isTeacher()
    ? Array.from(
        new Map(
          teacherMyClasses.map((a) => [a.classId, { id: a.classId, name: a.className }])
        ).values()
      )
    : classes;

  // Subjects available to the teacher in the modal depend on selected class
  const modalSubjects = isTeacher()
    ? (() => {
        if (!form.classId) {
          // No class selected yet — show all subjects this teacher is assigned to
          return Array.from(
            new Map(
              teacherMyClasses
                .filter((a) => a.subjectId)
                .map((a) => [a.subjectId, { id: a.subjectId!, name: a.subjectName! }])
            ).values()
          );
        }
        const forClass = teacherMyClasses.filter((a) => a.classId === form.classId);
        const hasGeneralAssignment = forClass.some((a) => !a.subjectId);
        if (hasGeneralAssignment) {
          // Class teacher (or general assignment) — allow any subject for this class
          return subjects;
        }
        return Array.from(
          new Map(
            forClass
              .filter((a) => a.subjectId)
              .map((a) => [a.subjectId, { id: a.subjectId!, name: a.subjectName! }])
          ).values()
        );
      })()
    : subjects;

  const selectedClassName = isStudent()
    ? myClass?.name || ''
    : classes.find((c) => c.id === selectedClass)?.name || '';

  const pageTitle = isStudent() ? 'My Timetable' : 'Class Timetable';

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="timetable">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">{pageTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedClassName || (isStudent() ? '' : 'Select a class to view timetable')}
          </p>
        </div>
        <div className="flex gap-2 self-start">
          {!isStudent() && (
            <select
              className="glass-input text-sm py-1.5"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {(isTeacher() ? teacherClasses : classes).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {canCreate && (
            <Button onClick={() => openAddModal()}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {periods.length === 0 && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
          <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            No timetable periods configured yet.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            Go to{' '}
            <Link href="/settings?t=timetable-periods" className="underline font-semibold">
              Settings &rarr; Timetable Periods
            </Link>{' '}
            to add periods like &quot;Period 1 (8:00 AM - 9:00 AM)&quot;.
          </p>
        </div>
      )}

      {/* Unified Table View — Days as rows, Periods as columns */}
      <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
        <table className="w-full min-w-[640px] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80">
              <th className="w-20 px-2 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
                Day
              </th>
              {periods.map((period) => {
                const fmt = (t?: string) => {
                  if (!t) return '';
                  const [h, m] = t.split(':');
                  const hr = parseInt(h, 10);
                  const ampm = hr >= 12 ? 'PM' : 'AM';
                  const displayH = hr % 12 || 12;
                  return `${displayH}:${m} ${ampm}`;
                };
                const timeLabel = `${fmt(period.startTime)} - ${fmt(period.endTime)}`;
                return (
                  <th
                    key={period.id}
                    className="px-1.5 py-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-w-[120px]"
                  >
                    <span className="block">{period.name}</span>
                    <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-medium normal-case">{timeLabel}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {days.map((day, rowIdx) => {
              const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const isToday = day === todayName;
              return (
                <tr
                  key={day}
                  className={`border-t border-slate-200 dark:border-slate-700 ${
                    isToday ? 'bg-green-50/40 dark:bg-green-900/10' : rowIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  {/* Day cell */}
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 align-top">
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-extrabold uppercase tracking-wide ${isToday ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day.substring(0, 3)}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold text-green-600 dark:text-green-400">Today</span>
                      )}
                    </div>
                  </td>

                  {/* Period cells */}
                  {periods.map((period) => {
                    const entry = entries.find(
                      (e) => e.dayOfWeek === dayBackendMap[day] && e.periodId === period.id
                    );
                    return (
                      <td
                        key={period.id}
                        className="px-1.5 py-1.5 align-top border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-w-[120px]"
                      >
                        {period.isBreak ? (
                          <div className="h-[56px] flex items-center justify-center rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 tracking-wider uppercase">Break</span>
                          </div>
                        ) : entry ? (
                          <div
                            className="h-[56px] rounded-md border-l-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 p-1.5 relative group transition-shadow hover:shadow-sm cursor-pointer"
                            onClick={() => {
                              if (entry.link) {
                                window.open(entry.link, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            title={entry.link ? 'Click to join class' : ''}
                          >
                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                              {entry.subjectName}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {entry.teacherName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {entry.room ? (
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1 flex-1">
                                  <span className="inline-block w-1 h-1 rounded-full bg-sky-400" />
                                  {entry.room}
                                </p>
                              ) : (
                                <span className="flex-1" />
                              )}
                              {entry.link && (
                                <span className="text-[9px] text-blue-500 flex items-center gap-0.5 shrink-0">
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  Join
                                </span>
                              )}
                            </div>
                            {canCreate && (
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(entry); }}
                                  className="text-blue-400 hover:text-blue-600 p-0.5 rounded bg-white/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Edit"
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                                  className="text-red-400 hover:text-red-600 p-0.5 rounded bg-white/80 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Remove"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : canCreate ? (
                          <div
                            className="h-[56px] flex items-center justify-center cursor-pointer rounded border border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                            onClick={() => openAddModal(day, period.id)}
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                          </div>
                        ) : (
                          <div className="h-[56px] flex items-center justify-center rounded">
                            <span className="text-[10px] text-slate-200 dark:text-slate-700">—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showEntryModal}
        onClose={() => { setShowEntryModal(false); setIsEditing(false); setEditingEntryId(''); }}
        title={isEditing ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Class
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="glass-input w-full pl-9"
              >
                <option value="">Select class</option>
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Day
              </label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                className="glass-input w-full"
              >
                {days.map((d) => (
                  <option key={d} value={dayValueMap[d]}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Period
              </label>
              <select
                value={form.periodId}
                onChange={(e) => setForm({ ...form, periodId: e.target.value })}
                className="glass-input w-full"
              >
                <option value="">Select period</option>
                {periods
                  .filter((p) => !p.isBreak)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.startTime?.substring(0, 5)} - {p.endTime?.substring(0, 5)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="glass-input w-full pl-9"
              >
                <option value="">Select subject</option>
                {modalSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isTeacher() && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Teacher
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="glass-input w-full pl-9"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Room / Venue (optional)
            </label>
            <div className="relative">
              <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. Room 101"
                className="glass-input w-full pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Link (optional)
            </label>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="e.g. https://zoom.us/j/123456789"
                className="glass-input w-full pl-9"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Zoom, Google Meet, Teams link, etc.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowEntryModal(false); setIsEditing(false); setEditingEntryId(''); }}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {isEditing ? (
                <>
                  <Pencil className="w-4 h-4 mr-1" />
                  Update Entry
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Entry
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
