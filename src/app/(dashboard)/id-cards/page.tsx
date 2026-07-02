'use client';

import { idCardApi, studentApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Users, Download, Printer, QrCode, GraduationCap, Eye, Camera, X } from 'lucide-react';
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
  const [previewCard, setPreviewCard] = useState<any>(null);

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
    setSelectedStudent(null);
    setSelectedTemplate('');
    setGenerating(false);
    load();
  };

  const filteredStudents = students.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const studentHasCard = (studentId: string) => idCards.some((c) => c.studentId === studentId && c.status === 'ACTIVE');

  const openGenerate = (student?: any) => {
    if (student) {
      setSelectedStudent(student.id);
    } else {
      setSelectedStudent(null);
    }
    setSelectedTemplate('');
    setShowModal(true);
  };

  const renderIdCardTemplate = (data: any, size: 'sm' | 'md' | 'lg' = 'md') => {
    const student = data.student;
    const isLarge = size === 'lg';
    const isSmall = size === 'sm';

    const width = isLarge ? 340 : isSmall ? 260 : 300;
    const pad = isLarge ? 18 : isSmall ? 12 : 14;
    const photoSize = isLarge ? 85 : isSmall ? 60 : 75;
    const fontHeader = isLarge ? 16 : isSmall ? 12 : 14;
    const fontSub = isLarge ? 11 : isSmall ? 9 : 10;
    const fontTiny = isLarge ? 10 : isSmall ? 8 : 9;

    return (
      <div
        className="rounded-xl overflow-hidden shadow-2xl flex-shrink-0"
        style={{ width, background: '#fff', border: '1px solid #e2e8f0' }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0b1d3a 0%, #1e3a5f 100%)',
            color: '#fff',
            padding: `${pad}px ${pad + 2}px`,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div className="absolute top-2 right-2 opacity-40">
            <QrCode className={isLarge ? 'w-6 h-6' : isSmall ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
          <GraduationCap className={isLarge ? 'w-7 h-7' : isSmall ? 'w-5 h-5' : 'w-6 h-6'} style={{ margin: '0 auto 4px' }} />
          <p style={{ margin: 0, fontSize: fontHeader, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {currentSchool?.name || 'School'}
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: fontTiny, opacity: 0.85 }}>STUDENT IDENTITY CARD</p>
        </div>

        {/* Body */}
        <div style={{ padding: pad }}>
          <div style={{ display: 'flex', gap: isLarge ? 16 : isSmall ? 10 : 12 }}>
            {/* Passport Photo */}
            <div style={{ flexShrink: 0 }}>
              {student?.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  style={{
                    width: photoSize,
                    height: photoSize * 1.15,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '2px solid #cbd5e1',
                    background: '#f8fafc',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: photoSize,
                    height: photoSize * 1.15,
                    borderRadius: 4,
                    border: '2px solid #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isSmall ? 9 : 10,
                    color: '#94a3b8',
                    background: '#f8fafc',
                    gap: 4,
                  }}
                >
                  <Camera className={isSmall ? 'w-4 h-4' : 'w-5 h-5'} />
                  <span>PHOTO</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ flex: 1, fontSize: fontSub, color: '#1e293b', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong style={{ color: '#64748b', fontSize: fontTiny, textTransform: 'uppercase' }}>Name:</strong>{' '}
                <span style={{ fontWeight: 600 }}>{data.studentName || student?.fullName || 'N/A'}</span>
              </p>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong style={{ color: '#64748b', fontSize: fontTiny, textTransform: 'uppercase' }}>Adm. No:</strong>{' '}
                {data.admissionNumber || student?.admissionNumber || 'N/A'}
              </p>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong style={{ color: '#64748b', fontSize: fontTiny, textTransform: 'uppercase' }}>Class:</strong>{' '}
                {data.studentClass || student?.className || 'N/A'}
                {student?.section ? ` (${student.section})` : ''}
              </p>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong style={{ color: '#64748b', fontSize: fontTiny, textTransform: 'uppercase' }}>Gender:</strong>{' '}
                {student?.gender || 'N/A'}
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#64748b', fontSize: fontTiny, textTransform: 'uppercase' }}>DOB:</strong>{' '}
                {student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* QR */}
          <div style={{ textAlign: 'center', marginTop: isLarge ? 14 : 10 }}>
            {data.qrCode ? (
              <img src={data.qrCode} alt="QR" style={{ width: isLarge ? 65 : 55, height: isLarge ? 65 : 55, margin: '0 auto' }} />
            ) : (
              <div style={{ width: isLarge ? 65 : 55, height: isLarge ? 65 : 55, margin: '0 auto', background: '#f1f5f9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: isLarge ? 14 : 10, textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
            <p style={{ margin: 0, fontSize: fontTiny, fontWeight: 700, color: '#0b1d3a' }}>Card No: {data.cardNumber || 'N/A'}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: isSmall ? 7 : 8, color: '#64748b' }}>
              Valid until: {data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="id-cards">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">Student ID Cards</h1>
        <div className="flex gap-2">
          <Button onClick={() => openGenerate()} variant="primary">
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
                {/* Mini ID Card Preview */}
                <div className="relative p-4 bg-gradient-to-br from-primary-600 to-purple-700 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      <span className="font-bold text-sm truncate">{currentSchool?.name || 'School'}</span>
                    </div>
                    <QrCode className="w-6 h-6 opacity-80" />
                  </div>
                  <div className="flex items-center gap-3">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        className="w-14 h-[4.5rem] rounded object-cover border-2 border-white/30 bg-white/10"
                      />
                    ) : (
                      <div className="w-14 h-[4.5rem] rounded bg-white/20 flex items-center justify-center text-xl font-bold">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{student.fullName}</p>
                      <p className="text-xs text-white/70">{student.admissionNumber}</p>
                      <p className="text-xs text-white/70">{student.className || 'Class N/A'}{student.section ? ` (${student.section})` : ''}</p>
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
                      <button
                        className="flex-1 btn-secondary text-xs py-2 justify-center flex items-center gap-1"
                        onClick={() => setPreviewCard({ ...card, student })}
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <a href={card.generatedPdfUrl} download className="flex-1 btn-secondary text-xs py-2 justify-center flex items-center gap-1">
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </>
                  ) : (
                    <button
                      className="flex-1 btn-primary text-xs py-2 justify-center flex items-center gap-1"
                      onClick={() => openGenerate(student)}
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

      {/* Generate Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedStudent(null); setSelectedTemplate(''); }} title="Generate ID Card" size="lg">
        <div className="space-y-5">
          {!selectedStudent && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Student</label>
              <select className="glass-input w-full" value={selectedStudent || ''} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">Choose a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</option>
                ))}
              </select>
            </div>
          )}
          {selectedStudent && (
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" />
              <span className="font-medium">{students.find((s) => s.id === selectedStudent)?.fullName}</span>
              <button className="ml-auto text-slate-400 hover:text-red-500" onClick={() => setSelectedStudent(null)}>
                <X className="w-4 h-4" />
              </button>
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

          {/* Live Preview inside generate modal */}
          {selectedStudent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Live Preview</p>
                <span className="text-xs text-slate-400">How the ID card will look</span>
              </div>
              <div className="flex justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                {renderIdCardTemplate({
                  student: students.find((s) => s.id === selectedStudent),
                  studentName: students.find((s) => s.id === selectedStudent)?.fullName,
                  admissionNumber: students.find((s) => s.id === selectedStudent)?.admissionNumber,
                  studentClass: students.find((s) => s.id === selectedStudent)?.className,
                  cardNumber: 'PREVIEW-0000',
                  expiryDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
                  qrCode: null,
                  generatedPdfUrl: null,
                }, 'md')}
              </div>
              <p className="text-xs text-center text-slate-400">
                The passport photograph will be positioned on the left as shown above.
                Ensure the student has a photo uploaded for best results.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setSelectedStudent(null); setSelectedTemplate(''); }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={generateCard} isLoading={generating} disabled={!selectedStudent || !selectedTemplate} className="flex-1">
              <CreditCard className="w-4 h-4" /> Generate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={!!previewCard} onClose={() => setPreviewCard(null)} title="ID Card Preview" size="lg">
        {previewCard && (
          <div className="flex flex-col items-center space-y-5" id="id-card-print-area">
            {/* Large ID Card Visual */}
            <div className="p-1">
              {renderIdCardTemplate(previewCard, 'lg')}
            </div>

            {previewCard.student && !previewCard.student.photoUrl && (
              <div className="w-full p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 flex-shrink-0" />
                <p>This student does not have a passport photograph uploaded. The generated ID card will show a placeholder.</p>
              </div>
            )}

            <div className="flex gap-3 w-full max-w-sm">
              {previewCard.generatedPdfUrl && (
                <a
                  href={previewCard.generatedPdfUrl}
                  download
                  className="flex-1 btn-secondary text-xs py-2.5 justify-center flex items-center gap-1 rounded-xl"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              )}
              <button
                className="flex-1 btn-secondary text-xs py-2.5 justify-center flex items-center gap-1 rounded-xl"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  const cardHtml = document.getElementById('id-card-print-area')?.innerHTML || '';
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>ID Card - ${previewCard.studentName || previewCard.student?.fullName || 'Student'}</title>
                        <style>
                          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; }
                          * { box-sizing: border-box; }
                        </style>
                      </head>
                      <body>${cardHtml}<script>setTimeout(() => { window.print(); }, 300);</script></body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
