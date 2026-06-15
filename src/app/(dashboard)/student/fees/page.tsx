'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { paymentApi, settingsApi, studentApi } from '@/lib/api';
import { useInlinePayment } from '@/lib/payment-inline';
import { Payment } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Calendar,
  Tag,
  Landmark,
  Copy,
  ChevronDown,
  Users,
  Wallet,
  X,
  Loader2,
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

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

interface PaymentAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch?: string;
  description?: string;
  isDefault: boolean;
}

interface StudentInfo {
  id: string;
  fullName: string;
  admissionNumber: string;
  classId?: string;
  className?: string;
  email?: string;
  parentEmail?: string;
}

export default function StudentFeesPage() {
  const { user, currentSchool, isStudent, isParent } = useAuth();

  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedFeeForTransfer, setSelectedFeeForTransfer] = useState<FeeItem | null>(null);
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

  const { status: inlineStatus, startPayment, reset: resetInline } = useInlinePayment({
    schoolId: currentSchool?.id || '',
    onSuccess: () => {
      fetchPayments();
    },
  });

  // Determine target student(s)
  const targetStudents = useMemo<StudentInfo[]>(() => {
    if (isStudent() && user?.studentId) {
      const stu = students.find((s) => s.id === user.studentId);
      return stu ? [stu] : [];
    }
    if (isParent() && user?.children) {
      return students.filter((s) => user.children?.some((c) => c.id === s.id));
    }
    return [];
  }, [isStudent, isParent, user, students]);

  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const fetchConfig = useCallback(async () => {
    if (!currentSchool) return;
    try {
      const res = await settingsApi.get(currentSchool.id);
      const data = (res as any).data || {};
      setFeeItems(data.feeItems || []);
      setPaymentAccounts(data.paymentAccounts || []);
      setGatewayConfig(data);
    } catch {
      // silent
    }
  }, [currentSchool]);

  const fetchPayments = useCallback(async () => {
    if (!currentSchool || !selectedStudentId) return;
    try {
      const res = await paymentApi.getStudentPayments(currentSchool.id, selectedStudentId, { size: 200 });
      setPayments(((res as any).data?.content || []) as Payment[]);
    } catch {
      // silent
    }
  }, [currentSchool, selectedStudentId]);

  const fetchStudents = useCallback(async () => {
    if (!currentSchool) return;
    try {
      // For demo: fetch all students (in production, backend should provide /students/me or /parents/me/children)
      const res = await studentApi.getAll(currentSchool.id, { size: 1000 });
      const all = ((res as any).data?.content || []) as StudentInfo[];
      setStudents(all);
    } catch {
      // silent
    }
  }, [currentSchool]);

  useEffect(() => {
    if (currentSchool) {
      fetchConfig();
      fetchStudents();
    }
  }, [currentSchool, fetchConfig, fetchStudents]);

  useEffect(() => {
    if (targetStudents.length === 1) {
      setSelectedStudentId(targetStudents[0].id);
    } else if (targetStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(targetStudents[0].id);
    }
  }, [targetStudents, selectedStudentId]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchPayments();
    }
  }, [selectedStudentId, fetchPayments]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const getRelevantFees = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return [];
    return feeItems.filter((fee) => {
      if (!fee.isActive) return false;
      if (fee.applicableToAll) return true;
      if (!student.classId) return false;
      return fee.applicableClassIds?.includes(student.classId);
    });
  };

  const isFeePaid = (feeId: string) => {
    return payments.some(
      (p) => p.status === 'SUCCESS' && p.metadata?.studentFeeId === feeId
    );
  };

  const computeDiscountedAmount = (fee: FeeItem) => {
    if (fee.discountType === 'none' || !fee.discountValue) return fee.amount;
    const now = new Date();
    const deadline = fee.discountDeadline ? new Date(fee.discountDeadline) : null;
    if (deadline && now > deadline) return fee.amount;
    if (fee.discountType === 'percentage') return Math.max(0, fee.amount - (fee.amount * fee.discountValue) / 100);
    if (fee.discountType === 'flat') return Math.max(0, fee.amount - fee.discountValue);
    return fee.amount;
  };

  const getFeePayment = (feeId: string) => {
    return payments.find(
      (p) => p.status === 'SUCCESS' && p.metadata?.studentFeeId === feeId
    );
  };

  const handlePayOnline = async (fee: FeeItem) => {
    if (!currentSchool || !selectedStudentId || !activeStudent) return;
    const amount = computeDiscountedAmount(fee);
    const gateway = gatewayConfig?.activeGateway || 'PAYSTACK';

    await startPayment(
      gateway,
      {
        studentId: selectedStudentId,
        amount,
        studentFeeId: fee.id,
        currency: gatewayConfig?.currency || 'NGN',
      },
      activeStudent.email || '',
      activeStudent.fullName
    );
  };

  const handleShowTransfer = (fee: FeeItem) => {
    setSelectedFeeForTransfer(fee);
    setShowTransferModal(true);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAccountId(id);
      setTimeout(() => setCopiedAccountId(null), 1500);
    });
  };

  const relevantFees = getRelevantFees(selectedStudentId);
  const totalPaid = payments.filter((p) => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = relevantFees
    .filter((f) => !isFeePaid(f.id))
    .reduce((sum, f) => sum + computeDiscountedAmount(f), 0);

  if (!currentSchool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Please select a school to continue.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary-500" />
          {isParent() ? 'My Children & Fees' : 'My Fees'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isParent()
            ? 'Select a child to view and pay their school fees'
            : 'View your fee products and make payments'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Fees</p>
                  <p className="text-2xl font-bold">
                    ₦{relevantFees.reduce((s, f) => s + computeDiscountedAmount(f), 0).toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Paid</p>
                  <p className="text-2xl font-bold">₦{totalPaid.toLocaleString()}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pending</p>
                  <p className="text-2xl font-bold">₦{totalPending.toLocaleString()}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Parent: Child Selector */}
      {(isParent() || targetStudents.length > 1) && (
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {isParent() ? 'Select Child' : 'Select Student'}
            </label>
            <div className="flex flex-wrap gap-2">
              {targetStudents.map((stu) => (
                <button
                  key={stu.id}
                  onClick={() => setSelectedStudentId(stu.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    selectedStudentId === stu.id
                      ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {stu.fullName}
                  {stu.className && <span className="opacity-70">({stu.className})</span>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Products */}
      {activeStudent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Fee Products for {activeStudent.fullName}
            </h2>
            <Badge variant="info">{activeStudent.className || 'No class'}</Badge>
          </div>

          {relevantFees.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No fee products available for this class.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {relevantFees.map((fee) => {
                  const paid = isFeePaid(fee.id);
                  const amount = fee.amount;
                  const discounted = computeDiscountedAmount(fee);
                  const hasDiscount = discounted < amount;
                  const feePayment = getFeePayment(fee.id);

                  return (
                    <motion.div
                      key={fee.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border p-5 ${
                        paid
                          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              paid
                                ? 'bg-gradient-to-br from-green-500 to-green-600'
                                : 'bg-gradient-to-br from-primary-500 to-purple-600'
                            }`}
                          >
                            {paid ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : (
                              <Tag className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{fee.name}</p>
                              {paid && (
                                <Badge variant="success" className="text-[10px]">Paid</Badge>
                              )}
                            </div>
                            {fee.description && (
                              <p className="text-xs text-slate-500">{fee.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">
                            ₦{discounted.toLocaleString()}
                          </p>
                          {hasDiscount && (
                            <p className="text-xs text-slate-400 line-through">
                              ₦{amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {fee.discountType !== 'none' && fee.discountValue > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="warning" className="text-[10px]">
                              {fee.discountType === 'percentage' ? `${fee.discountValue}%` : `₦${fee.discountValue}`} off
                            </Badge>
                            {fee.discountDeadline && (
                              <span className="text-slate-500">
                                until {new Date(fee.discountDeadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                        {fee.paymentDeadline && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            Payment deadline: {new Date(fee.paymentDeadline).toLocaleDateString()}
                          </div>
                        )}
                        {feePayment && (
                          <div className="flex items-center gap-1.5 text-xs text-green-600">
                            <Receipt className="w-3 h-3" />
                            Paid on {feePayment.paidAt ? new Date(feePayment.paidAt).toLocaleDateString() : 'N/A'}
                          </div>
                        )}
                      </div>

                      {!paid && (
                        <div className="flex gap-2 mt-4">
                          {gatewayConfig?.paystackEnabled || gatewayConfig?.flutterwaveEnabled ? (
                            <Button
                              size="sm"
                              onClick={() => handlePayOnline(fee)}
                              isLoading={inlineStatus === 'initializing' || inlineStatus === 'pending'}
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pay Online
                            </Button>
                          ) : null}
                          {paymentAccounts.length > 0 && (
                            <Button size="sm" variant="secondary" onClick={() => handleShowTransfer(fee)}>
                              <Landmark className="w-4 h-4 mr-1" />
                              Bank Transfer
                            </Button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-500" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No payment history yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    {payment.status === 'SUCCESS' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : payment.status === 'PENDING' ? (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">₦{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{payment.paymentReference}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      payment.status === 'SUCCESS'
                        ? 'success'
                        : payment.status === 'PENDING'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Transfer Modal */}
      {showTransferModal && selectedFeeForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary-500" />
                Bank Transfer
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                {selectedFeeForTransfer.name}
              </p>
              <p className="text-lg font-bold text-primary-600">
                ₦{computeDiscountedAmount(selectedFeeForTransfer).toLocaleString()}
              </p>
            </div>

            <p className="text-sm text-slate-500">
              Transfer the exact amount to one of the school accounts below. After payment, contact the school admin with your transaction reference for verification.
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {paymentAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{account.bankName}</span>
                    {account.isDefault && (
                      <Badge variant="info" className="text-[10px]">Default</Badge>
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
                        onClick={() => handleCopy(account.accountNumber, account.id)}
                        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {copiedAccountId === account.id ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {account.description && (
                    <p className="text-xs text-slate-500">{account.description}</p>
                  )}
                </div>
              ))}
            </div>

            {paymentAccounts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No bank accounts configured yet.
              </p>
            )}

            <Button variant="secondary" className="w-full" onClick={() => setShowTransferModal(false)}>
              Close
            </Button>
          </motion.div>
        </div>
      )}

      {/* Inline Payment Overlay */}
      {(inlineStatus === 'initializing' || inlineStatus === 'pending') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm font-medium">
              {inlineStatus === 'initializing' ? 'Preparing payment...' : 'Waiting for payment...'}
            </p>
            <p className="text-xs text-slate-500">Complete the payment in the popup window</p>
          </div>
        </div>
      )}
    </div>
  );
}
