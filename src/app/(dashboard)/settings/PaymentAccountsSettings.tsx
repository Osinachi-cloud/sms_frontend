'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Plus, Trash2, Landmark, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

interface PaymentAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch?: string;
  description?: string;
  isDefault: boolean;
}

export default function PaymentAccountsSettings({ schoolId }: { schoolId: string }) {
  const { isAppAdmin, currentSchool, hasPermission } = useAuth();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState<PaymentAccount>({
    id: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    description: '',
    isDefault: false,
  });

  const roleName = currentSchool?.roleName?.toLowerCase() || '';
  const canManage = isAppAdmin() || roleName.includes('admin') || currentSchool?.roleName === 'ACCOUNTANT' || hasPermission('payment.gateway.manage') || hasPermission('payment.gateway.switch');

  const fetchAccounts = async () => {
    if (!schoolId) return;
    try {
      const res = await settingsApi.get(schoolId);
      const data = (res as any).data || {};
      const raw = data.paymentAccounts || [];
      setAccounts(raw.length ? raw : []);
    } catch {
      toast.error('Failed to load payment accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [schoolId]);

  const resetForm = () => {
    setForm({ id: '', accountName: '', accountNumber: '', bankName: '', branch: '', description: '', isDefault: false });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.bankName.trim()) {
      toast.error('Account name, account number and bank name are required');
      return;
    }

    setIsSaving(true);
    try {
      let updated = [...accounts];
      const payload: PaymentAccount = {
        ...form,
        id: editingId || crypto.randomUUID(),
      };

      if (payload.isDefault) {
        updated = updated.map((a) => ({ ...a, isDefault: false }));
      }

      if (editingId) {
        const idx = updated.findIndex((a) => a.id === editingId);
        if (idx >= 0) updated[idx] = payload;
        else updated.push(payload);
      } else {
        updated.push(payload);
      }

      await settingsApi.update(schoolId, { paymentAccounts: updated });
      setAccounts(updated);
      toast.success(editingId ? 'Account updated' : 'Account added');
      resetForm();
    } catch {
      toast.error('Failed to save account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (account: PaymentAccount) => {
    setForm({ ...account });
    setEditingId(account.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this account?')) return;
    try {
      const updated = accounts.filter((a) => a.id !== id);
      await settingsApi.update(schoolId, { paymentAccounts: updated });
      setAccounts(updated);
      toast.success('Account removed');
      if (editingId === id) resetForm();
    } catch {
      toast.error('Failed to remove account');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
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
            You are viewing payment accounts in read-only mode. Only Super Admins and Finance Admins can edit.
          </p>
        </div>
      )}

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <CardTitle>School Bank Accounts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Banknote className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No payment accounts configured yet.</p>
              <p className="text-xs mt-1">Add a bank account so parents and students know where to make transfers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {accounts.map((account) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 relative"
                  >
                    {account.isDefault && (
                      <span className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wide">
                        Default
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{account.bankName}</p>
                        {account.branch && <p className="text-xs text-slate-500">{account.branch}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs text-slate-500">Account Name</span>
                        <span className="text-sm font-medium">{account.accountName}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs text-slate-500">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium font-mono">{account.accountNumber}</span>
                          <button
                            onClick={() => handleCopy(account.accountNumber, account.id)}
                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Copy account number"
                          >
                            {copiedId === account.id ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      {account.description && (
                        <p className="text-xs text-slate-500 px-2">{account.description}</p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(account.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Form */}
      {canManage && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <CardTitle>{editingId ? 'Edit Account' : 'Add New Account'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bank Name *"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="e.g. GTBank, First Bank"
              />
              <Input
                label="Account Number *"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="10-digit account number"
              />
              <Input
                label="Account Name *"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                placeholder="Name on the account"
              />
              <Input
                label="Branch (optional)"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                placeholder="e.g. Ikeja Branch"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. School fees account, PTA dues account"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm((prev) => ({ ...prev, isDefault: !prev.isDefault }))}
                disabled={!canManage}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.isDefault ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    form.isDefault ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Set as default account for bank transfers
              </span>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} isLoading={isSaving}>
                {editingId ? 'Update Account' : 'Add Account'}
              </Button>
              {editingId && (
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
