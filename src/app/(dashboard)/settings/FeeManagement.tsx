'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { settingsApi, classApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Tag, BookOpen, Users, Percent, Calendar, AlertTriangle, Edit3, X } from 'lucide-react';

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  description?: string;
  applicableClassIds: string[];
  applicableToAll: boolean;
  discountType: 'percentage' | 'flat' | 'none';
  discountValue: number;
  discountDeadline?: string;
  paymentDeadline?: string;
  isActive: boolean;
}

interface Classroom {
  id: string;
  name: string;
}

export default function FeeManagement({ schoolId }: { schoolId: string }) {
  const { isAppAdmin, currentSchool, hasPermission } = useAuth();
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<FeeItem>({
    id: '',
    name: '',
    amount: 0,
    description: '',
    applicableClassIds: [],
    applicableToAll: true,
    discountType: 'none',
    discountValue: 0,
    discountDeadline: '',
    paymentDeadline: '',
    isActive: true,
  });

  const roleName = currentSchool?.roleName?.toLowerCase() || '';
  const isSchoolAdmin = roleName.includes('admin');
  const canManage = isAppAdmin() || isSchoolAdmin || currentSchool?.roleName === 'ACCOUNTANT' || hasPermission('payment.gateway.manage') || hasPermission('payment.gateway.switch');

  const fetchData = async () => {
    if (!schoolId) return;
    try {
      const [settingsRes, classesRes] = await Promise.all([
        settingsApi.get(schoolId),
        classApi.getAll(schoolId, { size: 1000 }),
      ]);
      const data = (settingsRes as any).data || {};
      const rawFees = data.feeItems || [];
      setFeeItems(rawFees.length ? rawFees : []);
      setClasses((classesRes as any).data?.content || (classesRes as any).data || []);
    } catch {
      toast.error('Failed to load fee management data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const resetForm = () => {
    setForm({
      id: '', name: '', amount: 0, description: '', applicableClassIds: [], applicableToAll: true,
      discountType: 'none', discountValue: 0, discountDeadline: '', paymentDeadline: '', isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.amount <= 0) {
      toast.error('Fee name and a positive amount are required');
      return;
    }
    if (form.discountType !== 'none' && (form.discountValue <= 0 || !form.discountDeadline)) {
      toast.error('Discount value and deadline are required when discount is enabled');
      return;
    }

    setIsSaving(true);
    try {
      let updated = [...feeItems];
      const payload: FeeItem = {
        ...form,
        id: editingId || crypto.randomUUID(),
      };

      if (editingId) {
        const idx = updated.findIndex((f) => f.id === editingId);
        if (idx >= 0) updated[idx] = payload;
        else updated.push(payload);
      } else {
        updated.push(payload);
      }

      await settingsApi.update(schoolId, { feeItems: updated });
      setFeeItems(updated);
      toast.success(editingId ? 'Fee updated' : 'Fee created');
      resetForm();
    } catch {
      toast.error('Failed to save fee');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (fee: FeeItem) => {
    setForm({
      ...fee,
      discountDeadline: fee.discountDeadline ? fee.discountDeadline.slice(0, 10) : '',
      paymentDeadline: fee.paymentDeadline ? fee.paymentDeadline.slice(0, 10) : '',
    });
    setEditingId(fee.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee?')) return;
    try {
      const updated = feeItems.filter((f) => f.id !== id);
      await settingsApi.update(schoolId, { feeItems: updated });
      setFeeItems(updated);
      toast.success('Fee deleted');
      if (editingId === id) resetForm();
    } catch {
      toast.error('Failed to delete fee');
    }
  };

  const toggleClassSelection = (classId: string) => {
    setForm((prev) => {
      const has = prev.applicableClassIds.includes(classId);
      return {
        ...prev,
        applicableClassIds: has
          ? prev.applicableClassIds.filter((c) => c !== classId)
          : [...prev.applicableClassIds, classId],
      };
    });
  };

  const discountedAmount = () => {
    if (form.discountType === 'none' || !form.discountValue) return form.amount;
    if (form.discountType === 'percentage') return Math.max(0, form.amount - (form.amount * form.discountValue) / 100);
    if (form.discountType === 'flat') return Math.max(0, form.amount - form.discountValue);
    return form.amount;
  };

  const getClassNames = (fee: FeeItem) => {
    if (fee.applicableToAll) return 'All Classes';
    if (!fee.applicableClassIds?.length) return 'None';
    return fee.applicableClassIds
      .map((id) => classes.find((c) => c.id === id)?.name || id)
      .join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {!canManage && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You are viewing fee management in read-only mode. Only Super Admins and Finance Admins can edit.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Fee Products</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Create and manage fees such as school fees, books, uniforms, etc.
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            <Plus className="w-4 h-4" />
            {showForm ? 'Hide Form' : 'New Fee Product'}
          </Button>
        )}
      </div>

      {/* Fee Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary-500" />
                  {editingId ? 'Edit Fee Product' : 'Create Fee Product'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Fee Name *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. School Fees, Textbooks"
                  />
                  <Input
                    label="Amount *"
                    type="number"
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    placeholder="Enter amount"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Short description of what this fee covers"
                    />
                  </div>
                </div>

                {/* Applicable Classes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Applicable Classes
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, applicableToAll: !prev.applicableToAll, applicableClassIds: [] }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        form.applicableToAll ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.applicableToAll ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Apply to all classes</span>
                  </div>
                  {!form.applicableToAll && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {classes.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => toggleClassSelection(cls.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            form.applicableClassIds.includes(cls.id)
                              ? 'bg-primary-500 text-white border-primary-500'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cls.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Discount Type</label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value as FeeItem['discountType'] })}
                      className="glass-input"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Rate</option>
                    </select>
                  </div>
                  {form.discountType !== 'none' && (
                    <>
                      <Input
                        label={form.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                        type="number"
                        value={form.discountValue || ''}
                        onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                        placeholder={form.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5000'}
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Discount Deadline</label>
                        <input
                          type="date"
                          value={form.discountDeadline}
                          onChange={(e) => setForm({ ...form, discountDeadline: e.target.value })}
                          className="glass-input"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Payment Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Payment Deadline</label>
                    <input
                      type="date"
                      value={form.paymentDeadline}
                      onChange={(e) => setForm({ ...form, paymentDeadline: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className={`w-full p-3 rounded-xl ${form.discountType !== 'none' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                      <p className="text-xs text-slate-500">Final Amount</p>
                      <p className="text-lg font-bold text-primary-600">
                        ₦{discountedAmount().toLocaleString()}
                        {form.discountType !== 'none' && form.discountValue > 0 && (
                          <span className="text-xs text-slate-400 ml-2 line-through">₦{form.amount.toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{form.isActive ? 'Active' : 'Inactive'}</span>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSave} isLoading={isSaving}>
                    {editingId ? 'Update Fee' : 'Create Fee'}
                  </Button>
                  <Button variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fee List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            Existing Fee Products ({feeItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No fee products configured yet.</p>
              <p className="text-xs mt-1">Create fees so parents and students can see what to pay.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {feeItems.map((fee) => (
                  <motion.div
                    key={fee.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 rounded-2xl border ${fee.isActive ? 'border-slate-200 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800 opacity-60'} bg-white dark:bg-slate-800`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{fee.name}</p>
                            {!fee.isActive && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-bold uppercase">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{fee.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${fee.isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                            ₦{Number(fee.amount).toLocaleString()}
                          </p>
                          {fee.discountType !== 'none' && fee.discountValue > 0 && (
                            <p className="text-xs text-green-600">
                              {fee.discountType === 'percentage' ? `${fee.discountValue}%` : `₦${Number(fee.discountValue).toLocaleString()}`} off until {fee.discountDeadline ? new Date(fee.discountDeadline).toLocaleDateString() : 'N/A'}
                            </p>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(fee)}>
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(fee.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 truncate">{getClassNames(fee)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                        <Percent className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {fee.discountType === 'none' ? 'No discount' : `${fee.discountType === 'percentage' ? fee.discountValue + '%' : '₦' + Number(fee.discountValue).toLocaleString()} off`}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {fee.paymentDeadline ? `Due ${new Date(fee.paymentDeadline).toLocaleDateString()}` : 'No deadline'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          Final: ₦{(() => {
                            if (fee.discountType === 'none' || !fee.discountValue) return Number(fee.amount).toLocaleString();
                            if (fee.discountType === 'percentage') return Math.max(0, fee.amount - (fee.amount * fee.discountValue) / 100).toLocaleString();
                            return Math.max(0, fee.amount - fee.discountValue).toLocaleString();
                          })()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
