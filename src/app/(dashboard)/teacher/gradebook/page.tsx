'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { studentApi, gradeApi, classApi, subjectApi, termApi, dashboardApi } from '@/lib/api';
import { Student, Grade, ClassAssignment } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, GraduationCap, LayoutGrid, User, Users,
  Trophy, TrendingUp, Award, ArrowLeft, ChevronRight, BarChart3,
  Filter, XCircle, Calendar, School,
} from 'lucide-react';
import toast from 'react-hot-toast';

type ViewMode = 'overview' | 'subject' | 'student';

type NormalizedAssessment = 'EXAM' | 'TEST' | 'QUIZ' | 'CA' | 'ASSIGNMENT' | 'OTHER';

interface SubjectInfo {
  id: string;
  name: string;
  code?: string;
}

interface ClassInfo {
  id: string;
  name: string;
}

interface TermInfo {
  id: string;
  name: string;
}

interface StudentWithGrades {
  student: Student;
  grades: Grade[];
}

const ASSESSMENT_ORDER: NormalizedAssessment[] = ['CA', 'ASSIGNMENT', 'QUIZ', 'TEST', 'EXAM'];

function normalizeAssessment(type: string): NormalizedAssessment {
  const t = type.toUpperCase();
  if (t === 'EXAM') return 'EXAM';
  if (t === 'TEST') return 'TEST';
  if (t === 'QUIZ') return 'QUIZ';
  if (t === 'CA' || t === 'CONTINUOUS_ASSESSMENT' || t === 'C.A') return 'CA';
  if (t === 'ASSIGNMENT' || t === 'HOMEWORK' || t === 'PROJECT') return 'ASSIGNMENT';
  return 'OTHER';
}

function getAssessmentLabel(type: NormalizedAssessment) {
  const labels: Record<NormalizedAssessment, string> = {
    EXAM: 'Exam',
    TEST: 'Test',
    QUIZ: 'Quiz',
    CA: 'C.A.',
    ASSIGNMENT: 'Assignment',
    OTHER: 'Other',
  };
  return labels[type];
}

