'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { paymentApi, studentApi, settingsApi } from '@/lib/api';
import { useInlinePayment } from '@/lib/payment-inline';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { Payment, Student, PageResponse } from '@/types';
import { motion } from 'framer-motion';
import {
  Plus, CreditCard, TrendingUp, CheckCircle, Landmark, Copy, Banknote, Globe,
  Search, Calendar, FileText, Wallet, Receipt, AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  amount: z.number().min(1, 'Amount is required'),
});

type PaymentForm = z.infer<typeof paymentSchema>;

type ModalTab = 'online' | 'transfer' | 'record';

export default function PaymentsPage() {
  const { currentSchool, hasPermission } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('online');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [recordPaymentMethod, setRecordPaymentMethod] = useState('CASH');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    pending: 0,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  const { status: inlineStatus, startPayment } = useInlinePayment({
    schoolId: currentSchool?.id || '',
    onSuccess: () => {
      fetchPayments();
      closeModal();
    },
  });

  const fetchPayments = async () => {
    if (!currentSchool) return;
    try {
      const response = await paymentApi.getAll(currentSchool.id, {
        page,
        size: 10,
        status: statusFilter || undefined,
      });
      const data = response.data as PageResponse<Payment>;
      setPayments(data.content);
      setTotalPages(data.totalPages);

      const successful = data.content.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0);
      const pending = data.content.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
      setStats({
        total: data.totalElements,
        successful,
        pending,
      });
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentConfig = async () => {
    if (!currentSchool) return;
    try {
      const res = await settingsApi.get(currentSchool.id);
      const data = (res as any).data || {};
      setPaymentAccounts(data.paymentAccounts || []);
      setFeeItems(data.feeItems || []);
      setGatewayConfig(data);
    } catch {
      // silent
    }
  };

  const fetchStudents = async () => {
    if (!currentSchool) return;
    try {
      const response = await studentApi.getAll(currentSchool.id, { size: 1000 });
      setStudents((response.data as PageResponse<Student>).content);
    } catch (error) {
      console.error('Failed to load students');
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchPaymentConfig();
  }, [currentSchool, page, statusFilter]);

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    setModalTab('online');
    setSelectedStudentId('');
    setSelectedFeeId('');
    setCustomAmount('');
    setDescription('');
    setRecordPaymentMethod('CASH');
  };

  const onSubmitOnline = async (data: PaymentForm) => {
    if (!currentSchool || !selectedStudentId) return;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const gateway = gatewayConfig?.activeGateway || 'PAYSTACK';
    const feeId = selectedFeeId && selectedFeeId !== 'custom' ? selectedFeeId : undefined;

    await startPayment(
      gateway,
      {
        studentId: selectedStudentId,
        amount: data.amount,
        studentFeeId: feeId,
        currency: gatewayConfig?.currency || 'NGN',
        description,
      },
      student.email || '',
      student.fullName
    );
  };

  const handleRecordPayment = async () => {
    if (!currentSchool || !selectedStudentId || !customAmount) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const feeId = selectedFeeId && selectedFeeId !== 'custom' ? selectedFeeId : undefined;
      await paymentApi.record(currentSchool.id, {
        studentId: selectedStudentId,
        amount: Number(customAmount),
        studentFeeId: feeId,
        currency: gatewayConfig?.currency || 'NGN',
        paymentMethod: recordPaymentMethod,
        description,
      });
      toast.success('Payment recorded successfully');
      fetchPayments();
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const getRelevantFees = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return [];
    return feeItems.filter((fee: any) => {
      if (!fee.isActive) return false;
      if (fee.applicableToAll) return true;
      if (!student.classId) return false;
      return fee.applicableClassIds?.includes(student.classId);
    });
  };

  const computeDiscountedAmount = (fee: any) => {
    if (fee.discountType === 'none' || !fee.discountValue) return fee.amount;
    const now = new Date();
    const deadline = fee.discountDeadline ? new Date(fee.discountDeadline) : null;
    if (deadline && now > deadline) return fee.amount;
    if (fee.discountType === 'percentage') return Math.max(0, fee.amount - (fee.amount * fee.discountValue) / 100);
    if (fee.discountType === 'flat') return Math.max(0, fee.amount - fee.discountValue);
    return fee.amount;
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    // Auto-select the first applicable fee so payments are linked by default.
    const fees = getRelevantFees(studentId);
    const firstFeeId = fees.length > 0 ? fees[0].id : '';
    setSelectedFeeId(firstFeeId);
    if (firstFeeId) {
      const fee = feeItems.find((f: any) => f.id === firstFeeId);
      if (fee) {
        const amount = computeDiscountedAmount(fee);
        setCustomAmount(amount);
        setValue('amount', amount);
      }
    } else {
      setCustomAmount('');
      setValue('amount', undefined as any);
    }
    setValue('studentId', studentId);
  };

  const handleFeeChange = (feeId: string) => {
    setSelectedFeeId(feeId);
    if (feeId === 'custom') {
      setCustomAmount('');
      setValue('amount', undefined as any);
    } else {
      const fee = feeItems.find((f: any) => f.id === feeId);
      if (fee) {
        const amount = computeDiscountedAmount(fee);
        setCustomAmount(amount);
        setValue('amount', amount);
      }
    }
  };

  const handleCustomAmountChange = (val: string) => {
    const num = Number(val);
    setCustomAmount(num || '');
    setValue('amount', num || 0);
  };

  const relevantFees = getRelevantFees(selectedStudentId);

  const filteredPayments = useMemo(() => {
    let result = [...payments];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        (p.studentName || '').toLowerCase().includes(q) ||
        (p.paymentReference || '').toLowerCase().includes(q) ||
        (p.metadata?.description || '').toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((p) => new Date(p.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      result = result.filter((p) => new Date(p.createdAt) <= to);
    }
    return result;
  }, [payments, searchQuery, dateFrom, dateTo]);

  if (!currentSchool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Please select a school to continue.</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'studentName',
      header: 'Student',
      render: (payment: Payment) => (
        <div>
          <p className="font-medium">{payment.studentName || 'N/A'}</p>
          <p className="text-xs text-slate-500">{payment.paymentReference}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payment: Payment) => formatCurrency(payment.amount, payment.currency),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (p: Payment) => (
        <span className="text-xs">
          {p.paymentMethod || (p.metadata?.gateway === 'PAYSTACK' ? 'Paystack' : p.metadata?.gateway === 'FLUTTERWAVE' ? 'Flutterwave' : '-')}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (p: Payment) => (
        <span className="text-xs text-slate-500 truncate max-w-[150px] block">
          {p.metadata?.description || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment: Payment) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
          {payment.status}
        </span>
      ),
    },
    {
      key: 'paidAt',
      header: 'Date',
      render: (payment: Payment) => payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Payments</h1>
          <p className="text-slate-500 dark:text-slate-400">Track, manage and record payments</p>
        </div>
        {hasPermission('payment.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Payment
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Successful</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.successful)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.pending)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, ref or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-10 w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="glass-input"
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="glass-input py-2 text-sm"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="glass-input py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto scrollbar-hide">
          <DataTable
            columns={columns}
            data={filteredPayments}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="No payments found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="New Payment" size="lg">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setModalTab('online')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              modalTab === 'online'
                ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-1" />
            Pay Online
          </button>
          <button
            onClick={() => setModalTab('transfer')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              modalTab === 'transfer'
                ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Landmark className="w-4 h-4 inline mr-1" />
            Bank Transfer
          </button>
          <button
            onClick={() => setModalTab('record')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              modalTab === 'record'
                ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4 inline mr-1" />
            Record Payment
          </button>
        </div>

        {/* Common: Student selector + Fee selector */}
        {modalTab !== 'transfer' && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Student *</label>
              <select
                {...register('studentId')}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="glass-input"
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.admissionNumber}) {student.className ? `- ${student.className}` : ''}
                  </option>
                ))}
              </select>
              {errors.studentId && <p className="mt-1 text-sm text-red-500">{errors.studentId.message}</p>}
            </div>

            {selectedStudentId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fee Product</label>
                <select value={selectedFeeId} onChange={(e) => handleFeeChange(e.target.value)} className="glass-input">
                  <option value="">Select fee...</option>
                  {relevantFees.map((fee: any) => (
                    <option key={fee.id} value={fee.id}>
                      {fee.name} — ₦{computeDiscountedAmount(fee).toLocaleString()}
                      {fee.discountType !== 'none' && fee.discountValue > 0 ? ' (discounted)' : ''}
                    </option>
                  ))}
                  <option value="custom">Custom Amount</option>
                </select>
                {selectedFeeId === 'custom' && relevantFees.length > 0 && (
                  <p className="mt-1.5 text-xs text-orange-600 dark:text-orange-400 flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Custom payments are not linked to a fee product. They will appear in payment history but will not mark any fee as paid.
                  </p>
                )}
              </div>
            )}

            <Input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              label="Amount (NGN) *"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              error={errors.amount?.message}
            />

            <Input
              label="Description / Notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. First term school fees, Book purchase..."
            />
          </div>
        )}

        {/* Tab: Online */}
        {modalTab === 'online' && (
          <form onSubmit={handleSubmit(onSubmitOnline)}>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button
                type="submit"
                isLoading={isSubmitting || inlineStatus === 'initializing' || inlineStatus === 'pending'}
              >
                <Globe className="w-4 h-4 mr-1" />
                Pay with {gatewayConfig?.activeGateway === 'FLUTTERWAVE' ? 'Flutterwave' : 'Paystack'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab: Record */}
        {modalTab === 'record' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Payment Method</label>
              <select
                value={recordPaymentMethod}
                onChange={(e) => setRecordPaymentMethod(e.target.value)}
                className="glass-input"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="POS">POS Terminal</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleRecordPayment}>
                <Receipt className="w-4 h-4 mr-1" />
                Record Payment
              </Button>
            </div>
          </div>
        )}

        {/* Tab: Transfer */}
        {modalTab === 'transfer' && (
          <div className="space-y-4">
            {paymentAccounts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Banknote className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No school bank accounts configured yet.</p>
                <p className="text-xs mt-1">Go to Settings → Payment → Payment Accounts to add one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Transfer the fee amount to one of the school accounts below. After payment, contact the admin with your transaction reference for verification.
                </p>
                {paymentAccounts.map((account: any) => (
                  <div key={account.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-primary-500" />
                        <span className="font-medium text-sm">{account.bankName}</span>
                      </div>
                      {account.isDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800">
                      <span className="text-xs text-slate-500">Account Name</span>
                      <span className="text-sm font-medium">{account.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800">
                      <span className="text-xs text-slate-500">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium font-mono">{account.accountNumber}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(account.accountNumber);
                            setCopiedId(account.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {copiedId === account.id ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    {account.description && <p className="text-xs text-slate-500 px-1">{account.description}</p>}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
