'use client';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { affectiveRatingApi, classApi, termApi, studentApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Hash,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  GraduationCap,
  Award,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

/* ---------- Types ---------- */

interface TraitDef {
  key: string;
  label: string;
}

interface StudentRecord {
  studentId: string;
  fullName: string;
  admissionNumber: string;
  ratings: Record<string, number | undefined>;
  remarks: string;
}

const TRAITS: TraitDef[] = [
  { key: 'Punctuality', label: 'Punctuality' },
  { key: 'Neatness', label: 'Neatness' },
  { key: 'Politeness', label: 'Politeness' },
  { key: 'Attentiveness', label: 'Attentiveness' },
  { key: 'Obedience', label: 'Obedience' },
  { key: 'Hardwork', label: 'Hardwork' },
  { key: 'Self Control', label: 'Self Control' },
  { key: 'Honesty', label: 'Honesty' },
  { key: 'Leadership', label: 'Leadership' },
  { key: 'Sportsmanship', label: 'Sportsmanship' },
];

/* ---------- Page ---------- */

export default function WeeklyEvaluationPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || '';

  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  /* Load meta (classes + terms) */
  useEffect(() => {
    if (!schoolId) return;
    async function loadMeta() {
      try {
        const [cRes, tRes, currentTermRes] = await Promise.all([
          classApi.getAll(schoolId, { size: 100 }),
          termApi.getAll(schoolId, { size: 100 }),
          termApi.getCurrent(schoolId).catch(() => ({ data: null })),
        ]);
        const cls = ((cRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const trm = ((tRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        setClasses(cls);
        setTerms(trm);
        setSelectedTermId(currentTermRes?.data?.id || trm[0]?.id || '');
      } catch {
        toast.error('Failed to load classes/terms');
      }
    }
    loadMeta();
  }, [schoolId]);

  /* Load students + existing ratings when filters change */
  useEffect(() => {
    if (!schoolId || !selectedClassId || !selectedTermId) {
      setStudents([]);
      return;
    }
    loadStudentsAndRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, selectedClassId, selectedTermId, weekNumber]);

  const loadStudentsAndRatings = async () => {
    setLoading(true);
    try {
      const sRes = await studentApi.getAll(schoolId, { classId: selectedClassId, size: 200 });
      const items = (sRes.data as any)?.content || [];

      const rRes = await affectiveRatingApi.getForTerm(schoolId, selectedTermId, weekNumber);
      const existingRatings: any[] = rRes.data || [];

      const records: StudentRecord[] = items.map((s: any) => {
        const studentRatings: Record<string, number | undefined> = {};
        TRAITS.forEach((t) => {
          const found = existingRatings.find(
            (r) => r.studentId === s.id && r.trait === t.key
          );
          studentRatings[t.key] = found?.rating ?? undefined;
        });
        return {
          studentId: s.id,
          fullName: s.fullName,
          admissionNumber: s.admissionNumber || '',
          ratings: studentRatings,
          remarks: '',
        };
      });

      setStudents(records);
    } catch {
      toast.error('Failed to load students or ratings');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const updateRating = (studentId: string, traitKey: string, value: number | undefined) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? { ...s, ratings: { ...s.ratings, [traitKey]: value } }
          : s
      )
    );
  };

  const handleSave = async () => {
    if (!schoolId || !selectedTermId) return;
    if (students.length === 0) return;

    setSaving(true);
    let savedCount = 0;
    let errorCount = 0;

    await Promise.all(
      students.map(async (s) => {
        const ratings = TRAITS.map((t) => ({
          trait: t.key,
          rating: s.ratings[t.key] ?? null,
          remarks: null,
        })).filter((r) => r.rating !== null);

        if (ratings.length === 0) return;

        try {
          await affectiveRatingApi.saveForStudent(
            schoolId,
            s.studentId,
            selectedTermId,
            weekNumber,
            ratings
          );
          savedCount++;
        } catch {
          errorCount++;
        }
      })
    );

    setSaving(false);
    if (errorCount === 0) {
      toast.success(`Ratings saved for ${savedCount} student(s)`);
    } else {
      toast.success(`Saved for ${savedCount} student(s). ${errorCount} failed.`);
    }
    loadStudentsAndRatings();
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  /* Compute class average per trait for display */
  const classAverages: Record<string, number | null> = {};
  TRAITS.forEach((t) => {
    const values = filteredStudents
      .map((s) => s.ratings[t.key])
      .filter((v): v is number => v !== undefined);
    classAverages[t.key] = values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : null;
  });

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="weekly-evaluation">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text flex items-center gap-2">
            <Hash className="w-6 h-6 text-primary-500" />
            Weekly Evaluation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Score students weekly on behavioral traits (0 to 100). Report cards auto-average across weeks.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            <GraduationCap className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Class
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Term
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
          >
            <option value="">Select term</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            <Award className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Week
          </label>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setWeekNumber((w) => Math.max(1, w - 1))}
              className="px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center text-sm font-medium">Week {weekNumber}</span>
            <button
              onClick={() => setWeekNumber((w) => w + 1)}
              className="px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            <Users className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">All traits scored out of 100:</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> 0-49 (Poor)</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> 50-59 (Fair)</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 60-69 (Good)</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> 70-79 (Very Good)</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 80-100 (Excellent)</span>
      </div>

      {/* Students Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">
              {students.length === 0 ? 'Select a class to see students' : 'No students match your search'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800/80 z-10 min-w-[180px]">
                    Student
                  </th>
                  {TRAITS.map((t) => (
                    <th
                      key={t.key}
                      className="text-center py-3 px-2 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider min-w-[100px]"
                    >
                      {t.label}
                    </th>
                  ))}
                  <th className="text-center py-3 px-3 font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider min-w-[80px]">
                    Avg
                  </th>
                </tr>
                {/* Class average row */}
                <tr className="bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                  <td className="py-2 px-4 text-xs font-semibold text-slate-500 sticky left-0 bg-slate-100/60 dark:bg-slate-800/40 z-10">
                    Class Avg
                  </td>
                  {TRAITS.map((t) => (
                    <td key={t.key} className="py-2 px-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${scoreColor(classAverages[t.key])}`}>
                        {classAverages[t.key] ?? '-'}
                      </span>
                    </td>
                  ))}
                  <td className="py-2 px-3 text-center">
                    <span className="text-xs font-bold text-primary-600">
                      {computeOverallAvg(filteredStudents) ?? '-'}
                    </span>
                  </td>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => (
                  <motion.tr
                    key={s.studentId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{s.fullName}</p>
                        <p className="text-[10px] text-slate-400">{s.admissionNumber}</p>
                      </div>
                    </td>
                    {TRAITS.map((t) => (
                      <td key={t.key} className="py-2 px-2 text-center">
                        <ScoreInput
                          value={s.ratings[t.key]}
                          onChange={(val) => updateRating(s.studentId, t.key, val)}
                        />
                      </td>
                    ))}
                    <td className="py-2 px-3 text-center">
                      <span className="text-sm font-bold text-primary-600">
                        {studentAvg(s.ratings) ?? '-'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Bar */}
      {filteredStudents.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 glass-card rounded-2xl sticky bottom-4">
          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{filteredStudents.length}</span> student(s) &bull; Week {weekNumber}
            <ArrowRight className="w-3 h-3 inline mx-1" />
            <span className="text-xs text-slate-400">Report cards average all weeks automatically</span>
          </div>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save All Scores'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Utility Functions ---------- */

function scoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'bg-slate-100 text-slate-400';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 70) return 'bg-blue-100 text-blue-700';
  if (score >= 60) return 'bg-amber-100 text-amber-700';
  if (score >= 50) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

function studentAvg(ratings: Record<string, number | undefined>): number | null {
  const values = Object.values(ratings).filter((v): v is number => v !== undefined);
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function computeOverallAvg(students: StudentRecord[]): number | null {
  let total = 0;
  let count = 0;
  students.forEach((s) => {
    const avg = studentAvg(s.ratings);
    if (avg !== null) {
      total += avg;
      count++;
    }
  });
  return count > 0 ? Math.round(total / count) : null;
}

/* ---------- Score Input Component ---------- */

function ScoreInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (val: number | undefined) => void;
}) {
  const [local, setLocal] = useState(value !== undefined ? String(value) : '');
  const [error, setError] = useState('');

  useEffect(() => {
    setLocal(value !== undefined ? String(value) : '');
    setError('');
  }, [value]);

  const rawNum = Number(local);
  const isOutOfRange = local !== '' && !Number.isNaN(rawNum) && (rawNum < 0 || rawNum > 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocal(val);
    if (val === '') {
      setError('');
      return;
    }
    const num = Number(val);
    if (Number.isNaN(num)) {
      setError('Enter a number');
    } else if (num < 0) {
      setError('Min is 0');
    } else if (num > 100) {
      setError('Max is 100');
    } else {
      setError('');
    }
  };

  const handleBlur = () => {
    if (local === '') {
      onChange(undefined);
      setError('');
      return;
    }
    const num = Number(local);
    if (Number.isNaN(num)) {
      onChange(undefined);
      setLocal('');
      setError('');
      return;
    }
    const clamped = Math.min(100, Math.max(0, num));
    onChange(clamped);
    setLocal(String(clamped));
    setError('');
  };

  const score = value ?? null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12">
        <input
          type="number"
          min={0}
          max={100}
          value={local}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="-"
          className={`w-full text-center text-sm font-semibold py-1.5 rounded-lg border outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
            error || isOutOfRange
              ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : score === null || score === undefined
              ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
              : score >= 80
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
              : score >= 70
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
              : score >= 60
              ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
              : score >= 50
              ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
              : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        />
      </div>
      {error ? (
        <span className="text-[9px] text-red-500 font-medium">{error}</span>
      ) : (
        /* Mini progress bar */
        score !== null && score !== undefined && (
          <div className="w-14 h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                score >= 80 ? 'bg-emerald-500' :
                score >= 70 ? 'bg-blue-500' :
                score >= 60 ? 'bg-amber-500' :
                score >= 50 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        )
      )}
    </div>
  );
}
