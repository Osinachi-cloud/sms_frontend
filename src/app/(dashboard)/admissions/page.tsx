'use client';

import { admissionApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, CheckCircle, XCircle, Clock, Eye, Plus, User, Mail, Phone, MapPin,
  GraduationCap, Calendar, UserCircle, BookOpen, ArrowRight, AlertCircle,
  ClipboardCheck, Users, FileCheck, ChevronRight, Undo2, LogIn,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { AdmissionApplication, PageResponse } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const admissionSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  intendedClassName: z.string().optional(),
  previousSchool: z.string().optional(),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  guardianPhone: z.string().min(1, 'Guardian phone is required'),
  guardianRelationship: z.string().optional(),
  guardianAddress: z.string().optional(),
  guardianPassword: z.string()
    .refine((val) => !val || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/.test(val), {
      message: 'Password must be 8-32 chars with uppercase, lowercase, number and special char (@$!%*?&)'
    })
    .optional()
    .or(z.literal('')),
});

type AdmissionForm = z.infer<typeof admissionSchema>;

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

const pipelineStages = [
  { key: 'PENDING', label: 'Submitted', icon: ClipboardCheck },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: Eye },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview', icon: Users },
  { key: 'ACCEPTED', label: 'Accepted', icon: FileCheck },
];

