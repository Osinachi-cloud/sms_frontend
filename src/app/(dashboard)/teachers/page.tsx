'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { teacherApi } from '@/lib/api';
import { formatDate, getStatusColor, validatePassword } from '@/lib/utils';
import { Teacher, PageResponse } from '@/types';
import { Plus, Search, GraduationCap, Pencil, Upload } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const teacherSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  password: z.string()
    .refine((val) => !val || validatePassword(val) === null, { message: 'Password must be 8-32 chars with uppercase, lowercase, number and special char (@$!%*?&)' })
    .optional()
    .or(z.literal('')),
  employeeId: z.string().optional(),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
});

type TeacherForm = z.infer<typeof teacherSchema>;
type ModalMode = 'create' | 'edit';

export default function TeachersPage() {
  const { currentSchool, hasPermission } = useAuth();
  const isAdmin = currentSchool?.roleName?.toLowerCase().includes('admin') ?? false;
  const searchParams = useSearchParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
  });

  const fetchTeachers = async () => {
    if (!currentSchool) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await teacherApi.getAll(currentSchool.id, {
        page,
        size: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      const data = response.data as PageResponse<Teacher>;
      setTeachers(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentSchool, page, search, statusFilter]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openCreate();
    }
  }, [searchParams]);

  const onSubmit = async (data: TeacherForm) => {
    if (!currentSchool) return;
    try {
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      if (modalMode === 'create') {
        await teacherApi.create(currentSchool.id, payload);
        toast.success('Teacher created successfully');
      } else if (editingTeacher) {
        await teacherApi.update(currentSchool.id, editingTeacher.id, payload);
        toast.success('Teacher updated successfully');
      }
      setIsModalOpen(false);
      reset();
      setEditingTeacher(null);
      setModalMode('create');
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode} teacher`);
    }
  };

  const openCreate = () => {
    setModalMode('create');
    setEditingTeacher(null);
    reset();
    setIsModalOpen(true);
  };

  const openEdit = (teacher: Teacher) => {
    setModalMode('edit');
    setEditingTeacher(teacher);
    reset({
      fullName: teacher.fullName,
      email: teacher.email || '',
      phone: teacher.phone || '',
      password: '',
      employeeId: teacher.employeeId || '',
      specialization: teacher.specialization || '',
      qualification: teacher.qualification || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (teacherId: string) => {
    if (!currentSchool || !confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await teacherApi.delete(currentSchool.id, teacherId);
      toast.success('Teacher deleted');
      fetchTeachers();
    } catch (error) {
      toast.error('Failed to delete teacher');
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
      key: 'fullName',
      header: 'Teacher',
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{teacher.fullName}</p>
            <p className="text-xs text-slate-500">{teacher.employeeId || 'No ID'}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (t: Teacher) => t.email || '-' },
    { key: 'specialization', header: 'Specialization', render: (t: Teacher) => t.specialization || '-' },
    { key: 'phone', header: 'Phone', render: (t: Teacher) => t.phone || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (teacher: Teacher) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(teacher.status)}`}>
          {teacher.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (teacher: Teacher) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(teacher)}>
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
          {(isAdmin || hasPermission('teacher.delete')) && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(teacher.id)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="teachers-table">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Teachers</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage teaching staff</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/students/bulk-enroll?entity=teachers">
            <Button variant="secondary">
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
          </Link>
          {(isAdmin || hasPermission('teacher.create')) && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="glass-input pl-10 w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="glass-input w-full sm:w-40">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={teachers}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="No teachers found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); setEditingTeacher(null); setModalMode('create'); }}
        title={modalMode === 'create' ? 'Add New Teacher' : 'Edit Teacher'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('fullName')}
              label="Full Name"
              placeholder="Teacher's full name"
              error={errors.fullName?.message}
            />
            <Input
              {...register('employeeId')}
              label="Employee ID"
              placeholder="Employee ID"
            />
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="[EMAIL_REDACTED]"
              error={errors.email?.message}
            />
            <Input
              {...register('phone')}
              label="Phone"
              placeholder="Phone number"
            />
            <Input
              {...register('specialization')}
              label="Specialization"
              placeholder="e.g., Mathematics"
            />
            <Input
              {...register('qualification')}
              label="Qualification"
              placeholder="e.g., M.Ed"
            />
            <Input
              {...register('password')}
              type="password"
              label={modalMode === 'edit' ? 'Password (leave blank to keep unchanged)' : 'Password (optional)'}
              placeholder={modalMode === 'edit' ? 'Leave blank to keep current password' : 'Set strong password to create login account'}
              error={errors.password?.message}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Add Teacher' : 'Update Teacher'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
