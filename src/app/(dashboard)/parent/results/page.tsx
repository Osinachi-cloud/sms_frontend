'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { gradeApi } from '@/lib/api';
import { Grade } from '@/types';
import { motion } from 'framer-motion';
import { Award, BookOpen, Calendar, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChildGrades {
  childId: string;
  childName: string;
  className?: string;
  grades: Grade[];
}

export default function ParentResultsPage() {
  const { currentSchool, user, isParent } = useAuth();
  const [childResults, setChildResults] = useState<ChildGrades[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllChildrenGrades() {
      if (!currentSchool || !user?.children) return;

      setIsLoading(true);
      try {
        const results: ChildGrades[] = [];
        for (const child of user.children) {
          try {
            const response = await gradeApi.getStudentGrades(currentSchool.id, child.id);
            results.push({
              childId: child.id,
              childName: child.fullName,
              className: child.className,
              grades: response.data || [],
            });
          } catch {
            // If grades fail for one child, still show others
            results.push({
              childId: child.id,
              childName: child.fullName,
              className: child.className,
              grades: [],
            });
          }
        }
        setChildResults(results);
        // Auto-expand first child with grades
        const firstWithGrades = results.find((r) => r.grades.length > 0);
        if (firstWithGrades) setExpandedChild(firstWithGrades.childId);
      } catch (error) {
        console.error('Failed to fetch children grades:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllChildrenGrades();
  }, [currentSchool, user?.children]);

  const getGradeColor = (letter?: string) => {
    if (!letter) return 'bg-slate-100 text-slate-600';
    if (letter === 'A') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (letter === 'B') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (letter === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (letter === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const calculateAverage = (grades: Grade[]) => {
    const examGrades = grades.filter((g) => g.assessmentType === 'EXAM' && g.score !== undefined);
    if (examGrades.length === 0) return null;
    const sum = examGrades.reduce((acc, g) => acc + g.score, 0);
    return (sum / examGrades.length).toFixed(1);
  };

  const groupByTerm = (grades: Grade[]) => {
    return grades.reduce((acc, grade) => {
      const term = grade.termName || 'Unknown Term';
      if (!acc[term]) acc[term] = [];
      acc[term].push(grade);
      return acc;
    }, {} as Record<string, Grade[]>);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        </div>
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-16 bg-slate-200 dark:bg-slate-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!user?.children || user.children.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Award className="w-7 h-7 text-primary-500" />
            My Children's Results
          </h1>
          <p className="text-slate-500 mt-1">View academic performance and teacher remarks for all your children</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Children Found</h3>
            <p className="text-slate-500">Your children will appear here once linked to your account.</p>
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
          My Children's Results
        </h1>
        <p className="text-slate-500 mt-1">View academic performance and teacher remarks for all your children</p>
      </div>

      {childResults.map((child) => {
        const isExpanded = expandedChild === child.childId;
        const gradesByTerm = groupByTerm(child.grades);
        const hasGrades = child.grades.length > 0;

        return (
          <motion.div
            key={child.childId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedChild(isExpanded ? null : child.childId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {child.childName.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{child.childName}</CardTitle>
                      <p className="text-xs text-slate-500">{child.className || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasGrades && (
                      <Badge variant="info">{child.grades.length} result(s)</Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  {!hasGrades ? (
                    <div className="text-center py-6 text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No results available yet for {child.childName}.</p>
                      <p className="text-xs mt-1">Results will appear once teachers submit grades.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(gradesByTerm).map(([term, termGrades]) => (
                        <div key={term} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary-500" />
                              <span className="font-medium text-sm">{term}</span>
                            </div>
                            {calculateAverage(termGrades) && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30">
                                <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
                                <span className="text-xs font-semibold text-primary-600">
                                  Avg: {calculateAverage(termGrades)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                  <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Subject</th>
                                  <th className="text-center py-2 px-4 text-xs font-medium text-slate-500">Type</th>
                                  <th className="text-center py-2 px-4 text-xs font-medium text-slate-500">Score</th>
                                  <th className="text-center py-2 px-4 text-xs font-medium text-slate-500">Grade</th>
                                  <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {termGrades.map((grade) => (
                                  <tr key={grade.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <td className="py-2 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                          <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">{grade.subjectName}</p>
                                          <p className="text-[10px] text-slate-500">{grade.subjectCode}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                      <Badge variant={grade.assessmentType === 'EXAM' ? 'default' : 'info'} className="text-[10px]">
                                        {grade.assessmentType}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-4 text-center text-sm font-semibold">
                                      {grade.score}/{grade.maxScore}
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${getGradeColor(grade.gradeLetter)}`}>
                                        {grade.gradeLetter || '-'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-4 text-xs text-slate-500 max-w-[200px]">
                                      {grade.remarks || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
