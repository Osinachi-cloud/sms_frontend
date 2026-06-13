'use client';

import { quizApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, Play, Eye, Plus, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';

export default function QuizzesPage() {
  const { currentSchool, user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTake, setShowTake] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [role, setRole] = useState('student');

  const newQuiz = { title: '', description: '', durationMinutes: 30, totalMarks: 100, passMark: 40, status: 'DRAFT', questions: [] as any[] };
  const [quizForm, setQuizForm] = useState(newQuiz);
  const [currentQuestion, setCurrentQuestion] = useState({ questionText: '', questionType: 'MCQ', options: ['', ''], correctAnswer: '', marks: 1 });

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

  const isTeacherOrAdmin = role !== 'student';

  return (
    <div className="space-y-6" data-tour="quizzes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold gradient-text">Quizzes & Tests</h1>
        <div className="flex items-center gap-2 self-start">
          <select className="glass-input text-xs py-1.5" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student View</option>
            <option value="teacher">Teacher View</option>
          </select>
          {isTeacherOrAdmin && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Create Quiz
            </Button>
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
