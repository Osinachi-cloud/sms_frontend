'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { useAuth } from '@/lib/auth';
import { promotionApi, classApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { School, Users, Check, AlertCircle, GraduationCap, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface StudentPromotionInfo {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  currentClassName: string;
  averageScore: number | null;
  gradeLetter: string;
  eligible: boolean;
  nextClassId: string | null;
  nextClassName: string | null;
  promotionStatus: string;
}

interface Classroom {
  id: string;
  name: string;
  section?: string;
  gradeLevel?: number;
}

export default function PromotionsPage() {
  const { currentSchool } = useAuth();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<StudentPromotionInfo[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    if (!currentSchool) return;
    classApi.getAll(currentSchool.id, { size: 100 })
      .then((res: any) => {
        const data = res.data?.content || [];
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      })
      .catch(() => toast.error('Failed to load classes'));
  }, [currentSchool]);

  useEffect(() => {
    if (!currentSchool || !selectedClassId) return;
    setIsLoading(true);
    promotionApi.getEligibleStudents(currentSchool.id, selectedClassId)
      .then((res: any) => {
        setStudents(res.data || []);
        setSelectedStudentIds(new Set());
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setIsLoading(false));
  }, [currentSchool, selectedClassId]);

  const toggleSelect = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === eligibleStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(eligibleStudents.map(s => s.studentId)));
    }
  };

  const handlePromote = async (studentId: string) => {
    if (!currentSchool) return;
    setIsPromoting(true);
    try {
      const res = await promotionApi.promoteStudent(currentSchool.id, studentId);
      const result = res.data;
      if (result.promoted) {
        toast.success(`${result.studentName} promoted to ${result.newClassName}`);
        setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, promotionStatus: 'PROMOTED' } : s));
        setSelectedStudentIds(prev => { const n = new Set(prev); n.delete(studentId); return n; });
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Promotion failed');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleBatchPromote = async () => {
    if (!currentSchool || !selectedClassId || selectedStudentIds.size === 0) return;
    setIsPromoting(true);
    try {
      const res = await promotionApi.promoteBatch(currentSchool.id, selectedClassId, Array.from(selectedStudentIds));
      const result = res.data;
      toast.success(`${result.promoted} promoted, ${result.failed} failed`);
      // Refresh list
      const refresh = await promotionApi.getEligibleStudents(currentSchool.id, selectedClassId);
      setStudents(refresh.data || []);
      setSelectedStudentIds(new Set());
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Batch promotion failed');
    } finally {
      setIsPromoting(false);
    }
  };

  const eligibleStudents = students.filter(s => s.eligible && s.nextClassId);

  if (!currentSchool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Please select a school to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Student Promotions</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Approve student performance and promote to the next class at the end of the session
          </p>
        </div>
      </div>

      {/* Class Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <School className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium">Select Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="glass-input w-full sm:w-72"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `(${cls.section})` : ''}
                </option>
              ))}
            </select>
            {eligibleStudents.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleBatchPromote}
                isLoading={isPromoting}
                disabled={selectedStudentIds.size === 0}
              >
                <GraduationCap className="w-4 h-4 mr-1" />
                Promote Selected ({selectedStudentIds.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Students Ready for Promotion
            </span>
            <span className="text-sm font-normal text-slate-500">
              {eligibleStudents.length} eligible out of {students.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No students found in this class.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-3">
                    <input
                      type="checkbox"
                      checked={eligibleStudents.length > 0 && selectedStudentIds.size === eligibleStudents.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Student</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Average</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Grade</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Next Class</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Status</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <motion.tr
                    key={student.studentId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-b border-slate-100 dark:border-slate-800 ${
                      !student.eligible ? 'opacity-60' : ''
                    }`}>
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(student.studentId)}
                        onChange={() => toggleSelect(student.studentId)}
                        disabled={!student.eligible || !student.nextClassId || student.promotionStatus === 'PROMOTED'}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {student.averageScore !== null ? (
                        <span className={`font-bold ${
                          student.averageScore >= 70 ? 'text-green-600' :
                          student.averageScore >= 60 ? 'text-blue-600' :
                          student.averageScore >= 50 ? 'text-amber-600' :
                          student.averageScore >= 40 ? 'text-slate-600' : 'text-red-600'
                        }`}>{student.averageScore.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        student.gradeLetter === 'A' ? 'bg-green-100 text-green-700' :
                        student.gradeLetter === 'B' ? 'bg-blue-100 text-blue-700' :
                        student.gradeLetter === 'C' ? 'bg-amber-100 text-amber-700' :
                        student.gradeLetter === 'D' ? 'bg-slate-100 text-slate-700' :
                        'bg-red-100 text-red-700'
                      }`}>{student.gradeLetter || 'N/A'}</span>
                    </td>
                    <td className="py-2 px-3">
                      {student.nextClassName ? (
                        <span className="flex items-center gap-1 text-sm">
                          <ArrowRight className="w-3.5 h-3.5 text-primary-500" />
                          {student.nextClassName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No next class</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {student.promotionStatus === 'PROMOTED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                          <Check className="w-3.5 h-3.5" /> Promoted
                        </span>
                      ) : student.eligible ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600">
                          <Check className="w-3.5 h-3.5" /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                          <AlertCircle className="w-3.5 h-3.5" /> Below Pass
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {student.promotionStatus === 'PROMOTED' ? null : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!student.eligible || !student.nextClassId || isPromoting}
                          onClick={() => handlePromote(student.studentId)}
                        >
                          Promote
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
