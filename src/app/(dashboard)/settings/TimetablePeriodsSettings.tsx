'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { timetableApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2, X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  periodOrder: number;
  isBreak: boolean;
}

export default function TimetablePeriodsSettings() {
  const { currentSchool, hasPermission } = useAuth();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    periodOrder: 0,
    isBreak: false,
  });

  const canManage = currentSchool?.roleName?.toLowerCase().includes('admin') || hasPermission('timetable.create');

  const fetchPeriods = async () => {
    if (!currentSchool) return;
    setIsLoading(true);
    try {
      const res = await timetableApi.getPeriods(currentSchool.id, { size: 100 });
      const data = (res.data as any)?.content || [];
      setPeriods(data);
    } catch {
      toast.error('Failed to load periods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [currentSchool]);

  const openAdd = () => {
    setEditingPeriod(null);
    setForm({ name: '', startTime: '', endTime: '', periodOrder: periods.length + 1, isBreak: false });
    setIsModalOpen(true);
  };

  const openEdit = (period: Period) => {
    setEditingPeriod(period);
    setForm({
      name: period.name,
      startTime: period.startTime?.substring(0, 5) || '',
      endTime: period.endTime?.substring(0, 5) || '',
      periodOrder: period.periodOrder,
      isBreak: period.isBreak,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentSchool) return;
    if (!form.name.trim() || !form.startTime || !form.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        startTime: `${form.startTime}:00`,
        endTime: `${form.endTime}:00`,
        periodOrder: form.periodOrder,
        isBreak: form.isBreak,
      };
      if (editingPeriod) {
        await timetableApi.updatePeriod(currentSchool.id, editingPeriod.id, payload);
        toast.success('Period updated');
      } else {
        await timetableApi.createPeriod(currentSchool.id, payload);
        toast.success('Period created');
      }
      setIsModalOpen(false);
      fetchPeriods();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save period');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (periodId: string) => {
    if (!currentSchool || !confirm('Are you sure you want to delete this period?')) return;
    try {
      await timetableApi.deletePeriod(currentSchool.id, periodId);
      toast.success('Period deleted');
      fetchPeriods();
    } catch {
      toast.error('Failed to delete period');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <CardTitle>Timetable Periods</CardTitle>
          </div>
          {canManage && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" />
              Add Period
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No periods configured yet.</p>
              {canManage && (
                <p className="text-sm text-slate-400 mt-1">
                  Add periods like &quot;Period 1 (8:00 AM - 9:00 AM)&quot; so teachers can build timetables.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {periods.map((period) => (
                <div
                  key={period.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    period.isBreak
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                      {period.periodOrder}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {period.name}
                        {period.isBreak && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                            Break
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {period.startTime?.substring(0, 5)} - {period.endTime?.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(period)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(period.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPeriod ? 'Edit Period' : 'Add Period'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Period Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Period 1"
              className="glass-input w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="glass-input w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Order</label>
              <input
                type="number"
                value={form.periodOrder}
                onChange={(e) => setForm({ ...form, periodOrder: Number(e.target.value) })}
                className="glass-input w-full"
                min={1}
              />
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input
                id="isBreak"
                type="checkbox"
                checked={form.isBreak}
                onChange={(e) => setForm({ ...form, isBreak: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isBreak" className="text-sm text-slate-700 dark:text-slate-300">
                Is Break / Free Period
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-1" />
              {editingPeriod ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
