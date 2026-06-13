'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { teacherStudentApi, classApi } from '@/lib/api';
import { normalizeListResponse } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Phone, Mail, Home, Briefcase, ChevronDown, ChevronUp, GraduationCap, Heart } from 'lucide-react';

interface Parent {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  relationship?: string;
  isActive?: boolean;
}

interface StudentWithParents {
  id: string;
  admissionNumber: string;
  fullName: string;
  email?: string;
  phone?: string;
  gender?: string;
  className?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parents: Parent[];
}

interface SchoolClass {
  id: string;
  name: string;
}

export default function MyStudentsWithParentsPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id;

  const [students, setStudents] = useState<StudentWithParents[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    loadData();
    loadClasses();
  }, [schoolId, selectedClass]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = selectedClass ? { classId: selectedClass } : undefined;
      const res = await teacherStudentApi.getMyStudentsWithParents(schoolId, params);
      setStudents(normalizeListResponse<StudentWithParents>(res.data).items);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await classApi.getAll(schoolId);
      setClasses(res.data?.content || []);
    } catch {
      // ignore
    }
  };

  const toggleExpand = (studentId: string) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            My Students & Parents
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {students.length} student{students.length !== 1 ? 's' : ''} in your classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {students.map((student) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleExpand(student.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                    {student.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{student.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {student.admissionNumber} • {student.className} • {student.gender}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {student.parents?.length || 0} parent{student.parents?.length !== 1 ? 's' : ''}
                  </span>
                  {expandedStudent === student.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedStudent === student.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Student Details */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Student Info
                          </h4>
                          <div className="space-y-2 text-sm">
                            {student.email && (
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Mail className="w-4 h-4" />
                                {student.email}
                              </div>
                            )}
                            {student.phone && (
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Phone className="w-4 h-4" />
                                {student.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Parents */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            Parent / Guardian Details
                          </h4>
                          {student.parents && student.parents.length > 0 ? (
                            <div className="space-y-3">
                              {student.parents.map((parent) => (
                                <div
                                  key={parent.id}
                                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                                      {parent.fullName}
                                    </p>
                                    {parent.relationship && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                        {parent.relationship}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1 text-xs text-slate-500">
                                    {parent.phone && (
                                      <div className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" />
                                        {parent.phone}
                                      </div>
                                    )}
                                    {parent.email && (
                                      <div className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        {parent.email}
                                      </div>
                                    )}
                                    {parent.address && (
                                      <div className="flex items-center gap-1.5">
                                        <Home className="w-3.5 h-3.5" />
                                        {parent.address}
                                      </div>
                                    )}
                                    {parent.occupation && (
                                      <div className="flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {parent.occupation}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">No parent records found.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
