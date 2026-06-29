'use client';

import { reportCardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, Award, Calendar, User, AlertCircle, Plus } from 'lucide-react';
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

  const handlePrint = () => window.print();
  const handleDownload = async () => {
    if (!generatedReport?.student?.id) {
      toast.error('No report to download');
      return;
    }
    try {
      const res = await reportCardApi.downloadPdf(
        currentSchool?.id || '',
        generatedReport.student.id,
        generatedReport.term?.id
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedReport.student.name || 'report-card'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="report-cards">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">Report Cards</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Generate and view student academic reports from gradebook data
          </p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Generate Report Card
        </Button>
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ReportCardTemplate
            report={generatedReport}
            onPrint={handlePrint}
            onDownload={handleDownload}
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
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Click "Generate Report Card" to create a new report from gradebook data.
            </p>
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
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
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
          </div>
        )}
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
