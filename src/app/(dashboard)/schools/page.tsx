'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { schoolApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { School, PageResponse } from '@/types';
import { motion } from 'framer-motion';
import { Plus, Search, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const schoolSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  subdomain: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SchoolForm = z.infer<typeof schoolSchema>;

export default function SchoolsPage() {
  const { isPlatformAdmin } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
  });

  const fetchSchools = async () => {
    try {
      const response = await schoolApi.getAll({ page, size: 10, search: search || undefined });
      const data = response.data as PageResponse<School>;
      setSchools(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load schools');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [page, search]);

  const onSubmit = async (data: SchoolForm) => {
    try {
      await schoolApi.create(data);
      toast.success('School created successfully');
      setIsModalOpen(false);
      reset();
      fetchSchools();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create school');
    }
  };

  const handleStatusChange = async (schoolId: string, action: 'deactivate' | 'reactivate') => {
    try {
      if (action === 'deactivate') {
        await schoolApi.deactivate(schoolId);
        toast.success('School deactivated');
      } else {
        await schoolApi.reactivate(schoolId);
        toast.success('School reactivated');
      }
      fetchSchools();
    } catch (error) {
      toast.error(`Failed to ${action} school`);
    }
  };

  if (!isPlatformAdmin()) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">You don't have permission to view this page.</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'School',
      render: (school: School) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{school.name}</p>
            <p className="text-xs text-slate-500">{school.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'status',
      header: 'Status',
      render: (school: School) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(school.status)}`}>
          {school.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (school: School) => formatDate(school.createdAt),
    },
    {
      key: 'actions',
      header: '',
      render: (school: School) => (
        <div className="flex gap-2">
          {school.status === 'ACTIVE' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange(school.id, 'deactivate')}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange(school.id, 'reactivate')}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Schools</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all schools on the platform</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add School
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search schools..."
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
            data={schools}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="No schools found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="Create New School"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            label="School Name"
            placeholder="Enter school name"
            error={errors.name?.message}
          />
          <Input
            {...register('subdomain')}
            label="Subdomain (optional)"
            placeholder="school-name"
            error={errors.subdomain?.message}
          />
          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="contact@school.com"
            error={errors.email?.message}
          />
          <Input
            {...register('phone')}
            label="Phone"
            placeholder="+234..."
            error={errors.phone?.message}
          />
          <Input
            {...register('address')}
            label="Address"
            placeholder="School address"
            error={errors.address?.message}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create School
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
