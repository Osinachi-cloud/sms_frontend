'use client';

import { admissionApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TicketCheck, Search, Filter, CheckCircle, XCircle, Clock, Eye, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function AdmissionsPage() {
  const { currentSchool } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const demoApps = [
    { id: '1', applicationNumber: 'APP-2026-001', firstName: 'Michael', lastName: 'Johnson', dateOfBirth: '2015-03-12', gender: 'MALE', guardianName: 'Mr. Johnson', guardianPhone: '+2348012345678', intendedClassName: 'JSS 1', status: 'PENDING', examScore: null, interviewScore: null, createdAt: new Date().toISOString() },
    { id: '2', applicationNumber: 'APP-2026-002', firstName: 'Amara', lastName: 'Williams', dateOfBirth: '2014-07-22', gender: 'FEMALE', guardianName: 'Mrs. Williams', guardianPhone: '+2348098765432', intendedClassName: 'JSS 2', status: 'UNDER_REVIEW', examScore: 78, interviewScore: null, createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];

  useEffect(() => {
    if (currentSchool?.id) {
      loadApps();
    }
  }, [currentSchool]);

  const loadApps = async () => {
    try {
      const res = await admissionApi.getAll(currentSchool!.id, { size: 50 });
      setApplications(res.data?.content?.length ? res.data.content : demoApps);
    } catch {
      setApplications(demoApps);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await admissionApi.review(id, { status, reviewNotes: '' });
    loadApps();
    setSelectedApp(null);
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  const filtered = applications.filter((a) =>
    !filter || a.status === filter
  );

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="admissions">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">Admission Applications</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search applications..." className="glass-input pl-10 w-full" />
        </div>
        <select className="glass-input w-full sm:w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="INTERVIEW_SCHEDULED">Interview</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedApp(app)}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {app.firstName?.charAt(0)}{app.lastName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{app.firstName} {app.lastName}</p>
                  <p className="text-xs text-slate-500">{app.applicationNumber} &middot; {app.intendedClassName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusColors[app.status] || 'bg-slate-100 text-slate-600'}`}>
                  {app.status?.replace('_', ' ')}
                </span>
                <Eye className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Details" size="lg">
        {selectedApp && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Full Name</p>
                <p className="font-medium">{selectedApp.firstName} {selectedApp.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Application Number</p>
                <p className="font-medium">{selectedApp.applicationNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date of Birth</p>
                <p className="font-medium">{selectedApp.dateOfBirth ? new Date(selectedApp.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Gender</p>
                <p className="font-medium">{selectedApp.gender}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Guardian</p>
                <p className="font-medium">{selectedApp.guardianName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium">{selectedApp.guardianPhone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Intended Class</p>
                <p className="font-medium">{selectedApp.intendedClassName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Applied On</p>
                <p className="font-medium">{new Date(selectedApp.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedApp.examScore && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500">Exam Score</p>
                <p className="text-lg font-bold text-primary-600">{selectedApp.examScore}%</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-green-600 hover:bg-green-700 text-white transition-all" onClick={() => updateStatus(selectedApp.id, 'ACCEPTED')}>
                <CheckCircle className="w-4 h-4" /> Accept
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-red-600 hover:bg-red-700 text-white transition-all" onClick={() => updateStatus(selectedApp.id, 'REJECTED')}>
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button className="flex-1 btn-secondary" onClick={() => updateStatus(selectedApp.id, 'UNDER_REVIEW')}>
                <Clock className="w-4 h-4" /> Under Review
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
