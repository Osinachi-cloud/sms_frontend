'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { paymentApi, settingsApi, studentApi, dashboardApi, termApi, paymentGatewayApi } from '@/lib/api';
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
  Info,
  ArrowRight,
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
  isMandatory?: boolean;
  sessionId?: string;
  sessionName?: string;
  termId?: string;
  termName?: string;
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
  const [selectedFeeDetail, setSelectedFeeDetail] = useState<FeeItem | null>(null);
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const [terms, setTerms] = useState<Array<{ id: string; name: string; sessionId: string }>>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [currentTermId, setCurrentTermId] = useState<string>('');

  const { status: inlineStatus, startPayment, reset: resetInline } = useInlinePayment({
    schoolId: currentSchool?.id || '',
    onSuccess: () => {
      fetchPayments();
    },
  });

  // Build target students from auth context first, enriched by API data when available.
  // This ensures the page works even when studentApi.getAll fails (e.g. students lack student.read permission).
  const targetStudents = useMemo<StudentInfo[]>(() => {
    if (isStudent() && user?.studentId) {
      const stu = students.find((s) => s.id === user.studentId);
      if (stu) return [stu];
      // Fallback: minimal info from auth context
      return [{ id: user.studentId, fullName: user.fullName, admissionNumber: '' }];
    }
    if (isParent() && user?.children) {
      return user.children.map((c) => {
        const stu = students.find((s) => s.id === c.id);
        return stu || { id: c.id, fullName: c.fullName, admissionNumber: '', className: c.className };
      });
    }
    return [];
  }, [isStudent, isParent, user, students]);

  const activeStudent = useMemo<StudentInfo | undefined>(() => {
    const stu = students.find((s) => s.id === selectedStudentId);
    if (stu) return stu;
    if (isStudent() && user?.studentId === selectedStudentId) {
      return { id: user.studentId, fullName: user.fullName, admissionNumber: '' };
    }
    if (isParent() && user?.children) {
      const child = user.children.find((c) => c.id === selectedStudentId);
      if (child) return { id: child.id, fullName: child.fullName, admissionNumber: '', className: child.className, classId: child.classId };
    }
    return undefined;
  }, [students, selectedStudentId, isStudent, isParent, user]);

  const fetchConfig = useCallback(async () => {
    if (!currentSchool) return;
    try {
      const [settingsRes, termsRes, gatewayRes] = await Promise.all([
        settingsApi.get(currentSchool.id),
        termApi.getAll(currentSchool.id, { size: 100 }).catch(() => ({ data: null })),
        paymentGatewayApi.getConfig(currentSchool.id).catch(() => ({ data: null })),
      ]);
      const data = (settingsRes as any).data || {};
      const gatewayData = (gatewayRes as any)?.data || {};

      setFeeItems(data.feeItems || []);
      setPaymentAccounts(data.paymentAccounts || []);
      setGatewayConfig({
        ...data,
        paystackEnabled: gatewayData.paystackEnabled ?? false,
        flutterwaveEnabled: gatewayData.flutterwaveEnabled ?? false,
        activeGateway: gatewayData.activeGateway || data.activeGateway,
        paystackPublicKey: gatewayData.paystackPublicKey,
        flutterwavePublicKey: gatewayData.flutterwavePublicKey,
      });

      // Load available terms and pick current
      const allTerms = ((termsRes as any)?.data?.content || []) as Array<{ id: string; name: string; sessionId: string }>;
      setTerms(allTerms);
      const current = data.currentTerm || allTerms.find((t: any) => t.isCurrent);
      if (current?.id) {
        setCurrentTermId(current.id);
        if (!selectedTermId) setSelectedTermId(current.id);
      }
    } catch {
      // silent
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchool]);

  const fetchPayments = useCallback(async (studentId?: string) => {
    const sid = studentId || selectedStudentId;
    if (!currentSchool || !sid) return;

    // Strategy 1: direct payment API
    try {
      const res = await paymentApi.getStudentPayments(currentSchool.id, sid, { size: 200 });
      const fetched = ((res as any).data?.content || []) as Payment[];
      if (fetched.length > 0) {
        setPayments(fetched);
        return; // done
      }
      console.warn(`Fees page: payment API returned empty for student ${sid}.`);
    } catch (err: any) {
      console.error('Fees page: payment API failed for', sid, err?.response?.status, err?.message);
    }

    // Strategy 2: fetch student detail which may include embedded payments
    // (works even when /payments/student/{id} is admin-only)
    try {
      const res = await studentApi.getOne(currentSchool.id, sid);
      const detail = (res as any).data;
      if (detail?.payments && Array.isArray(detail.payments) && detail.payments.length > 0) {
        console.log('Fees page: loaded payments from student detail');
        setPayments(detail.payments as Payment[]);
        return; // done
      }
    } catch (err: any) {
      console.error('Fees page: student detail API failed for', sid, err?.response?.status, err?.message);
    }

    // Strategy 3: for student users, try dashboard API to discover canonical id
    if (isStudent()) {
      try {
        const dashRes = await dashboardApi.getStudentDashboard(currentSchool.id);
        const dashData = (dashRes as any).data;
        const canonicalId = dashData?.student?.id;
        if (canonicalId && canonicalId !== sid) {
          console.log('Fees page: retrying with canonical studentId from dashboard:', canonicalId);
          // update local state so next fetch uses correct id
          setSelectedStudentId(canonicalId);
          // also enrich students list
          setStudents((prev) => {
            if (prev.some((s) => s.id === canonicalId)) return prev;
            return [...prev, {
              id: canonicalId,
              fullName: dashData.student.fullName,
              admissionNumber: dashData.student.admissionNumber,
              email: dashData.student.email,
              classId: dashData.currentClass?.id,
              className: dashData.currentClass?.name,
            }];
          });
          // now fetch payments with canonical id
          const retryRes = await paymentApi.getStudentPayments(currentSchool.id, canonicalId, { size: 200 });
          const retryFetched = ((retryRes as any).data?.content || []) as Payment[];
          if (retryFetched.length > 0) {
            setPayments(retryFetched);
            return;
          }
        }
      } catch (err: any) {
        console.error('Fees page: dashboard fallback failed', err?.message);
      }
    }

    // Strategy 4: for parent users, try the parent-view endpoint
    // (works when parent role lacks payment.read but has student.grades.read)
    if (isParent()) {
      try {
        const parentRes = await paymentApi.getParentViewOfStudentPayments(currentSchool.id, sid, { size: 200 });
        const parentFetched = ((parentRes as any).data?.content || []) as Payment[];
        if (parentFetched.length > 0) {
          console.log('Fees page: loaded payments via parent-view endpoint');
          setPayments(parentFetched);
          return;
        }
      } catch (err: any) {
        console.error('Fees page: parent-view API failed for', sid, err?.response?.status, err?.message);
      }
    }

    // Nothing worked — keep empty but show user feedback
    setPayments([]);
    console.error(`Fees page: all payment fetch strategies failed for student ${sid}.`);
  }, [currentSchool, selectedStudentId, isStudent, isParent]);

  const fetchStudents = useCallback(async () => {
    if (!currentSchool) return;
    try {
      // Best-effort: fetch all students. May fail for students/parents without student.read permission.
      const res = await studentApi.getAll(currentSchool.id, { size: 1000 });
      const all = ((res as any).data?.content || []) as StudentInfo[];
      setStudents(all);
    } catch {
      // silent — we fall back to auth context data
    }
  }, [currentSchool]);

  // For student users, also try the dedicated dashboard endpoint to get class info
  // when the bulk student list is unavailable.
  const fetchStudentSelfDetails = useCallback(async () => {
    if (!currentSchool || !isStudent()) return;
    try {
      const res = await dashboardApi.getStudentDashboard(currentSchool.id);
      const data = (res as any).data;
      if (data?.student) {
        const stu = data.student;
        // Ensure selectedStudentId uses the canonical student id from the backend
        // when auth context does not provide one (e.g. no studentId in JWT userinfo).
        setSelectedStudentId((prev) => prev || stu.id);
        setStudents((prev) => {
          if (prev.some((s) => s.id === stu.id)) return prev;
          return [...prev, {
            id: stu.id,
            fullName: stu.fullName,
            admissionNumber: stu.admissionNumber,
            email: stu.email,
            classId: data.currentClass?.id,
            className: data.currentClass?.name,
          }];
        });
      }
    } catch {
      // silent
    }
  }, [currentSchool, isStudent]);

  // Fetch individual student details when selectedStudentId is known but not yet in students list
  const fetchStudentDetails = useCallback(async (studentId: string) => {
    if (!currentSchool) return;
    try {
      const res = await studentApi.getOne(currentSchool.id, studentId);
      const stu = (res as any).data as StudentInfo;
      if (stu) {
        setStudents((prev) => {
          if (prev.some((s) => s.id === stu.id)) return prev;
          return [...prev, stu];
        });
      }
    } catch {
      // silent
    }
  }, [currentSchool]);

  useEffect(() => {
    if (currentSchool) {
      fetchConfig();
      fetchStudents();
      fetchStudentSelfDetails();
    }
  }, [currentSchool, fetchConfig, fetchStudents, fetchStudentSelfDetails]);

  // Initialize selectedStudentId directly from auth context so payments fetch immediately
  // without depending on the potentially-failing studentApi.getAll
  useEffect(() => {
    if (selectedStudentId) return;
    if (isStudent() && user?.studentId) {
      setSelectedStudentId(user.studentId);
    } else if (isParent() && user?.children && user.children.length > 0) {
      setSelectedStudentId(user.children[0].id);
    }
  }, [isStudent, isParent, user, selectedStudentId]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchPayments();
      // If we don't have this student's details yet, try to fetch them individually
      if (!students.some((s) => s.id === selectedStudentId)) {
        fetchStudentDetails(selectedStudentId);
      }
    }
  }, [selectedStudentId, fetchPayments, students, fetchStudentDetails]);

  // No separate retry effect needed — fetchPayments now handles all fallback strategies internally.

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (inlineStatus === 'success') {
      setSelectedFeeDetail(null);
    }
  }, [inlineStatus]);

  const getRelevantFees = (studentId: string) => {
    // Use activeStudent fallback (includes auth context data) so parents/students
    // still see fees even when studentApi.getAll fails.
    const student = students.find((s) => s.id === studentId) ||
      (activeStudent?.id === studentId ? activeStudent : undefined);
    return feeItems.filter((fee) => {
      if (!fee.isActive) return false;

      // Term filter: strict. When a term is selected, only show fees explicitly
      // assigned to that term. Fees without a termId are hidden when a term is
      // selected to avoid ambiguity.
      if (selectedTermId) {
        if (fee.termId !== selectedTermId) return false;
      }

      // Class filter
      if (fee.applicableToAll) return true;
      if (student?.classId) {
        return fee.applicableClassIds?.includes(student.classId);
      }
      // If no class info is available, only show applicable-to-all fees
      // so the user doesn't get confused by unrelated fees.
      return false;
    });
  };

  const getPaymentFeeId = (p: Payment) => {
    return p.metadata?.studentFeeId || (p as any).studentFeeId;
  };

  const getPaymentDescription = (p: Payment) => {
    if (p.metadata?.description) return p.metadata.description;
    const feeId = getPaymentFeeId(p);
    if (feeId) {
      const fee = feeItems.find((f: any) => f.id === feeId);
      if (fee) return fee.name;
    }
    return 'School fees';
  };

  const isFeePaid = (feeId: string) => {
    return payments.some(
      (p) => p.status === 'SUCCESS' && getPaymentFeeId(p) === feeId
    );
  };

  const hasActivePayment = (feeId: string) => {
    return payments.some(
      (p) => (p.status === 'SUCCESS' || p.status === 'PENDING') && getPaymentFeeId(p) === feeId
    );
  };

  const getFeePayment = (feeId: string) => {
    return payments.find(
      (p) => p.status === 'SUCCESS' && getPaymentFeeId(p) === feeId
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
        description: fee.name,
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
  const totalFeesAmount = relevantFees.reduce((s, f) => s + computeDiscountedAmount(f), 0);

  // Separate payments explicitly linked to a current fee item from general/unlinked ones.
  const feeIds = useMemo(() => new Set(relevantFees.map((f) => f.id)), [relevantFees]);
  const linkedPayments = payments.filter(
    (p) => p.status === 'SUCCESS' && feeIds.has(getPaymentFeeId(p) || '')
  );
  const unlinkedPayments = payments.filter(
    (p) => p.status === 'SUCCESS' && !feeIds.has(getPaymentFeeId(p) || '')
  );

  const linkedPaid = linkedPayments.reduce((sum, p) => sum + p.amount, 0);
  const unlinkedPaid = unlinkedPayments.reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = linkedPaid + unlinkedPaid;
  const totalPending = Math.max(0, totalFeesAmount - linkedPaid);
  const overpaid = totalPaid > totalFeesAmount ? totalPaid - totalFeesAmount : 0;

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
                    ₦{totalFeesAmount.toLocaleString()}
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
                  {unlinkedPaid > 0 && (
                    <p className="text-green-200 text-xs mt-1">
                      Includes ₦{unlinkedPaid.toLocaleString()} unlinked
                    </p>
                  )}
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
                  {overpaid > 0 && (
                    <p className="text-yellow-200 text-xs mt-1">
                      Overpaid by ₦{overpaid.toLocaleString()}
                    </p>
                  )}
                </div>
                <Clock className="w-10 h-10 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Math consistency notice */}
      {unlinkedPaid > 0 && totalPending > 0 && (
        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            You have payments recorded (₦{unlinkedPaid.toLocaleString()}) that are not linked to a specific fee item.
            Because of this, some fees may still appear unpaid even though money has been received.
            Please contact your school admin to link these payments to the correct fees.
          </p>
        </div>
      )}

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

      {/* Term Filter */}
      {terms.length > 0 && (
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Academic Term:</label>
            <div className="flex flex-wrap gap-2">
              {terms.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTermId(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedTermId === t.id
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.name}
                  {currentTermId === t.id && (
                    <span className="ml-1.5 px-1 py-0.5 rounded bg-white/20 text-[9px] uppercase">Current</span>
                  )}
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
            <div className="flex items-center gap-2">
              {selectedTermId && (
                <Badge variant="info">
                  {terms.find((t) => t.id === selectedTermId)?.name || 'Term'}
                </Badge>
              )}
              <Badge variant="info">{activeStudent.className || 'No class'}</Badge>
            </div>
          </div>

          {relevantFees.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>
                {selectedTermId
                  ? `No fee products found for the selected term (${terms.find((t) => t.id === selectedTermId)?.name || ''}).`
                  : 'No fee products available for this class.'}
              </p>
              {selectedTermId && (
                <p className="text-xs mt-1 text-slate-300">
                  Try selecting a different term or contact your school admin.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {relevantFees.map((fee) => {
                  const paid = isFeePaid(fee.id);
                  const active = hasActivePayment(fee.id);
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{fee.name}</p>
                              {fee.isMandatory !== false && (
                                <Badge variant="error" className="text-[10px]">Mandatory</Badge>
                              )}
                              {fee.isMandatory === false && (
                                <Badge variant="info" className="text-[10px]">Optional</Badge>
                              )}
                              {paid && (
                                <Badge variant="success" className="text-[10px]">Paid</Badge>
                              )}
                              {!paid && active && (
                                <Badge variant="warning" className="text-[10px]">Pending</Badge>
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

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setSelectedFeeDetail(fee)}
                          className="flex-1 btn-secondary text-xs py-2 justify-center flex items-center gap-1 rounded-xl"
                        >
                          <Info className="w-3.5 h-3.5" /> View Details
                        </button>
                        {!active && (
                          <>
                            {gatewayConfig?.paystackEnabled || gatewayConfig?.flutterwaveEnabled ? (
                              <Button
                                size="sm"
                                onClick={() => handlePayOnline(fee)}
                                isLoading={['initializing', 'pending', 'verifying'].includes(inlineStatus)}
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
                          </>
                        )}
                      </div>
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
                      <p className="text-xs text-slate-500">
                        {getPaymentDescription(payment)}
                        <span className="text-slate-400 ml-1">• {payment.paymentReference}</span>
                      </p>
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

      {/* Fee Product Detail Modal */}
      {selectedFeeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-500" />
                Fee Details
              </h3>
              <button
                onClick={() => setSelectedFeeDetail(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isFeePaid(selectedFeeDetail.id) ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-primary-500 to-purple-600'}`}>
                  {isFeePaid(selectedFeeDetail.id) ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Tag className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-base">{selectedFeeDetail.name}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {selectedFeeDetail.isMandatory !== false && (
                      <Badge variant="error" className="text-[10px]">Mandatory</Badge>
                    )}
                    {selectedFeeDetail.isMandatory === false && (
                      <Badge variant="info" className="text-[10px]">Optional</Badge>
                    )}
                    {isFeePaid(selectedFeeDetail.id) && (
                      <Badge variant="success" className="text-[10px]">Paid</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedFeeDetail.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedFeeDetail.description}
                </p>
              )}

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Amount</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600">
                      ₦{computeDiscountedAmount(selectedFeeDetail).toLocaleString()}
                    </p>
                    {computeDiscountedAmount(selectedFeeDetail) < selectedFeeDetail.amount && (
                      <p className="text-xs text-slate-400 line-through">
                        ₦{selectedFeeDetail.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {selectedFeeDetail.discountType !== 'none' && selectedFeeDetail.discountValue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Discount</span>
                    <Badge variant="warning" className="text-[10px]">
                      {selectedFeeDetail.discountType === 'percentage' ? `${selectedFeeDetail.discountValue}%` : `₦${selectedFeeDetail.discountValue}`} off
                    </Badge>
                  </div>
                )}

                {selectedFeeDetail.discountDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Discount Deadline</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedFeeDetail.discountDeadline).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {selectedFeeDetail.paymentDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Payment Deadline</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedFeeDetail.paymentDeadline).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {selectedFeeDetail.sessionName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Session</span>
                    <span className="text-sm font-medium">{selectedFeeDetail.sessionName}</span>
                  </div>
                )}

                {selectedFeeDetail.termName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Term</span>
                    <span className="text-sm font-medium">{selectedFeeDetail.termName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Applicable To</span>
                  <span className="text-sm font-medium">
                    {selectedFeeDetail.applicableToAll ? 'All Classes' : 'Selected Classes'}
                  </span>
                </div>
              </div>

              {!isFeePaid(selectedFeeDetail.id) ? (
                <div className="space-y-2">
                  {/* Gateway not fully configured warning */}
                  {(gatewayConfig?.paystackEnabled || gatewayConfig?.flutterwaveEnabled) &&
                    !gatewayConfig?.paystackPublicKey &&
                    !gatewayConfig?.flutterwavePublicKey && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>Online payment is not fully set up yet. Please contact your school admin or use Bank Transfer.</p>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 text-center">
                    Click below to proceed to payment
                  </p>
                  <div className="flex gap-2">
                    {(gatewayConfig?.paystackEnabled || gatewayConfig?.flutterwaveEnabled) &&
                      (gatewayConfig?.paystackPublicKey || gatewayConfig?.flutterwavePublicKey) ? (
                      <Button
                        className="flex-1"
                        onClick={() => handlePayOnline(selectedFeeDetail)}
                        isLoading={['initializing', 'pending', 'verifying'].includes(inlineStatus)}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Pay Now
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    ) : null}
                    {paymentAccounts.length > 0 && (
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setSelectedFeeDetail(null);
                          handleShowTransfer(selectedFeeDetail);
                        }}
                      >
                        <Landmark className="w-4 h-4 mr-1" />
                        Bank Transfer
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <p>This fee has been paid. No further action is required.</p>
                </div>
              )}
            </div>
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
