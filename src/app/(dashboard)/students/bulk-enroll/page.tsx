'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { rawBulkEnrollApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, ArrowRight, Check, X, RefreshCw, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import * as XLSX from 'xlsx';

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

type Step = 'upload' | 'mapping' | 'processing' | 'complete';

export default function BulkEnrollPage() {
  const { currentSchool } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<BulkJob | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!currentSchool?.id) return;
    rawBulkEnrollApi.getFields(currentSchool.id).then((res) => {
      setAvailableFields(res.data);
    }).catch(() => {
      // fallback fields if API fails
      setAvailableFields([
        { key: 'full_name', label: 'Full Name', required: true },
        { key: 'email', label: 'Email', required: false },
        { key: 'phone', label: 'Phone', required: false },
        { key: 'gender', label: 'Gender', required: false },
        { key: 'address', label: 'Address', required: false },
        { key: 'admission_number', label: 'Admission Number', required: false },
        { key: 'class_id', label: 'Class ID', required: false },
        { key: 'parent_name', label: 'Parent Name', required: false },
        { key: 'parent_email', label: 'Parent Email', required: false },
        { key: 'parent_phone', label: 'Parent Phone', required: false },
      ]);
    });
  }, [currentSchool?.id]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

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
        if (matchingField) {
          initialMapping[header] = matchingField.key;
        }
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

      const response = await rawBulkEnrollApi.process(
        currentSchool?.id || '',
        formData
      );

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
        const response = await rawBulkEnrollApi.getJob(
          currentSchool?.id || '',
          jobId
        );
        const job = response.data;
        setCurrentJob(job);

        if (job.status === 'PROCESSING' || job.status === 'PENDING') {
          setTimeout(poll, 2000);
        } else {
          setIsProcessing(false);
          setStep('complete');
          if (job.status === 'COMPLETED') {
            toast.success(`Successfully enrolled ${job.successfulRows} students!`);
          } else {
            toast.error('Bulk enrollment completed with errors');
          }
        }
      } catch (error) {
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

  const downloadTemplate = () => {
    if (availableFields.length === 0) {
      toast.error('Template fields not loaded yet. Please wait.');
      return;
    }

    const headers = availableFields.map(f => f.label);

    // Sample data rows to show users what the data should look like
    const sampleRows = [
      ['Ade Johnson', 'ade.johnson@example.com', '+2348012345678', 'Male', '12 Greenfield Ave, Lagos', 'GFA/2025/001', 'class-uuid-here', 'Mr Johnson', 'parent@example.com', '+2348087654321'],
      ['Chioma Obi', 'chioma.obi@example.com', '+2348023456789', 'Female', '5 Oak Street, Abuja', 'GFA/2025/002', 'class-uuid-here', 'Mrs Obi', 'mrs.obi@example.com', '+2348098765432'],
      ['David Lee', 'david.lee@example.com', '+2348034567890', 'Male', '', 'GFA/2025/003', '', '', '', ''],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for readability
    const colWidths = headers.map(() => ({ wch: 22 }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Enrollment Template');

    // Also add an instruction sheet
    const instructionData = [
      ['Student Bulk Enrollment Template - Instructions'],
      [],
      ['Field', 'Required', 'Description'],
      ...availableFields.map(f => [f.label, f.required ? 'Yes' : 'No', getFieldDescription(f.key)]),
      [],
      ['Notes:'],
      ['- Gender should be Male, Female, or Other'],
      ['- Class ID should be the UUID of the class (optional)'],
      ['- Admission Number is auto-generated if left blank'],
      ['- Columns marked with * are required'],
      ['- You can delete the sample rows and add your own data'],
      ['- Save the file as .xlsx or .csv before uploading'],
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instructionData);
    wsInstr['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

    XLSX.writeFile(wb, 'student_enrollment_template.xlsx');
  };

  const getFieldDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      full_name: 'Student full name (e.g., Ade Johnson)',
      email: 'Student email address',
      phone: 'Phone number with country code',
      gender: 'Male / Female / Other',
      address: 'Residential address',
      admission_number: 'School admission number (auto-generated if blank)',
      class_id: 'UUID of the class to assign student to',
      parent_name: 'Parent or guardian full name',
      parent_email: 'Parent or guardian email',
      parent_phone: 'Parent or guardian phone number',
    };
    return descriptions[key] || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Student Enrollment</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Upload a CSV or Excel file to enroll multiple students at once
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Link href="/students">
            <Button variant="outline">Back to Students</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-8">
        {(['upload', 'mapping', 'processing', 'complete'] as Step[]).map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                step === s
                  ? 'bg-primary-500 text-white'
                  : ['upload', 'mapping', 'processing', 'complete'].indexOf(step) > index
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}
            >
              {['upload', 'mapping', 'processing', 'complete'].indexOf(step) > index ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`ml-2 text-sm font-medium capitalize ${
              step === s ? 'text-primary-500' : 'text-slate-500'
            }`}>
              {s}
            </span>
            {index < 3 && (
              <ArrowRight className="w-5 h-5 mx-4 text-slate-300 dark:text-slate-600" />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-8">
                <div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                    dragActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
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
                      <p className="text-lg font-medium mb-2">
                        Drag and drop your file here
                      </p>
                      <p className="text-slate-500 mb-4">
                        Supports CSV and Excel files (.csv, .xlsx, .xls)
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        />
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
          <motion.div
            key="mapping"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>File Preview</span>
                  <span className="text-sm font-normal text-slate-500">
                    {file?.name} • {preview.totalRows} rows
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-slate-700">
                        {preview.headers.map((header, i) => (
                          <th key={i} className="text-left p-3 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-b dark:border-slate-800">
                          {row.map((cell, j) => (
                            <td key={j} className="p-3 text-slate-600 dark:text-slate-400">
                              {cell || '-'}
                            </td>
                          ))}
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
                <p className="text-sm text-slate-500">
                  Map your file columns to the student database fields
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preview.headers.map((header) => (
                    <div
                      key={header}
                      className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{header}</p>
                        <p className="text-xs text-slate-500">CSV Column</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                      <select
                        value={mapping[header] || ''}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">-- Skip --</option>
                        {availableFields.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label} {field.required && '*'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {!isValidMapping() && (
                  <div className="mt-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">
                        Required fields missing
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        Please map the following required fields:{' '}
                        {availableFields
                          .filter(f => f.required && !Object.values(mapping).includes(f.key))
                          .map(f => f.label)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleProcess} disabled={!isValidMapping()}>
                    Start Enrollment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="w-16 h-16 mx-auto text-primary-500 animate-spin mb-6" />
                <h2 className="text-xl font-bold mb-2">Processing Enrollment</h2>
                <p className="text-slate-500 mb-6">
                  Please wait while we process your file...
                </p>
                {currentJob && (
                  <div className="max-w-sm mx-auto">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>
                        {currentJob.successfulRows + currentJob.failedRows} / {currentJob.totalRows || '?'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{
                          width: currentJob.totalRows
                            ? `${((currentJob.successfulRows + currentJob.failedRows) / currentJob.totalRows) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'complete' && currentJob && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
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
                  <h2 className="text-xl font-bold mb-2">Enrollment Complete</h2>
                  <p className="text-slate-500">
                    {currentJob.status === 'FAILED'
                      ? 'The enrollment process encountered an error'
                      : 'Your bulk enrollment has been processed'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                  <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                      {currentJob.totalRows}
                    </p>
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
                      <pre className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
                        {currentJob.errorLog}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    Upload Another File
                  </Button>
                  <Link href="/students">
                    <Button>View Students</Button>
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
