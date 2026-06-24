'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { assessmentApi, studentApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Users, Search, Trophy, Hash,
  BookOpen, GraduationCap,
} from 'lucide-react';

interface ScoreEntry {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  score: string;
  remarks: string;
}

interface Assessment {
  id: string;
  title: string;
  subjectName?: string;
  className?: string;
  assessmentType: string;
  maxScore: number;
}

export default function AssessmentScoresPage() {
  const params = useParams();
  const { currentSchool } = useAuth();
  const assessmentId = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentSchool || !assessmentId) return;
    loadData();
  }, [currentSchool, assessmentId]);

  async function loadData() {
    try {
      setLoading(true);
      const [aRes, scoresRes] = await Promise.all([
        assessmentApi.getOne(currentSchool!.id, assessmentId),
        assessmentApi.getScores(currentSchool!.id, assessmentId),
      ]);
      const a = aRes.data as Assessment;
      setAssessment(a);

      const classId = (aRes.data as any).classId;
      const stuRes = await studentApi.getAll(currentSchool!.id, { classId, size: 200 });
      const students = (stuRes.data as any)?.content || [];

      const existingScores: Record<string, any> = {};
      (scoresRes.data || []).forEach((s: any) => {
        existingScores[s.studentId] = s;
      });

      const mapped: ScoreEntry[] = students.map((s: any) => ({
        studentId: s.id,
        studentName: s.fullName,
        admissionNumber: s.admissionNumber,
        score: existingScores[s.id]?.score != null ? String(existingScores[s.id].score) : '',
        remarks: existingScores[s.id]?.remarks || '',
      }));
      setEntries(mapped);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const payload = {
      scores: entries
        .filter((e) => e.score.trim() !== '')
        .map((e) => ({
          studentId: e.studentId,
          score: Number(e.score),
          remarks: e.remarks,
        })),
    };
    try {
      setSaving(true);
      await assessmentApi.saveScores(currentSchool!.id, assessmentId, payload);
      toast.success('Scores saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const filtered = entries.filter((e) =>
    e.studentName.toLowerCase().includes(search.toLowerCase()) ||
    (e.admissionNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  const scoredCount = entries.filter((e) => e.score.trim() !== '').length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Assessment not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/teacher/assessments" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to assessments
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{assessment.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {assessment.assessmentType} • {assessment.subjectName} • {assessment.className} • Max: {assessment.maxScore}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Trophy className="w-3 h-3 mr-1" /> {scoredCount}/{entries.length} scored
          </Badge>
          <Button size="sm" onClick={handleSave} isLoading={saving}>
            <Save className="w-4 h-4 mr-1.5" /> Save Scores
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          />
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
        <CardContent className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="py-3 px-2 font-semibold text-slate-500 w-10">#</th>
                <th className="py-3 px-2 font-semibold text-slate-500">Student</th>
                <th className="py-3 px-2 font-semibold text-slate-500 text-center w-28">Score / {assessment.maxScore}</th>
                <th className="py-3 px-2 font-semibold text-slate-500 text-center w-20">%</th>
                <th className="py-3 px-2 font-semibold text-slate-500">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => {
                const scoreNum = Number(entry.score);
                const pct = !isNaN(scoreNum) && assessment.maxScore > 0
                  ? ((scoreNum / assessment.maxScore) * 100).toFixed(1)
                  : null;
                return (
                  <motion.tr
                    key={entry.studentId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-2 text-xs text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{entry.studentName}</p>
                        <p className="text-[11px] text-slate-400">{entry.admissionNumber}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={assessment.maxScore}
                        className="w-20 text-sm px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                        value={entry.score}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEntries((prev) => prev.map((p) =>
                            p.studentId === entry.studentId ? { ...p, score: val } : p
                          ));
                        }}
                      />
                    </td>
                    <td className="py-3 px-2 text-center">
                      {pct !== null ? (
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                          Number(pct) >= 70 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : Number(pct) >= 50 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {pct}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        className="w-full text-sm px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                        placeholder="Remark..."
                        value={entry.remarks}
                        onChange={(e) => {
                          setEntries((prev) => prev.map((p) =>
                            p.studentId === entry.studentId ? { ...p, remarks: e.target.value } : p
                          ));
                        }}
                      />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">No students found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
