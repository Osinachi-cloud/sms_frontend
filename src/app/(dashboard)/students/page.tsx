'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { studentApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Student, PageResponse } from '@/types';
import { Plus, Search, Upload, User } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const studentSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  parentName: z.string().optional(),
  parentEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  parentPhone: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function StudentsPage() {
  const { currentSchool, hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  const fetchStudents = async () => {
    if (!currentSchool) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await studentApi.getAll(currentSchool.id, {
        page,
        size: 10,
        search: search || undefined
      });
      const data = response.data as PageResponse<Student>;
      setStudents(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentSchool, page, search]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const onSubmit = async (data: StudentForm) => {
    if (!currentSchool) return;
    try {
      await studentApi.create(currentSchool.id, data);
      toast.success('Student created successfully');
      setIsModalOpen(false);
      reset();
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create student');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!currentSchool || !confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentApi.delete(currentSchool.id, studentId);
      toast.success('Student deleted');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
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
      header: 'Student',
      render: (student: Student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{student.fullName}</p>
            <p className="text-xs text-slate-500">{student.admissionNumber}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (s: Student) => s.email || '-' },
    { key: 'className', header: 'Class', render: (s: Student) => s.className || '-' },
    { key: 'parentPhone', header: 'Parent Phone', render: (s: Student) => s.parentPhone || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (student: Student) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
          {student.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (student: Student) => (
        <div className="flex gap-2">
          {hasPermission('student.delete') && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(student.id)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="students-table">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Students</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage student records</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {hasPermission('student.bulk.enroll') && (
            <Link href="/students/bulk-enroll">
              <Button variant="secondary">
                <Upload className="w-4 h-4" />
                Bulk Enroll
              </Button>
            </Link>
          )}
          {hasPermission('student.create') && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm w-full">
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
        <CardContent className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={students}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="No students found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="Add New Student"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('fullName')}
              label="Full Name"
              placeholder="Student's full name"
              error={errors.fullName?.message}
            />
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="student@email.com"
              error={errors.email?.message}
            />
            <Input
              {...register('phone')}
              label="Phone"
              placeholder="Phone number"
            />
            <Input
              {...register('password')}
              type="password"
              label="Password (optional)"
              placeholder="Set password to create login account"
              error={errors.password?.message}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <select {...register('gender')} className="glass-input">
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h3 className="font-medium mb-4">Parent/Guardian Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register('parentName')}
                label="Parent Name"
                placeholder="Parent's full name"
              />
              <Input
                {...register('parentEmail')}
                type="email"
                label="Parent Email"
                placeholder="parent@email.com"
                error={errors.parentEmail?.message}
              />
              <Input
                {...register('parentPhone')}
                label="Parent Phone"
                placeholder="Parent's phone"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
