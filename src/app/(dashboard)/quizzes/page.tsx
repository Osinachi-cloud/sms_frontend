'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { quizApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Quiz, QuizParticipant } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  Play,
  Eye,
  Trophy,
  CheckCircle,
  XCircle,
  BookOpen,
  GraduationCap,
  Calendar,
  Search,
  BarChart3,
  AlertCircle,
  Lock,
  Upload,
  FileDown,
  FileSpreadsheet,
  Trash2,
  Pencil,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  TrendingUp,
  Flame,
  RefreshCw,
} from 'lucide-react';

import * as XLSX from 'xlsx';

const TEMPLATE_HEADERS = [
  'quiz_title',
  'quiz_description',
  'quiz_type',
  'duration_minutes',
  'total_marks',
  'pass_mark',
  'question_text',
  'question_type',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
  'correct_answers',
  'marks',
  'explanation',
];

const TEMPLATE_EXAMPLE = [
  'Mathematics Mid-term',
  'Test your algebra skills',
  'TEST',
  '30',
  '100',
  '40',
  'What is 2 + 2?',
  'MCQ',
  '1',
  '2',
  '3',
  '4',
  '4',
  '',
  '1',
  '',
];

const TEMPLATE_EXAMPLE_2 = [
  'Mathematics Mid-term',
  'Test your algebra skills',
  'TEST',
  '30',
  '100',
  '40',
  'Select prime numbers',
  'CHECKBOX',
  '2',
  '3',
  '4',
  '9',
  '',
  '2,3',
  '2',
  '',
];

const TEMPLATE_EXAMPLE_3 = [
  'Mathematics Mid-term',
  'Test your algebra skills',
  'TEST',
  '30',
  '100',
  '40',
  'Write a short essay on algebra',
  'PARAGRAPH',
  '',
  '',
  '',
  '',
  '',
  '',
  '5',
  'Expect at least 100 words',
];

