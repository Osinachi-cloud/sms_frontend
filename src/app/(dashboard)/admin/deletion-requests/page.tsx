'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { rawDeletionRequestApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Trash2, Check, X, ArrowRight, Clock, AlertTriangle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeletionRequest {
  id: string;
  schoolId: string;
  requestedBy: string;
  reason: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  forwardedBy: string | null;
  forwardedAt: string | null;
  forwardNotes: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNotes: string | null;
  createdAt: string;
  school?: {
    name: string;
    code: string;
  };
  requester?: {
    fullName: string;
    email: string;
  };
}

type TabType = 'pending' | 'reviewed' | 'forwarded' | 'all';

export default function DeletionRequestsPage() {
  const { user, isPlatformAdmin, isAppAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [actionModal, setActionModal] = useState<'review' | 'forward' | 'decision' | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await rawDeletionRequestApi.getAll(
        activeTab === 'all' ? undefined : { status: activeTab }
      );
      setRequests(response.data.content || []);
    } catch (error) {
      toast.error('Failed to fetch deletion requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (approve: boolean) => {
    if (!selectedRequest || !notes.trim()) {
      toast.error('Please provide review notes');
      return;
    }

    setIsSubmitting(true);
    try {
      await rawDeletionRequestApi.review(selectedRequest.id, {
        notes: notes.trim(),
        approved: approve,
      });
      toast.success(approve ? 'Request approved for forwarding' : 'Request rejected');
      setActionModal(null);
      setSelectedRequest(null);
      setNotes('');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to review request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForward = async () => {
    if (!selectedRequest || !notes.trim()) {
      toast.error('Please provide forward notes');
      return;
    }

    setIsSubmitting(true);
    try {
      await rawDeletionRequestApi.forward(selectedRequest.id, {
        notes: notes.trim(),
      });
      toast.success('Request forwarded to App Admin');
      setActionModal(null);
      setSelectedRequest(null);
      setNotes('');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to forward request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async (approve: boolean) => {
    if (!selectedRequest || !notes.trim()) {
      toast.error('Please provide decision notes');
      return;
    }

    setIsSubmitting(true);
    try {
      await rawDeletionRequestApi.decide(selectedRequest.id, {
        notes: notes.trim(),
        approved: approve,
      });
      toast.success(approve ? 'School deletion approved. Backup created.' : 'Request rejected');
      setActionModal(null);
      setSelectedRequest(null);
      setNotes('');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'warning',
      REVIEWED: 'info',
      FORWARDED: 'default',
      APPROVED: 'success',
      REJECTED: 'danger',
    };
    return <Badge variant={styles[status] as any || 'default'}>{status}</Badge>;
  };

  const openActionModal = (request: DeletionRequest, action: 'review' | 'forward' | 'decision') => {
    setSelectedRequest(request);
    setActionModal(action);
    setNotes('');
  };

  const tabs: { key: TabType; label: string; visible: boolean }[] = [
    { key: 'pending', label: 'Pending', visible: true },
    { key: 'reviewed', label: 'Reviewed', visible: true },
    { key: 'forwarded', label: 'Forwarded', visible: isAppAdmin() },
    { key: 'all', label: 'All Requests', visible: true },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Deletion Requests</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage school deletion requests with maker-checker workflow
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b dark:border-slate-700 flex-wrap">
        {tabs.filter(t => t.visible).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trash2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">
              No {activeTab} requests
            </h3>
            <p className="text-slate-500">Deletion requests will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {request.school?.name || 'Unknown School'}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Code: {request.school?.code || request.schoolId}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Reason for deletion:
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {request.reason}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          Requested by: {request.requester?.fullName || 'Unknown'}
                        </span>
                      </div>

                      {(request.reviewNotes || request.forwardNotes || request.decisionNotes) && (
                        <div className="mt-3 space-y-2">
                          {request.reviewNotes && (
                            <div className="text-sm">
                              <span className="font-medium">Review Notes:</span>{' '}
                              <span className="text-slate-600 dark:text-slate-400">{request.reviewNotes}</span>
                            </div>
                          )}
                          {request.forwardNotes && (
                            <div className="text-sm">
                              <span className="font-medium">Forward Notes:</span>{' '}
                              <span className="text-slate-600 dark:text-slate-400">{request.forwardNotes}</span>
                            </div>
                          )}
                          {request.decisionNotes && (
                            <div className="text-sm">
                              <span className="font-medium">Decision Notes:</span>{' '}
                              <span className="text-slate-600 dark:text-slate-400">{request.decisionNotes}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        {request.status === 'PENDING' && !isAppAdmin() && (
                          <Button
                            size="sm"
                            onClick={() => openActionModal(request, 'review')}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}
                        {request.status === 'REVIEWED' && !isAppAdmin() && (
                          <Button
                            size="sm"
                            onClick={() => openActionModal(request, 'forward')}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Forward to App Admin
                          </Button>
                        )}
                        {request.status === 'FORWARDED' && isAppAdmin() && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => openActionModal(request, 'decision')}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Make Final Decision
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={actionModal === 'review'}
        onClose={() => setActionModal(null)}
        title="Review Deletion Request"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                  Review this deletion request
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  After approval, it will be ready for forwarding to App Admin.
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Review Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your review notes..."
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleReview(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleReview(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve for Forwarding
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={actionModal === 'forward'}
        onClose={() => setActionModal(null)}
        title="Forward to App Admin"
      >
        <div className="space-y-4">
          <Input
            label="Forward Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for App Admin..."
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setActionModal(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForward}
              disabled={isSubmitting}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Forward Request
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={actionModal === 'decision'}
        onClose={() => setActionModal(null)}
        title="Final Decision"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  This action cannot be undone
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  Approving will soft-delete the school. A backup will be created automatically.
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Decision Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your decision notes..."
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleDecision(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDecision(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Approve Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
