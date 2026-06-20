'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { quizApi, subjectApi, classApi, termApi, academicSessionApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { QuizQuestion } from '@/types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, Clock, BookOpen, GraduationCap, Calendar, CheckSquare, GripVertical, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateQuizPage() {
  const router = useRouter();
  const { currentSchool } = useAuth();
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
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      subjectApi.getAll(schoolId, { size: 100 }),
      classApi.getAll(schoolId, { size: 100 }),
      termApi.getAll(schoolId, { size: 100 }),
      academicSessionApi.getAll(schoolId, { size: 100 }),
    ]).then(([subRes, clsRes, termRes, sessRes]) => {
      setSubjects((subRes.data as any)?.content || []);
      setClasses((clsRes.data as any)?.content || []);
      setTerms((termRes.data as any)?.content || []);
      setSessions((sessRes.data as any)?.content || []);
    }).catch(() => toast.error('Failed to load lookup data'));
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/quizzes" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3 h-3" /> Back to Quizzes
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Create Quiz / Exam / Test</h1>
        </div>
        <Button onClick={handleSave} isLoading={loading}>
          <Save className="w-4 h-4 mr-2" /> Save Quiz
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input label="Title" placeholder="e.g., Mathematics Mid-term" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea className="glass-input w-full" rows={3} placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                <select className="glass-input w-full" value={form.quizType} onChange={(e) => setForm({ ...form, quizType: e.target.value })}>
                  <option value="QUIZ">Quiz</option>
                  <option value="TEST">Test</option>
                  <option value="EXAM">Exam</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Organization</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
                <select className="glass-input w-full" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                  <option value="">Select subject...</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Classes</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleToggleClass(c.id)}
                      className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                        form.targetClassIds.includes(c.id)
                          ? 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Term</label>
                <select className="glass-input w-full" value={form.termId} onChange={(e) => setForm({ ...form, termId: e.target.value })}>
                  <option value="">Select term...</option>
                  {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Session</label>
                <select className="glass-input w-full" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })}>
                  <option value="">Select session...</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Duration (min)</label>
                  <input type="number" className="glass-input w-full" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Max Attempts</label>
                  <input type="number" className="glass-input w-full" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Total Marks</label>
                  <input type="number" className="glass-input w-full" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Pass Mark</label>
                  <input type="number" className="glass-input w-full" value={form.passMark} onChange={(e) => setForm({ ...form, passMark: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Start Time</label>
                <input type="datetime-local" className="glass-input w-full" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">End Time (expiry)</label>
                <input type="datetime-local" className="glass-input w-full" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm({ ...form, shuffleQuestions: e.target.checked })} />
                Shuffle questions
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.showResultsImmediately} onChange={(e) => setForm({ ...form, showResultsImmediately: e.target.checked })} />
                Show results immediately
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.showCorrectAnswers} onChange={(e) => setForm({ ...form, showCorrectAnswers: e.target.checked })} />
                Show correct answers after submission
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })} />
                Enabled (students can see it)
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Right: Questions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Questions ({questions.length})</CardTitle>
              <div className="flex gap-2 flex-wrap">
                {(['MCQ', 'CHECKBOX', 'SHORT_ANSWER', 'PARAGRAPH', 'TRUE_FALSE', 'FILL_BLANK'] as const).map((t) => (
                  <Button key={t} variant="secondary" size="sm" onClick={() => addQuestion(t)}>
                    <Plus className="w-3 h-3 mr-1" /> {t.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Add questions using the buttons above</p>
                </div>
              )}
              {questions.map((q, qIdx) => (
                <motion.div
                  key={q.id || qIdx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-slate-300 mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="info" className="text-[10px]">Q{qIdx + 1}</Badge>
                        <Badge variant="default" className="text-[10px]">{q.questionType.replace('_', ' ')}</Badge>
                        <input
                          type="number"
                          className="w-16 text-xs glass-input py-1"
                          value={q.marks}
                          onChange={(e) => updateQuestion(qIdx, { marks: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-xs text-slate-400">marks</span>
                        <button onClick={() => removeQuestion(qIdx)} className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        className="glass-input w-full text-sm"
                        placeholder="Enter question text..."
                        value={q.questionText}
                        onChange={(e) => updateQuestion(qIdx, { questionText: e.target.value })}
                      />
                      {/* Options for MCQ/CHECKBOX/TRUE_FALSE */}
                      {(q.questionType === 'MCQ' || q.questionType === 'CHECKBOX' || q.questionType === 'TRUE_FALSE') && (
                        <div className="space-y-2 pl-2">
                          {q.options?.map((opt: any, oIdx: number) => (
                            <div key={oIdx} className="flex items-center gap-2">
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
                                className="w-4 h-4"
                              />
                              <input
                                className="glass-input flex-1 text-sm"
                                value={typeof opt === 'string' ? opt : opt.label}
                                onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                              />
                              {q.options && q.options.length > 1 && (
                                <button onClick={() => removeOption(qIdx, oIdx)} className="text-red-400 hover:text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button onClick={() => addOption(qIdx)} className="text-xs text-primary-600 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add option
                          </button>
                        </div>
                      )}
                      {/* Short answer / Fill blank */}
                      {(q.questionType === 'SHORT_ANSWER' || q.questionType === 'FILL_BLANK') && (
                        <div className="pl-2">
                          <label className="text-xs text-slate-500">Correct answer</label>
                          <input
                            className="glass-input w-full text-sm mt-1"
                            placeholder="Expected answer"
                            value={q.correctAnswer || ''}
                            onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                          />
                        </div>
                      )}
                      {/* Paragraph */}
                      {q.questionType === 'PARAGRAPH' && (
                        <div className="pl-2">
                          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                            Paragraph questions require manual grading. Students will submit free-text answers.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
