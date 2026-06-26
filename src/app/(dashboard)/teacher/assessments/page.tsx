'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { assessmentApi, classApi, subjectApi, termApi, academicSessionApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Search, Calendar, Hash, GraduationCap,
  Award, ChevronRight, Trash2, Pencil, ClipboardList,
} from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  classId?: string;
  className?: string;
  termId?: string;
  termName?: string;
  assessmentType: string;
  maxScore: number;
  status: string;
  totalStudents?: number;
  scoredCount?: number;
  dateConducted?: string;
}

export default function TeacherAssessmentsPage() {
  const { currentSchool } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    termId: '',
    assessmentType: 'TEST',
    maxScore: 100,
  });

  useEffect(() => {
    if (!currentSchool) return;
    loadAssessments();
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
      setForm((prev) => ({ ...prev, termId: defaultTermId }));
    });
  }, [currentSchool, search]);

  async function loadAssessments() {
    try {
      setLoading(true);
      const res = await assessmentApi.list(currentSchool!.id, {
        search: search || undefined,
        size: 100,
      });
      setAssessments((res.data as any)?.content || []);
    } catch {
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.title.trim() || !form.classId || !form.subjectId) {
      toast.error('Please fill title, class and subject');
      return;
    }
    try {
      setCreating(true);
      await assessmentApi.create(currentSchool!.id, {
        ...form,
        maxScore: Number(form.maxScore),
        status: 'PUBLISHED',
      });
      toast.success('Assessment created');
      setShowCreate(false);
      setForm({ title: '', description: '', subjectId: '', classId: '', termId: '', assessmentType: 'TEST', maxScore: 100 });
      loadAssessments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this assessment? All scores will be lost.')) return;
    try {
      await assessmentApi.delete(currentSchool!.id, id);
      toast.success('Deleted');
      loadAssessments();
    } catch {
      toast.error('Failed to delete');
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <ClipboardList className="w-7 h-7 text-primary-500" />
            Assessments
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create tests, exams and quizzes — then enter scores</p>
        </div>
        <div className="flex gap-2">
          <Link href="/teacher/assessments/grading">
            <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
              <Award className="w-4 h-4 mr-1.5" /> Grading Scheme
            </Button>
          </Link>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New Assessment
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-500">No assessments yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Assessment" to create one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="text-[10px] border-0 mb-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                        {a.assessmentType}
                      </Badge>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{a.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{a.subjectName} • {a.className}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-400">Max Score</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{a.maxScore}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-400">Scored</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{a.scoredCount || 0}/{a.totalStudents || 0}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-400">Term</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{a.termName || '—'}</p>
                    </div>
                  </div>

                  <Link href={`/teacher/assessments/${a.id}/scores`}>
                    <Button size="sm" className="w-full shadow-sm" variant="secondary">
                      Enter Scores <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Assessment">
        <div className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
            <input
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              placeholder="e.g., Mid-term Mathematics Test"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description (optional)</label>
            <textarea
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
              rows={2}
              placeholder="Brief description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Class</label>
              <select
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">Select class...</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
              <select
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              >
                <option value="">Select subject...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Term</label>
              <select
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                value={form.termId}
                onChange={(e) => setForm({ ...form, termId: e.target.value })}
              >
                <option value="">Select term...</option>
                {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
              <select
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                value={form.assessmentType}
                onChange={(e) => setForm({ ...form, assessmentType: e.target.value })}
              >
                <option value="CA">C.A.</option>
                <option value="TEST">Test</option>
                <option value="QUIZ">Quiz</option>
                <option value="EXAM">Exam</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Max Score</label>
            <input
              type="number"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              value={form.maxScore}
              onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" className="flex-1" isLoading={creating} onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
