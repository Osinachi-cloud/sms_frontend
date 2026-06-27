'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { quizApi, subjectApi, classApi, termApi, academicSessionApi, teacherAssignmentApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { QuizQuestion } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Clock,
  BookOpen,
  GraduationCap,
  Calendar,
  CheckSquare,
  GripVertical,
  Save,
  Layers,
  Sparkles,
  Hash,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import Link from 'next/link';

const QUESTION_TYPES: { type: QuizQuestion['questionType']; label: string; icon: string }[] = [
  { type: 'MCQ', label: 'Multiple Choice', icon: '●' },
  { type: 'CHECKBOX', label: 'Checkbox', icon: '☑' },
  { type: 'TRUE_FALSE', label: 'True / False', icon: '⊘' },
  { type: 'SHORT_ANSWER', label: 'Short Answer', icon: '✎' },
  { type: 'FILL_BLANK', label: 'Fill in Blank', icon: '▭' },
  { type: 'PARAGRAPH', label: 'Paragraph', icon: '¶' },
];

export default function CreateQuizPage() {
  const router = useRouter();
  const { currentSchool, isTeacher } = useAuth();
  const schoolId = currentSchool?.id;

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    quizType: 'QUIZ',
    subjectId: '',
    targetClassIds: [] as string[],
    termId: '',
    sessionId: '',
    durationMinutes: 30,
    totalMarks: 100,
    passMark: 40,
    maxAttempts: 1,
    startTime: '',
    endTime: '',
    shuffleQuestions: false,
    showResultsImmediately: true,
    showCorrectAnswers: false,
    isEnabled: true,
    resultVisibilityType: 'NEVER' as 'IMMEDIATELY' | 'AFTER_ALL_SUBMITTED' | 'AFTER_DEADLINE' | 'MANUAL' | 'NEVER',
    resultsReleased: false,
    scoreAggregationStrategy: 'HIGHEST' as 'HIGHEST' | 'LOWEST' | 'AVERAGE',
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (!schoolId) return;

    const loadLookupData = async () => {
      try {
        const [termRes, sessRes, currentTermRes, currentSessionRes] = await Promise.all([
          termApi.getAll(schoolId, { size: 100 }),
          academicSessionApi.getAll(schoolId, { size: 100 }),
          termApi.getCurrent(schoolId).catch(() => ({ data: null })),
          academicSessionApi.getCurrent(schoolId).catch(() => ({ data: null })),
        ]);

        const trm = (termRes.data as any)?.content || [];
        const sess = (sessRes.data as any)?.content || [];
        setTerms(trm);
        setSessions(sess);
        const defaultTermId = currentTermRes?.data?.id || trm[0]?.id || '';
        const defaultSessionId = currentSessionRes?.data?.id || sess[0]?.id || '';
        setForm((prev) => ({ ...prev, termId: defaultTermId, sessionId: defaultSessionId }));

        if (isTeacher()) {
          const assignmentsRes = await teacherAssignmentApi.getMyAssignments(schoolId);
          const assignments = (assignmentsRes.data as any[]) || [];
          const uniqueSubjects = Array.from(
            new Map(assignments.filter((a) => a.subjectId).map((a) => [a.subjectId, { id: a.subjectId, name: a.subjectName }])).values()
          );
          const uniqueClasses = Array.from(
            new Map(assignments.filter((a) => a.classId).map((a) => [a.classId, { id: a.classId, name: a.className }])).values()
          );
          setSubjects(uniqueSubjects);
          setClasses(uniqueClasses);
        } else {
          const [subRes, clsRes] = await Promise.all([
            subjectApi.getAll(schoolId, { size: 100 }),
            classApi.getAll(schoolId, { size: 100 }),
          ]);
          setSubjects((subRes.data as any)?.content || []);
          setClasses((clsRes.data as any)?.content || []);
        }
      } catch {
        toast.error('Failed to load lookup data');
      }
    };

    loadLookupData();
  }, [schoolId]);

  const addQuestion = (type: QuizQuestion['questionType']) => {
    const q: QuizQuestion = {
      id: crypto.randomUUID(),
      questionText: '',
      questionType: type,
      options: type === 'TRUE_FALSE' ? [{ label: 'True', value: 'True' }, { label: 'False', value: 'False' }] : [{ label: 'Option 1', value: 'Option 1' }],
      marks: 1,
      orderIndex: questions.length,
      correctAnswer: '',
      correctAnswers: [],
      required: false,
    };
    setQuestions([...questions, q]);
  };

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, orderIndex: i })));
  };

  const addOption = (qIdx: number) => {
    const q = questions[qIdx];
    const opts = [...(q.options || [])];
    opts.push({ label: `Option ${opts.length + 1}`, value: `Option ${opts.length + 1}` });
    updateQuestion(qIdx, { options: opts });
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    const q = questions[qIdx];
    const opts = [...(q.options || [])];
    opts[oIdx] = { label: val, value: val };
    updateQuestion(qIdx, { options: opts });
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const q = questions[qIdx];
    const opts = [...(q.options || [])];
    opts.splice(oIdx, 1);
    updateQuestion(qIdx, { options: opts });
  };

  const handleToggleClass = (classId: string) => {
    setForm((prev) => {
      const current = prev.targetClassIds;
      if (current.includes(classId)) {
        return { ...prev, targetClassIds: current.filter((id) => id !== classId) };
      }
      return { ...prev, targetClassIds: [...current, classId] };
    });
  };

  const handleSave = async () => {
    if (!schoolId) return;
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (questions.length === 0) { toast.error('Add at least one question'); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        targetClassIds: form.targetClassIds.length > 0 ? form.targetClassIds : undefined,
        termId: form.termId || undefined,
        sessionId: form.sessionId || undefined,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        questions: questions.map((q) => ({
          ...q,
          options: q.options?.map((o: any) => (typeof o === 'string' ? { label: o, value: o } : o)),
        })),
      };
      await quizApi.create(schoolId, payload);
      toast.success('Quiz created successfully');
      router.push('/quizzes');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const totalQuestionMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/quizzes" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to quizzes
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Assessment</h1>
          </div>
        </div>
        <Button onClick={handleSave} isLoading={loading} className="shadow-lg shadow-primary-500/20">
          <Save className="w-4 h-4 mr-2" /> Save Assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Layers className="w-4 h-4 text-primary-500" /> Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Title" placeholder="e.g., Mathematics Mid-term" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                  rows={3}
                  placeholder="Brief description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['QUIZ', 'ASSIGNMENT', 'ASSESSMENT', 'EXAM'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, quizType: t })}
                      title={t}
                      className={`flex-1 min-w-[60px] px-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        form.quizType === t
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <BookOpen className="w-4 h-4 text-emerald-500" /> Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
                <select
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Classes</label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {classes.map((c) => {
                    const selected = form.targetClassIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleClass(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selected
                            ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Term</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.termId}
                    onChange={(e) => setForm({ ...form, termId: e.target.value })}
                  >
                    <option value="">Term...</option>
                    {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Session</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.sessionId}
                    onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                  >
                    <option value="">Session...</option>
                    {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Clock className="w-4 h-4 text-amber-500" /> Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Max Attempts</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.maxAttempts}
                    onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Total Marks</label>
                  <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300">
                    Auto-set from subject grading scheme
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Pass Mark</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.passMark}
                    onChange={(e) => setForm({ ...form, passMark: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Start</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">End</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>

                <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Score aggregation for multiple attempts</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.scoreAggregationStrategy}
                    onChange={(e) => setForm({ ...form, scoreAggregationStrategy: e.target.value as any })}
                  >
                    <option value="HIGHEST">Highest score (best attempt)</option>
                    <option value="LOWEST">Lowest score</option>
                    <option value="AVERAGE">Average of all attempts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">When can students see their results?</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    value={form.resultVisibilityType}
                    onChange={(e) => setForm({ ...form, resultVisibilityType: e.target.value as any })}
                  >
                    <option value="NEVER">Never show results</option>
                    <option value="IMMEDIATELY">Show immediately</option>
                    <option value="AFTER_ALL_SUBMITTED">After all submit</option>
                    <option value="AFTER_DEADLINE">After deadline</option>
                    <option value="MANUAL">When I release</option>
                  </select>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { key: 'shuffleQuestions', label: 'Shuffle questions' },
                    { key: 'showCorrectAnswers', label: 'Show correct answers' },
                    { key: 'isEnabled', label: 'Visible to students' },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-center gap-3 text-sm cursor-pointer group">
                      <div className={`relative w-9 h-5 rounded-full transition-colors ${(form as any)[opt.key] ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={(form as any)[opt.key]}
                          onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked })}
                        />
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${(form as any)[opt.key] ? 'translate-x-4' : ''}`} />
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Questions */}
        <div className="lg:col-span-2 space-y-5">
          <div className="sticky top-0 z-30 pt-2">
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Hash className="w-4 h-4 text-violet-500" />
                    Questions
                    <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {questions.length}
                    </Badge>
                  </CardTitle>
                  <div className="text-xs font-medium text-slate-500">
                    Total marks: <span className="text-slate-800 dark:text-slate-200 font-bold">{totalQuestionMarks}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-1">
                  {QUESTION_TYPES.map((t) => (
                    <Button key={t.type} variant="outline" size="sm" onClick={() => addQuestion(t.type)} className="text-xs font-semibold">
                      <span className="mr-1.5 text-slate-400">{t.icon}</span> {t.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <AnimatePresence>
            {questions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-14 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">No questions yet</p>
                <p className="text-xs text-slate-400">Click a question type above to get started</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <AnimatePresence>
              {questions.map((q, qIdx) => (
                <motion.div
                  key={q.id || qIdx}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5 space-y-4">
                    {/* Question Header */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-slate-500">{qIdx + 1}</span>
                      </div>
                      <Badge variant="info" className="text-[10px] border-0 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400">
                        {q.questionType.replace('_', ' ')}
                      </Badge>
                      <div className="ml-auto flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <span className="hidden sm:inline text-[10px] font-semibold text-slate-400">Required</span>
                          <div className={`relative w-8 h-4 rounded-full transition-colors ${q.required ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={q.required}
                              onChange={(e) => updateQuestion(qIdx, { required: e.target.checked })}
                            />
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${q.required ? 'translate-x-4' : ''}`} />
                          </div>
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-semibold text-slate-400">Marks</span>
                          <input
                            type="number"
                            className="w-14 text-xs py-1 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center
                              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                            value={q.marks}
                            onChange={(e) => updateQuestion(qIdx, { marks: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <button
                          onClick={() => removeQuestion(qIdx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <input
                      className="w-full text-sm font-medium bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2
                        focus:outline-none focus:border-primary-400 transition-colors placeholder:text-slate-400"
                      placeholder="Enter your question..."
                      value={q.questionText}
                      onChange={(e) => updateQuestion(qIdx, { questionText: e.target.value })}
                    />

                    {/* Options for MCQ/CHECKBOX/TRUE_FALSE */}
                    {(q.questionType === 'MCQ' || q.questionType === 'CHECKBOX' || q.questionType === 'TRUE_FALSE') && (
                      <div className="space-y-2 pl-1">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Answer Key</span>
                          <span className="text-[10px] text-slate-400">— tick the correct option(s)</span>
                        </div>
                        {q.options?.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-3 group">
                            <input
                              type={q.questionType === 'CHECKBOX' ? 'checkbox' : 'radio'}
                              name={`correct-${qIdx}`}
                              checked={q.questionType === 'CHECKBOX'
                                ? (q.correctAnswers || []).includes(typeof opt === 'string' ? opt : opt.value)
                                : q.correctAnswer === (typeof opt === 'string' ? opt : opt.value)
                              }
                              onChange={() => {
                                const val = typeof opt === 'string' ? opt : opt.value;
                                if (q.questionType === 'CHECKBOX') {
                                  const current = [...(q.correctAnswers || [])];
                                  if (current.includes(val)) {
                                    updateQuestion(qIdx, { correctAnswers: current.filter((v) => v !== val) });
                                  } else {
                                    updateQuestion(qIdx, { correctAnswers: [...current, val] });
                                  }
                                } else {
                                  updateQuestion(qIdx, { correctAnswer: val });
                                }
                              }}
                              className="w-4 h-4 text-primary-600 accent-primary-600"
                            />
                            <input
                              className="flex-1 text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl
                                focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                              value={typeof opt === 'string' ? opt : opt.label}
                              onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`}
                            />
                            {q.options && q.options.length > 1 && (
                              <button
                                onClick={() => removeOption(qIdx, oIdx)}
                                className="p-1.5 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(qIdx)}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 px-1 py-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add option
                        </button>
                      </div>
                    )}

                    {/* Short answer / Fill blank */}
                    {(q.questionType === 'SHORT_ANSWER' || q.questionType === 'FILL_BLANK') && (
                      <div className="pl-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Answer Key</label>
                        </div>
                        <input
                          className="w-full text-sm px-3 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl
                            focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                          placeholder="Type the expected correct answer here..."
                          value={q.correctAnswer || ''}
                          onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Paragraph */}
                    {q.questionType === 'PARAGRAPH' && (
                      <div className="pl-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20">
                        <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          Paragraph questions require manual grading. Students will submit free-text answers.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
