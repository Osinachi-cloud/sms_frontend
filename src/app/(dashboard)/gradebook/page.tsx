'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { gradebookApi, classApi, subjectApi, termApi, academicSessionApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  BookOpen, GraduationCap, AlertCircle, Search, ChevronLeft, ChevronRight,
  FilterX, FileText, ClipboardList
} from 'lucide-react';

interface ComponentResult {
  component_name: string;
  weight: number;
  score: number | string | null;
}

interface ComputedRow {
  student_id: string;
  student_name: string;
  admission_number?: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  components: ComponentResult[];
  total: number | null;
}

interface ComputedData {
  grading_scheme: string;
  students: ComputedRow[];
}

const PAGE_SIZE = 50;

export default function AdminGradebookPage() {
  const { currentSchool } = useAuth();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [search, setSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const studentDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [computedData, setComputedData] = useState<ComputedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Load meta data
  useEffect(() => {
    if (!currentSchool) return;
    let mounted = true;
    async function loadMeta() {
      try {
        setLoadingMeta(true);
        const [cRes, sRes, tRes, sessRes, currentTermRes, currentSessionRes] = await Promise.all([
          classApi.getAll(currentSchool!.id, { size: 100 }),
          subjectApi.getAll(currentSchool!.id, { size: 100 }),
          termApi.getAll(currentSchool!.id, { size: 100 }),
          academicSessionApi.getAll(currentSchool!.id, { size: 100 }),
          termApi.getCurrent(currentSchool!.id).catch(() => ({ data: null })),
          academicSessionApi.getCurrent(currentSchool!.id).catch(() => ({ data: null })),
        ]);

        const cls = ((cRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const sub = ((sRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const trm = ((tRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const sess = ((sessRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));

        if (!mounted) return;
        setClasses(cls);
        setSubjects(sub);
        setTerms(trm);
        setSessions(sess);

        const defaultTermId = currentTermRes?.data?.id || trm[0]?.id || '';
        const defaultSessionId = currentSessionRes?.data?.id || sess[0]?.id || '';
        setTermId(defaultTermId);
        setSessionId(defaultSessionId);
      } catch {
        toast.error('Failed to load filter data');
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    }
    loadMeta();
    return () => { mounted = false; };
  }, [currentSchool]);

  const loadData = useCallback(async () => {
    if (!currentSchool) return;
    try {
      setLoading(true);
      const res = await gradebookApi.compute(currentSchool.id, classId || undefined, subjectId || undefined);
      setComputedData(res.data as ComputedData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load gradebook');
      setComputedData(null);
    } finally {
      setLoading(false);
    }
  }, [currentSchool, classId, subjectId]);

  useEffect(() => {
    if (!currentSchool || loadingMeta) return;
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchool, classId, subjectId, loadData]);

  // Close student dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target as Node)) {
        setStudentDropdownOpen(false);
      }
    }
    if (studentDropdownOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [studentDropdownOpen]);

  // Build unique student list from computed data for the dropdown
  const computedStudents = useMemo(() => {
    if (!computedData) return [];
    const map = new Map<string, { id: string; name: string }>();
    computedData.students.forEach((s) => {
      if (!map.has(s.student_id)) {
        map.set(s.student_id, { id: s.student_id, name: s.student_name });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [computedData]);

  // Client-side filtering + pagination
  const filteredRows = useMemo(() => {
    if (!computedData) return [];
    let rows = computedData.students;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.student_name.toLowerCase().includes(q) ||
        r.class_name.toLowerCase().includes(q) ||
        r.subject_name.toLowerCase().includes(q)
      );
    }
    if (studentFilter) {
      rows = rows.filter(r => r.student_id === studentFilter);
    }
    return rows;
  }, [computedData, search, studentFilter]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pagedRows = filteredRows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const allComponents = computedData?.students[0]?.components.map(c => c.component_name) || [];

  const getGrade = (total: number | null) => {
    if (total === null) return '-';
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    return 'F';
  };

  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'B': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'C': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'D': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  const clearFilters = () => {
    setClassId('');
    setSubjectId('');
    setSearch('');
    setStudentFilter('');
    setCurrentPage(0);
  };

  if (loadingMeta) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <GraduationCap className="w-7 h-7 text-primary-500" />
          School Gradebook
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {classId ? classes.find(c => c.id === classId)?.name : 'All Classes'}
          {' · '}
          {subjectId ? subjects.find(s => s.id === subjectId)?.name : 'All Subjects'}
          {termId ? ' · ' + terms.find(t => t.id === termId)?.name : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center flex-wrap">
        <div className="flex flex-wrap gap-2">
          <select
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setCurrentPage(0); }}
          >
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value); setCurrentPage(0); }}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            value={termId}
            onChange={(e) => { setTermId(e.target.value); setCurrentPage(0); }}
          >
            <option value="">All Terms</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            value={sessionId}
            onChange={(e) => { setSessionId(e.target.value); setCurrentPage(0); }}
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-1 max-w-md xl:ml-auto">
          {/* Searchable Student Dropdown */}
          <div className="relative" ref={studentDropdownRef}>
            <button
              type="button"
              onClick={() => setStudentDropdownOpen((v) => !v)}
              className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-left min-w-[140px]"
            >
              {studentFilter
                ? computedStudents.find((s) => s.id === studentFilter)?.name ?? 'Student'
                : 'All Students'}
            </button>
            {studentDropdownOpen && (
              <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => { setStudentSearch(e.target.value); }}
                      className="w-full pl-7 pr-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!studentFilter ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => { setStudentFilter(''); setStudentDropdownOpen(false); setCurrentPage(0); }}
                  >
                    All Students
                  </button>
                  {computedStudents
                    .filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                    .map((s) => (
                      <button
                        key={s.id}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${studentFilter === s.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        onClick={() => { setStudentFilter(s.id); setStudentDropdownOpen(false); setCurrentPage(0); }}
                      >
                        {s.name}
                      </button>
                    ))}
                  {computedStudents.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-400">No students found</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search class or subject..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
          </div>
          {(classId || subjectId || search || studentFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Clear filters"
            >
              <FilterX className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<BookOpen className="w-4 h-4 text-blue-500" />} label="Entries" value={filteredRows.length} />
        <StatCard icon={<GraduationCap className="w-4 h-4 text-emerald-500" />} label="Students" value={new Set(filteredRows.map(r => r.student_id)).size} />
        <StatCard icon={<ClipboardList className="w-4 h-4 text-amber-500" />} label="Subjects" value={new Set(filteredRows.map(r => r.subject_id)).size} />
        <StatCard icon={<FileText className="w-4 h-4 text-violet-500" />} label="Page" value={`${currentPage + 1} of ${totalPages || 1}`} />
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      ) : !computedData || pagedRows.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No gradebook data found</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No students or grading schemes configured yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Computed Gradebook</CardTitle>
              <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredRows.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-500 min-w-[160px]">Student</th>
                  {!classId && <th className="py-3 px-2 font-semibold text-slate-500">Class</th>}
                  {!subjectId && <th className="py-3 px-2 font-semibold text-slate-500">Subject</th>}
                  {allComponents.map((name, i) => (
                    <th key={i} className="py-3 px-2 font-semibold text-slate-500 text-center whitespace-nowrap">
                      {name}
                    </th>
                  ))}
                  <th className="py-3 px-2 font-semibold text-slate-500 text-center whitespace-nowrap">Total</th>
                  <th className="py-3 px-2 font-semibold text-slate-500 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, idx) => {
                  const grade = getGrade(row.total);
                  return (
                    <motion.tr
                      key={`${row.student_id}-${row.subject_id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {row.student_name?.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{row.student_name}</span>
                        </div>
                      </td>
                      {!classId && <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{row.class_name}</td>}
                      {!subjectId && <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{row.subject_name}</td>}
                      {row.components.map((c, i) => (
                        <td key={i} className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            c.score === null
                              ? 'text-slate-400'
                              : c.score === '-'
                                ? 'text-red-500'
                                : Number(c.score) >= (c.weight * 0.5)
                                  ? 'text-slate-700 dark:text-slate-200'
                                  : 'text-red-600'
                          }`}>
                            {c.score === null ? '...' : c.score}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">/ {c.weight}</span>
                        </td>
                      ))}
                      <td className="py-3 px-2 text-center">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {row.total !== null ? row.total : '...'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${gradeColor(grade)}`}>
                          {grade}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-xs text-slate-500">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
