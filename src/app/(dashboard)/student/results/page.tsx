'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { gradeApi } from '@/lib/api';
import { Grade } from '@/types';
import { motion } from 'framer-motion';
import { Award, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StudentResultsPage() {
  const { currentSchool } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGrades() {
      if (!currentSchool) return;

      try {
        const response = await gradeApi.getStudentGrades(currentSchool.id, 'current');
        setGrades(response.data);
      } catch (error) {
        console.error('Failed to fetch grades:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGrades();
  }, [currentSchool]);

  const gradesByTerm = grades.reduce((acc, grade) => {
    const term = grade.termName || 'Unknown Term';
    if (!acc[term]) acc[term] = [];
    acc[term].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  const getGradeColor = (letter?: string) => {
    if (!letter) return 'bg-slate-100 text-slate-600';
    if (letter === 'A') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (letter === 'B') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (letter === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (letter === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const calculateAverage = (termGrades: Grade[]) => {
    const examGrades = termGrades.filter(g => g.assessmentType === 'EXAM' && g.score !== undefined);
    if (examGrades.length === 0) return null;
    const sum = examGrades.reduce((acc, g) => acc + g.score, 0);
    return (sum / examGrades.length).toFixed(1);
  };

  if (isLoading) {
    return (
    <div className="space-y-4 sm:space-y-6" data-tour="results-table">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Award className="w-7 h-7 text-primary-500" />
          My Results
        </h1>
        <p className="text-slate-500 mt-1">View your academic performance across all terms</p>
      </div>

      {Object.keys(gradesByTerm).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
            <p className="text-slate-500">Your results will appear here once they are entered.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(gradesByTerm).map(([term, termGrades]) => (
          <motion.div
            key={term}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  {term}
                </CardTitle>
                {calculateAverage(termGrades) && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                    <span className="font-semibold text-primary-600">
                      Avg: {calculateAverage(termGrades)}%
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Subject</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-500">Type</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-500">Score</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-500">Grade</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {termGrades.map((grade) => (
                        <tr key={grade.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-primary-500" />
                              </div>
                              <div>
                                <p className="font-medium">{grade.subjectName}</p>
                                <p className="text-xs text-slate-500">{grade.subjectCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={grade.assessmentType === 'EXAM' ? 'default' : 'info'}>
                              {grade.assessmentType}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">
                            {grade.score}/{grade.maxScore}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${getGradeColor(grade.gradeLetter)}`}>
                              {grade.gradeLetter || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {grade.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}
