'use client';

import { reportCardApi, classApi, termApi, academicSessionApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, Award, Calendar, User, AlertCircle, Plus, Mail, Send, Loader2, Users, CheckSquare, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';
import GenerateReportCardModal from '@/components/report-cards/GenerateReportCardModal';
import ReportCardTemplate from '@/components/report-cards/ReportCardTemplate';
import toast from 'react-hot-toast';

export default function ReportCardsPage() {
  const { currentSchool } = useAuth();
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Single email
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Bulk email modal state
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [bulkTermId, setBulkTermId] = useState('');
  const [bulkSessionId, setBulkSessionId] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  const loadReportCards = async () => {
    if (!currentSchool?.id) return;
    try {
      setLoading(true);
      const res = await reportCardApi.getAll(currentSchool.id, { size: 50 });
      const items = normalizeListResponse<any>(res.data).items;
      setReportCards(items);
    } catch {
      toast.error('Failed to load report cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportCards();
  }, [currentSchool]);

  const handleGenerated = (report: any) => {
    setGeneratedReport(report);
    loadReportCards();
  };

  const handleEmailSingle = async (card: any) => {
    if (!currentSchool?.id) return;
    setSendingEmailId(card.id);
    try {
      await reportCardApi.emailToParent(currentSchool.id, card.id);
      toast.success(`Report card emailed to parent of ${card.studentName}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to email report card');
    } finally {
      setSendingEmailId(null);
    }
  };

  const openBulkEmail = async () => {
    setShowBulkEmail(true);
    setLoadingMeta(true);
    setSelectedClassIds([]);
    setBulkTermId('');
    setBulkSessionId('');
    try {
      const [cRes, tRes, sRes, currentTermRes, currentSessionRes] = await Promise.all([
        classApi.getAll(currentSchool?.id || '', { size: 100 }),
        termApi.getAll(currentSchool?.id || '', { size: 100 }),
        academicSessionApi.getAll(currentSchool?.id || '', { size: 100 }),
        termApi.getCurrent(currentSchool?.id || '').catch(() => ({ data: null })),
        academicSessionApi.getCurrent(currentSchool?.id || '').catch(() => ({ data: null })),
      ]);
      const cls = ((cRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
      const trm = ((tRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
      const sess = ((sRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
      setClasses(cls);
      setTerms(trm);
      setSessions(sess);
      setBulkTermId(currentTermRes?.data?.id || trm[0]?.id || '');
      setBulkSessionId(currentSessionRes?.data?.id || sess[0]?.id || '');
    } catch {
      toast.error('Failed to load filter data');
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleBulkEmail = async () => {
    if (!currentSchool?.id) return;
    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class');
      return;
    }
    if (!bulkTermId) {
      toast.error('Please select a term');
      return;
    }
    setBulkSending(true);
    try {
      const res = await reportCardApi.bulkEmailToParents(currentSchool.id, {
        classIds: selectedClassIds,
        termId: bulkTermId,
      });
      toast.success(`Bulk email job started! ${res.data?.count || 0} report(s) queued.`);
      setShowBulkEmail(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start bulk email job');
    } finally {
      setBulkSending(false);
    }
  };

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="report-cards">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">Report Cards</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Generate, view, and email student academic reports to parents
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={openBulkEmail} className="border-primary-300 text-primary-700 hover:bg-primary-50">
            <Mail className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Bulk Email to Parents</span>
            <span className="sm:hidden">Bulk Email</span>
          </Button>
          <Button onClick={() => setShowGenerateModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Generate Report Card
          </Button>
        </div>
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ReportCardTemplate
            report={generatedReport}
            schoolId={currentSchool?.id || ''}
          />
        </motion.div>
      )}

      {/* Existing Report Cards List */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Saved Report Cards
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : reportCards.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No report cards generated yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Click &quot;Generate Report Card&quot; to create a new report from gradebook data.
            </p>
            <Button variant="outline" size="sm" onClick={openBulkEmail} className="border-primary-300 text-primary-700 hover:bg-primary-50">
              <Mail className="w-4 h-4 mr-1.5" /> Bulk Email Existing Reports
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reportCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-4 sm:p-5 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCard(card)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{card.studentName}</h3>
                    <p className="text-xs text-slate-500">{card.admissionNumber}</p>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    card.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {card.status}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {card.termName}
                </p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary-600">{card.averageScore ?? '-'}</p>
                    <p className="text-[10px] text-slate-500">Average</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber-600">{card.overallGrade ?? '-'}</p>
                    <p className="text-[10px] text-slate-500">Grade</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-purple-600">{card.classPosition ?? '-'}/{card.classSize ?? '-'}</p>
                    <p className="text-[10px] text-slate-500">Position</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 btn-secondary text-xs py-1.5 justify-center" onClick={(e) => { e.stopPropagation(); setSelectedCard(card); }}>
                    <Eye className="w-3 h-3" /> View
                  </button>
                  <button
                    className="flex-1 btn-secondary text-xs py-1.5 justify-center text-primary-600 hover:text-primary-700"
                    onClick={(e) => { e.stopPropagation(); handleEmailSingle(card); }}
                    disabled={sendingEmailId === card.id}
                  >
                    {sendingEmailId === card.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    {sendingEmailId === card.id ? 'Sending...' : 'Email Parent'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Saved Card Modal */}
      <Modal isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} title="Report Card Summary" size="lg">
        {selectedCard && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700 flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{currentSchool?.name || 'School'}</h2>
                <p className="text-sm text-slate-500">{selectedCard.termName}</p>
                <div className="mt-3 inline-flex items-center gap-4 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                  <div>
                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{selectedCard.averageScore ?? '-'}</p>
                    <p className="text-xs text-slate-500">Average Score</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                  <div>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{selectedCard.overallGrade ?? '-'}</p>
                    <p className="text-xs text-slate-500">Grade</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                  <div>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{selectedCard.classPosition ?? '-'}<span className="text-sm">/{selectedCard.classSize ?? '-'}</span></p>
                    <p className="text-xs text-slate-500">Position</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 text-slate-500 uppercase text-xs tracking-wider">Subject</th>
                    <th className="text-center py-2 px-2 text-slate-500 uppercase text-xs tracking-wider">Score</th>
                    <th className="text-center py-2 px-2 text-slate-500 uppercase text-xs tracking-wider">Grade</th>
                    <th className="text-left py-2 px-2 text-slate-500 uppercase text-xs tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCard.entries?.map((e: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">{e.subjectName}</td>
                      <td className="text-center py-2 px-2">{e.totalScore ?? '-'}</td>
                      <td className="text-center py-2 px-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          e.gradeLetter === 'A' ? 'bg-emerald-100 text-emerald-700' :
                          e.gradeLetter === 'B' ? 'bg-blue-100 text-blue-700' :
                          e.gradeLetter === 'C' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{e.gradeLetter}</span>
                      </td>
                      <td className="text-xs py-2 px-2 text-slate-500">{e.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Teacher&apos;s Comment</p>
                <p className="text-slate-700 dark:text-slate-300">{selectedCard.teacherComment || 'No comment'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Principal&apos;s Comment</p>
                <p className="text-slate-700 dark:text-slate-300">{selectedCard.principalComment || 'No comment'}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedCard(null)} className="flex-1">Close</Button>
              <Button
                onClick={() => handleEmailSingle(selectedCard)}
                disabled={sendingEmailId === selectedCard.id}
                className="flex-1"
              >
                {sendingEmailId === selectedCard.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                {sendingEmailId === selectedCard.id ? 'Sending...' : 'Email to Parent'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Email Modal */}
      <Modal isOpen={showBulkEmail} onClose={() => setShowBulkEmail(false)} title="Bulk Email Report Cards to Parents" size="md">
        <div className="space-y-5">
          <p className="text-sm text-slate-500">
            Select the classes and term you want to send report cards for. Each report card will be generated as a PDF and emailed to the student&apos;s parent/guardian.
          </p>

          {loadingMeta ? (
            <div className="space-y-3 py-4">
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {/* Term & Session Select */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" /> Term
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    value={bulkTermId}
                    onChange={(e) => setBulkTermId(e.target.value)}
                  >
                    <option value="">Select term</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" /> Session
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    value={bulkSessionId}
                    onChange={(e) => setBulkSessionId(e.target.value)}
                  >
                    <option value="">Select session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Users className="w-4 h-4 inline mr-1 -mt-0.5" /> Classes
                </label>
                {classes.length === 0 ? (
                  <div className="text-center py-4 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    No classes found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {classes.map((c) => {
                      const isSelected = selectedClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleClass(c.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg text-left text-sm transition-colors border ${
                            isSelected
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400'
                              : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary-500 border-primary-500' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                          </div>
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedClassIds.length > 0 && (
                  <p className="text-xs text-primary-600 mt-1.5">{selectedClassIds.length} class(es) selected</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowBulkEmail(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkEmail}
                  disabled={bulkSending || selectedClassIds.length === 0 || !bulkTermId}
                  className="flex-1"
                >
                  {bulkSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {bulkSending ? 'Sending...' : 'Send to All Parents'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Generate Modal */}
      <GenerateReportCardModal
        schoolId={currentSchool?.id || ''}
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerated={handleGenerated}
      />
    </div>
  );
}
