'use client';

import { idCardApi, studentApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Users, Download, Printer, QrCode, GraduationCap } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';

export default function IdCardsPage() {
  const { currentSchool } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [idCards, setIdCards] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    if (!currentSchool?.id) return;
    setLoading(true);
    const [sRes, iRes, tRes] = await Promise.all([
      studentApi.getAll(currentSchool.id, { size: 100 }),
      idCardApi.getAll(currentSchool.id, { size: 100 }),
      idCardApi.getTemplates(currentSchool.id),
    ]);
    setStudents(normalizeListResponse<any>(sRes.data).items);
    setIdCards(normalizeListResponse<any>(iRes.data).items);
    setTemplates(normalizeListResponse<any>(tRes.data).items);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentSchool]);

  const generateCard = async () => {
    if (!currentSchool?.id || !selectedStudent || !selectedTemplate) return;
    setGenerating(true);
    await idCardApi.generate(currentSchool.id, {
      studentId: selectedStudent,
      templateId: selectedTemplate,
    });
    setShowModal(false);
    setGenerating(false);
    load();
  };

  const filteredStudents = students.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const studentHasCard = (studentId: string) => idCards.some((c) => c.studentId === studentId && c.status === 'ACTIVE');

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="id-cards">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">Student ID Cards</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowModal(true)} variant="primary">
            <CreditCard className="w-4 h-4" /> Generate ID Card
          </Button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search students..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="glass-input w-full max-w-md"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student, i) => {
            const card = idCards.find((c) => c.studentId === student.id);
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                {/* ID Card Preview */}
                <div className="relative p-4 bg-gradient-to-br from-primary-600 to-purple-700 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      <span className="font-bold text-sm">{currentSchool?.name || 'School'}</span>
                    </div>
                    <QrCode className="w-6 h-6 opacity-80" />
                  </div>
                  <div className="flex items-center gap-3">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        className="w-14 h-14 rounded object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                        {student.fullName?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{student.fullName}</p>
                      <p className="text-xs text-white/70">{student.admissionNumber}</p>
                      <p className="text-xs text-white/70">{student.className || 'Class N/A'}</p>
                    </div>
                  </div>
                  {card && (
                    <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                      <span>Valid until: {new Date(card.expiryDate).toLocaleDateString()}</span>
                      <span className="px-2 py-0.5 rounded bg-white/20">{card.cardNumber}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 flex gap-2">
                  {card ? (
                    <>
                      <a href={card.generatedPdfUrl} download className="flex-1 btn-secondary text-xs py-2 justify-center">
                        <Download className="w-3 h-3" /> Download
                      </a>
                      <button className="flex-1 btn-secondary text-xs py-2 justify-center" onClick={() => window.print()}>
                        <Printer className="w-3 h-3" /> Print
                      </button>
                    </>
                  ) : (
                    <button
                      className="flex-1 btn-primary text-xs py-2 justify-center"
                      onClick={() => { setSelectedStudent(student.id); setShowModal(true); }}
                    >
                      <CreditCard className="w-3 h-3" /> Generate
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Generate ID Card" size="md">
        <div className="space-y-4">
          {!selectedStudent && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Student</label>
              <select className="glass-input w-full" onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">Choose a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Select Template</label>
            <select className="glass-input w-full" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
              <option value="">Choose a template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={generateCard} isLoading={generating} className="w-full">
            <CreditCard className="w-4 h-4" /> Generate ID Card
          </Button>
        </div>
      </Modal>
    </div>
  );
}
