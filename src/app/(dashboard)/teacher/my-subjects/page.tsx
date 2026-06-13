'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth';
import { subjectApi, teacherAssignmentApi, classApi, teacherApi } from '@/lib/api';
import { normalizeListResponse } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Trash2, Users, School, Star, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  isClassTeacher: boolean;
}

interface Classroom {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  fullName: string;
}

export default function TeacherSubjectsPage() {
  const { currentSchool } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [myClasses, setMyClasses] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [newSubject, setNewSubject] = useState({ name: '', code: '', description: '' });
  const [newAssignment, setNewAssignment] = useState({ teacherId: '', subjectId: '', classId: '' });

  useEffect(() => {
    if (!currentSchool) return;
    fetchData();
  }, [currentSchool]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const subRes = await subjectApi.getAll(currentSchool!.id);
      setSubjects(normalizeListResponse<Subject>(subRes.data).items);

      const [clsRes, tchRes] = await Promise.all([
        classApi.getAll(currentSchool!.id, { size: 100 }),
        teacherApi.getAll(currentSchool!.id, { size: 100 }),
      ]);

      const classes = normalizeListResponse<Classroom>(clsRes.data).items;
      setMyClasses(classes);
      setTeachers(normalizeListResponse<any>(tchRes.data).items.map((t: any) => ({ id: t.id, fullName: t.fullName })));

      // Fetch assignments for all my classes
      const allAssignments: Assignment[] = [];
      for (const cls of classes) {
        try {
          const res = await teacherAssignmentApi.getByClass(currentSchool!.id, cls.id);
          allAssignments.push(...normalizeListResponse<Assignment>(res.data).items);
        } catch { /* silent */ }
      }
      setAssignments(allAssignments);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!currentSchool || !newSubject.name.trim()) return;
    try {
      await subjectApi.create(currentSchool.id, {
        name: newSubject.name.trim(),
        code: newSubject.code.trim() || undefined,
        description: newSubject.description.trim() || undefined,
      });
      toast.success('Subject created');
      setIsSubjectModalOpen(false);
      setNewSubject({ name: '', code: '', description: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleAssignTeacher = async () => {
    if (!currentSchool || !newAssignment.teacherId || !newAssignment.subjectId || !newAssignment.classId) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await teacherAssignmentApi.assign(currentSchool.id, {
        teacherId: newAssignment.teacherId,
        classId: newAssignment.classId,
        subjectId: newAssignment.subjectId,
        isClassTeacher: false,
      });
      toast.success('Teacher assigned to subject');
      setIsAssignModalOpen(false);
      setNewAssignment({ teacherId: '', subjectId: '', classId: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign teacher');
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!currentSchool || !confirm('Remove this assignment?')) return;
    try {
      await teacherAssignmentApi.remove(currentSchool.id, id);
      toast.success('Assignment removed');
      fetchData();
    } catch {
      toast.error('Failed to remove assignment');
    }
  };

  // Group assignments by class
  const assignmentsByClass = assignments.reduce((acc, a) => {
    if (!acc[a.classId]) acc[a.classId] = [];
    acc[a.classId].push(a);
    return acc;
  }, {} as Record<string, Assignment[]>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="animate-pulse h-32 bg-slate-200 dark:bg-slate-700 rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-500" />
            My Subjects
          </h1>
          <p className="text-slate-500 mt-1">
            Manage subjects and teacher assignments for your classes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsAssignModalOpen(true)}>
            <Users className="w-4 h-4 mr-1" />
            Assign Teacher
          </Button>
          <Button onClick={() => setIsSubjectModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Subject
          </Button>
        </div>
      </div>

      {/* All Subjects List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              All Subjects ({subjects.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No subjects created yet.</p>
              <p className="text-slate-400 text-xs mt-1">Click &quot;New Subject&quot; to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {subject.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{subject.name}</p>
                      {subject.code && (
                        <p className="text-xs text-slate-500">{subject.code}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {myClasses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <School className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
            <p className="text-slate-500">You haven&apos;t been assigned to any classes yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myClasses.map((cls, idx) => {
            const classAssignments = assignmentsByClass[cls.id] || [];
            const subjectAssignments = classAssignments.filter(a => a.subjectId && !a.isClassTeacher);
            const classTeacher = classAssignments.find(a => a.isClassTeacher);

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <School className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          {classTeacher && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              Class Teacher: {classTeacher.teacherName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {subjectAssignments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">
                        No subject teachers assigned yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {subjectAssignments.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                                {a.subjectName?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{a.subjectName}</p>
                                <p className="text-xs text-slate-500">Teacher: {a.teacherName}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleRemoveAssignment(a.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Create New Subject"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject Name *</label>
            <input
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              placeholder="e.g. Mathematics"
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject Code</label>
            <input
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
              placeholder="e.g. MATH101"
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              value={newSubject.description}
              onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
              placeholder="Brief description..."
              className="glass-input w-full h-20"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsSubjectModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSubject}>
              <Check className="w-4 h-4 mr-1" />
              Create Subject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Teacher to Subject"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Class *</label>
            <select
              value={newAssignment.classId}
              onChange={(e) => setNewAssignment({ ...newAssignment, classId: e.target.value })}
              className="glass-input w-full"
            >
              <option value="">Select a class</option>
              {myClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
            <select
              value={newAssignment.subjectId}
              onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
              className="glass-input w-full"
            >
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teacher *</label>
            <select
              value={newAssignment.teacherId}
              onChange={(e) => setNewAssignment({ ...newAssignment, teacherId: e.target.value })}
              className="glass-input w-full"
            >
              <option value="">Select a teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignTeacher}>
              <Check className="w-4 h-4 mr-1" />
              Assign Teacher
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
