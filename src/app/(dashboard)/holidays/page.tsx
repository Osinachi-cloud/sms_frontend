'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { holidayApi } from '@/lib/api';
import { normalizeListResponse } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Pencil, Trash2, Upload, Download, X, Loader2, ArrowLeft, FileSpreadsheet, AlertCircle, Check, FileCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useRouter, useSearchParams } from 'next/navigation';

interface Holiday {
  id: string;
  name: string;
  date: string;
  holidayType: string;
  description?: string;
}

interface HolidayPreviewItem {
  rowNumber: number;
  name: string;
  date: string;
  holidayType: string;
  description: string;
  valid: boolean;
  error: string | null;
}

type HolidayForm = {
  name: string;
  date: string;
  holidayType: string;
  description: string;
};

type BulkStep = 'upload' | 'preview' | 'saving' | 'done';

export default function HolidaysPage() {
  const { currentSchool, hasPermission, isPlatformAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const schoolId = currentSchool?.id;
  const roleName = currentSchool?.roleName?.toLowerCase() || '';
  // Academic calendar is strictly admin-only (no temporary permissions)
  const canEdit = isPlatformAdmin() || roleName.includes('admin');

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [form, setForm] = useState<HolidayForm>({
    name: '',
    date: '',
    holidayType: 'PUBLIC_HOLIDAY',
    description: '',
  });

  // Bulk upload state
  const [bulkStep, setBulkStep] = useState<BulkStep>('upload');
  const [previewItems, setPreviewItems] = useState<HolidayPreviewItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    loadHolidays();
  }, [schoolId]);

  const loadHolidays = async () => {
    if (!schoolId) return;
    try {
      const res = await holidayApi.getAll(schoolId);
      setHolidays(normalizeListResponse<Holiday>(res.data).items);
    } catch {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingHoliday(null);
    setForm({ name: '', date: '', holidayType: 'PUBLIC_HOLIDAY', description: '' });
    setShowModal(true);
  };

  const openEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setForm({
      name: holiday.name,
      date: holiday.date,
      holidayType: holiday.holidayType || 'PUBLIC_HOLIDAY',
      description: holiday.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!schoolId) return;
    if (!form.name.trim() || !form.date) {
      toast.error('Name and date are required');
      return;
    }
    try {
      if (editingHoliday) {
        await holidayApi.update(schoolId, editingHoliday.id, form);
        toast.success('Holiday updated');
      } else {
        await holidayApi.create(schoolId, form);
        toast.success('Holiday created');
      }
      setShowModal(false);
      loadHolidays();
    } catch {
      toast.error('Failed to save holiday');
    }
  };

  const handleDelete = async (id: string) => {
    if (!schoolId) return;
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await holidayApi.delete(schoolId, id);
      toast.success('Holiday deleted');
      loadHolidays();
    } catch {
      toast.error('Failed to delete holiday');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!schoolId) {
      toast.error('School not loaded');
      return;
    }
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) &&
        !file.name.endsWith('.csv') &&
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setBulkStep('upload');

    try {
      const res = await holidayApi.previewBulkUpload(schoolId, file);
      setPreviewItems(res.data.preview || []);
      setBulkStep('preview');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to preview file');
      setFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  const removePreviewItem = (rowNumber: number) => {
    setPreviewItems((prev) => prev.filter((item) => item.rowNumber !== rowNumber));
  };

  const confirmBulkUpload = async () => {
    if (!schoolId) return;
    const validItems = previewItems.filter((item) => item.valid);
    if (validItems.length === 0) {
      toast.error('No valid holidays to upload');
      return;
    }
    setBulkStep('saving');
    try {
      const holidaysToSave = validItems.map((item) => ({
        name: item.name,
        date: item.date,
        holidayType: item.holidayType,
        description: item.description || undefined,
      }));
      const res = await holidayApi.bulkUpload(schoolId, holidaysToSave);
      toast.success(`${res.data.savedCount} holidays uploaded successfully`);
      setBulkStep('done');
      loadHolidays();
      setTimeout(() => {
        setBulkStep('upload');
        setPreviewItems([]);
        setFileName('');
      }, 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Upload failed');
      setBulkStep('preview');
    }
  };

  const cancelBulkUpload = () => {
    setBulkStep('upload');
    setPreviewItems([]);
    setFileName('');
  };

  const downloadTemplate = async () => {
    if (!schoolId) return;
    try {
      await holidayApi.downloadTemplate(schoolId);
    } catch {
      toast.error('Failed to download template');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PUBLIC_HOLIDAY':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'SCHOOL_EVENT':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const validCount = previewItems.filter((i) => i.valid).length;
  const invalidCount = previewItems.filter((i) => !i.valid).length;

  return (
    <div className="space-y-6">
      {returnTo && (
        <Button variant="secondary" size="sm" onClick={() => router.push(returnTo)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-500" />
            Holidays & Events
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage school holidays and special events</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-1" />
              Template
            </Button>
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700">
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              <Upload className="w-4 h-4" />
              Bulk Upload
            </label>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Add Holiday
            </Button>
          </div>
        )}
      </div>

      {/* Bulk upload drop zone (visible when in upload step but user wants to drag) */}
      {canEdit && bulkStep === 'upload' && (
        <div
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
            dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
              <p className="text-sm font-medium">Parsing file...</p>
            </div>
          ) : (
            <>
              <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drag and drop a CSV or Excel file here</p>
              <p className="text-xs text-slate-500 mt-1">.csv, .xlsx, .xls supported</p>
            </>
          )}
        </div>
      )}

      {/* Preview Panel */}
      <AnimatePresence>
        {bulkStep !== 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-primary-500" />
                      Bulk Upload Preview
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      {fileName} • {previewItems.length} rows • {validCount} valid • {invalidCount} invalid
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={cancelBulkUpload} disabled={bulkStep === 'saving'}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={confirmBulkUpload} disabled={validCount === 0 || bulkStep === 'saving'}>
                      {bulkStep === 'saving' ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      {bulkStep === 'saving' ? 'Saving...' : bulkStep === 'done' ? 'Saved!' : `Confirm Upload (${validCount})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {previewItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No records found in file.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 px-3 font-medium text-slate-500 w-10">Row</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Name</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Date</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Type</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Description</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Status</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {previewItems.map((item) => (
                          <tr
                            key={item.rowNumber}
                            className={`border-b border-slate-100 dark:border-slate-800 ${
                              !item.valid ? 'bg-red-50 dark:bg-red-900/10' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-slate-400">{item.rowNumber}</td>
                            <td className="py-2 px-3 font-medium">{item.name || '-'}</td>
                            <td className="py-2 px-3">{item.date || '-'}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeColor(item.holidayType)}`}>
                                {item.holidayType}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-xs max-w-[200px] truncate">{item.description || '-'}</td>
                            <td className="py-2 px-3">
                              {item.valid ? (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> {item.error}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() => removePreviewItem(item.rowNumber)}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : holidays.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No holidays found. Add your first holiday or upload from Excel/CSV.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {holidays
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((holiday) => (
              <motion.div key={holiday.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(
                          holiday.holidayType
                        )}`}
                      >
                        {holiday.holidayType}
                      </span>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(holiday)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(holiday.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{holiday.name}</h3>
                    <p className="text-sm text-slate-500 mb-2">
                      {new Date(holiday.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {holiday.description && (
                      <p className="text-xs text-slate-400">{holiday.description}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}>
        <div className="space-y-4 p-2">
          <Input label="Holiday Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Independence Day" />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
            <select
              value={form.holidayType}
              onChange={(e) => setForm({ ...form, holidayType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="PUBLIC_HOLIDAY">Public Holiday</option>
              <option value="SCHOOL_EVENT">School Event</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (optional)</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional details"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingHoliday ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
