'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { assessmentApi, classApi, subjectApi, termApi, academicSessionApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Award, Save, CheckCircle, AlertCircle,
  BookOpen, GraduationCap, Hash,
} from 'lucide-react';

interface GradingItem {
  sourceType: string;
  sourceId: string;
  sourceTitle: string;
  assessmentType?: string;
  weight: number;
  active: boolean;
}

export default function GradingSchemePage() {
  const { currentSchool } = useAuth();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId] = useState('');

  const [available, setAvailable] = useState<GradingItem[]>([]);
  const [scheme, setScheme] = useState<GradingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentSchool) return;
    Promise.all([
      classApi.getAll(currentSchool.id, { size: 100 }),
      subjectApi.getAll(currentSchool.id, { size: 100 }),
      termApi.getAll(currentSchool.id, { size: 100 }),
      termApi.getCurrent(currentSchool.id).catch(() => ({ data: null })),
    ]).then(([c, s, t, currentTermRes]) => {
      const trm = ((t.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
      setClasses(((c.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name })));
      setSubjects(((s.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name })));
      setTerms(trm);
      const defaultTermId = currentTermRes?.data?.id || trm[0]?.id || '';
      setTermId(defaultTermId);
      setLoading(false);
    });
  }, [currentSchool]);

  useEffect(() => {
    if (!currentSchool || !classId || !subjectId || !termId) return;
    loadData();
  }, [currentSchool, classId, subjectId, termId]);

  async function loadData() {
    try {
      setLoading(true);
      const [availRes, schemeRes] = await Promise.all([
        assessmentApi.getAvailable(currentSchool!.id, { classId, subjectId, termId }),
        assessmentApi.getGradingScheme(currentSchool!.id, { classId, subjectId, termId }),
      ]);

      const existingScheme: GradingItem[] = (schemeRes.data || []).map((e: any) => ({
        sourceType: e.sourceType,
        sourceId: e.sourceId,
        sourceTitle: e.sourceTitle || 'Untitled',
        weight: e.weight || 0,
        active: e.active ?? true,
      }));

      const existingIds = new Set(existingScheme.map((s) => `${s.sourceType}:${s.sourceId}`));

      const availableItems: GradingItem[] = (availRes.data || []).map((a: any) => ({
        sourceType: 'ASSESSMENT',
        sourceId: a.id,
        sourceTitle: a.title,
        assessmentType: a.assessmentType,
        weight: 0,
        active: false,
      })).filter((a: GradingItem) => !existingIds.has(`${a.sourceType}:${a.sourceId}`));

      setScheme(existingScheme);
      setAvailable(availableItems);
    } catch {
      toast.error('Failed to load grading data');
    } finally {
      setLoading(false);
    }
  }

  const totalWeight = useMemo(() =>
    scheme.filter((s) => s.active).reduce((sum, s) => sum + (Number(s.weight) || 0), 0),
    [scheme]
  );

  function toggleActive(item: GradingItem, fromAvailable = false) {
    if (fromAvailable) {
      setAvailable((prev) => prev.filter((p) => !(p.sourceType === item.sourceType && p.sourceId === item.sourceId)));
      setScheme((prev) => [...prev, { ...item, weight: 0, active: true }]);
    } else {
      setScheme((prev) => prev.map((p) =>
        p.sourceId === item.sourceId && p.sourceType === item.sourceType
          ? { ...p, active: !p.active }
          : p
      ));
    }
  }

  function removeFromScheme(item: GradingItem) {
    setScheme((prev) => prev.filter((p) => !(p.sourceId === item.sourceId && p.sourceType === item.sourceType)));
    setAvailable((prev) => [...prev, { ...item, active: false }]);
  }

  function updateWeight(item: GradingItem, weight: number) {
    setScheme((prev) => prev.map((p) =>
      p.sourceId === item.sourceId && p.sourceType === item.sourceType
        ? { ...p, weight }
        : p
    ));
  }

  async function handleSave() {
    if (totalWeight !== 100) {
      toast.error(`Total weight must be exactly 100%. Current: ${totalWeight}%`);
      return;
    }
    try {
      setSaving(true);
      await assessmentApi.saveGradingScheme(currentSchool!.id, {
        classId,
        subjectId,
        termId,
        entries: scheme.map((s) => ({
          sourceType: s.sourceType,
          sourceId: s.sourceId,
          weight: s.weight,
          active: s.active,
        })),
      });
      toast.success('Grading scheme saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/teacher/assessments" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to assessments
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Award className="w-7 h-7 text-primary-500" />
            Grading Scheme
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose assessments for grading. Active weights must sum to exactly 100%.
          </p>
        </div>
        <Button onClick={handleSave} isLoading={saving}>
          <Save className="w-4 h-4 mr-1.5" /> Save Scheme
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Select Subject</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
        >
          <option value="">Select Term</option>
          {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Weight Summary */}
      {classId && subjectId && termId && (
        <Card className={`border shadow-sm ${totalWeight === 100 ? 'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-amber-200 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/10'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {totalWeight === 100 ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Total Weight: {totalWeight}%
                </p>
                <p className="text-xs text-slate-500">
                  {totalWeight === 100
                    ? 'Perfect! The aggregate adds up to 100%.'
                    : totalWeight < 100
                      ? `You need ${100 - totalWeight}% more to reach 100.`
                      : `You are ${totalWeight - 100}% over. Reduce some weights.`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Active Assessments</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {scheme.filter((s) => s.active).length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && classId && subjectId && termId ? (
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
      ) : !classId || !subjectId || !termId ? (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-500">Select class, subject and term to manage the grading scheme</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Active Scheme */}
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Selected for Grading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scheme.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No assessments selected yet. Add from the right panel.</p>
              ) : (
                scheme.map((item, idx) => (
                  <motion.div
                    key={`${item.sourceType}:${item.sourceId}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      item.active
                        ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/30'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <button
                      onClick={() => toggleActive(item)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        item.active
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {item.active && <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.sourceTitle}</p>
                      <p className="text-[10px] text-slate-400">{item.assessmentType || item.sourceType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 text-sm px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                        value={item.weight}
                        onChange={(e) => updateWeight(item, Number(e.target.value))}
                        disabled={!item.active}
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                    <button
                      onClick={() => removeFromScheme(item)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Available Assessments */}
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Available Assessments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {available.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No more assessments available for this class/subject/term.</p>
              ) : (
                available.map((item, idx) => (
                  <motion.div
                    key={`${item.sourceType}:${item.sourceId}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.sourceTitle}</p>
                      <p className="text-[10px] text-slate-400">{item.assessmentType || item.sourceType}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(item, true)} className="border-slate-200 dark:border-slate-700 text-xs">
                      Add
                    </Button>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
