'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { gradebookApi, classApi, subjectApi, termApi, academicSessionApi, studentApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  BookOpen, GraduationCap, AlertCircle, Search, ChevronLeft, ChevronRight,
  FilterX, FileText, ClipboardList, HelpCircle
} from 'lucide-react';

interface GradebookEntry {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  className?: string;
  subjectName?: string;
  sourceTitle: string;
  sourceType: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  percentage: number;
  gradeLetter?: string;
  termName?: string;
  sessionName?: string;
  remarks?: string;
  createdAt: string;
}

const PAGE_SIZE = 50;

export default function AdminGradebookPage() {
  const { currentSchool } = useAuth();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; fullName: string; admissionNumber?: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [termId, setTermId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const [entries, setEntries] = useState<GradebookEntry[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Load meta data and set defaults
  useEffect(() => {
    if (!currentSchool) return;
    let mounted = true;
    async function loadMeta() {
      try {
        setLoadingMeta(true);
        const [cRes, sRes, stRes, tRes, sessRes, currentTermRes, currentSessionRes] = await Promise.all([
          classApi.getAll(currentSchool!.id, { size: 100 }),
          subjectApi.getAll(currentSchool!.id, { size: 100 }),
          studentApi.getAll(currentSchool!.id, { size: 200, status: 'ACTIVE' }),
          termApi.getAll(currentSchool!.id, { size: 100 }),
          academicSessionApi.getAll(currentSchool!.id, { size: 100 }),
          termApi.getCurrent(currentSchool!.id).catch(() => ({ data: null })),
          academicSessionApi.getCurrent(currentSchool!.id).catch(() => ({ data: null })),
        ]);

        const cls = ((cRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const sub = ((sRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const std = ((stRes.data as any)?.content || []).map((x: any) => ({ id: x.id, fullName: x.fullName, admissionNumber: x.admissionNumber }));
        const trm = ((tRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const sess = ((sessRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));

        if (!mounted) return;
        setClasses(cls);
        setSubjects(sub);
        setStudents(std);
        setTerms(trm);
        setSessions(sess);

        // Defaults: current term/session, all classes/subjects/students
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
      const res = await gradebookApi.getEntries(currentSchool.id, {
        classId: classId || undefined,
        subjectId: subjectId || undefined,
        studentId: studentId || undefined,
        termId: termId || undefined,
        sessionId: sessionId || undefined,
        search: search.trim() || undefined,
        page: currentPage,
        size: PAGE_SIZE,
      });

      const data = res.data as any;
      const mapped = (data.content || []).map((e: any) => ({
        id: e.id,
        studentId: e.studentId,
        studentName: e.studentName,
        admissionNumber: e.admissionNumber,
        className: e.className,
        subjectName: e.subjectName,
        sourceTitle: e.sourceTitle,
        sourceType: e.sourceType,
        assessmentType: e.assessmentType,
        score: e.score != null ? Number(e.score) : 0,
        maxScore: e.maxScore != null ? Number(e.maxScore) : 100,
        percentage: e.percentage != null ? Number(e.percentage) : 0,
        gradeLetter: e.gradeLetter,
        termName: e.termName,
        sessionName: e.sessionName,
        remarks: e.remarks,
        createdAt: e.createdAt,
      }));
      setEntries(mapped);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load gradebook');
      setEntries([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentSchool, classId, subjectId, studentId, termId, sessionId, search, currentPage]);

  // Load gradebook data when filters or page change
  useEffect(() => {
    if (!currentSchool || loadingMeta) return;
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchool, classId, subjectId, studentId, termId, sessionId, search, currentPage, loadData]);

  const clearFilters = () => {
    setClassId('');
    setSubjectId('');
    setStudentId('');
    setSearch('');
    setCurrentPage(0);
  };

  const uniqueStudents = new Set(entries.map((e) => e.studentId)).size;
  const avgPercentage = entries.length > 0
    ? (entries.reduce((s, e) => s + (e.percentage || 0), 0) / entries.length).toFixed(1)
    : '-';

  const sourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'QUIZ': return <HelpCircle className="w-3.5 h-3.5 text-violet-500" />;
      case 'ASSESSMENT': return <ClipboardList className="w-3.5 h-3.5 text-blue-500" />;
      case 'GRADE': return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
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
          View all grades, assessments and quiz results across the school
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
            value={studentId}
            onChange={(e) => { setStudentId(e.target.value); setCurrentPage(0); }}
          >
            <option value="">All Students</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.fullName} {s.admissionNumber ? `(${s.admissionNumber})` : ''}</option>)}
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, subject or title..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
          </div>
          {(classId || subjectId || studentId || search) && (
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
        <StatCard icon={<BookOpen className="w-4 h-4 text-blue-500" />} label="Entries" value={totalElements} />
        <StatCard icon={<GraduationCap className="w-4 h-4 text-emerald-500" />} label="Students" value={uniqueStudents} />
        <StatCard icon={<ClipboardList className="w-4 h-4 text-amber-500" />} label="Avg Score" value={`${avgPercentage}%`} />
        <StatCard icon={<FileText className="w-4 h-4 text-violet-500" />} label="Page" value={`${currentPage + 1} of ${totalPages || 1}`} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No gradebook entries found</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your filters. Results will appear once teachers create assessments, enter grades, or students take quizzes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Gradebook Entries</CardTitle>
              <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {totalElements} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-500">Student</th>
                  <th className="py-3 px-2 font-semibold text-slate-500">Class</th>
                  <th className="py-3 px-2 font-semibold text-slate-500">Subject</th>
                  <th className="py-3 px-2 font-semibold text-slate-500">Source</th>
                  <th className="py-3 px-2 font-semibold text-slate-500 text-center">Type</th>
                  <th className="py-3 px-2 font-semibold text-slate-500 text-center">Score</th>
                  <th className="py-3 px-2 font-semibold text-slate-500 text-center">%</th>
                  <th className="py-3 px-2 font-semibold text-slate-500 text-center">Grade</th>
                  <th className="py-3 px-2 font-semibold text-slate-500">Term</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const pct = entry.percentage || 0;
                  const grade = entry.gradeLetter || (pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 45 ? 'D' : 'F');
                  return (
                    <motion.tr
                      key={entry.id + '-' + idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {entry.studentName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{entry.studentName}</p>
                            <p className="text-[11px] text-slate-400">{entry.admissionNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{entry.className || '-'}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{entry.subjectName || '-'}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          {sourceIcon(entry.sourceType)}
                          <span className="text-slate-700 dark:text-slate-200 truncate max-w-[140px]" title={entry.sourceTitle}>
                            {entry.sourceTitle || 'Untitled'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {entry.assessmentType}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-700 dark:text-slate-200">
                        {entry.score}/{entry.maxScore}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                          pct >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : pct >= 50 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          grade === 'A' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : grade === 'B' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : grade === 'C' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                : grade === 'D' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {grade}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-500">
                        {entry.termName || '-'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
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
