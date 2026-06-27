'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { studentApi, parentApi, classApi, teacherStudentApi } from '@/lib/api';
import { getStatusColor, validatePassword, normalizeListResponse } from '@/lib/utils';
import { Student, PageResponse } from '@/types';
import { Plus, Search, Upload, User, ArrowRight, Check, ChevronRight, ChevronLeft, Users, LogIn, UserPlus, UserCheck, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

type ParentMode = 'new' | 'existing' | 'none';
type Step = 1 | 2 | 3;

interface ParentOption {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface StudentDraft {
  fullName: string;
  emailOrUsername: string;
  phone: string;
  gender: string;
  password: string;
  dateOfBirth: string;
  admissionNumber: string;
  address: string;
  classId: string;
  status: string;
}

interface ParentDraft {
  fullName: string;
  email: string;
  phone: string;
  relationship: string;
  address: string;
  occupation: string;
  password: string;
}

export default function StudentsPage() {
  const { currentSchool, hasPermission } = useAuth();
  const isAdmin = currentSchool?.roleName?.toLowerCase().includes('admin') ?? false;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [classesList, setClassesList] = useState<{ id: string; name: string }[]>([]);

  // Query params for teacher class/subject filtering
  const queryClassId = searchParams.get('class') || '';
  const querySubjectId = searchParams.get('subject') || '';
  const isTeacher = currentSchool?.roleName?.toLowerCase() === 'teacher';

  // Multi-step form state
  const [step, setStep] = useState<Step>(1);
  const [studentInfo, setStudentInfo] = useState<StudentDraft>({
    fullName: '',
    emailOrUsername: '',
    phone: '',
    gender: '',
    password: '',
    dateOfBirth: '',
    admissionNumber: '',
    address: '',
    classId: '',
    status: 'ACTIVE',
  });
  const [parentMode, setParentMode] = useState<ParentMode>('new');
  const [parentInfo, setParentInfo] = useState<ParentDraft>({
    fullName: '',
    email: '',
    phone: '',
    relationship: '',
    address: '',
    occupation: '',
    password: '',
  });
  const [existingParents, setExistingParents] = useState<ParentOption[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    admissionNumber: '',
    address: '',
    classId: '',
    status: 'ACTIVE',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const fetchStudents = async () => {
    if (!currentSchool) {
      setIsLoading(false);
      return;
    }
    try {
      let data: PageResponse<Student> | { content: Student[]; totalPages: number };
      if (isTeacher) {
        const response = await teacherStudentApi.getMyStudents(currentSchool.id, {
          classId: queryClassId || undefined,
          subjectId: querySubjectId || undefined,
        });
        const normalized = normalizeListResponse<Student>(response.data);
        data = { content: normalized.items, totalPages: normalized.totalPages };
      } else {
        const response = await studentApi.getAll(currentSchool.id, {
          page,
          size: 10,
          search: search || undefined,
          status: statusFilter || undefined,
          classId: queryClassId || undefined,
        });
        data = response.data as PageResponse<Student>;
      }
      setStudents(data.content);
      setTotalPages(data.totalPages);
      const uniqueClasses = Array.from(new Set(data.content.map((s) => s.className).filter(Boolean))) as string[];
      if (uniqueClasses.length > 0) setAvailableClasses(uniqueClasses);

      // Sync classFilter from query param if we now know the class name
      if (queryClassId && !classFilter) {
        const matched = classesList.find((c) => c.id === queryClassId);
        if (matched) setClassFilter(matched.name);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParents = useCallback(async () => {
    if (!currentSchool) return;
    try {
      const res = await parentApi.getAll(currentSchool.id, { size: 100 });
      setExistingParents((res.data as any)?.content || []);
    } catch {
      // silent
    }
  }, [currentSchool]);

  const fetchClasses = useCallback(async () => {
    if (!currentSchool) return;
    try {
      const res = await classApi.getAll(currentSchool.id, { size: 100 });
      const data = res.data as PageResponse<{ id: string; name: string }>;
      setClassesList(data.content || []);
      const names = (data.content || []).map((c) => c.name);
      if (names.length > 0) setAvailableClasses(names);
    } catch {
      // silent
    }
  }, [currentSchool]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [currentSchool, page, search, statusFilter, queryClassId, querySubjectId]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isModalOpen && step === 2 && parentMode === 'existing') {
      fetchParents();
    }
  }, [isModalOpen, step, parentMode, fetchParents]);

  const resetForm = () => {
    setStep(1);
    setStudentInfo({ fullName: '', emailOrUsername: '', phone: '', gender: '', password: '', dateOfBirth: '', admissionNumber: '', address: '', classId: '', status: 'ACTIVE' });
    setParentInfo({ fullName: '', email: '', phone: '', relationship: '', address: '', occupation: '', password: '' });
    setParentMode('new');
    setSelectedParentId('');
    setErrors({});
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!studentInfo.fullName.trim() || studentInfo.fullName.length < 2) e.fullName = 'Full name is required';
    if (studentInfo.emailOrUsername && studentInfo.emailOrUsername.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentInfo.emailOrUsername)) {
        e.emailOrUsername = 'Invalid email format';
      }
    } else if (studentInfo.emailOrUsername) {
      if (!/[@$!%*?&._-]/.test(studentInfo.emailOrUsername)) {
        e.emailOrUsername = 'Username must contain at least one special character (@$!%*?&._-)';
      }
    }
    if (studentInfo.password) {
      const pwdErr = validatePassword(studentInfo.password);
      if (pwdErr) e.password = pwdErr;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (parentMode === 'new') {
      if (!parentInfo.fullName.trim() || parentInfo.fullName.length < 2) e.parentFullName = 'Parent name is required';
      if (parentInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentInfo.email)) e.parentEmail = 'Invalid email';
      if (parentInfo.password) {
        const pwdErr = validatePassword(parentInfo.password);
        if (pwdErr) e.parentPassword = pwdErr;
      }
    } else if (parentMode === 'existing') {
      if (!selectedParentId) e.parentSelect = 'Please select a parent';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!currentSchool) return;
    setIsSubmitting(true);
    try {
      const studentPayload: any = {
        fullName: studentInfo.fullName,
        phone: studentInfo.phone || undefined,
        gender: studentInfo.gender || undefined,
        password: studentInfo.password || undefined,
        dateOfBirth: studentInfo.dateOfBirth || undefined,
        admissionNumber: studentInfo.admissionNumber || undefined,
        address: studentInfo.address || undefined,
        classId: studentInfo.classId || undefined,
        status: studentInfo.status,
      };

      // Parse emailOrUsername into email or username
      if (studentInfo.emailOrUsername) {
        if (studentInfo.emailOrUsername.includes('@')) {
          studentPayload.email = studentInfo.emailOrUsername;
        } else {
          studentPayload.username = studentInfo.emailOrUsername;
        }
      }

      // Prepare parent payload
      let parentPayload: any = undefined;
      if (parentMode === 'new') {
        parentPayload = {
          ...parentInfo,
          password: parentInfo.password || undefined,
          status: 'ACTIVE',
        };
      } else if (parentMode === 'existing') {
        parentPayload = { parentId: selectedParentId };
      }

      await studentApi.create(currentSchool.id, {
        ...studentPayload,
        parent: parentPayload,
      });

      toast.success('Student added successfully');
      setIsModalOpen(false);
      resetForm();
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!currentSchool || !confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentApi.delete(currentSchool.id, studentId);
      toast.success('Student deleted');
      fetchStudents();
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName,
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender || '',
      dateOfBirth: student.dateOfBirth || '',
      admissionNumber: student.admissionNumber || '',
      address: student.address || '',
      classId: student.classId || '',
      status: student.status || 'ACTIVE',
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const validateEdit = () => {
    const e: Record<string, string> = {};
    if (!editForm.fullName.trim() || editForm.fullName.length < 2) e.fullName = 'Full name is required';
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) e.email = 'Invalid email';
    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = async () => {
    if (!currentSchool || !editingStudent || !validateEdit()) return;
    setIsEditSubmitting(true);
    try {
      await studentApi.update(currentSchool.id, editingStudent.id, editForm);
      toast.success('Student updated successfully');
      setIsEditModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const displayedStudents = classFilter ? students.filter((s) => s.className === classFilter) : students;

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
      render: (s: Student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{s.fullName}</p>
            <p className="text-xs text-slate-500">{s.admissionNumber}</p>
            {isTeacher && s.isClassTeacher && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 mt-0.5">
                My Class
              </span>
            )}
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (s: Student) => s.email || '-', mobileHidden: true },
    { key: 'className', header: 'Class', render: (s: Student) => s.className || '-' },
    { key: 'parentPhone', header: 'Parent Phone', render: (s: Student) => s.parentPhone || '-', mobileHidden: true },
    {
      key: 'status',
      header: 'Status',
      render: (s: Student) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>{s.status}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s: Student) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/students/${s.id}`); }}>
            View
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          {(isAdmin || hasPermission('student.update')) && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
          )}
          {(isAdmin || hasPermission('student.delete')) && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const steps = [
    { num: 1, label: 'Student Info', icon: User },
    { num: 2, label: 'Parent / Guardian', icon: Users },
    { num: 3, label: 'Review', icon: Check },
  ] as const;

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="students-table">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Students</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage student records</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {(isAdmin || hasPermission('student.bulk.enroll')) && (
            <Link href="/students/bulk-enroll">
              <Button variant="secondary">
                <Upload className="w-4 h-4" />
                Bulk Enroll
              </Button>
            </Link>
          )}
          {(isAdmin || hasPermission('student.create')) && (
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4" />
              Add Student
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
                placeholder="Search students..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="glass-input pl-10 w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="glass-input w-full sm:w-36">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="GRADUATED">Graduated</option>
              </select>
              {availableClasses.length > 0 && (
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="glass-input w-full sm:w-40">
                  <option value="">All Classes</option>
                  {availableClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto scrollbar-hide">
          <DataTable
            columns={columns}
            data={displayedStudents}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="No students found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onRowClick={(s: Student) => router.push(`/students/${s.id}`)}
            mobileCardRender={(s: Student) => (
              <div className="space-y-2 cursor-pointer" onClick={() => router.push(`/students/${s.id}`)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Name</span>
                  <div className="text-right">
                    <span className="text-sm font-medium">{s.fullName}</span>
                    {isTeacher && s.isClassTeacher && (
                      <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                        My Class
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Admission #</span><span className="text-sm">{s.admissionNumber}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Class</span><span className="text-sm">{s.className || '-'}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Status</span><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>{s.status}</span></div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Multi-step Add Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Add New Student"
        size="lg"
      >
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                        isActive
                          ? 'bg-primary-500 text-white border-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/30'
                          : isCompleted
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > s.num ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Student Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                <input value={studentInfo.fullName} onChange={(e) => setStudentInfo((p) => ({ ...p, fullName: e.target.value }))} placeholder="Student's full name" className={`glass-input w-full ${errors.fullName ? 'border-red-500' : ''}`} />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email or Username</label>
                <input value={studentInfo.emailOrUsername} onChange={(e) => setStudentInfo((p) => ({ ...p, emailOrUsername: e.target.value }))} placeholder="email@example.com or student_username" className={`glass-input w-full ${errors.emailOrUsername ? 'border-red-500' : ''}`} />
                <p className="text-xs text-slate-500 mt-1">Students can use an email or a username. If using a username, include at least one special character (@$!%*?&._-).</p>
                {errors.emailOrUsername && <p className="text-red-500 text-xs mt-1">{errors.emailOrUsername}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                <input value={studentInfo.phone} onChange={(e) => setStudentInfo((p) => ({ ...p, phone: e.target.value }))} placeholder="+234..." className="glass-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Admission Number</label>
                <input value={studentInfo.admissionNumber} onChange={(e) => setStudentInfo((p) => ({ ...p, admissionNumber: e.target.value }))} placeholder="Auto-generated if blank" className="glass-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                <input value={studentInfo.dateOfBirth} onChange={(e) => setStudentInfo((p) => ({ ...p, dateOfBirth: e.target.value }))} type="date" className="glass-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                <select value={studentInfo.gender} onChange={(e) => setStudentInfo((p) => ({ ...p, gender: e.target.value }))} className="glass-input w-full">
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Class</label>
                <select value={studentInfo.classId} onChange={(e) => setStudentInfo((p) => ({ ...p, classId: e.target.value }))} className="glass-input w-full">
                  <option value="">Select a class</option>
                  {classesList.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                  {classesList.length === 0 && <option value="" disabled>No classes available</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input value={studentInfo.password} onChange={(e) => setStudentInfo((p) => ({ ...p, password: e.target.value }))} type="password" placeholder="Leave blank to use default: Password@12" className="glass-input w-full" />
                <p className="text-xs text-slate-500 mt-1">Min 8 chars with uppercase, lowercase, number & special char. Defaults to Password@12 if blank.</p>
                {studentInfo.password && validatePassword(studentInfo.password) && (
                  <p className="text-red-500 text-xs mt-1">{validatePassword(studentInfo.password)}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                <input value={studentInfo.address} onChange={(e) => setStudentInfo((p) => ({ ...p, address: e.target.value }))} placeholder="Residential address" className="glass-input w-full" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={nextStep}>
                Next: Parent / Guardian
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Parent / Guardian */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              Parent / Guardian Setup
            </h3>

            {/* Mode toggle */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'new', label: 'Create New', icon: UserPlus },
                { key: 'existing', label: 'Select Existing', icon: UserCheck },
                { key: 'none', label: 'Skip for Now', icon: ChevronRight },
              ] as { key: ParentMode; label: string; icon: typeof UserPlus }[]).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    onClick={() => { setParentMode(m.key); setErrors({}); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      parentMode === m.key
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* New Parent Form */}
            {parentMode === 'new' && (
              <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500">A new parent/guardian user account will be created and linked to this student.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                    <input value={parentInfo.fullName} onChange={(e) => setParentInfo((p) => ({ ...p, fullName: e.target.value }))} placeholder="Parent's full name" className={`glass-input w-full ${errors.parentFullName ? 'border-red-500' : ''}`} />
                    {errors.parentFullName && <p className="text-red-500 text-xs mt-1">{errors.parentFullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                    <input value={parentInfo.email} onChange={(e) => setParentInfo((p) => ({ ...p, email: e.target.value }))} type="email" placeholder="parent@example.com" className={`glass-input w-full ${errors.parentEmail ? 'border-red-500' : ''}`} />
                    {errors.parentEmail && <p className="text-red-500 text-xs mt-1">{errors.parentEmail}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                    <input value={parentInfo.phone} onChange={(e) => setParentInfo((p) => ({ ...p, phone: e.target.value }))} placeholder="+234..." className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Relationship</label>
                    <select value={parentInfo.relationship} onChange={(e) => setParentInfo((p) => ({ ...p, relationship: e.target.value }))} className="glass-input w-full">
                      <option value="">Select relationship</option>
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="BOTH_PARENTS">Both Parents</option>
                      <option value="GUARDIAN">Guardian</option>
                      <option value="SIBLING">Sibling</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Occupation</label>
                    <input value={parentInfo.occupation} onChange={(e) => setParentInfo((p) => ({ ...p, occupation: e.target.value }))} placeholder="e.g. Engineer" className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password (optional)</label>
                    <input value={parentInfo.password} onChange={(e) => setParentInfo((p) => ({ ...p, password: e.target.value }))} type="password" placeholder="Leave blank to use default: Password@12" className={`glass-input w-full ${errors.parentPassword ? 'border-red-500' : ''}`} />
                    <p className="text-xs text-slate-500 mt-1">Min 8 chars with uppercase, lowercase, number & special char. Defaults to Password@12 if blank.</p>
                    {errors.parentPassword && <p className="text-red-500 text-xs mt-1">{errors.parentPassword}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                    <input value={parentInfo.address} onChange={(e) => setParentInfo((p) => ({ ...p, address: e.target.value }))} placeholder="Parent's address" className="glass-input w-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Select Existing Parent */}
            {parentMode === 'existing' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Choose an existing parent/guardian already in the system.</p>
                  {selectedParentId && (
                    <button
                      type="button"
                      onClick={() => setSelectedParentId('')}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear selection
                    </button>
                  )}
                </div>
                {errors.parentSelect && <p className="text-red-500 text-xs">{errors.parentSelect}</p>}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search parents by name, email or phone..."
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    className="glass-input w-full pl-9"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto scrollbar-hide space-y-2">
                  {(() => {
                    const filtered = parentSearch.trim()
                      ? existingParents.filter((p) =>
                          p.fullName.toLowerCase().includes(parentSearch.toLowerCase()) ||
                          (p.email || '').toLowerCase().includes(parentSearch.toLowerCase()) ||
                          (p.phone || '').toLowerCase().includes(parentSearch.toLowerCase())
                        )
                      : existingParents;
                    if (filtered.length === 0) {
                      return (
                        <p className="text-sm text-slate-400 text-center py-4">
                          {parentSearch.trim() ? 'No parents match your search.' : 'No existing parents found. Create a new one instead.'}
                        </p>
                      );
                    }
                    return filtered.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedParentId === p.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="existingParent"
                          value={p.id}
                          checked={selectedParentId === p.id}
                          onChange={() => setSelectedParentId(p.id)}
                          className="w-4 h-4 text-primary-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{p.fullName}</p>
                          <p className="text-xs text-slate-500">{p.email || p.phone || 'No contact info'}</p>
                        </div>
                        {selectedParentId === p.id && <Check className="w-4 h-4 text-primary-500" />}
                      </label>
                    ));
                  })()}
                </div>
              </div>
            )}

            {parentMode === 'none' && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-center">
                <Users className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-amber-700 dark:text-amber-400">You can link a parent/guardian later from the student's profile page.</p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Next: Review
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-primary-500" />
              Review & Confirm
            </h3>

            {/* Student Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Student</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-400">Name:</span> <span className="font-medium">{studentInfo.fullName || '-'}</span></div>
                <div><span className="text-slate-400">Email/Username:</span> <span className="font-medium">{studentInfo.emailOrUsername || '-'}</span></div>
                <div><span className="text-slate-400">Phone:</span> <span className="font-medium">{studentInfo.phone || '-'}</span></div>
                <div><span className="text-slate-400">Gender:</span> <span className="font-medium">{studentInfo.gender || '-'}</span></div>
                <div><span className="text-slate-400">Class:</span> <span className="font-medium">{classesList.find(c => c.id === studentInfo.classId)?.name || '-'}</span></div>
                <div><span className="text-slate-400">DOB:</span> <span className="font-medium">{studentInfo.dateOfBirth || '-'}</span></div>
                <div className="col-span-2"><span className="text-slate-400">Address:</span> <span className="font-medium">{studentInfo.address || '-'}</span></div>
              </div>
            </div>

            {/* Parent Summary */}
            {parentMode === 'new' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">New Parent / Guardian</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-400">Name:</span> <span className="font-medium">{parentInfo.fullName || '-'}</span></div>
                  <div><span className="text-slate-400">Email:</span> <span className="font-medium">{parentInfo.email || '-'}</span></div>
                  <div><span className="text-slate-400">Phone:</span> <span className="font-medium">{parentInfo.phone || '-'}</span></div>
                  <div><span className="text-slate-400">Relationship:</span> <span className="font-medium">{parentInfo.relationship || '-'}</span></div>
                  <div className="col-span-2"><span className="text-slate-400">Address:</span> <span className="font-medium">{parentInfo.address || '-'}</span></div>
                </div>
                {parentInfo.password && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <LogIn className="w-3.5 h-3.5" />
                    Parent login account will be created
                  </div>
                )}
              </div>
            )}

            {parentMode === 'existing' && selectedParentId && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Linked Parent / Guardian</h4>
                {(() => {
                  const p = existingParents.find((ep) => ep.id === selectedParentId);
                  return p ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                        {p.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.fullName}</p>
                        <p className="text-xs text-slate-500">{p.email || p.phone || 'No contact info'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Parent not found</p>
                  );
                })()}
              </div>
            )}

            {parentMode === 'none' && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-400">No parent/guardian will be linked at this time.</p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleSubmit} isLoading={isSubmitting}>
                <Check className="w-4 h-4 mr-1" />
                Confirm & Create
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingStudent(null); }}
        title="Edit Student"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
              <input value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Student's full name" className={`glass-input w-full ${editErrors.fullName ? 'border-red-500' : ''}`} />
              {editErrors.fullName && <p className="text-red-500 text-xs mt-1">{editErrors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} type="email" placeholder="[EMAIL_REDACTED]" className={`glass-input w-full ${editErrors.email ? 'border-red-500' : ''}`} />
              {editErrors.email && <p className="text-red-500 text-xs mt-1">{editErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
              <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+234..." className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Admission Number</label>
              <input value={editForm.admissionNumber} onChange={(e) => setEditForm((p) => ({ ...p, admissionNumber: e.target.value }))} placeholder="Admission number" className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
              <input value={editForm.dateOfBirth} onChange={(e) => setEditForm((p) => ({ ...p, dateOfBirth: e.target.value }))} type="date" className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
              <select value={editForm.gender} onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))} className="glass-input w-full">
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Class</label>
              <select value={editForm.classId} onChange={(e) => setEditForm((p) => ({ ...p, classId: e.target.value }))} className="glass-input w-full">
                <option value="">Select a class</option>
                {classesList.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className="glass-input w-full">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="GRADUATED">Graduated</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
              <input value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} placeholder="Residential address" className="glass-input w-full" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} isLoading={isEditSubmitting}>
              <Check className="w-4 h-4 mr-1" />
              Update Student
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
