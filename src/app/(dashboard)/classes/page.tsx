'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth';
import { classApi, teacherApi } from '@/lib/api';
import { Classroom, Teacher, PageResponse } from '@/types';
import { Plus, Search, School, Users, GraduationCap, Pencil, Trash2, Check } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

type ModalMode = 'create' | 'edit';

export default function ClassesPage() {
  const { currentSchool, hasPermission } = useAuth();
  const isAdmin = currentSchool?.roleName?.toLowerCase().includes('admin') ?? false;
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [capacity, setCapacity] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchClasses = useCallback(async () => {
    if (!currentSchool) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await classApi.getAll(currentSchool.id, { page, size: 10, search: search || undefined });
      const data = res.data as PageResponse<Classroom>;
      setClasses(data.content);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  }, [currentSchool, page, search]);

  const fetchTeachers = useCallback(async () => {
    if (!currentSchool) return;
    try {
      const res = await teacherApi.getAll(currentSchool.id, { size: 100 });
      setTeachers((res.data as PageResponse<Teacher>)?.content || []);
    } catch {
      // silent
    }
  }, [currentSchool]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (isModalOpen) fetchTeachers();
  }, [isModalOpen, fetchTeachers]);

  const resetForm = () => {
    setName('');
    setSection('');
    setCapacity('');
    setClassTeacherId('');
    setErrors({});
    setEditingClass(null);
  };

  const openCreate = () => {
    resetForm();
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEdit = (cls: Classroom) => {
    setEditingClass(cls);
    setName(cls.name);
    setSection(cls.section || '');
    setCapacity(cls.capacity?.toString() || '');
    setClassTeacherId(cls.classTeacherId || '');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.length < 2) e.name = 'Class name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!currentSchool || !validate()) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        section: section.trim() || undefined,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        classTeacherId: classTeacherId || undefined,
      };

      if (modalMode === 'create') {
        await classApi.create(currentSchool.id, payload);
        toast.success('Class created successfully');
      } else if (editingClass) {
        await classApi.update(currentSchool.id, editingClass.id, payload);
        toast.success('Class updated successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode} class`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (classId: string) => {
    if (!currentSchool || !confirm('Are you sure you want to delete this class?')) return;
    try {
      await classApi.delete(currentSchool.id, classId);
      toast.success('Class deleted');
      fetchClasses();
    } catch {
      toast.error('Failed to delete class');
    }
  };

  if (!currentSchool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Please select a school to continue.</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Class',
      render: (cls: Classroom) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{cls.name}</p>
            {cls.section && <p className="text-xs text-slate-500">Section: {cls.section}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'classTeacher',
      header: 'Class Teacher',
      render: (cls: Classroom) =>
        cls.classTeacherName ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-[10px] font-bold">
              {cls.classTeacherName.charAt(0)}
            </div>
            <span className="text-sm">{cls.classTeacherName}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-sm">Not assigned</span>
        ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (cls: Classroom) => (
        <span className="text-sm">
          {cls.studentCount ?? 0} / {cls.capacity ?? '-'} students
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (cls: Classroom) => new Date(cls.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      render: (cls: Classroom) => (
        <div className="flex items-center gap-1">
          {(isAdmin || hasPermission('class.update')) && (
            <Button variant="ghost" size="sm" onClick={() => openEdit(cls)}>
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          )}
          {(isAdmin || hasPermission('class.delete')) && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(cls.id)}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="classes-table">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Classes</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage classrooms and assign class teachers</p>
        </div>
        {(isAdmin || hasPermission('class.create')) && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Class
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="glass-input pl-10 w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={classes}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="No classes found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            mobileCardRender={(cls: Classroom) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Class</span>
                  <span className="text-sm font-medium">{cls.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Teacher</span>
                  <span className="text-sm">{cls.classTeacherName || 'Not assigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Students</span>
                  <span className="text-sm">{cls.studentCount ?? 0} / {cls.capacity ?? '-'}</span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={modalMode === 'create' ? 'Add New Class' : 'Edit Class'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Class Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JSS 1"
              className={`glass-input w-full ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Section</label>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Capacity</label>
              <input
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                type="number"
                placeholder="e.g. 40"
                className="glass-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Class Teacher</label>
            <select
              value={classTeacherId}
              onChange={(e) => setClassTeacherId(e.target.value)}
              className="glass-input w-full"
            >
              <option value="">-- Select a teacher --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName} {teacher.specialization ? `(${teacher.specialization})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              The selected teacher will automatically become the class teacher for all students in this class.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              <Check className="w-4 h-4 mr-1" />
              {modalMode === 'create' ? 'Create Class' : 'Update Class'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
