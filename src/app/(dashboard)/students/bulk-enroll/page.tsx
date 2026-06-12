'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { rawBulkEnrollApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, ArrowRight, Check, X, RefreshCw, Download, AlertCircle, Users, GraduationCap, UserCircle, BookOpen, Info, FileDown, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

type EntityType = 'students' | 'teachers' | 'parents';
type Step = 'upload' | 'mapping' | 'processing' | 'complete';

interface PreviewResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface AvailableField {
  key: string;
  label: string;
  required: boolean;
}

interface BulkJob {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errorLog: string;
  createdAt: string;
  completedAt: string;
}

interface TemplateField {
  key: string;
  label: string;
  required: boolean;
  example: string;
  description: string;
}

const DEFAULT_TEMPLATES: Record<EntityType, { label: string; icon: typeof Users; description: string; fields: TemplateField[] }> = {
  students: {
    label: 'Students',
    icon: Users,
    description: 'Upload multiple students with optional parent/guardian details. Password is auto-generated if blank.',
    fields: [
      { key: 'full_name', label: 'Full Name', required: true, example: 'Ade Johnson', description: 'Student full name' },
      { key: 'email', label: 'Email', required: true, example: 'student@school.com', description: 'Valid email address' },
      { key: 'phone', label: 'Phone', required: true, example: '+2348012345678', description: 'Phone with country code' },
      { key: 'gender', label: 'Gender', required: true, example: 'Male', description: 'Male / Female / Other' },
      { key: 'date_of_birth', label: 'Date of Birth', required: false, example: '2010-05-15', description: 'YYYY-MM-DD format' },
      { key: 'admission_number', label: 'Admission Number', required: false, example: 'ADM/2026/001', description: 'Auto-generated if blank' },
      { key: 'class_name', label: 'Class Name', required: false, example: 'JSS 1A', description: 'Current class name' },
      { key: 'address', label: 'Address', required: true, example: '12 Lagos Street', description: 'Residential address' },
      { key: 'password', label: 'Password', required: false, example: 'MyP@ssw0rd', description: 'Min 8 chars with uppercase, lowercase, number & special char. Defaults to Password@12 if blank' },
      { key: 'parent_full_name', label: 'Parent Full Name', required: false, example: 'Mr. Johnson Ade', description: 'Parent or guardian name' },
      { key: 'parent_email', label: 'Parent Email', required: false, example: '[EMAIL_REDACTED]', description: 'Parent email address. If provided, a parent user account is created automatically' },
      { key: 'parent_phone', label: 'Parent Phone', required: false, example: '[PHONE NUMBER_REDACTED]', description: 'Parent phone number' },
      { key: 'parent_relationship', label: 'Parent Relationship', required: false, example: 'Father', description: 'Father / Mother / Guardian / Other' },
      { key: 'parent_address', label: 'Parent Address', required: false, example: '[STREET_ADDRESS_REDACTED]', description: 'Parent residential address' },
      { key: 'parent_occupation', label: 'Parent Occupation', required: false, example: 'Civil Servant', description: 'Parent occupation' },
      { key: 'parent_password', label: 'Parent Password', required: false, example: 'MyP@ssw0rd', description: 'Min 8 chars with uppercase, lowercase, number & special char. Defaults to Password@12 if blank' },
    ],
  },
  teachers: {
    label: 'Teachers',
    icon: GraduationCap,
    description: 'Upload teaching staff records. Password is auto-generated if blank.',
    fields: [
      { key: 'full_name', label: 'Full Name', required: true, example: 'Mrs. Folake Adeleke', description: 'Teacher full name' },
      { key: 'email', label: 'Email', required: true, example: 'teacher@school.com', description: 'Valid email address' },
      { key: 'phone', label: 'Phone', required: true, example: '+2348012345678', description: 'Phone with country code' },
      { key: 'gender', label: 'Gender', required: true, example: 'Female', description: 'Male / Female / Other' },
      { key: 'employee_id', label: 'Employee ID', required: false, example: 'TCH/2026/001', description: 'Staff ID number' },
      { key: 'specialization', label: 'Specialization', required: false, example: 'Mathematics', description: 'Subject specialty' },
      { key: 'qualification', label: 'Qualification', required: false, example: 'M.Ed Mathematics', description: 'Highest qualification' },
      { key: 'date_of_joining', label: 'Date of Joining', required: false, example: '2024-09-01', description: 'YYYY-MM-DD format' },
      { key: 'address', label: 'Address', required: true, example: '45 Abuja Road', description: 'Residential address' },
      { key: 'password', label: 'Password', required: false, example: 'MyP@ssw0rd', description: 'Min 8 chars with uppercase, lowercase, number & special char. Leave blank for no login account' },
    ],
  },
  parents: {
    label: 'Parents / Guardians',
    icon: UserCircle,
    description: 'Upload parent or guardian records. Password is auto-generated if blank.',
    fields: [
      { key: 'full_name', label: 'Full Name', required: true, example: 'Mr. Johnson Ade', description: 'Parent full name' },
      { key: 'email', label: 'Email', required: true, example: 'parent@email.com', description: 'Valid email address' },
      { key: 'phone', label: 'Phone', required: true, example: '+2348087654321', description: 'Phone with country code' },
      { key: 'gender', label: 'Gender', required: true, example: 'Male', description: 'Male / Female / Other' },
      { key: 'relationship', label: 'Relationship', required: true, example: 'Father', description: 'Father / Mother / Guardian / Other' },
      { key: 'occupation', label: 'Occupation', required: false, example: 'Business Owner', description: 'Parent occupation' },
      { key: 'address', label: 'Address', required: true, example: '12 Lagos Street', description: 'Residential address' },
      { key: 'password', label: 'Password', required: false, example: 'MyP@ssw0rd', description: 'Min 8 chars with uppercase, lowercase, number & special char. Leave blank for no login account' },
    ],
  },
};

