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
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Building2, Eye, EyeOff, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;

const schoolSchema = z.object({
  name: z.string().min(2, 'School name is required'),
  subdomain: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  adminFullName: z.string().min(2, "Admin's full name is required"),
  adminEmail: z.string().email('Invalid admin email'),
  adminPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(32, 'Password must not exceed 32 characters')
    .regex(PASSWORD_REGEX, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
  adminConfirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.adminConfirmPassword, {
  message: "Passwords don't match",
  path: ['adminConfirmPassword'],
});

type SchoolForm = z.infer<typeof schoolSchema>;

type Step = 1 | 2;

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { num: 1, label: 'School Details' },
    { num: 2, label: 'Admin Account' },
  ];

  return (
    <div className="flex items-center gap-2 mb-5">
      {steps.map((s, index) => {
        const isCompleted = currentStep > s.num;
        const isActive = currentStep === s.num;

        return (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isActive && 'bg-primary-500 text-white',
                  !isCompleted && !isActive && 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-primary-600' : 'text-slate-500'
                )}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mx-1">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isCompleted ? 'bg-green-500 w-full' : 'w-0'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function SchoolsPage() {
  const { isPlatformAdmin } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<Step>(1);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, reset, trigger, formState: { errors, isSubmitting }, watch } = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
    mode: 'onChange',
  });

  const adminPassword = watch('adminPassword');

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

  const nextStep = async () => {
    const isValid = await trigger(['name', 'subdomain', 'email', 'phone', 'address']);
    if (isValid) {
      setStep(2);
    }
  };

  const prevStep = () => setStep(1);

  const onSubmit = async (data: SchoolForm) => {
    try {
      // Remove confirmPassword before sending to API
      const { adminConfirmPassword, ...payload } = data;
      await schoolApi.create(payload);
      toast.success('School created successfully');
      setIsModalOpen(false);
      reset();
      setStep(1);
      setShowPassword(false);
      setShowConfirmPassword(false);
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
      key: 'admin',
      header: 'School Admin',
      render: (school: School) => (
        school.admin ? (
          <div>
            <p className="font-medium">{school.admin.fullName}</p>
            <p className="text-xs text-slate-500">{school.admin.email}</p>
          </div>
        ) : (
          <span className="text-slate-400 text-sm">-</span>
        )
      ),
    },
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
        onClose={() => {
          setIsModalOpen(false);
          reset();
          setStep(1);
          setShowPassword(false);
          setShowConfirmPassword(false);
        }}
        title="Create New School"
        size="md"
      >
        <StepIndicator currentStep={step} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <Input
                  {...register('name')}
                  label="School Name *"
                  placeholder="e.g. Greenfield Academy"
                  error={errors.name?.message}
                />
                <Input
                  {...register('subdomain')}
                  label="Subdomain"
                  placeholder="e.g. greenfield (optional)"
                  error={errors.subdomain?.message}
                />
                <Input
                  {...register('email')}
                  type="email"
                  label="School Email"
                  placeholder="info@school.edu"
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
                <div className="flex gap-3 pt-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={nextStep} className="ml-auto">
                    Next: Admin Account
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <Input
                  {...register('adminFullName')}
                  label="Admin Full Name *"
                  placeholder="e.g. Mrs Folake Adeleke"
                  error={errors.adminFullName?.message}
                />
                <Input
                  {...register('adminEmail')}
                  type="email"
                  label="Admin Email *"
                  placeholder="admin@school.edu"
                  error={errors.adminEmail?.message}
                />

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register('adminPassword')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn(
                        'w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 px-4 py-2.5 pr-10 text-sm',
                        errors.adminPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.adminPassword?.message && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.adminPassword.message}</p>
                  )}

                  {/* Password strength checklist */}
                  {adminPassword && (
                    <div className="mt-2 space-y-1">
                      {[
                        { label: '8–32 characters', met: adminPassword.length >= 8 && adminPassword.length <= 32 },
                        { label: 'One uppercase letter', met: /[A-Z]/.test(adminPassword) },
                        { label: 'One lowercase letter', met: /[a-z]/.test(adminPassword) },
                        { label: 'One number', met: /\d/.test(adminPassword) },
                        { label: 'One special character (@$!%*?&)', met: /[@$!%*?&]/.test(adminPassword) },
                      ].map((rule) => (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          <div className={cn(
                            'w-3.5 h-3.5 rounded-full flex items-center justify-center',
                            rule.met ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          )}>
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className={cn('text-xs', rule.met ? 'text-green-600 dark:text-green-400' : 'text-slate-500')}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register('adminConfirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn(
                        'w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 px-4 py-2.5 pr-10 text-sm',
                        errors.adminConfirmPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.adminConfirmPassword?.message && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.adminConfirmPassword.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <Button type="button" variant="outline" size="sm" onClick={prevStep}>
                    Back
                  </Button>
                  <Button type="submit" size="sm" isLoading={isSubmitting} className="ml-auto">
                    Create School
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Modal>
    </div>
  );
}
