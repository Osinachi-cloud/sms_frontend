'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth';
import { academicSessionApi, termApi, holidayApi } from '@/lib/api';
import { normalizeListResponse } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Pencil, Sun, BookOpen, Check, ArrowRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface Term {
  id: string;
  schoolId: string;
  sessionId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  holidayType: string;
  description?: string;
}

export default function AcademicCalendarSettings() {
  const { currentSchool, isPlatformAdmin, isAppAdmin } = useAuth();
  const router = useRouter();

  const roleName = currentSchool?.roleName?.toLowerCase() || '';
  // Academic calendar is strictly admin-only (no temporary permissions)
  const canManageCalendar = isPlatformAdmin() || isAppAdmin() || roleName.includes('admin');

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeSection, setActiveSection] = useState<'sessions' | 'terms' | 'holidays'>('sessions');

  // Modal states
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  const [newSession, setNewSession] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });
  const [newTerm, setNewTerm] = useState({ name: '', sessionId: '', startDate: '', endDate: '', isCurrent: false });

  // Edit states
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentSchool) return;
    setIsLoading(true);
    try {
      const [sRes, tRes, hRes] = await Promise.all([
        academicSessionApi.getAll(currentSchool.id),
        termApi.getAll(currentSchool.id),
        holidayApi.getAll(currentSchool.id),
      ]);
      setSessions(normalizeListResponse<AcademicSession>(sRes.data).items);
      setTerms(normalizeListResponse<Term>(tRes.data).items);
      setHolidays(normalizeListResponse<Holiday>(hRes.data).items);
    } catch {
      toast.error('Failed to load academic calendar data');
    } finally {
      setIsLoading(false);
    }
  }, [currentSchool]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSession = async () => {
    if (!currentSchool || !newSession.name.trim() || !newSession.startDate || !newSession.endDate) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await academicSessionApi.create(currentSchool.id, {
        name: newSession.name.trim(),
        startDate: newSession.startDate,
        endDate: newSession.endDate,
        isCurrent: newSession.isCurrent,
      });
      toast.success('Academic session created');
      setIsSessionModalOpen(false);
      setNewSession({ name: '', startDate: '', endDate: '', isCurrent: false });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!currentSchool || !confirm('Delete this session?')) return;
    try {
      await academicSessionApi.delete(currentSchool.id, id);
      toast.success('Session deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const handleCreateTerm = async () => {
    if (!currentSchool || !newTerm.name.trim() || !newTerm.sessionId || !newTerm.startDate || !newTerm.endDate) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await termApi.create(currentSchool.id, {
        name: newTerm.name.trim(),
        sessionId: newTerm.sessionId,
        startDate: newTerm.startDate,
        endDate: newTerm.endDate,
        isCurrent: newTerm.isCurrent,
      });
      toast.success('Term created');
      setIsTermModalOpen(false);
      setNewTerm({ name: '', sessionId: '', startDate: '', endDate: '', isCurrent: false });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create term');
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (!currentSchool || !confirm('Delete this term?')) return;
    try {
      await termApi.delete(currentSchool.id, id);
      toast.success('Term deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete term');
    }
  };

  const openCreateSession = () => {
    setEditingSession(null);
    setNewSession({ name: '', startDate: '', endDate: '', isCurrent: false });
    setIsSessionModalOpen(true);
  };

  const openEditSession = (session: AcademicSession) => {
    setEditingSession(session);
    setNewSession({
      name: session.name,
      startDate: session.startDate,
      endDate: session.endDate,
      isCurrent: session.isCurrent,
    });
    setIsSessionModalOpen(true);
  };

  const handleUpdateSession = async () => {
    if (!currentSchool || !editingSession) return;
    if (!newSession.name.trim() || !newSession.startDate || !newSession.endDate) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await academicSessionApi.update(currentSchool.id, editingSession.id, {
        name: newSession.name.trim(),
        startDate: newSession.startDate,
        endDate: newSession.endDate,
        isCurrent: newSession.isCurrent,
      });
      toast.success('Academic session updated');
      setIsSessionModalOpen(false);
      setEditingSession(null);
      setNewSession({ name: '', startDate: '', endDate: '', isCurrent: false });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update session');
    }
  };

  const openCreateTerm = () => {
    setEditingTerm(null);
    setNewTerm({ name: '', sessionId: '', startDate: '', endDate: '', isCurrent: false });
    setIsTermModalOpen(true);
  };

  const openEditTerm = (term: Term) => {
    setEditingTerm(term);
    setNewTerm({
      name: term.name,
      sessionId: term.sessionId,
      startDate: term.startDate,
      endDate: term.endDate,
      isCurrent: term.isCurrent,
    });
    setIsTermModalOpen(true);
  };

  const handleUpdateTerm = async () => {
    if (!currentSchool || !editingTerm) return;
    if (!newTerm.name.trim() || !newTerm.sessionId || !newTerm.startDate || !newTerm.endDate) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await termApi.update(currentSchool.id, editingTerm.id, {
        name: newTerm.name.trim(),
        sessionId: newTerm.sessionId,
        startDate: newTerm.startDate,
        endDate: newTerm.endDate,
        isCurrent: newTerm.isCurrent,
      });
      toast.success('Term updated');
      setIsTermModalOpen(false);
      setEditingTerm(null);
      setNewTerm({ name: '', sessionId: '', startDate: '', endDate: '', isCurrent: false });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update term');
    }
  };

  const goToHolidaysPage = () => {
    router.push(`/holidays?returnTo=/settings`);
  };

  const sections = [
    { key: 'sessions' as const, label: 'Sessions', icon: Calendar },
    { key: 'terms' as const, label: 'Terms', icon: BookOpen },
    { key: 'holidays' as const, label: 'Public Holidays', icon: Sun },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Section Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;
          return (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Sessions Section */}
      {activeSection === 'sessions' && (
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                Academic Sessions
                {!canManageCalendar && (
                  <span className="ml-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">Read-only</span>
                )}
              </CardTitle>
              {canManageCalendar && (
                <Button size="sm" onClick={openCreateSession}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Session
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No academic sessions configured.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {s.name}
                          {s.isCurrent && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {canManageCalendar && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700" onClick={() => openEditSession(s)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteSession(s.id)}>
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
      )}

      {/* Terms Section */}
      {activeSection === 'terms' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
                Terms / Semesters
                {!canManageCalendar && (
                  <span className="ml-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">Read-only</span>
                )}
              </CardTitle>
              {canManageCalendar && (
                <Button size="sm" onClick={openCreateTerm}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Term
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {terms.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No terms configured.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {terms.map((t) => {
                  const parentSession = sessions.find((s) => s.id === t.sessionId);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {t.name}
                            {t.isCurrent && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {parentSession ? `${parentSession.name} • ` : ''}
                            {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {canManageCalendar && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700" onClick={() => openEditTerm(t)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteTerm(t.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Holidays Section - routed to /holidays page */}
      {activeSection === 'holidays' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary-500" />
                Public Holidays
                {!canManageCalendar && (
                  <span className="ml-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">Read-only</span>
                )}
              </CardTitle>
              {canManageCalendar && (
                <Button size="sm" onClick={goToHolidaysPage}>
                  Manage Holidays
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Sun className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No holidays configured.</p>
                <p className="text-xs text-slate-400 mt-1">Attendance will not be counted on these dates.</p>
                {canManageCalendar && (
                  <Button size="sm" className="mt-4" onClick={goToHolidaysPage}>
                    Go to Holidays Page
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {holidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{h.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(h.date).toLocaleDateString()} • {h.holidayType === 'PUBLIC_HOLIDAY' ? 'Public Holiday' : 'School Event'}
                        </p>
                        {h.description && <p className="text-xs text-slate-400 mt-0.5">{h.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Session Modal */}
      <Modal isOpen={isSessionModalOpen} onClose={() => { setIsSessionModalOpen(false); setEditingSession(null); }} title={editingSession ? 'Edit Academic Session' : 'Create Academic Session'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Session Name *</label>
            <input value={newSession.name} onChange={(e) => setNewSession({ ...newSession, name: e.target.value })} placeholder="e.g. 2025/2026 Academic Session" className="glass-input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date *</label>
              <input type="date" value={newSession.startDate} onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date *</label>
              <input type="date" value={newSession.endDate} onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })} className="glass-input w-full" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={newSession.isCurrent} onChange={(e) => setNewSession({ ...newSession, isCurrent: e.target.checked })} className="w-4 h-4 rounded" />
            Set as current session
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setIsSessionModalOpen(false); setEditingSession(null); }}>Cancel</Button>
            <Button onClick={editingSession ? handleUpdateSession : handleCreateSession}>
              <Check className="w-4 h-4 mr-1" />
              {editingSession ? 'Update Session' : 'Create Session'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create / Edit Term Modal */}
      <Modal isOpen={isTermModalOpen} onClose={() => { setIsTermModalOpen(false); setEditingTerm(null); }} title={editingTerm ? 'Edit Term / Semester' : 'Create Term / Semester'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Term Name *</label>
            <input value={newTerm.name} onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })} placeholder="e.g. First Term" className="glass-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Session *</label>
            <select value={newTerm.sessionId} onChange={(e) => setNewTerm({ ...newTerm, sessionId: e.target.value })} className="glass-input w-full">
              <option value="">Select a session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date *</label>
              <input type="date" value={newTerm.startDate} onChange={(e) => setNewTerm({ ...newTerm, startDate: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date *</label>
              <input type="date" value={newTerm.endDate} onChange={(e) => setNewTerm({ ...newTerm, endDate: e.target.value })} className="glass-input w-full" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={newTerm.isCurrent} onChange={(e) => setNewTerm({ ...newTerm, isCurrent: e.target.checked })} className="w-4 h-4 rounded" />
            Set as current term
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setIsTermModalOpen(false); setEditingTerm(null); }}>Cancel</Button>
            <Button onClick={editingTerm ? handleUpdateTerm : handleCreateTerm}>
              <Check className="w-4 h-4 mr-1" />
              {editingTerm ? 'Update Term' : 'Create Term'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
