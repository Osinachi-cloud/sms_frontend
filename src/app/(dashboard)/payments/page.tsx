'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { paymentApi, studentApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { Payment, Student, PageResponse } from '@/types';
import { motion } from 'framer-motion';
import { Plus, CreditCard, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  amount: z.number().min(1, 'Amount is required'),
});

type PaymentForm = z.infer<typeof paymentSchema>;

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function PaymentsPage() {
  const { currentSchool, hasPermission } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    pending: 0,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  const fetchPayments = async () => {
    if (!currentSchool) return;
    try {
      const response = await paymentApi.getAll(currentSchool.id, { page, size: 10 });
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
  }, [currentSchool, page]);

  const onSubmit = async (data: PaymentForm) => {
    if (!currentSchool) return;
    try {
      const response = await paymentApi.initiate(currentSchool.id, {
        studentId: data.studentId,
        amount: data.amount,
        callbackUrl: window.location.href,
      });

      const paymentData = response.data as Payment;

      if (paymentData.authorizationUrl) {
        window.location.href = paymentData.authorizationUrl;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    }
  };

  const handleVerify = async (reference: string) => {
    if (!currentSchool) return;
    try {
      const response = await paymentApi.verify(currentSchool.id, reference);
      const payment = response.data as Payment;
      if (payment.status === 'SUCCESS') {
        toast.success('Payment verified successfully');
      } else {
        toast.error(`Payment status: ${payment.status}`);
      }
      fetchPayments();
    } catch (error) {
      toast.error('Failed to verify payment');
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    if (reference && currentSchool) {
      handleVerify(reference);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [currentSchool]);

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
    { key: 'paymentMethod', header: 'Method', render: (p: Payment) => p.paymentMethod || '-' },
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
    {
      key: 'actions',
      header: '',
      render: (payment: Payment) => (
        payment.status === 'PENDING' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerify(payment.paymentReference)}
          >
            Verify
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="payments-table">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Payments</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage payments</p>
        </div>
        {hasPermission('payment.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto scrollbar-hide">
          <DataTable
            columns={columns}
            data={payments}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="No payments found"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="New Payment"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Student
            </label>
            <select {...register('studentId')} className="glass-input">
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} ({student.admissionNumber})
                </option>
              ))}
            </select>
            {errors.studentId && (
              <p className="mt-1 text-sm text-red-500">{errors.studentId.message}</p>
            )}
          </div>
          <Input
            {...register('amount', { valueAsNumber: true })}
            type="number"
            label="Amount (NGN)"
            placeholder="Enter amount"
            error={errors.amount?.message}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Pay with Paystack
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
