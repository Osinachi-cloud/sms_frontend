'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { userApi, roleApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Role, PageResponse } from '@/types';
import { Plus, Search, UserCog } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const userSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleName: z.string().min(1, 'Role is required'),
});

type UserForm = z.infer<typeof userSchema>;

interface SchoolUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId?: string;
  roleName?: string;
  isActive?: boolean;
  joinedAt?: string;
  createdAt: string;
}

export default function UsersPage() {
  const { currentSchool, hasPermission } = useAuth();
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  const fetchUsers = async () => {
    if (!currentSchool) return;
    try {
      const response = await userApi.getAll(currentSchool.id, {
        page,
        size: 10,
        search: search || undefined
      });
      const data = response.data as PageResponse<SchoolUser>;
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    if (!currentSchool) return;
    try {
      const response = await roleApi.getRoles(currentSchool.id);
      setRoles(response.data as Role[]);
    } catch (error) {
      toast.error('Failed to load roles');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentSchool, page, search]);

  useEffect(() => {
    if (isModalOpen) {
      fetchRoles();
    }
  }, [isModalOpen]);

  const onSubmit = async (data: UserForm) => {
    if (!currentSchool) return;
    try {
      await userApi.create(currentSchool.id, data);
      toast.success('User created successfully');
      setIsModalOpen(false);
      reset();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
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
      header: 'User',
      render: (user: SchoolUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{user.fullName}</p>
            <p className="text-xs text-slate-500">{user.roleName || 'User'}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (u: SchoolUser) => u.email || '-' },
    { key: 'phone', header: 'Phone', render: (u: SchoolUser) => u.phone || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (user: SchoolUser) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive ? 'ACTIVE' : 'INACTIVE')}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: (u: SchoolUser) => (u.joinedAt ? formatDate(u.joinedAt) : '-'),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="users-table">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Users</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage school users and roles</p>
        </div>
        {hasPermission('user.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add User
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
                placeholder="Search users..."
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
            data={users}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="No users found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="Add New User"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('fullName')}
              label="Full Name"
              placeholder="User's full name"
              error={errors.fullName?.message}
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
              {...register('password')}
              type="password"
              label="Password"
              placeholder="Temporary password"
              error={errors.password?.message}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Role
              </label>
              <select {...register('roleName')} className="glass-input">
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.roleName?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.roleName.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
