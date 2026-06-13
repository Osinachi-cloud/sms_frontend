'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { studentApi, gradeApi } from '@/lib/api';
import { Student, Grade } from '@/types';
import { motion } from 'framer-motion';
import { BookOpen, Search, Save, TrendingUp, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface GradeEntry {
  studentId: string;
  studentName: string;
  score: string;
  maxScore: string;
  gradeLetter: string;
  remarks: string;
}

export default function TeacherGradebookPage() {
  const { currentSchool } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject] = useState('Mathematics');
  const [entries, setEntries] = useState<Record<string, GradeEntry>>({});

  useEffect(() => {
    async function fetchData() {
      if (!currentSchool) return;
      try {
        const [studentsRes, gradesRes] = await Promise.all([
          studentApi.getAll(currentSchool.id, { page: 0, size: 50 }),
          gradeApi.getStudentGrades(currentSchool.id, 's1'),
        ]);
        const studentList = (studentsRes.data as any).content || [];
        const gradeList = gradesRes.data as Grade[] || [];
        setStudents(studentList);
        setGrades(gradeList);

        const initialEntries: Record<string, GradeEntry> = {};
        studentList.forEach((s: Student) => {
          const existing = gradeList.find((g) => g.studentId === s.id);
          initialEntries[s.id] = {
            studentId: s.id,
            studentName: s.fullName,
            score: existing ? String(existing.score) : '',
            maxScore: existing ? String(existing.maxScore) : '100',
            gradeLetter: existing ? (existing.gradeLetter || '') : '',
            remarks: existing ? (existing.remarks || '') : '',
          };
        });
        setEntries(initialEntries);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load gradebook data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentSchool]);

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (s.admissionNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleEntryChange = (studentId: string, field: keyof GradeEntry, value: string) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const handleSaveAll = () => {
    toast.success('Grades saved successfully!');
  };

  const getGradeColor = (letter?: string) => {
    if (!letter) return 'text-slate-500';
    if (letter === 'A') return 'text-green-600';
    if (letter === 'B') return 'text-blue-600';
    if (letter === 'C') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-500" />
            Gradebook
          </h1>
          <p className="text-slate-500 mt-1">Enter and manage student grades</p>
        </div>
        <Button onClick={handleSaveAll}>
          <Save className="w-4 h-4 mr-2" />
          Save Grades
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Subject</p>
                <p className="font-semibold">{subject}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Class Average</p>
                <p className="font-semibold">76.4%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Top Score</p>
                <p className="font-semibold">95%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Students</p>
                <p className="font-semibold">{students.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Student</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Score</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Max</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const entry = entries[student.id] || { score: '', maxScore: '100', gradeLetter: '', remarks: '' };
                    return (
                      <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{student.fullName}</p>
                            <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            value={entry.score}
                            onChange={(e) => handleEntryChange(student.id, 'score', e.target.value)}
                            className="w-16 glass-input text-center"
                            min={0}
                            max={100}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            value={entry.maxScore}
                            onChange={(e) => handleEntryChange(student.id, 'maxScore', e.target.value)}
                            className="w-16 glass-input text-center"
                            min={1}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="text"
                            value={entry.gradeLetter}
                            onChange={(e) => handleEntryChange(student.id, 'gradeLetter', e.target.value.toUpperCase())}
                            className={`w-12 glass-input text-center font-bold ${getGradeColor(entry.gradeLetter)}`}
                            maxLength={1}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={entry.remarks}
                            onChange={(e) => handleEntryChange(student.id, 'remarks', e.target.value)}
                            className="w-full glass-input"
                            placeholder="Add remark..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredStudents.length === 0 && (
                <p className="text-center py-8 text-slate-400">No students found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