export default function BulkEnrollPage() {
  const { currentSchool } = useAuth();
  const searchParams = useSearchParams();
  const urlEntity = searchParams.get('entity') as EntityType | null;
  const validEntity: EntityType = urlEntity && ['students', 'teachers', 'parents'].includes(urlEntity) ? urlEntity : 'students';
  const [entityType, setEntityType] = useState<EntityType>(validEntity);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<BulkJob | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Field configuration state - allows customizing required/optional per field
  const [fieldConfigs, setFieldConfigs] = useState<Record<EntityType, TemplateField[]>>({
    students: [...DEFAULT_TEMPLATES.students.fields],
    teachers: [...DEFAULT_TEMPLATES.teachers.fields],
    parents: [...DEFAULT_TEMPLATES.parents.fields],
  });
  const [showFieldConfig, setShowFieldConfig] = useState(false);

  const template = {
    ...DEFAULT_TEMPLATES[entityType],
    fields: fieldConfigs[entityType],
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(selectedFile.type) &&
        !selectedFile.name.endsWith('.csv') &&
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', entityType);

      const [previewRes, fieldsRes] = await Promise.all([
        rawBulkEnrollApi.preview(currentSchool?.id || '', formData),
        rawBulkEnrollApi.getFields(currentSchool?.id || ''),
      ]);

      setPreview(previewRes.data);
      setAvailableFields(fieldsRes.data);

      const initialMapping: Record<string, string> = {};
      previewRes.data.headers.forEach((header: string) => {
        const matchingField = fieldsRes.data.find(
          (f: AvailableField) =>
            f.key.toLowerCase() === header.toLowerCase().replace(/\s+/g, '_') ||
            f.label.toLowerCase() === header.toLowerCase()
        );
        if (matchingField) initialMapping[header] = matchingField.key;
      });
      setMapping(initialMapping);

      setStep('mapping');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to preview file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMappingChange = (csvColumn: string, dbField: string) => {
    setMapping(prev => {
      if (dbField === '') {
        const { [csvColumn]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [csvColumn]: dbField };
    });
  };

  const isValidMapping = () => {
    const requiredFields = availableFields.filter(f => f.required).map(f => f.key);
    const mappedFields = Object.values(mapping);
    return requiredFields.every(field => mappedFields.includes(field));
  };

  const handleProcess = async () => {
    if (!file || !isValidMapping()) return;
    setIsProcessing(true);
    setStep('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('entityType', entityType);

      const response = await rawBulkEnrollApi.process(currentSchool?.id || '', formData);
      const jobId = response.data.jobId;
      pollJobStatus(jobId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start processing');
      setStep('mapping');
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await rawBulkEnrollApi.getJob(currentSchool?.id || '', jobId);
        const job = response.data;
        setCurrentJob(job);

        if (job.status === 'PROCESSING' || job.status === 'PENDING') {
          setTimeout(poll, 2000);
        } else {
          setIsProcessing(false);
          setStep('complete');
          if (job.status === 'COMPLETED') {
            toast.success(`Successfully processed ${job.successfulRows} ${entityType}!`);
          } else {
            toast.error('Bulk upload completed with errors');
          }
        }
      } catch {
        setIsProcessing(false);
        toast.error('Failed to check job status');
      }
    };
    poll();
  };

  const resetForm = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setMapping({});
    setCurrentJob(null);
  };

  const toggleFieldRequired = (key: string) => {
    setFieldConfigs(prev => ({
      ...prev,
      [entityType]: prev[entityType].map(f =>
        f.key === key ? { ...f, required: !f.required } : f
      ),
    }));
    toast.success('Field configuration updated');
  };

  const resetFieldConfig = () => {
    setFieldConfigs(prev => ({
      ...prev,
      [entityType]: [...DEFAULT_TEMPLATES[entityType].fields],
    }));
    toast.success('Fields reset to defaults');
  };

  const setAllRequired = (required: boolean) => {
    setFieldConfigs(prev => ({
      ...prev,
      [entityType]: prev[entityType].map(f => ({ ...f, required })),
    }));
    toast.success(required ? 'All fields marked as required' : 'All fields marked as optional');
  };

  const getTemplateData = () => {
    return {
      ...DEFAULT_TEMPLATES[entityType],
      fields: fieldConfigs[entityType],
    };
  };

  const downloadCsvTemplate = () => {
    const t = getTemplateData();
    const headers = t.fields.map(f => f.label);
    const exampleRow = t.fields.map(f => f.example);
    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_bulk_upload_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${t.label} CSV template downloaded`);
  };

  const downloadExcelTemplate = () => {
    const t = getTemplateData();
    const headers = t.fields.map(f => f.label);
    const exampleRow = t.fields.map(f => f.example);

    // Template sheet with headers and example row
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

    // Instructions sheet listing fields with required/optional status
    const instructionData = [
      ['Field Name', 'Status', 'Description'],
      ...t.fields.map(f => [f.label, f.required ? 'Required' : 'Optional', f.description]),
    ];
    const instWs = XLSX.utils.aoa_to_sheet(instructionData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.utils.book_append_sheet(wb, instWs, 'Instructions');
    XLSX.writeFile(wb, `${entityType}_bulk_upload_template.xlsx`);
    toast.success(`${t.label} Excel template downloaded`);
  };

  const getFieldDescription = (key: string) => {
    const field = getTemplateData().fields.find(f => f.key === key);
    return field?.description || '';
  };

  const stepLabels: Record<Step, string> = {
    upload: 'Upload File',
    mapping: 'Map Columns',
    processing: 'Processing',
    complete: 'Complete',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Upload multiple records at once using a CSV or Excel file
          </p>
        </div>
        <Link href="/students">
          <Button variant="outline">Back to Students</Button>
        </Link>
      </div>

      {/* Entity Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(DEFAULT_TEMPLATES) as EntityType[]).map((type) => {
          const t = DEFAULT_TEMPLATES[type];
          const Icon = t.icon;
          const isActive = entityType === type;
          return (
            <button
              key={type}
              onClick={() => { setEntityType(type); resetForm(); }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                isActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-semibold ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-slate-500">{fieldConfigs[type].length} fields</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Template Info Card with Field Configuration */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base flex-wrap gap-3">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
                {template.label} Upload Template
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button variant="ghost" size="sm" onClick={() => setShowFieldConfig(!showFieldConfig)}>
                  <Settings2 className="w-4 h-4 mr-2" />
                  {showFieldConfig ? 'Hide Config' : 'Configure Fields'}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV Template
                </Button>
                <Button variant="outline" size="sm" onClick={downloadExcelTemplate}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel Template
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              {template.description} 
              <span className="text-primary-600 font-medium ml-1">
                Toggle &quot;Configure Fields&quot; to customize required columns.
              </span>
            </p>

            {/* Field Configuration Panel */}
            <AnimatePresence>
              {showFieldConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        Field Configuration
                      </h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAllRequired(true)}>
                          Make All Required
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAllRequired(false)}>
                          Make All Optional
                        </Button>
                        <Button variant="ghost" size="sm" onClick={resetFieldConfig}>
                          Reset to Defaults
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                      Toggle switches to mark fields as Required or Optional for your {template.label.toLowerCase()} upload template.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {fieldConfigs[entityType].map((field) => (
                        <label
                          key={field.key}
                          className={`flex items-center justify-between p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                            field.required
                              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${field.required ? 'bg-red-500' : 'bg-slate-300'}`} />
                            <span className="text-sm font-medium truncate">{field.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFieldRequired(field.key)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                              field.required ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                field.required ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Required
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        Optional
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Column Name</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Required</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Example</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldConfigs[entityType].map((field) => (
                    <tr key={field.key} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-3 font-medium">{field.label}</td>
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() => toggleFieldRequired(field.key)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            field.required ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                          title={field.required ? 'Click to make optional' : 'Click to make required'}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              field.required ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`ml-2 text-[10px] font-bold ${field.required ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {field.required ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-xs font-mono">{field.example}</td>
                      <td className="py-2 px-3 text-slate-500 text-xs">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {(['upload', 'mapping', 'processing', 'complete'] as Step[]).map((s, index) => {
          const stepIndex = ['upload', 'mapping', 'processing', 'complete'].indexOf(step);
          const isActive = step === s;
          const isCompleted = stepIndex > index;
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                    isActive ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : index + 1}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium mt-1 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>
                  {stepLabels[s]}
                </span>
              </div>
              {index < 3 && (
                <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 mx-2 sm:mx-4 ${isCompleted ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card>
              <CardContent className="p-8">
                <div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                    dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <RefreshCw className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                      <p className="text-lg font-medium">Processing file...</p>
                    </div>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                      <p className="text-lg font-medium mb-2">Drag and drop your {template.label.toLowerCase()} file here</p>
                      <p className="text-slate-500 mb-4">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
                      <label className="inline-block">
                        <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                        <Button as="span" className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Browse Files
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'mapping' && preview && (
          <motion.div key="mapping" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>File Preview</span>
                  <span className="text-sm font-normal text-slate-500">{file?.name} • {preview.totalRows} rows</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-slate-700">
                        {preview.headers.map((header, i) => <th key={i} className="text-left p-3 font-medium">{header}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-b dark:border-slate-800">
                          {row.map((cell, j) => <td key={j} className="p-3 text-slate-600 dark:text-slate-400">{cell || '-'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Column Mapping</CardTitle>
                <p className="text-sm text-slate-500">Map your file columns to the {template.label.toLowerCase()} database fields</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preview.headers.map((header) => (
                    <div key={header} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{header}</p>
                        <p className="text-xs text-slate-500">CSV Column</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <select
                        value={mapping[header] || ''}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        <option value="">-- Skip --</option>
                        {availableFields.map((field) => (
                          <option key={field.key} value={field.key}>{field.label} {field.required && '*'}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {!isValidMapping() && (
                  <div className="mt-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Required fields missing</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        Please map: {availableFields.filter(f => f.required && !Object.values(mapping).includes(f.key)).map(f => f.label).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button onClick={handleProcess} disabled={!isValidMapping()}>
                    Start Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="w-16 h-16 mx-auto text-primary-500 animate-spin mb-6" />
                <h2 className="text-xl font-bold mb-2">Processing {template.label}</h2>
                <p className="text-slate-500 mb-6">Please wait while we process your file...</p>
                {currentJob && (
                  <div className="max-w-sm mx-auto">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{currentJob.successfulRows + currentJob.failedRows} / {currentJob.totalRows || '?'}</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: currentJob.totalRows ? `${((currentJob.successfulRows + currentJob.failedRows) / currentJob.totalRows) * 100}%` : '0%' }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'complete' && currentJob && (
          <motion.div key="complete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card>
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  {currentJob.status === 'COMPLETED' && currentJob.failedRows === 0 ? (
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
                      <AlertCircle className="w-10 h-10 text-yellow-500" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold mb-2">Upload Complete</h2>
                  <p className="text-slate-500">
                    {currentJob.status === 'FAILED' ? 'The upload process encountered an error' : `Your ${template.label.toLowerCase()} bulk upload has been processed`}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                  <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{currentJob.totalRows}</p>
                    <p className="text-sm text-slate-500">Total Rows</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-600">{currentJob.successfulRows}</p>
                    <p className="text-sm text-green-600">Successful</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                    <p className="text-2xl font-bold text-red-600">{currentJob.failedRows}</p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                </div>

                {currentJob.errorLog && (
                  <div className="mb-8">
                    <h3 className="font-medium mb-2">Error Log</h3>
                    <div className="max-h-48 overflow-y-auto p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <pre className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{currentJob.errorLog}</pre>
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={resetForm}>Upload Another File</Button>
                  <Link href={entityType === 'students' ? '/students' : entityType === 'teachers' ? '/teachers' : '/users'}>
                    <Button>View {template.label}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
