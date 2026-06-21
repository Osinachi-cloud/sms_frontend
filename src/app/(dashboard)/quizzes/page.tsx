'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { quizApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Quiz } from '@/types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
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
  const [filterType, setFilterType] = useState<'ALL' | 'EXAM' | 'TEST' | 'QUIZ'>('ALL');

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Exams, Tests & Quizzes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Organized assessments by subject and class</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowImport(true); setImportFile(null); setImportPreview([]); }}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Link href="/quizzes/create">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Create Assessment
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, subject, class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-9 w-full text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'EXAM', 'TEST', 'QUIZ'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === t
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 glass-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No assessments found</p>
          {canManage && (
            <Link href="/quizzes/create">
              <Button variant="secondary" size="sm" className="mt-3">Create your first assessment</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([subjectName, subjectQuizzes]) => (
            <div key={subjectName}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary-500" />
                <h2 className="text-lg font-semibold">{subjectName}</h2>
                <Badge variant="default" className="text-[10px]">{subjectQuizzes.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {subjectQuizzes.map((quiz, i) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    index={i}
                    isStudent={isStudent()}
                    canManage={canManage}
                    isExpired={isExpired(quiz)}
                    isNotStarted={isNotStarted(quiz)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      <Modal isOpen={showImport} onClose={() => { setShowImport(false); setImportFile(null); setImportPreview([]); }} title="Import Quiz from File" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
          {/* Templates */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium">Download Template</p>
            <p className="text-xs text-slate-500">
              Download a blank template, fill it with your quiz data, then upload below.
              Supports all question types: MCQ, CHECKBOX, SHORT_ANSWER, PARAGRAPH, TRUE_FALSE, FILL_BLANK.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                <FileDown className="w-4 h-4 mr-2" /> CSV Template
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcelTemplate}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel Template
              </Button>
            </div>
          </div>

          {/* Upload area */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center space-y-3">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium">Upload your filled template</p>
            <p className="text-xs text-slate-500">Supported formats: .csv, .xlsx</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              id="quiz-import-file"
            />
            <label htmlFor="quiz-import-file">
              <Button variant="secondary" size="sm" className="cursor-pointer" as="span">
                Select File
              </Button>
            </label>
            {importFile && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-xs text-slate-600">{importFile.name}</p>
                <button onClick={() => { setImportFile(null); setImportPreview([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          {importPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview ({importPreview.length} questions)</p>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                    <tr>
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Question</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Answer(s)</th>
                      <th className="text-left p-2">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((q, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2 max-w-[200px] truncate">{q.question_text}</td>
                        <td className="p-2">{q.question_type}</td>
                        <td className="p-2 max-w-[150px] truncate">
                          {q.correct_answers || q.correct_answer || '—'}
                        </td>
                        <td className="p-2">{q.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowImport(false); setImportFile(null); setImportPreview([]); }}>
              Cancel
            </Button>
            <Button onClick={submitImportedQuiz} isLoading={isImporting} disabled={importPreview.length === 0}>
              Import Quiz
            </Button>
          </div>
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
}: {
  quiz: Quiz;
  index: number;
  isStudent: boolean;
  canManage: boolean;
  isExpired: boolean;
  isNotStarted: boolean;
}) {
  const disabled = quiz.isEnabled === false || isExpired;
  const attempted = quiz.hasAttempted;
  const attemptsRemaining = (quiz.maxAttempts || 1) - (quiz.attemptsUsed || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card rounded-2xl p-4 sm:p-5 ${disabled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{quiz.title}</h3>
          {attempted && (
            <Badge variant="success" className="text-[10px]">
              {quiz.bestScore}/{quiz.totalMarks}
            </Badge>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          quiz.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {quiz.status}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{quiz.description || 'No description'}</p>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.durationMinutes} min</span>
        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {quiz.questionCount} Qs</span>
        <span>{quiz.totalMarks} marks</span>
        {quiz.className && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {quiz.className}</span>}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        <Badge variant="default" className="text-[10px]">{quiz.quizType || 'Quiz'}</Badge>
        {disabled && <Badge variant="error" className="text-[10px]"><Lock className="w-3 h-3 mr-0.5" /> {isExpired ? 'Expired' : 'Disabled'}</Badge>}
        {isNotStarted && <Badge variant="warning" className="text-[10px]"><Calendar className="w-3 h-3 mr-0.5" /> Upcoming</Badge>}
        {attempted && <Badge variant="info" className="text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5" /> Attempted</Badge>}
      </div>

      {isStudent ? (
        <div className="flex gap-2">
          {attempted && (
            <div className="flex-1 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
              <Trophy className="w-4 h-4 text-green-600 mx-auto mb-0.5" />
              <p className="text-xs font-medium text-green-700">{quiz.bestScore}/{quiz.totalMarks}</p>
            </div>
          )}
          {!disabled && !isNotStarted && attemptsRemaining > 0 ? (
            <Link href={`/quizzes/${quiz.id}/take`} className="flex-1">
              <Button size="sm" className="w-full">
                <Play className="w-3 h-3 mr-1" /> {attempted ? 'Retake' : 'Take'}
              </Button>
            </Link>
          ) : (
            <Button size="sm" className="w-full" disabled>
              <Lock className="w-3 h-3 mr-1" /> {isExpired ? 'Expired' : isNotStarted ? 'Not started' : 'No attempts left'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          {canManage && (
            <Link href={`/quizzes/${quiz.id}/results`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                <BarChart3 className="w-3 h-3 mr-1" /> Results
              </Button>
            </Link>
          )}
          <Link href={`/quizzes/${quiz.id}/take`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              <Eye className="w-3 h-3 mr-1" /> Preview
            </Button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
