'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth';
import { userApi, roleApi, teacherApi, parentApi } from '@/lib/api';
import { formatDate, getStatusColor, validatePassword } from '@/lib/utils';
import { Role, PageResponse } from '@/types';
import { Plus, Search, UserCog, GraduationCap, Users, Shield, ChevronRight, ChevronLeft, Check, UserCircle, Mail, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

type UserType = 'admin' | 'teacher' | 'parent';
type Step = 1 | 2;

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

  // Multi-step form state
  const [step, setStep] = useState<Step>(1);
  const [userType, setUserType] = useState<UserType>('admin');
  const [formData, setFormData] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    // Teacher fields
    employeeId: '',
    specialization: '',
    qualification: '',
    dateOfJoining: '',
    // Parent fields
    relationship: '',
    occupation: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    if (!currentSchool) return;
    try {
      const response = await userApi.getAll(currentSchool.id, { page, size: 10, search: search || undefined });
      const data = response.data as PageResponse<SchoolUser>;
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch {
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
    } catch {
      toast.error('Failed to load roles');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentSchool, page, search]);

  useEffect(() => {
    if (isModalOpen) fetchRoles();
  }, [isModalOpen]);

  const resetForm = () => {
    setStep(1);
    setUserType('admin');
    setFormData({ fullName: '', email: '', phone: '', password: '', employeeId: '', specialization: '', qualification: '', dateOfJoining: '', relationship: '', occupation: '', address: '' });
    setErrors({});
  };

  const getAutoRoleName = (type: UserType): string => {
    // Find a matching role from the backend roles list
    const match = roles.find((r) => {
      const name = r.name.toLowerCase();
      if (type === 'teacher') return name.includes('teacher');
      if (type === 'parent') return name.includes('parent') || name.includes('guardian');
      // Admin / Staff: only match admin-related role names
      // Do NOT fall back to isSystemRole — that can incorrectly match Teacher/Student roles
      return name.includes('admin') || name.includes('staff') || name.includes('manager') || name.includes('director') || name.includes('head');
    });
    return match?.name || '';
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.length < 2) e.fullName = 'Full name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Valid email is required';
    if (userType === 'admin' && !formData.password) e.password = 'Password is required for admin users';
    if (formData.password) {
      const pwdError = validatePassword(formData.password);
      if (pwdError) e.password = pwdError;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!currentSchool || !validate()) return;

    const roleName = getAutoRoleName(userType);
    if (!roleName) {
      toast.error(`No matching ${userType} role found. Please create a role first in Roles settings.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (userType === 'teacher') {
        await teacherApi.create(currentSchool.id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || undefined,
          employeeId: formData.employeeId,
          specialization: formData.specialization,
          qualification: formData.qualification,
          dateOfJoining: formData.dateOfJoining,
        });
      } else if (userType === 'parent') {
        await parentApi.create(currentSchool.id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || undefined,
          relationship: formData.relationship,
          occupation: formData.occupation,
          address: formData.address,
        });
      } else {
        // Admin requires a password
        const adminPassword = formData.password || '';
        if (!adminPassword) {
          toast.error('Password is required for admin users');
          setIsSubmitting(false);
          return;
        }
        const pwdError = validatePassword(adminPassword);
        if (pwdError) {
          toast.error(pwdError);
          setIsSubmitting(false);
          return;
        }
        await userApi.create(currentSchool.id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: adminPassword,
          roleName,
        });
      }
      toast.success(`${userType === 'teacher' ? 'Teacher' : userType === 'parent' ? 'Parent / Guardian' : 'User'} created successfully`);
      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTypeCards = [
    { key: 'admin' as UserType, label: 'Admin / Staff', icon: Shield, color: 'bg-purple-500' },
    { key: 'teacher' as UserType, label: 'Teacher', icon: GraduationCap, color: 'bg-green-500' },
    { key: 'parent' as UserType, label: 'Parent / Guardian', icon: Users, color: 'bg-blue-500' },
  ];

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
    { key: 'phone', header: 'Phone', render: (u: SchoolUser) => u.phone || '-', mobileHidden: true },
    {
      key: 'status',
      header: 'Account Status',
      render: (user: SchoolUser) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.isActive ? 'ACTIVE' : 'INACTIVE')}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: (u: SchoolUser) => (u.joinedAt ? formatDate(u.joinedAt) : '-'),
      mobileHidden: true,
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
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
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
              <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="glass-input pl-10" />
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
            mobileCardRender={(user: SchoolUser) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Name</span>
                  <span className="text-sm font-medium">{user.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Role</span>
                  <span className="text-sm">{user.roleName || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(user.isActive ? 'ACTIVE' : 'INACTIVE')}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={`Add New ${userType === 'teacher' ? 'Teacher' : userType === 'parent' ? 'Parent / Guardian' : 'User'}`} size="lg">
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[1, 2].map((s) => {
              const isActive = step === s;
              const isCompleted = step > s;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                      isActive ? 'bg-primary-500 text-white border-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/30' :
                      isCompleted ? 'bg-green-500 text-white border-green-500' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : s}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                      {s === 1 ? 'Select Type' : userType === 'teacher' ? 'Teacher Details' : userType === 'parent' ? 'Parent Details' : 'User Details'}
                    </span>
                  </div>
                  {s < 2 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > s ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">What type of user are you adding?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {userTypeCards.map((type) => {
                const Icon = type.icon;
                const isActive = userType === type.key;
                return (
                  <button
                    key={type.key}
                    onClick={() => setUserType(type.key)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>{type.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Auto-selected role badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
              <UserCog className="w-4 h-4 text-primary-500" />
              <div>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wide">Selected Role</p>
                <p className="text-sm text-primary-800 dark:text-primary-300">
                  {getAutoRoleName(userType) || `No ${userType} role found — create one in Roles settings`}
                </p>
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-500" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                  <input value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} placeholder="User's full name" className={`glass-input w-full ${errors.fullName ? 'border-red-500' : ''}`} />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email (Username) *</label>
                  <input value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} type="email" placeholder="user@school.com" className={`glass-input w-full ${errors.email ? 'border-red-500' : ''}`} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="+234..." className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password {userType === 'admin' && '*'}</label>
                  <input value={formData.password} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} type="password" placeholder={userType === 'admin' ? 'Required for admin users' : 'Leave blank for no login account'} className={`glass-input w-full ${errors.password ? 'border-red-500' : ''}`} />
                  <p className="text-xs text-slate-500 mt-1">Min 8 chars with uppercase, lowercase, number & special char.</p>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                The email address will be used as the username for login. A password is required so the user can sign in immediately.
              </p>
            </div>

            {/* Teacher-specific fields */}
            {userType === 'teacher' && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary-500" />
                  Teacher Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Employee ID</label>
                    <input value={formData.employeeId} onChange={(e) => setFormData((p) => ({ ...p, employeeId: e.target.value }))} placeholder="e.g. TCH/2026/001" className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Specialization</label>
                    <input value={formData.specialization} onChange={(e) => setFormData((p) => ({ ...p, specialization: e.target.value }))} placeholder="e.g. Mathematics" className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Qualification</label>
                    <input value={formData.qualification} onChange={(e) => setFormData((p) => ({ ...p, qualification: e.target.value }))} placeholder="e.g. M.Ed Mathematics" className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date of Joining</label>
                    <input value={formData.dateOfJoining} onChange={(e) => setFormData((p) => ({ ...p, dateOfJoining: e.target.value }))} type="date" className="glass-input w-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Parent-specific fields */}
            {userType === 'parent' && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-primary-500" />
                  Parent / Guardian Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Relationship</label>
                    <select value={formData.relationship} onChange={(e) => setFormData((p) => ({ ...p, relationship: e.target.value }))} className="glass-input w-full">
                      <option value="">Select relationship</option>
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="GUARDIAN">Guardian</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Occupation</label>
                    <input value={formData.occupation} onChange={(e) => setFormData((p) => ({ ...p, occupation: e.target.value }))} placeholder="e.g. Civil Servant" className="glass-input w-full" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                    <input value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} placeholder="Residential address" className="glass-input w-full" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  This parent account can be linked to students from the student creation page.
                </p>
              </div>
            )}

            {/* Admin note */}
            {userType === 'admin' && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Admin users have full access to school management. Ensure this role is only assigned to trusted staff.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleSubmit} isLoading={isSubmitting}>
                <Check className="w-4 h-4 mr-1" />
                {userType === 'teacher' ? 'Create Teacher' : userType === 'parent' ? 'Create Parent / Guardian' : 'Create User'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