function getGradeColor(letter?: string) {
  if (!letter) return 'text-slate-500';
  if (letter === 'A') return 'text-emerald-600 dark:text-emerald-400';
  if (letter === 'B') return 'text-blue-600 dark:text-blue-400';
  if (letter === 'C') return 'text-amber-600 dark:text-amber-400';
  if (letter === 'D') return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getGradeBg(letter?: string) {
  if (!letter) return 'bg-slate-50 dark:bg-slate-800';
  if (letter === 'A') return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (letter === 'B') return 'bg-blue-50 dark:bg-blue-900/20';
  if (letter === 'C') return 'bg-amber-50 dark:bg-amber-900/20';
  if (letter === 'D') return 'bg-orange-50 dark:bg-orange-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}

export default function TeacherGradebookPage() {
  const { currentSchool, isTeacher } = useAuth();
  const searchParams = useSearchParams();
  const urlClassId = searchParams.get('class');
  const urlSubjectId = searchParams.get('subject');

  // Core data
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [terms, setTerms] = useState<TermInfo[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<ClassAssignment[]>([]);
  const [allStudentGrades, setAllStudentGrades] = useState<StudentWithGrades[]>([]);

  // Loading
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(urlClassId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(urlSubjectId || '');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  // Load meta data (classes, subjects, terms, teacher assignments)
  useEffect(() => {
    if (!currentSchool) return;
    async function loadMeta() {
      try {
        setLoadingClasses(true);
        const [clsRes, subRes, termRes] = await Promise.all([
          classApi.getAll(currentSchool!.id, { size: 100 }),
          subjectApi.getAll(currentSchool!.id, { size: 100 }),
          termApi.getAll(currentSchool!.id, { size: 100 }),
        ]);
        const clsList = ((clsRes.data as any)?.content || []).map((c: any) => ({ id: c.id, name: c.name }));
        const subList = ((subRes.data as any)?.content || []).map((s: any) => ({ id: s.id, name: s.name, code: s.code }));
        const termList = ((termRes.data as any)?.content || []).map((t: any) => ({ id: t.id, name: t.name }));
        setClasses(clsList);
        setSubjects(subList);
        setTerms(termList);

        if (isTeacher()) {
          const dashRes = await dashboardApi.getTeacherDashboard(currentSchool!.id);
          const assignments: ClassAssignment[] = dashRes.data?.myClasses || [];
          setTeacherAssignments(assignments);

          // If no class selected and teacher has assignments, default to their first class
          if (!selectedClassId && assignments.length > 0) {
            const firstClass = assignments[0];
            setSelectedClassId(firstClass.classId);
            if (!selectedSubjectId && firstClass.subjectId) {
              setSelectedSubjectId(firstClass.subjectId);
            }
          }
        }
      } catch {
        toast.error('Failed to load school data');
      } finally {
        setLoadingClasses(false);
      }
    }
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchool]);

  // Load students and grades when filters change
  useEffect(() => {
    if (!currentSchool || !selectedClassId) return;
    async function loadStudentsAndGrades() {
      try {
        setLoadingData(true);
        const stuRes = await studentApi.getAll(currentSchool!.id, { classId: selectedClassId, size: 200 });
        const studentList: Student[] = (stuRes.data as any)?.content || [];

        const withGrades: StudentWithGrades[] = [];
        for (const s of studentList) {
          try {
            const gRes = selectedTermId
              ? await gradeApi.getStudentGradesByTerm(currentSchool!.id, s.id, selectedTermId)
              : await gradeApi.getStudentGrades(currentSchool!.id, s.id);
            withGrades.push({ student: s, grades: (gRes.data || []) as Grade[] });
          } catch {
            withGrades.push({ student: s, grades: [] });
          }
        }
        setAllStudentGrades(withGrades);
      } catch {
        toast.error('Failed to load grade data');
        setAllStudentGrades([]);
      } finally {
        setLoadingData(false);
      }
    }
    loadStudentsAndGrades();
  }, [currentSchool, selectedClassId, selectedTermId]);

  // Filtered students by search
  const filteredStudentGrades = useMemo(() => {
    if (!searchQuery.trim()) return allStudentGrades;
    const q = searchQuery.toLowerCase();
    return allStudentGrades.filter(
      (sg) =>
        sg.student.fullName.toLowerCase().includes(q) ||
        (sg.student.admissionNumber || '').toLowerCase().includes(q)
    );
  }, [allStudentGrades, searchQuery]);

  // --------------------------
  //  COMPUTED DATA FOR VIEWS
  // --------------------------

  // For overview: subjects in this class + assessment types
  const classSubjects = useMemo(() => {
    const subjectIds = new Set<string>();
    filteredStudentGrades.forEach((sg) => {
      sg.grades.forEach((g) => {
        if (g.subjectId) subjectIds.add(g.subjectId);
      });
    });
    return subjects
      .filter((s) => subjectIds.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredStudentGrades, subjects]);

  // For overview: compute average per student across all subjects
  const overviewData = useMemo(() => {
    const rows = filteredStudentGrades.map((sg) => {
      const validGrades = sg.grades.filter((g) => g.score != null && g.maxScore > 0);
      const totalPct = validGrades.reduce((sum, g) => sum + (Number(g.score) / Number(g.maxScore)) * 100, 0);
      const avg = validGrades.length > 0 ? totalPct / validGrades.length : 0;

      // Per-subject averages
      const subjectAvgs: Record<string, number> = {};
      classSubjects.forEach((subj) => {
        const subGrades = sg.grades.filter((g) => g.subjectId === subj.id && g.score != null && g.maxScore > 0);
        if (subGrades.length > 0) {
          const subTotal = subGrades.reduce((sum, g) => sum + (Number(g.score) / Number(g.maxScore)) * 100, 0);
          subjectAvgs[subj.id] = subTotal / subGrades.length;
        }
      });

      return {
        student: sg.student,
        avg,
        subjectAvgs,
        gradeCount: validGrades.length,
      };
    });
    // Sort by average descending for ranking
    rows.sort((a, b) => b.avg - a.avg);
    return rows;
  }, [filteredStudentGrades, classSubjects]);

  // For subject view: detailed grid per assessment type
  const subjectViewData = useMemo(() => {
    if (!selectedSubjectId) return [];
    return filteredStudentGrades.map((sg) => {
      const subjGrades = sg.grades.filter((g) => g.subjectId === selectedSubjectId);
      const byAssessment: Record<NormalizedAssessment, Grade[]> = {
        EXAM: [], TEST: [], QUIZ: [], CA: [], ASSIGNMENT: [], OTHER: [],
      };
      subjGrades.forEach((g) => {
        byAssessment[normalizeAssessment(g.assessmentType)].push(g);
      });
      return { student: sg.student, byAssessment };
    });
  }, [filteredStudentGrades, selectedSubjectId]);

  // For student view: the selected student's full report card
  const selectedStudentData = useMemo(() => {
    if (!selectedStudentId) return null;
    const sg = allStudentGrades.find((x) => x.student.id === selectedStudentId);
    if (!sg) return null;
    const bySubject: Record<string, Grade[]> = {};
    sg.grades.forEach((g) => {
      if (!bySubject[g.subjectId]) bySubject[g.subjectId] = [];
      bySubject[g.subjectId].push(g);
    });
    return { student: sg.student, bySubject };
  }, [allStudentGrades, selectedStudentId]);

  const currentClassName = classes.find((c) => c.id === selectedClassId)?.name || 'All Classes';
  const currentSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || 'All Subjects';
  const currentTermName = terms.find((t) => t.id === selectedTermId)?.name || 'All Terms';

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedStudentId('');
  };

  // ---- Render Helpers ----

  const renderFilters = () => (
    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
      <div className="flex flex-wrap gap-2">
        {/* Class selector */}
        <select
          className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setSelectedSubjectId('');
            setSelectedStudentId('');
            setViewMode('overview');
          }}
        >
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Term selector */}
        <select
          className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          value={selectedTermId}
          onChange={(e) => setSelectedTermId(e.target.value)}
        >
          <option value="">All Terms</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 w-48"
          />
        </div>
      </div>

      {/* View Toggles */}
      <div className="flex gap-1 ml-auto">
        {[
          { key: 'overview' as ViewMode, label: 'Class Overview', icon: LayoutGrid },
          { key: 'subject' as ViewMode, label: 'Subject Report', icon: BookOpen },
          { key: 'student' as ViewMode, label: 'Student Report', icon: User },
        ].map((v) => (
          <button
            key={v.key}
            onClick={() => { setViewMode(v.key); setSelectedStudentId(''); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              viewMode === v.key
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <v.icon className="w-3.5 h-3.5" /> {v.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ---- VIEW: OVERVIEW (All Students, All Subjects, Averages, Positions) ----
  const renderOverview = () => {
    if (!selectedClassId) {
      return (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-12 text-center">
            <School className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-500">Select a class to view the gradebook</p>
          </CardContent>
        </Card>
      );
    }

    const assessmentCols = classSubjects;

    return (
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4 text-primary-500" />}
            label="Students"
            value={overviewData.length}
          />
          <StatCard
            icon={<BookOpen className="w-4 h-4 text-blue-500" />}
            label="Subjects"
            value={classSubjects.length}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
            label="Class Avg"
            value={
              overviewData.length > 0
                ? `${(overviewData.reduce((s, r) => s + r.avg, 0) / overviewData.length).toFixed(1)}%`
                : '-'
            }
          />
          <StatCard
            icon={<Trophy className="w-4 h-4 text-amber-500" />}
            label="Top Student"
            value={overviewData[0]?.student.fullName.split(' ')[0] || '-'}
          />
        </div>

        {/* Ranking Table */}
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                Class Performance & Positions
              </CardTitle>
              <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {overviewData.length} students
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto -mx-6 px-6">
            {overviewData.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No grade data available for this class</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                    <th className="py-3 px-2 font-semibold text-slate-500 w-12">Pos</th>
                    <th className="py-3 px-2 font-semibold text-slate-500">Student</th>
                    {assessmentCols.map((s) => (
                      <th key={s.id} className="py-3 px-2 font-semibold text-slate-500 text-center min-w-[80px]">{s.name}</th>
                    ))}
                    <th className="py-3 px-2 font-semibold text-slate-500 text-center">Overall Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewData.map((row, idx) => {
                    const pos = idx + 1;
                    return (
                      <tr
                        key={row.student.id}
                        className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => { setSelectedStudentId(row.student.id); setViewMode('student'); }}
                      >
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                            pos === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : pos === 2 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                : pos === 3 ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                                  : 'text-slate-400'
                          }`}>
                            {pos}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{row.student.fullName}</p>
                            <p className="text-[11px] text-slate-400">{row.student.admissionNumber}</p>
                          </div>
                        </td>
                        {assessmentCols.map((s) => {
                          const pct = row.subjectAvgs[s.id];
                          return (
                            <td key={s.id} className="py-3 px-2 text-center">
                              {pct !== undefined ? (
                                <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                                  pct >= 70 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : pct >= 50 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {pct.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                            row.avg >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : row.avg >= 50 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {row.avg.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ---- VIEW: SUBJECT REPORT (All Students for selected subject) ----
  const renderSubjectReport = () => {
    if (!selectedClassId) {
      return (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-12 text-center">
            <School className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-500">Select a class first</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {/* Subject selector inside this view */}
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <select
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {!selectedSubjectId ? (
          <Card className="border-slate-200 dark:border-slate-700/50">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-500">Select a subject to view the detailed report</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary-500" />
                  {currentSubjectName} — Assessment Breakdown
                </CardTitle>
                <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {subjectViewData.length} students
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto -mx-6 px-6">
              {subjectViewData.length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No students or grades found</p>
                </div>
              ) : (
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                      <th className="py-3 px-2 font-semibold text-slate-500">Student</th>
                      {ASSESSMENT_ORDER.map((a) => (
                        <th key={a} className="py-3 px-2 font-semibold text-slate-500 text-center">
                          {getAssessmentLabel(a)}
                        </th>
                      ))}
                      <th className="py-3 px-2 font-semibold text-slate-500 text-center">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectViewData.map(({ student, byAssessment }) => {
                      // Compute per-assessment averages
                      const avgs: Record<string, number> = {};
                      let totalPct = 0;
                      let count = 0;
                      ASSESSMENT_ORDER.forEach((a) => {
                        const list = byAssessment[a];
                        if (list && list.length > 0) {
                          const sum = list.reduce((s, g) => s + (Number(g.score) / Number(g.maxScore)) * 100, 0);
                          avgs[a] = sum / list.length;
                          totalPct += avgs[a];
                          count++;
                        }
                      });
                      const overallAvg = count > 0 ? totalPct / count : 0;

                      return (
                        <tr
                          key={student.id}
                          className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                          onClick={() => { setSelectedStudentId(student.id); setViewMode('student'); }}
                        >
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">{student.fullName}</p>
                              <p className="text-[11px] text-slate-400">{student.admissionNumber}</p>
                            </div>
                          </td>
                          {ASSESSMENT_ORDER.map((a) => {
                            const pct = avgs[a];
                            return (
                              <td key={a} className="py-3 px-2 text-center">
                                {pct !== undefined ? (
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                                    pct >= 70 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                      : pct >= 50 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                    {pct.toFixed(0)}%
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                              overallAvg >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : overallAvg >= 50 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {overallAvg > 0 ? `${overallAvg.toFixed(1)}%` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ---- VIEW: STUDENT REPORT CARD ----
  const renderStudentReport = () => {
    if (!selectedStudentId || !selectedStudentData) {
      return (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-12 text-center space-y-4">
            <User className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-500">Select a student to view their report card</p>
            <div className="flex flex-wrap justify-center gap-2 max-h-60 overflow-y-auto">
              {filteredStudentGrades.map((sg) => (
                <button
                  key={sg.student.id}
                  onClick={() => setSelectedStudentId(sg.student.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                    {sg.student.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{sg.student.fullName}</p>
                    <p className="text-[10px] text-slate-400">{sg.student.admissionNumber}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    const { student, bySubject } = selectedStudentData;

    // Build report card rows
    const reportSubjects = subjects
      .filter((s) => bySubject[s.id] && bySubject[s.id].length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    let overallTotal = 0;
    let overallCount = 0;

    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Button variant="outline" size="sm" onClick={handleBackToOverview} className="border-slate-200 dark:border-slate-700">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
        </Button>

        {/* Report Card Header */}
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-primary-400 via-violet-400 to-indigo-400" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-500/25">
                  {student.fullName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{student.fullName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{student.admissionNumber} • {currentClassName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{currentTermName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Report Card</p>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Breakdown Cards */}
        {reportSubjects.map((subj) => {
          const grades = bySubject[subj.id] || [];
          const byType: Record<NormalizedAssessment, Grade[]> = {
            EXAM: [], TEST: [], QUIZ: [], CA: [], ASSIGNMENT: [], OTHER: [],
          };
          grades.forEach((g) => byType[normalizeAssessment(g.assessmentType)].push(g));

          const typeAvgs: { type: NormalizedAssessment; avg: number }[] = [];
          ASSESSMENT_ORDER.forEach((a) => {
            const list = byType[a];
            if (list.length > 0) {
              const sum = list.reduce((s, g) => s + (Number(g.score) / Number(g.maxScore)) * 100, 0);
              typeAvgs.push({ type: a, avg: sum / list.length });
            }
          });

          const subjAvg = typeAvgs.length > 0
            ? typeAvgs.reduce((s, t) => s + t.avg, 0) / typeAvgs.length
            : 0;

          if (subjAvg > 0) {
            overallTotal += subjAvg;
            overallCount++;
          }

          // Best grade for letter display
          const bestGrade = grades.reduce((best, g) =>
            (g.score || 0) > (best?.score || 0) ? g : best, grades[0]
          );

          return (
            <Card key={subj.id} className="border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary-500" />
                    {subj.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] border-0 ${getGradeBg(bestGrade?.gradeLetter)} ${getGradeColor(bestGrade?.gradeLetter)}`}>
                      Grade: {bestGrade?.gradeLetter || 'N/A'}
                    </Badge>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      subjAvg >= 70 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : subjAvg >= 50 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      Avg: {subjAvg.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {typeAvgs.map(({ type, avg }) => (
                    <div key={type} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{getAssessmentLabel(type)}</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{avg.toFixed(1)}%</p>
                    </div>
                  ))}
                  {typeAvgs.length === 0 && (
                    <p className="text-xs text-slate-400 col-span-full">No assessments recorded</p>
                  )}
                </div>

                {/* Individual grade entries */}
                <div className="mt-3 space-y-1">
                  {grades.map((g) => (
                    <div key={g.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase w-20">{normalizeAssessment(g.assessmentType)}</span>
                        <span className="text-xs text-slate-500">{g.remarks || ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{g.score}/{g.maxScore}</span>
                        <span className="text-[10px] text-slate-400">{((Number(g.score) / Number(g.maxScore)) * 100).toFixed(1)}%</span>
                        {g.gradeLetter && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getGradeBg(g.gradeLetter)} ${getGradeColor(g.gradeLetter)}`}>
                            {g.gradeLetter}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {reportSubjects.length === 0 && (
          <Card className="border-slate-200 dark:border-slate-700/50">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-500">No grades recorded for this student yet</p>
            </CardContent>
          </Card>
        )}

        {/* Overall Summary */}
        {overallCount > 0 && (
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Cumulative Average</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {(overallTotal / overallCount).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Across {overallCount} subject{overallCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {overallTotal / overallCount >= 70 ? 'Excellent Performance'
                      : overallTotal / overallCount >= 50 ? 'Good Performance'
                        : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <GraduationCap className="w-7 h-7 text-primary-500" />
            Gradebook
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {currentClassName} • {currentSubjectName} • {currentTermName}
          </p>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode + selectedClassId + selectedSubjectId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {loadingClasses || loadingData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          ) : (
            <>
              {viewMode === 'overview' && renderOverview()}
              {viewMode === 'subject' && renderSubjectReport()}
              {viewMode === 'student' && renderStudentReport()}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
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
