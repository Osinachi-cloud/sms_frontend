'use client';

import { quizApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, Play, Eye, Plus, CheckCircle, XCircle, Trophy, Upload, Download, FileSpreadsheet, FileDown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const QUIZ_TEMPLATE_HEADERS = [
  'quiz_title',
  'quiz_description',
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
  'marks',
];

const QUIZ_TEMPLATE_EXAMPLE = [
  'Mid-term Mathematics',
  'Mid-term assessment for JSS 1',
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
  '1',
];

export default function QuizzesPage() {
  const { currentSchool, user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTake, setShowTake] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [role, setRole] = useState('student');

  const newQuiz = { title: '', description: '', durationMinutes: 30, totalMarks: 100, passMark: 40, status: 'DRAFT', shuffleQuestions: false, showResultsImmediately: true, maxAttempts: 1, questions: [] as any[] };
  const [quizForm, setQuizForm] = useState(newQuiz);
  const [currentQuestion, setCurrentQuestion] = useState({ questionText: '', questionType: 'MCQ', options: ['', ''], correctAnswer: '', marks: 1 });

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (currentSchool?.id) {
      loadQuizzes();
    }
  }, [currentSchool]);

  const loadQuizzes = async () => {
    setLoading(true);
    const res = await quizApi.getAll(currentSchool!.id, { size: 50 });
    setQuizzes(normalizeListResponse<any>(res.data).items);
    setLoading(false);
  };

  const addQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, currentQuestion],
    });
    setCurrentQuestion({ questionText: '', questionType: 'MCQ', options: ['', ''], correctAnswer: '', marks: 1 });
  };

  const createQuiz = async () => {
    if (!currentSchool?.id) return;
    await quizApi.create(currentSchool.id, quizForm);
    setShowCreate(false);
    setQuizForm(newQuiz);
    loadQuizzes();
  };

  const startQuiz = async (quiz: any) => {
    setActiveQuiz(quiz);
    setShowTake(true);
    setAnswers({});
    setResult(null);
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    const payload = {
      quizId: activeQuiz.id,
      answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer, selectedOptions: [answer] })),
    };
    const res = await quizApi.submit(activeQuiz.id, payload);
    setResult(res.data);
  };

  // Template downloads
  const downloadCsvTemplate = () => {
    const csvContent = [QUIZ_TEMPLATE_HEADERS.join(','), QUIZ_TEMPLATE_EXAMPLE.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV template downloaded');
  };

  const downloadExcelTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([QUIZ_TEMPLATE_HEADERS, QUIZ_TEMPLATE_EXAMPLE]);
    const instData = [
      ['Column', 'Description'],
      ['quiz_title', 'Title of the quiz'],
      ['quiz_description', 'Short description'],
      ['duration_minutes', 'Time limit in minutes'],
      ['total_marks', 'Maximum marks'],
      ['pass_mark', 'Minimum passing marks'],
      ['question_text', 'The question'],
      ['question_type', 'MCQ | TRUE_FALSE | FILL_BLANK'],
      ['option_a', 'Option A (for MCQ/TRUE_FALSE)'],
      ['option_b', 'Option B (for MCQ/TRUE_FALSE)'],
      ['option_c', 'Option C (for MCQ only)'],
      ['option_d', 'Option D (for MCQ only)'],
      ['correct_answer', 'Correct answer text'],
      ['marks', 'Marks for this question'],
    ];
    const instWs = XLSX.utils.aoa_to_sheet(instData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.utils.book_append_sheet(wb, instWs, 'Instructions');
    XLSX.writeFile(wb, 'quiz_import_template.xlsx');
    toast.success('Excel template downloaded');
  };

  // File upload and parse
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
          rows = text.split('\n').filter(r => r.trim()).map(r => r.split(','));
        } else {
          const wb = XLSX.read(data, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
        }
        if (rows.length < 2) {
          toast.error('File appears to be empty');
          return;
        }
        const headers = rows[0].map((h: string) => String(h).trim().toLowerCase());
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
    if (!currentSchool?.id || importPreview.length === 0) return;
    setIsImporting(true);
    try {
      const first = importPreview[0];
      const questions = importPreview.map((row: any) => {
        const opts = [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean);
        const qType = row.question_type?.toUpperCase() || 'MCQ';
        return {
          questionText: row.question_text,
          questionType: qType,
          options: qType === 'TRUE_FALSE' ? [{ label: 'True', value: 'True' }, { label: 'False', value: 'False' }] : opts.map((o: string) => ({ label: o, value: o })),
          correctAnswer: row.correct_answer,
          marks: parseFloat(row.marks) || 1,
        };
      });
      const payload = {
        title: first.quiz_title || 'Imported Quiz',
        description: first.quiz_description || '',
        durationMinutes: parseInt(first.duration_minutes) || 30,
        totalMarks: parseFloat(first.total_marks) || questions.reduce((s: number, q: any) => s + (q.marks || 1), 0),
        passMark: parseFloat(first.pass_mark) || 40,
        status: 'DRAFT',
        shuffleQuestions: false,
        showResultsImmediately: true,
        maxAttempts: 1,
        questions,
      };
      await quizApi.create(currentSchool.id, payload);
      toast.success('Quiz imported successfully');
      setShowImport(false);
      setImportFile(null);
      setImportPreview([]);
      loadQuizzes();
    } catch {
      toast.error('Failed to import quiz');
    } finally {
      setIsImporting(false);
    }
  };

  const isTeacherOrAdmin = role !== 'student';

  return (
    <div className="space-y-6" data-tour="quizzes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold gradient-text">Quizzes & Tests</h1>
        <div className="flex items-center gap-2 self-start flex-wrap">
          <select className="glass-input text-xs py-1.5" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student View</option>
            <option value="teacher">Teacher View</option>
          </select>
          {isTeacherOrAdmin && (
            <>
              <Button variant="secondary" onClick={() => setShowImport(true)}>
                <Upload className="w-4 h-4" /> Import
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Create Quiz
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 glass-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {quizzes.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-sm">{quiz.title}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  quiz.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {quiz.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{quiz.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.durationMinutes} min</span>
                <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> {quiz.questionCount || 0} Qs</span>
                <span>{quiz.totalMarks} marks</span>
              </div>
              {isTeacherOrAdmin ? (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1"><Eye className="w-3 h-3" /> View</Button>
                </div>
              ) : (
                <Button size="sm" className="w-full" onClick={() => startQuiz(quiz)}>
                  <Play className="w-3 h-3" /> Take Quiz
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Quiz Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Quiz" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
          <input className="glass-input w-full" placeholder="Quiz title" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} />
          <textarea className="glass-input w-full" placeholder="Description" rows={2} value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" className="glass-input w-full" placeholder="Duration (min)" value={quizForm.durationMinutes} onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: parseInt(e.target.value) })} />
            <input type="number" className="glass-input w-full" placeholder="Total marks" value={quizForm.totalMarks} onChange={(e) => setQuizForm({ ...quizForm, totalMarks: parseInt(e.target.value) })} />
            <input type="number" className="glass-input w-full" placeholder="Pass mark" value={quizForm.passMark} onChange={(e) => setQuizForm({ ...quizForm, passMark: parseInt(e.target.value) })} />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-medium text-sm mb-2">Add Question</h4>
            <input className="glass-input w-full mb-2" placeholder="Question text" value={currentQuestion.questionText} onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })} />
            <select className="glass-input w-full mb-2" value={currentQuestion.questionType} onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionType: e.target.value })}>
              <option value="MCQ">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="FILL_BLANK">Fill in the Blank</option>
            </select>
            {currentQuestion.questionType === 'MCQ' && (
              <div className="space-y-2 mb-2">
                {currentQuestion.options.map((opt, idx) => (
                  <input key={idx} className="glass-input w-full" placeholder={`Option ${idx + 1}`} value={opt} onChange={(e) => {
                    const newOpts = [...currentQuestion.options];
                    newOpts[idx] = e.target.value;
                    setCurrentQuestion({ ...currentQuestion, options: newOpts });
                  }} />
                ))}
                <button className="text-xs text-primary-600" onClick={() => setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, ''] })}>+ Add option</button>
              </div>
            )}
            <input className="glass-input w-full mb-2" placeholder="Correct answer" value={currentQuestion.correctAnswer} onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })} />
            <button className="btn-secondary text-xs w-full" onClick={addQuestion}>
              <Plus className="w-3 h-3" /> Add Question ({quizForm.questions.length})
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            <Button onClick={createQuiz}>Create Quiz</Button>
          </div>
        </div>
      </Modal>

      {/* Import Quiz Modal */}
      <Modal isOpen={showImport} onClose={() => { setShowImport(false); setImportFile(null); setImportPreview([]); }} title="Import Quiz from File" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium">Download Template</p>
            <p className="text-xs text-slate-500">Download a blank template, fill it with your quiz data, then upload below.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                <FileDown className="w-4 h-4 mr-2" /> CSV Template
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcelTemplate}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel Template
              </Button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center space-y-3">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium">Upload your filled template</p>
            <p className="text-xs text-slate-500">Supported formats: .csv, .xlsx</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
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
              <p className="text-xs text-slate-600">Selected: {importFile.name}</p>
            )}
          </div>

          {importPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview ({importPreview.length} questions)</p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                    <tr>
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Question</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Answer</th>
                      <th className="text-left p-2">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 10).map((q, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{q.question_text}</td>
                        <td className="p-2">{q.question_type}</td>
                        <td className="p-2">{q.correct_answer}</td>
                        <td className="p-2">{q.marks}</td>
                      </tr>
                    ))}
                    {importPreview.length > 10 && (
                      <tr>
                        <td className="p-2 text-slate-500" colSpan={5}>...and {importPreview.length - 10} more</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary text-sm" onClick={() => { setShowImport(false); setImportFile(null); setImportPreview([]); }}>
              Cancel
            </button>
            <Button onClick={submitImportedQuiz} isLoading={isImporting} disabled={importPreview.length === 0}>
              Import Quiz
            </Button>
          </div>
        </div>
      </Modal>

      {/* Take Quiz Modal */}
      <Modal isOpen={showTake && !!activeQuiz && !result} onClose={() => setShowTake(false)} title={activeQuiz?.title || 'Quiz'} size="lg">
        <div className="space-y-6 max-h-[70vh] overflow-auto pr-2">
          {activeQuiz?.questions?.map((q: any, idx: number) => (
            <div key={q.id} className="glass-card rounded-xl p-4">
              <p className="font-medium text-sm mb-3">{idx + 1}. {q.questionText}</p>
              {q.questionType === 'MCQ' && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt: any, i: number) => (
                    <label key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name={q.id}
                        value={typeof opt === 'string' ? opt : opt.label || opt.value}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm">{typeof opt === 'string' ? opt : opt.label || opt.value}</span>
                    </label>
                  ))}
                </div>
              )}
              {(q.questionType === 'TRUE_FALSE' || q.questionType === 'FILL_BLANK') && (
                <input
                  className="glass-input w-full"
                  placeholder="Your answer"
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
            </div>
          ))}
          <Button onClick={submitQuiz} className="w-full">
            <CheckCircle className="w-4 h-4" /> Submit Quiz
          </Button>
        </div>
      </Modal>

      {/* Result Modal */}
      <Modal isOpen={!!result} onClose={() => { setResult(null); setShowTake(false); }} title="Quiz Result" size="md">
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mx-auto flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold gradient-text">{result?.percentage?.toFixed(1)}%</p>
            <p className="text-lg font-medium">{result?.gradeLetter}</p>
            <p className="text-sm text-slate-500">{result?.score} / {result?.totalMarks} marks</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
              <p className="font-bold text-lg">{result?.answers?.filter((a: any) => a.isCorrect).length}</p>
              <p>Correct</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
              <p className="font-bold text-lg">{result?.answers?.filter((a: any) => !a.isCorrect).length}</p>
              <p>Incorrect</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
