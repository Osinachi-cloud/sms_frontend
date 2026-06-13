'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { subjectApi, classApi } from '@/lib/api';
import { normalizeListResponse } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Pencil, Trash2, CheckCircle, DollarSign, Users, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isFree: boolean;
  cost: number;
  createdByType?: string;
  classIds: string[];
  classNames: string[];
  enrollmentCount: number;
}

interface SchoolClass {
  id: string;
  name: string;
}

export default function SubjectsPage() {
  const { currentSchool, hasPermission, user } = useAuth();
  const schoolId = currentSchool?.id;
  const isAdmin = hasPermission('subject.update') || hasPermission('cms.content.edit.any');
  const canCreate = hasPermission('subject.create') || hasPermission('class.update');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    isFree: true,
    cost: '',
    classIds: [] as string[],
  });

  useEffect(() => {
    if (!schoolId) return;
    loadSubjects();
    loadClasses();
  }, [schoolId]);

  const loadSubjects = async () => {
    if (!schoolId) return;
    try {
      const res = await subjectApi.getAll(schoolId);
      setSubjects(normalizeListResponse<Subject>(res.data).items);
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    if (!schoolId) return;
    try {
      const res = await classApi.getAll(schoolId);
      setClasses(res.data?.content || []);
    } catch {
      // ignore
    }
  };

  const openCreate = () => {
    setEditingSubject(null);
    setForm({ name: '', code: '', description: '', isFree: true, cost: '', classIds: [] });
    setShowModal(true);
  };

  const openEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name,
      code: subject.code || '',
      description: subject.description || '',
      isFree: subject.isFree,
      cost: subject.cost ? String(subject.cost) : '',
      classIds: subject.classIds || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!schoolId) {
      toast.error('School not loaded');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
    const payload = {
      ...form,
      cost: form.isFree ? 0 : Number(form.cost) || 0,
    };
    try {
      if (editingSubject) {
        await subjectApi.update(schoolId, editingSubject.id, payload);
        toast.success('Subject updated');
      } else {
        await subjectApi.create(schoolId, payload);
        toast.success('Subject created');
      }
      setShowModal(false);
      loadSubjects();
    } catch {
      toast.error('Failed to save subject');
    }
  };

  const handleDelete = async (id: string) => {
    if (!schoolId) {
      toast.error('School not loaded');
      return;
    }
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await subjectApi.delete(schoolId, id);
      toast.success('Subject deleted');
      loadSubjects();
    } catch {
      toast.error('Failed to delete subject');
    }
  };

  const toggleClass = (classId: string) => {
    setForm((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter((c) => c !== classId)
        : [...prev.classIds, classId],
    }));
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    { key: 'classes', header: 'Classes', render: (s: Subject) => s.classNames?.join(', ') || '-' },
    {
      key: 'pricing',
      header: 'Pricing',
      render: (s: Subject) =>
        s.isFree ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
            <CheckCircle className="w-4 h-4" /> Free
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
            <DollarSign className="w-4 h-4" /> ₦{s.cost}
          </span>
        ),
    },
    {
      key: 'enrolled',
      header: 'Enrolled',
      render: (s: Subject) => (
        <span className="inline-flex items-center gap-1 text-slate-600 text-sm">
          <Users className="w-4 h-4" /> {s.enrollmentCount}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (s: Subject) => (
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {s.createdByType === 'TEACHER' ? 'Teacher' : 'Admin'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s: Subject) => (
        <div className="flex items-center gap-2">
          {(isAdmin || s.createdByType === 'TEACHER') && (
            <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-500" />
            Subjects
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage courses and their pricing</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            Add Subject
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={subjects} keyField="id" isLoading={loading} />
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSubject ? 'Edit Subject' : 'Create Subject'}>
        <div className="space-y-4 p-2">
          <Input
            label="Subject Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Mathematics"
          />
          <Input
            label="Code (optional)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. MATH101"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-sm">Free Subject</p>
              <p className="text-xs text-slate-500">Students can register without payment</p>
            </div>
            <button
              onClick={() => setForm((prev) => ({ ...prev, isFree: !prev.isFree }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.isFree ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.isFree ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {!form.isFree && (
            <Input
              label="Cost (₦)"
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              placeholder="Enter amount"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Classes</label>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleClass(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.classIds.includes(c.id)
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingSubject ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