export default function QuizzesPage() {
  const { currentSchool, user, hasPermission, isTeacher, isStudent, isPlatformAdmin } = useAuth();
  const schoolId = currentSchool?.id;
  const studentId = user?.studentId;

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Standard quiz types always shown, merged with any dynamic types discovered from data
  const discoveredTypes = Array.from(new Set(quizzes.map((q) => q.quizType).filter(Boolean))) as string[];
  const standardTypes = ['QUIZ', 'ASSIGNMENT', 'ASSESSMENT', 'EXAM'];
  const quizTypes = ['ALL', ...Array.from(new Set([...standardTypes, ...discoveredTypes]))];

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Participants modal state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantStatus, setParticipantStatus] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [participantMinScore, setParticipantMinScore] = useState('');
  const [participantMaxScore, setParticipantMaxScore] = useState('');
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());

  const isAdmin = isPlatformAdmin() || currentSchool?.roleName === 'ADMIN' || currentSchool?.roleName === 'SUPER_ADMIN';
  const canManage = isAdmin || isTeacher() || hasPermission('cms.content.create');

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    loadQuizzes();
  }, [schoolId]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const params: any = { size: 100 };
      if (isStudent() && studentId) {
        params.studentId = studentId;
      }
      const res = await quizApi.getAll(schoolId!, params);
      const items = (res.data?.content || res.data || []) as Quiz[];
      setQuizzes(items);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (quiz: Quiz) => {
    if (!quiz.endTime) return false;
    return new Date() > new Date(quiz.endTime);
  };

  const isNotStarted = (quiz: Quiz) => {
    if (!quiz.startTime) return false;
    return new Date() < new Date(quiz.startTime);
  };

  const filtered = quizzes
    .filter((q) => {
      if (filterType !== 'ALL' && q.quizType !== filterType) return false;
      const qText = `${q.title} ${q.subjectName} ${q.className} ${q.description}`.toLowerCase();
      return qText.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const grouped = filtered.reduce((acc, q) => {
    const key = q.subjectName || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {} as Record<string, Quiz[]>);

  // ---- Delete handlers ----
  const confirmDelete = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteConfirm(true);
  };

  const handleDeleteQuiz = async () => {
    if (!schoolId || !quizToDelete) return;
    setDeleting(true);
    try {
      await quizApi.delete(schoolId, quizToDelete.id);
      toast.success('Quiz deleted successfully');
      setShowDeleteConfirm(false);
      setQuizToDelete(null);
      loadQuizzes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete quiz');
    } finally {
      setDeleting(false);
    }
  };

  // ---- Participants handlers ----
  const openParticipants = async (quizId: string, title: string) => {
    if (!schoolId) return;
    setSelectedQuizId(quizId);
    setSelectedQuizTitle(title);
    setShowParticipants(true);
    setParticipantsLoading(true);
    setParticipantSearch('');
    setParticipantStatus('ALL');
    setParticipantMinScore('');
    setParticipantMaxScore('');
    setExpandedParticipants(new Set());
    try {
      const res = await quizApi.getParticipants(schoolId, quizId);
      setParticipants(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load participants');
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const closeParticipants = () => {
    setShowParticipants(false);
    setSelectedQuizId(null);
    setSelectedQuizTitle('');
    setParticipants([]);
  };

  const toggleExpandParticipant = (studentId: string) => {
    setExpandedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const filteredParticipants = participants.filter((p) => {
    const text = `${p.studentName} ${p.admissionNumber || ''} ${p.className || ''}`.toLowerCase();
    if (!text.includes(participantSearch.toLowerCase())) return false;
    if (participantStatus === 'PASSED' && !p.passed) return false;
    if (participantStatus === 'FAILED' && p.passed) return false;
    if (participantMinScore) {
      const min = parseFloat(participantMinScore);
      if (!isNaN(min) && (p.bestScore === undefined || p.bestScore < min)) return false;
    }
    if (participantMaxScore) {
      const max = parseFloat(participantMaxScore);
      if (!isNaN(max) && (p.bestScore === undefined || p.bestScore > max)) return false;
    }
    return true;
  });

  // ---- Import handlers ----

  const downloadCsvTemplate = () => {
    const rows = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE, TEMPLATE_EXAMPLE_2, TEMPLATE_EXAMPLE_3];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV template downloaded');
  };

  const downloadExcelTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE, TEMPLATE_EXAMPLE_2, TEMPLATE_EXAMPLE_3]);
    const instData = [
      ['Column', 'Description'],
      ['quiz_title', 'Title of the quiz/exam/test'],
      ['quiz_description', 'Short description'],
      ['quiz_type', 'EXAM | TEST | QUIZ'],
      ['duration_minutes', 'Time limit in minutes'],
      ['total_marks', 'Maximum marks for the whole quiz'],
      ['pass_mark', 'Minimum passing marks'],
      ['question_text', 'The question text'],
      ['question_type', 'MCQ | CHECKBOX | SHORT_ANSWER | PARAGRAPH | TRUE_FALSE | FILL_BLANK'],
      ['option_a', 'Option A (for MCQ/CHECKBOX/TRUE_FALSE)'],
      ['option_b', 'Option B (for MCQ/CHECKBOX/TRUE_FALSE)'],
      ['option_c', 'Option C (for MCQ/CHECKBOX only)'],
      ['option_d', 'Option D (for MCQ/CHECKBOX only)'],
      ['correct_answer', 'Correct answer for single-answer types'],
      ['correct_answers', 'Comma-separated correct answers for CHECKBOX'],
      ['marks', 'Marks for this question'],
      ['explanation', 'Optional explanation shown after submission'],
    ];
    const instWs = XLSX.utils.aoa_to_sheet(instData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.utils.book_append_sheet(wb, instWs, 'Instructions');
    XLSX.writeFile(wb, 'quiz_import_template.xlsx');
    toast.success('Excel template downloaded');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    parseFile(file);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      try {
        let rows: any[] = [];
        if (file.name.endsWith('.csv')) {
          const text = data as string;
          rows = text.split('\n').filter((r) => r.trim()).map((r) => r.split(','));
        } else {
          const wb = XLSX.read(data, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
        }
        if (rows.length < 2) {
          toast.error('File appears to be empty');
          return;
        }
        const headers = (rows[0] as any[]).map((h: any) => String(h).trim().toLowerCase());
        const parsed = rows.slice(1).map((row: any[]) => {
          const obj: Record<string, any> = {};
          headers.forEach((h: string, i: number) => {
            obj[h] = row[i] !== undefined ? String(row[i]).trim() : '';
          });
          return obj;
        }).filter((r: any) => r.question_text);
        setImportPreview(parsed);
        toast.success(`Parsed ${parsed.length} questions`);
      } catch {
        toast.error('Failed to parse file');
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const submitImportedQuiz = async () => {
    if (!schoolId || importPreview.length === 0) return;
    setIsImporting(true);
    try {
      const first = importPreview[0];
      const questions = importPreview.map((row: any) => {
        const qType = (row.question_type?.toUpperCase() || 'MCQ').trim();
        const opts = [row.option_a, row.option_b, row.option_c, row.option_d]
          .filter((o: any) => o !== undefined && String(o).trim() !== '');

        const normalizedOpts =
          qType === 'TRUE_FALSE'
            ? [{ label: 'True', value: 'True' }, { label: 'False', value: 'False' }]
            : opts.map((o: string) => ({ label: o, value: o }));

        const q: any = {
          questionText: row.question_text,
          questionType: qType,
          options: normalizedOpts,
          marks: parseFloat(row.marks) || 1,
          explanation: row.explanation || undefined,
        };

        if (qType === 'CHECKBOX') {
          q.correctAnswers = row.correct_answers
            ? String(row.correct_answers).split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
        } else if (qType !== 'PARAGRAPH') {
          q.correctAnswer = row.correct_answer || '';
        }
        return q;
      });

      const totalMarks = questions.reduce((s: number, q: any) => s + (q.marks || 1), 0);

      const payload = {
        title: first.quiz_title || 'Imported Quiz',
        description: first.quiz_description || '',
        quizType: (first.quiz_type?.toUpperCase() || 'QUIZ').trim(),
        durationMinutes: parseInt(first.duration_minutes) || 30,
        totalMarks: parseFloat(first.total_marks) || totalMarks,
        passMark: parseFloat(first.pass_mark) || 40,
        status: 'DRAFT',
        shuffleQuestions: false,
        showResultsImmediately: true,
        showCorrectAnswers: false,
        maxAttempts: 1,
        isEnabled: true,
        questions,
      };
      await quizApi.create(schoolId, payload);
      toast.success('Quiz imported successfully');
      setShowImport(false);
      setImportFile(null);
      setImportPreview([]);
      loadQuizzes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to import quiz');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Assessments
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm ml-10">Manage exams, tests, and quizzes across subjects</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 ml-10 sm:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowImport(true); setImportFile(null); setImportPreview([]); }}
              className="border-slate-200 dark:border-slate-700 hover:border-primary-300"
            >
              <Upload className="w-4 h-4 mr-1.5" /> Import
            </Button>
            <Link href="/quizzes/create">
              <Button size="sm" className="shadow-lg shadow-primary-500/20">
                <Plus className="w-4 h-4 mr-1.5" /> Create assessment
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
              transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          {quizTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filterType === t
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((group) => (
            <div key={group} className="space-y-3">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-52 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No assessments found</h3>
          <p className="text-sm text-slate-400 mb-5">Get started by creating your first quiz or exam</p>
          {canManage && (
            <Link href="/quizzes/create">
              <Button size="sm" className="shadow-lg shadow-primary-500/20">
                <Plus className="w-4 h-4 mr-1.5" /> Create assessment
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([subjectName, subjectQuizzes]) => (
            <motion.div
              key={subjectName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{subjectName}</h2>
                <Badge variant="default" className="text-[10px] px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-0">
                  {subjectQuizzes.length}
                </Badge>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800 ml-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {subjectQuizzes.map((quiz, i) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    index={i}
                    isStudent={isStudent()}
                    canManage={canManage}
                    isExpired={isExpired(quiz)}
                    isNotStarted={isNotStarted(quiz)}
                    onDelete={confirmDelete}
                    onViewParticipants={openParticipants}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      <Modal isOpen={showImport} onClose={() => { setShowImport(false); setImportFile(null); setImportPreview([]); }} title="Import Quiz" size="xl">
        <div className="space-y-5 max-h-[75vh] overflow-auto pr-2">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-2xl p-5 space-y-3 border border-indigo-100 dark:border-indigo-900/20">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Download Template</p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
              Download a template, fill with your quiz data, then upload. Supports MCQ, CHECKBOX, SHORT_ANSWER, PARAGRAPH, TRUE_FALSE, FILL_BLANK.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={downloadCsvTemplate} className="bg-white dark:bg-slate-800">
                <FileDown className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcelTemplate} className="bg-white dark:bg-slate-800">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
              </Button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 rounded-2xl p-8 text-center space-y-3 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload</p>
              <p className="text-xs text-slate-400 mt-0.5">CSV, XLSX up to 10MB</p>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            {importFile && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{importFile.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setImportFile(null); setImportPreview([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  <XCircle className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}
          </div>

          {importPreview.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Preview ({importPreview.length} questions)</p>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-400">#</th>
                      <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-400">Question</th>
                      <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-400">Type</th>
                      <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-400">Answer(s)</th>
                      <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-400">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((q, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 text-slate-500">{i + 1}</td>
                        <td className="p-3 max-w-[220px] truncate text-slate-700 dark:text-slate-300">{q.question_text}</td>
                        <td className="p-3">
                          <Badge variant="default" className="text-[10px] border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{q.question_type}</Badge>
                        </td>
                        <td className="p-3 max-w-[160px] truncate text-slate-500">
                          {q.correct_answers || q.correct_answer || '—'}
                        </td>
                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{q.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowImport(false); setImportFile(null); setImportPreview([]); }}>
              Cancel
            </Button>
            <Button onClick={submitImportedQuiz} isLoading={isImporting} disabled={importPreview.length === 0} size="sm">
              Import Quiz
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setQuizToDelete(null); }} title="Delete Quiz" size="sm">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Delete assessment?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">{quizToDelete?.title}</span> will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowDeleteConfirm(false); setQuizToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={deleting} onClick={handleDeleteQuiz}>
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Participants Modal */}
      <Modal isOpen={showParticipants} onClose={closeParticipants} title={`Participants`} subtitle={selectedQuizTitle} size="xl">
        <div className="space-y-5 max-h-[75vh] overflow-auto pr-2">
          {/* Participant filters */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Filter className="w-4 h-4 text-slate-400" />
              Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, admission #..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                value={participantStatus}
                onChange={(e) => setParticipantStatus(e.target.value as any)}
              >
                <option value="ALL">All Results</option>
                <option value="PASSED">Passed Only</option>
                <option value="FAILED">Failed Only</option>
              </select>
              <input
                type="number"
                placeholder="Min score"
                value={participantMinScore}
                onChange={(e) => setParticipantMinScore(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
              <input
                type="number"
                placeholder="Max score"
                value={participantMaxScore}
                onChange={(e) => setParticipantMaxScore(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredParticipants.length}</span> of {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </div>
          </div>

          {participantsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No participants found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredParticipants.map((p, i) => {
                const isExpanded = expandedParticipants.has(p.studentId);
                const bestAttempt = p.attempts.reduce((best, a) => (a.score || 0) > (best?.score || 0) ? a : best, p.attempts[0]);
                return (
                  <motion.div
                    key={p.studentId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <button
                      onClick={() => toggleExpandParticipant(p.studentId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                          {p.studentName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate eight dark:text-slate-200">{p.studentName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {p.admissionNumber || 'No admission #'} • {p.attemptCount} attempt{p.attemptCount !== 1 ? 's' : ''}
                            {p.className && ` • ${p.className}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {p.bestScore !== undefined ? `${p.bestScore}/${bestAttempt?.totalMarks ?? '-'}` : '-'}
                          </p>
                          <Badge
                            variant={p.passed ? 'success' : 'error'}
                            className="text-[10px] border-0 mt-0.5"
                          >
                            {p.bestPercentage?.toFixed(1)}% — {p.bestGradeLetter || '-'}
                          </Badge>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">All Attempts</p>
                            <div className="space-y-2">
                              {p.attempts.map((attempt) => {
                                const isBest = attempt.score === Math.max(...p.attempts.map((x) => x.score || 0));
                                return (
                                  <div
                                    key={attempt.submissionId}
                                    className={`flex items-center justify-between p-3 rounded-xl text-sm ${
                                      isBest
                                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30'
                                        : 'bg-slate-50 dark:bg-slate-800/20'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-xs font-bold text-slate-400 w-5">#{attempt.attemptNumber}</span>
                                      {isBest && (
                                        <Badge variant="success" className="text-[9px] px-1.5 py-0 border-0">
                                          <Flame className="w-2.5 h-2.5 mr-0.5" /> BEST
                                        </Badge>
                                      )}
                                      {attempt.status === 'TIMED_OUT' && (
                                        <Badge variant="warning" className="text-[9px] px-1.5 py-0 border-0">TIMED OUT</Badge>
                                      )}
                                      <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}
                                      </span>
                                      {attempt.startedAt && attempt.submittedAt && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000)} min
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {attempt.score !== undefined ? `${attempt.score}/${attempt.totalMarks ?? '-'}` : '-'}
                                      </span>
                                      <span className="text-xs text-slate-500 ml-2">
                                        ({attempt.percentage?.toFixed(1) ?? '-'}%)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function QuizCard({
  quiz,
  index,
  isStudent,
  canManage,
  isExpired,
  isNotStarted,
  onDelete,
  onViewParticipants,
}: {
  quiz: Quiz;
  index: number;
  isStudent: boolean;
  canManage: boolean;
  isExpired: boolean;
  isNotStarted: boolean;
  onDelete: (quiz: Quiz) => void;
  onViewParticipants: (quizId: string, title: string) => void;
}) {
  const disabled = quiz.isEnabled === false || isExpired;
  const attempted = quiz.hasAttempted;
  const attemptsRemaining = (quiz.maxAttempts || 1) - (quiz.attemptsUsed || 0);

  const typeColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    EXAM: { bg: 'bg-rose-50 dark:bg-rose-900/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/30', icon: Trophy },
    ASSESSMENT: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/30', icon: TrendingUp },
    ASSIGNMENT: { bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/30', icon: BookOpen },
    QUIZ: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/30', icon: CheckCircle },
  };

  const tc = typeColors[quiz.quizType || 'QUIZ'] || typeColors['QUIZ'];
  const TypeIcon = tc.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50
        hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/20
        transition-all duration-300 overflow-hidden ${disabled ? 'opacity-55' : ''}`}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${tc.bg.replace('bg-', 'bg-gradient-to-r from-').replace('50', '400').replace('/10', '')} to-transparent`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-lg ${tc.bg} ${tc.text} flex items-center justify-center flex-shrink-0 border ${tc.border}`}>
              <TypeIcon className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{quiz.title}</h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Status indicators moved to the badges row below for cleaner header */}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">{quiz.description || 'No description provided'}</p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Clock className="w-3 h-3 text-slate-400" /> {quiz.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <BarChart3 className="w-3 h-3 text-slate-400" /> {quiz.questionCount} Qs
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Trophy className="w-3 h-3 text-slate-400" /> {quiz.totalMarks} marks
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800" title="Attempts used out of total allowed">
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Attempts:</span> {quiz.attemptsUsed || 0}/{quiz.maxAttempts || 1}
          </span>
          {quiz.className && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <GraduationCap className="w-3 h-3 text-slate-400" /> {quiz.className}
            </span>
          )}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge className={`text-[10px] border-0 px-2 py-0.5 ${tc.bg} ${tc.text}`}>
            {quiz.quizType || 'Quiz'}
          </Badge>
          {disabled && (
            <Badge variant="error" className="text-[10px] border-0 px-2 py-0.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400">
              <Lock className="w-2.5 h-2.5 mr-0.5" /> {isExpired ? 'Expired' : 'Disabled'}
            </Badge>
          )}
          {isNotStarted && (
            <Badge variant="warning" className="text-[10px] border-0 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400">
              <Calendar className="w-2.5 h-2.5 mr-0.5" /> Upcoming
            </Badge>
          )}
          {attempted && (
            <Badge variant="info" className="text-[10px] border-0 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400">
              <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Attempted
            </Badge>
          )}
        </div>

        {/* Actions */}
        {isStudent ? (
          <div className="flex gap-2">
            {!disabled && !isNotStarted && attemptsRemaining > 0 ? (
              <Link href={`/quizzes/${quiz.id}/take`} className="flex-1">
                <Button size="sm" className="w-full shadow-md shadow-primary-500/15">
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  {attempted
                    ? `Retake (${attemptsRemaining} left)`
                    : quiz.maxAttempts && quiz.maxAttempts > 1
                      ? `Start (${quiz.maxAttempts} attempts)`
                      : 'Start'}
                </Button>
              </Link>
            ) : (
              <Button size="sm" className="w-full" disabled>
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                {isExpired ? 'Expired' : isNotStarted ? 'Not started' : 'No attempts remaining'}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {canManage && (
              <>
                <Link href={`/quizzes/${quiz.id}/edit`} className="flex-1 min-w-[50px]">
                  <Button variant="ghost" size="sm" className="w-full text-slate-600 dark:text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 min-w-[70px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                  onClick={() => onViewParticipants(quiz.id, quiz.title)}
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Participants
                </Button>
                <Link href={`/quizzes/${quiz.id}/results`} className="flex-1 min-w-[50px]">
                  <Button variant="ghost" size="sm" className="w-full text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                    <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Results
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                  onClick={() => onDelete(quiz)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Link href={`/quizzes/${quiz.id}/take`} className="flex-1 min-w-[50px]">
              <Button variant="ghost" size="sm" className="w-full text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
