'use client';

import { reportCardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, TrendingUp, Award, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';

export default function ReportCardsPage() {
  const { currentSchool } = useAuth();
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const demoCards = [
    { id: '1', studentName: 'Ade Johnson', admissionNumber: 'GFA/2023/001', termName: 'First Term 2025/2026', averageScore: 78.5, overallGrade: 'B', classPosition: 5, classSize: 35, status: 'PUBLISHED', attendancePresent: 45, attendanceAbsent: 2, teacherComment: 'Excellent performance. Keep it up!', principalComment: 'A well-rounded student.', entries: [
      { subjectName: 'Mathematics', testScore: 18, examScore: 55, totalScore: 73, gradeLetter: 'B', remarks: 'Good' },
      { subjectName: 'English', testScore: 20, examScore: 62, totalScore: 82, gradeLetter: 'A', remarks: 'Excellent' },
      { subjectName: 'Science', testScore: 15, examScore: 50, totalScore: 65, gradeLetter: 'C', remarks: 'Fair' },
    ]},
    { id: '2', studentName: 'Chioma Obi', admissionNumber: 'GFA/2022/001', termName: 'First Term 2025/2026', averageScore: 85.2, overallGrade: 'A', classPosition: 2, classSize: 30, status: 'PUBLISHED', attendancePresent: 47, attendanceAbsent: 0, teacherComment: 'Outstanding work!', principalComment: 'Top performer.', entries: [
      { subjectName: 'Mathematics', testScore: 20, examScore: 68, totalScore: 88, gradeLetter: 'A', remarks: 'Excellent' },
      { subjectName: 'English', testScore: 19, examScore: 65, totalScore: 84, gradeLetter: 'A', remarks: 'Excellent' },
    ]},
  ];

  useEffect(() => {
    if (currentSchool?.id) {
      reportCardApi.getAll(currentSchool.id, { size: 20 }).then((r) => {
        const items = normalizeListResponse<any>(r.data).items;
        setReportCards(items.length ? items : demoCards);
      }).catch(() => setReportCards(demoCards));
    }
  }, [currentSchool]);

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="report-cards">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">Report Cards</h1>
        <Button>
          <FileText className="w-4 h-4" /> Generate New
        </Button>
      </div>

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
                <h3 className="font-semibold text-sm">{card.studentName}</h3>
                <p className="text-xs text-slate-500">{card.admissionNumber}</p>
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                card.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {card.status}
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {card.termName}
            </p>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <p className="text-xl font-bold text-primary-600">{card.averageScore}</p>
                <p className="text-[10px] text-slate-500">Average</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-amber-600">{card.overallGrade}</p>
                <p className="text-[10px] text-slate-500">Grade</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-600">{card.classPosition}/{card.classSize}</p>
                <p className="text-[10px] text-slate-500">Position</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 btn-secondary text-xs py-1.5 justify-center">
                <Eye className="w-3 h-3" /> View
              </button>
              <button className="flex-1 btn-secondary text-xs py-1.5 justify-center">
                <Download className="w-3 h-3" /> PDF
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} title="Report Card" size="lg">
        {selectedCard && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold">{currentSchool?.name || 'School'}</h2>
              <p className="text-sm text-slate-500">{selectedCard.termName}</p>
              <div className="mt-3 inline-flex items-center gap-4 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <div>
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{selectedCard.averageScore}</p>
                  <p className="text-xs text-slate-500">Average Score</p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{selectedCard.overallGrade}</p>
                  <p className="text-xs text-slate-500">Grade</p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{selectedCard.classPosition}<span className="text-sm">/{selectedCard.classSize}</span></p>
                  <p className="text-xs text-slate-500">Position</p>
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2">Subject</th>
                    <th className="text-center py-2 px-2">Test</th>
                    <th className="text-center py-2 px-2">Exam</th>
                    <th className="text-center py-2 px-2">Total</th>
                    <th className="text-center py-2 px-2">Grade</th>
                    <th className="text-left py-2 px-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCard.entries?.map((e: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-2 px-2 font-medium">{e.subjectName}</td>
                      <td className="text-center py-2 px-2">{e.testScore || '-'}</td>
                      <td className="text-center py-2 px-2">{e.examScore || '-'}</td>
                      <td className="text-center py-2 px-2 font-semibold">{e.totalScore}</td>
                      <td className="text-center py-2 px-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          e.gradeLetter === 'A' ? 'bg-green-100 text-green-700' :
                          e.gradeLetter === 'B' ? 'bg-blue-100 text-blue-700' :
                          e.gradeLetter === 'C' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{e.gradeLetter}</span>
                      </td>
                      <td className="text-xs py-2 px-2 text-slate-500">{e.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Teacher&apos;s Comment</p>
                <p>{selectedCard.teacherComment}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Principal&apos;s Comment</p>
                <p>{selectedCard.principalComment}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