export default function AdmissionsPage() {
  const { currentSchool, hasPermission } = useAuth();
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW' | 'INTERVIEW_SCHEDULED' | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AdmissionForm>({
    resolver: zodResolver(admissionSchema),
  });

  const fetchApplications = async () => {
    if (!currentSchool) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await admissionApi.getAll(currentSchool.id, {
        page,
        size: 10,
        status: statusFilter || undefined,
      });
      const data = res.data as PageResponse<AdmissionApplication>;
      setApplications(data.content);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load admissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [currentSchool, page, statusFilter]);

  const onSubmit = async (data: AdmissionForm) => {
    if (!currentSchool) return;
    try {
      await admissionApi.submit(currentSchool.id, {
        ...data,
        status: 'PENDING',
      });
      toast.success('Admission application submitted successfully');
      setIsModalOpen(false);
      reset();
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    }
  };

  const handleReview = async () => {
    if (!selectedApp || !reviewAction) return;
    try {
      await admissionApi.review(selectedApp.id, {
        status: reviewAction,
        reviewNotes: reviewNotes || undefined,
      });
      toast.success(`Application ${statusLabels[reviewAction]}`);
      setSelectedApp(null);
      setReviewNotes('');
      setReviewAction(null);
      fetchApplications();
    } catch {
      toast.error('Failed to update application');
    }
  };

  // Filter by view mode + search
  const filteredApps = applications.filter((a) => {
    const matchesView = showCompleted
      ? a.status === 'ACCEPTED' || a.status === 'REJECTED'
      : a.status !== 'ACCEPTED';
    if (!matchesView) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.fullName?.toLowerCase().includes(q) ||
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.applicationNumber?.toLowerCase().includes(q) ||
      a.guardianName?.toLowerCase().includes(q) ||
      a.intendedClassName?.toLowerCase().includes(q)
    );
  });

  const getStageIndex = (status: string) => pipelineStages.findIndex((s) => s.key === status);

  const columns = [
    {
      key: 'fullName',
      header: 'Applicant',
      render: (app: AdmissionApplication) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-medium">
            {app.firstName?.charAt(0)}{app.lastName?.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{app.fullName || `${app.firstName} ${app.lastName}`}</p>
            <p className="text-xs text-slate-500">{app.applicationNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (app: AdmissionApplication) => app.gender || '-',
    },
    {
      key: 'intendedClassName',
      header: 'Class',
      render: (app: AdmissionApplication) => app.intendedClassName || '-',
    },
    {
      key: 'guardian',
      header: 'Guardian',
      render: (app: AdmissionApplication) => (
        <div>
          <p className="text-sm">{app.guardianName}</p>
          <p className="text-xs text-slate-500">{app.guardianPhone}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (app: AdmissionApplication) => {
        const stageIdx = getStageIndex(app.status);
        const pct = stageIdx >= 0 ? ((stageIdx + 1) / pipelineStages.length) * 100 : 0;
        return (
          <div className="w-28">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${statusColors[app.status]}`}>
                {statusLabels[app.status] || app.status}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  app.status === 'REJECTED' ? 'bg-red-500' : 'bg-primary-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Applied',
      render: (app: AdmissionApplication) =>
        app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (app: AdmissionApplication) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Details</span>
          </Button>
        </div>
      ),
    },
  ];

  if (!currentSchool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Please select a school to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="admissions">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">Admissions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {showCompleted ? 'Review completed admission records' : 'Manage active admission applications'}
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission('student.create') && !showCompleted && (
            <Button onClick={() => { reset(); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4" />
              New Admission
            </Button>
          )}
        </div>
      </div>

      {/* Toggle between Active & Completed */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 w-fit">
        <button
          onClick={() => { setShowCompleted(false); setPage(0); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !showCompleted
              ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Active Applications
        </button>
        <button
          onClick={() => { setShowCompleted(true); setPage(0); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            showCompleted
              ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Completed
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-10 w-full"
              />
            </div>
            {!showCompleted && (
              <select
                className="glass-input w-full sm:w-44"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Active Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredApps}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={showCompleted ? 'No completed admissions found' : 'No active admission applications found'}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            mobileCardRender={(app: AdmissionApplication) => (
              <div className="space-y-2" onClick={() => setSelectedApp(app)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Name</span>
                  <span className="text-sm font-medium">{app.fullName || `${app.firstName} ${app.lastName}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Class</span>
                  <span className="text-sm">{app.intendedClassName || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Guardian</span>
                  <span className="text-sm">{app.guardianName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Stage</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[app.status]}`}>
                    {statusLabels[app.status]}
                  </span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* New Admission Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="New Admission Application"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input {...register('firstName')} label="First Name *" placeholder="e.g. Michael" error={errors.firstName?.message} />
              <Input {...register('lastName')} label="Last Name *" placeholder="e.g. Johnson" error={errors.lastName?.message} />
              <Input {...register('dateOfBirth')} type="date" label="Date of Birth" />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                <select {...register('gender')} className="glass-input w-full">
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Input {...register('email')} type="email" label="Email" placeholder="[EMAIL_REDACTED]" error={errors.email?.message} />
              <Input {...register('phone')} label="Phone" placeholder="+234..." />
              <Input {...register('intendedClassName')} label="Intended Class" placeholder="e.g. JSS 1" />
              <Input {...register('previousSchool')} label="Previous School" placeholder="Name of previous school" />
              <div className="sm:col-span-2">
                <Input {...register('address')} label="Address" placeholder="Residential address" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-primary-500" />
              Parent / Guardian Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input {...register('guardianName')} label="Guardian Name *" placeholder="e.g. Mr. Johnson" error={errors.guardianName?.message} />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Relationship</label>
                <select {...register('guardianRelationship')} className="glass-input w-full">
                  <option value="">Select relationship</option>
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="BOTH_PARENTS">Both Parents</option>
                  <option value="GUARDIAN">Guardian</option>
                  <option value="SIBLING">Sibling</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Input {...register('guardianEmail')} type="email" label="Guardian Email" placeholder="[EMAIL_REDACTED]" error={errors.guardianEmail?.message} />
              <Input {...register('guardianPhone')} label="Guardian Phone *" placeholder="+234..." error={errors.guardianPhone?.message} />
              <Input {...register('guardianPassword')} type="password" label="Guardian Password (optional)" placeholder="Set password for parent login" error={errors.guardianPassword?.message} />
              <div className="sm:col-span-2">
                <Input {...register('guardianAddress')} label="Guardian Address" placeholder="Guardian's address" />
              </div>
              <div className="sm:col-span-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-start gap-2">
                <LogIn className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  If email and password are provided, a parent login account will be created. 
                  The account will remain <strong>inactive</strong> until this admission is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Application Details & Review Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => { setSelectedApp(null); setReviewNotes(''); setReviewAction(null); }}
        title={
          selectedApp
            ? `${selectedApp.fullName || `${selectedApp.firstName} ${selectedApp.lastName}`} — ${selectedApp.applicationNumber}`
            : 'Application Details'
        }
        size="xl"
      >
        {selectedApp && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
            {/* Admission Stage Pipeline */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Admission Progress</h3>
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                {pipelineStages.map((stage, idx) => {
                  const currentIdx = getStageIndex(selectedApp.status);
                  const isActive = stage.key === selectedApp.status;
                  const isCompleted = currentIdx > idx;
                  const Icon = stage.icon;

                  return (
                    <div key={stage.key} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30'
                              : isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-semibold whitespace-nowrap ${
                            isActive ? 'text-primary-600 dark:text-primary-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                      {idx < pipelineStages.length - 1 && (
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isCompleted ? 'text-green-500' : 'text-slate-300'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedApp.status === 'REJECTED' && (
                <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-400 font-medium">Application Rejected</span>
                </div>
              )}
            </div>

            {/* Student Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-500" />
                Applicant Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoItem icon={<User className="w-4 h-4 text-primary-500" />} label="Full Name" value={`${selectedApp.firstName} ${selectedApp.lastName}`} />
                <InfoItem icon={<Calendar className="w-4 h-4 text-primary-500" />} label="Date of Birth" value={selectedApp.dateOfBirth ? new Date(selectedApp.dateOfBirth).toLocaleDateString() : 'N/A'} />
                <InfoItem icon={<BookOpen className="w-4 h-4 text-primary-500" />} label="Gender" value={selectedApp.gender || 'N/A'} />
                <InfoItem icon={<Mail className="w-4 h-4 text-primary-500" />} label="Email" value={selectedApp.email || 'N/A'} />
                <InfoItem icon={<Phone className="w-4 h-4 text-primary-500" />} label="Phone" value={selectedApp.phone || 'N/A'} />
                <InfoItem icon={<GraduationCap className="w-4 h-4 text-primary-500" />} label="Intended Class" value={selectedApp.intendedClassName || 'N/A'} />
                <InfoItem icon={<BookOpen className="w-4 h-4 text-primary-500" />} label="Previous School" value={selectedApp.previousSchool || 'N/A'} />
                <InfoItem icon={<Calendar className="w-4 h-4 text-primary-500" />} label="Applied On" value={new Date(selectedApp.createdAt).toLocaleDateString()} />
                <InfoItem icon={<MapPin className="w-4 h-4 text-primary-500" />} label="Address" value={selectedApp.address || 'N/A'} span />
              </div>
            </div>

            {/* Guardian Info */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-primary-500" />
                Parent / Guardian Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoItem icon={<UserCircle className="w-4 h-4 text-primary-500" />} label="Name" value={selectedApp.guardianName} />
                <InfoItem icon={<Phone className="w-4 h-4 text-primary-500" />} label="Phone" value={selectedApp.guardianPhone} />
                <InfoItem icon={<Mail className="w-4 h-4 text-primary-500" />} label="Email" value={selectedApp.guardianEmail || 'N/A'} />
                <InfoItem icon={<User className="w-4 h-4 text-primary-500" />} label="Relationship" value={selectedApp.guardianRelationship || 'N/A'} />
                <InfoItem icon={<MapPin className="w-4 h-4 text-primary-500" />} label="Address" value={selectedApp.guardianAddress || 'N/A'} span />
              </div>
            </div>

            {/* Previous Review Notes */}
            {selectedApp.reviewNotes && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-semibold">Previous Review Notes</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{selectedApp.reviewNotes}</p>
              </div>
            )}

            {/* Review Actions */}
            {!showCompleted && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Review Decision</h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {(['ACCEPTED', 'REJECTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED'] as const).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setReviewAction(action)}
                      disabled={action === selectedApp.status}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                        reviewAction === action
                          ? action === 'ACCEPTED'
                            ? 'bg-green-600 text-white border-green-600'
                            : action === 'REJECTED'
                            ? 'bg-red-600 text-white border-red-600'
                            : action === 'UNDER_REVIEW'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-purple-600 text-white border-purple-600'
                          : action === selectedApp.status
                          ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {action === 'ACCEPTED' && <CheckCircle className="w-3.5 h-3.5" />}
                      {action === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                      {action === 'UNDER_REVIEW' && <Clock className="w-3.5 h-3.5" />}
                      {action === 'INTERVIEW_SCHEDULED' && <Users className="w-3.5 h-3.5" />}
                      {statusLabels[action]}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes (optional)..."
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 px-4 py-3 text-sm min-h-[80px] resize-y"
                />

                <div className="flex gap-2 pt-3">
                  <Button variant="secondary" onClick={() => { setSelectedApp(null); setReviewNotes(''); setReviewAction(null); }}>
                    Close
                  </Button>
                  <Button
                    onClick={handleReview}
                    disabled={!reviewAction || reviewAction === selectedApp.status}
                  >
                    {reviewAction === 'ACCEPTED' ? 'Approve Application' : 'Update Status'}
                  </Button>
                </div>
              </div>
            )}

            {showCompleted && (
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => { setSelectedApp(null); setReviewNotes(''); setReviewAction(null); }}>
                  Close
                </Button>
                {selectedApp.status === 'REJECTED' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReviewAction('PENDING');
                      setReviewNotes('Re-opened from rejected');
                      handleReview();
                    }}
                  >
                    <Undo2 className="w-4 h-4" />
                    Re-open
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value, span }: { icon: React.ReactNode; label: string; value: string | undefined; span?: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${span ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{value}</p>
      </div>
    </div>
  );
}
