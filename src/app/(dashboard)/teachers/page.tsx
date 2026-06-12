'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { teacherApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Teacher, PageResponse } from '@/types';
import { Plus, Search, GraduationCap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const teacherSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  employeeId: z.string().optional(),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
});

type TeacherForm = z.infer<typeof teacherSchema>;

export default function TeachersPage() {
  const { currentSchool, hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

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
        search: search || undefined
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
  }, [currentSchool, page, search]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const onSubmit = async (data: TeacherForm) => {
    if (!currentSchool) return;
    try {
      await teacherApi.create(currentSchool.id, data);
      toast.success('Teacher created successfully');
      setIsModalOpen(false);
      reset();
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    }
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
          {hasPermission('teacher.delete') && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(teacher.id)}>
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
        {hasPermission('teacher.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Teacher
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
                placeholder="Search teachers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-10"
              />
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
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="Add New Teacher"
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
              placeholder="teacher@email.com"
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
              label="Password (optional)"
              placeholder="Set password to create login account"
              error={errors.password?.message}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Teacher
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
