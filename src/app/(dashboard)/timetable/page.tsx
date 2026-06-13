'use client';

import { timetableApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, BookOpen, Users, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';

const defaultClasses = [
  { id: 'c1', name: 'JSS 1' },
  { id: 'c2', name: 'JSS 2' },
  { id: 'c3', name: 'JSS 3' },
  { id: 'c4', name: 'SS 1' },
  { id: 'c5', name: 'SS 2' },
  { id: 'c6', name: 'SS 3' },
];

export default function TimetablePage() {
  const { currentSchool } = useAuth();
  const [classes] = useState<any[]>(defaultClasses);
  const [selectedClass, setSelectedClass] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMap: Record<string, string> = {
    Monday: 'MONDAY',
    Tuesday: 'TUESDAY',
    Wednesday: 'WEDNESDAY',
    Thursday: 'THURSDAY',
    Friday: 'FRIDAY',
    Saturday: 'SATURDAY',
  };

  useEffect(() => {
    if (currentSchool?.id) {
      loadPeriods();
    }
  }, [currentSchool]);

  useEffect(() => {
    if (currentSchool?.id && selectedClass) {
      loadTimetable();
    }
  }, [currentSchool, selectedClass]);

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const res = await timetableApi.getPeriods(currentSchool!.id);
      setPeriods(normalizeListResponse<any>(res.data).items);
    } catch {
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetable = async () => {
    if (!selectedClass) return;
    try {
      const res = await timetableApi.getClassTimetable(currentSchool!.id, selectedClass);
      setEntries(res.data || []);
    } catch {
      setEntries([]);
    }
  };

  const getEntriesForDay = (day: string) =>
    entries.filter((e) => e.dayOfWeek === dayMap[day]);

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="timetable">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">Class Timetable</h1>
        <div className="flex gap-2 self-start">
          <select className="glass-input text-sm py-1.5" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button onClick={() => setShowEntryModal(true)}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Mobile View - Day Cards */}
      <div className="block lg:hidden space-y-4">
        {days.map((day) => {
          const dayEntries = getEntriesForDay(day);
          return (
            <motion.div key={day} className="glass-card rounded-2xl p-4">
              <h3 className="font-semibold text-sm mb-3 text-primary-600">{day}</h3>
              {dayEntries.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No classes scheduled</p>
              ) : (
                <div className="space-y-2">
                  {dayEntries.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="text-xs font-medium text-slate-500 min-w-[60px]">
                        {e.startTime?.substring(0, 5)} - {e.endTime?.substring(0, 5)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{e.subjectName || 'Subject'}</p>
                        <p className="text-xs text-slate-500 truncate">{e.teacherName || 'Teacher'} {e.room && `(${e.room})`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Desktop View - Grid */}
      <div className="hidden lg:block glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-left text-xs font-semibold text-slate-500">Time</th>
                {days.map((day) => (
                  <th key={day} className="p-4 text-left text-xs font-semibold text-slate-500 min-w-[140px]">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-400">
                    No timetable entries yet. Add periods and entries to get started.
                  </td>
                </tr>
              ) : (
                periods.map((period, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <td className="p-3 text-xs font-medium text-slate-600">
                      {period.startTime?.substring(0, 5)} - {period.endTime?.substring(0, 5)}
                    </td>
                    {days.map((day) => {
                      const entry = entries.find((e) => e.dayOfWeek === dayMap[day] && e.periodId === period.id);
                      return (
                        <td key={day} className="p-2">
                          {entry ? (
                            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-xs">
                              <p className="font-medium text-primary-700 dark:text-primary-300">{entry.subjectName}</p>
                              <p className="text-slate-500">{entry.teacherName}</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center">
                              <button className="text-xs text-slate-400 hover:text-primary-500">+</button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showEntryModal} onClose={() => setShowEntryModal(false)} title="Add Timetable Entry" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            To add timetable entries, ensure periods are configured first in School Settings.
          </p>
          <div className="flex justify-end">
            <button className="btn-secondary text-sm" onClick={() => setShowEntryModal(false)}>Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
