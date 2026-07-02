"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { classApi, studentApi, termApi, reportCardApi, academicSessionApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  GraduationCap,
  User,
  Calendar,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

interface GenerateReportCardModalProps {
  schoolId: string;
  isOpen: boolean;
  onClose: () => void;
  onGenerated?: (report: any) => void;
}

export default function GenerateReportCardModal({
  schoolId,
  isOpen,
  onClose,
  onGenerated,
}: GenerateReportCardModalProps) {
  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);

  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [termId, setTermId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load classes, terms, sessions
  useEffect(() => {
    if (!isOpen || !schoolId) return;
    let mounted = true;
    async function loadMeta() {
      try {
        setLoadingMeta(true);
        const [cRes, tRes, sRes, currentTermRes, currentSessionRes] = await Promise.all([
          classApi.getAll(schoolId, { size: 100 }),
          termApi.getAll(schoolId, { size: 100 }),
          academicSessionApi.getAll(schoolId, { size: 100 }),
          termApi.getCurrent(schoolId).catch(() => ({ data: null })),
          academicSessionApi.getCurrent(schoolId).catch(() => ({ data: null })),
        ]);
        if (!mounted) return;
        const cls = ((cRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const trm = ((tRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        const sess = ((sRes.data as any)?.content || []).map((x: any) => ({ id: x.id, name: x.name }));
        setClasses(cls);
        setTerms(trm);
        setSessions(sess);

        const defaultTermId = currentTermRes?.data?.id || trm[0]?.id || "";
        const defaultSessionId = currentSessionRes?.data?.id || sess[0]?.id || "";
        setTermId(defaultTermId);
        setSessionId(defaultSessionId);
      } catch {
        toast.error("Failed to load filter data");
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    }
    loadMeta();
    return () => { mounted = false; };
  }, [isOpen, schoolId]);

  // Load students when class is selected
  useEffect(() => {
    if (!schoolId || !classId) {
      setStudents([]);
      setStudentId("");
      return;
    }
    let mounted = true;
    async function loadStudents() {
      try {
        setLoadingStudents(true);
        const res = await studentApi.getAll(schoolId, { classId, size: 200 });
        if (!mounted) return;
        const items = (res.data as any)?.content || [];
        setStudents(items);
        if (items.length === 1) {
          setStudentId(items[0].id);
        }
      } catch {
        toast.error("Failed to load students");
      } finally {
        if (mounted) setLoadingStudents(false);
      }
    }
    loadStudents();
    return () => { mounted = false; };
  }, [schoolId, classId]);

  const handleGenerate = async () => {
    if (!studentId) {
      toast.error("Please select a student");
      return;
    }
    try {
      setGenerating(true);
      const res = await reportCardApi.getStudentReport(schoolId, studentId, termId || undefined);
      if (onGenerated) onGenerated(res.data);
      toast.success("Report card generated successfully");
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate report card");
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setClassId("");
    setStudentId("");
    setStudentSearch("");
    onClose();
  };

  const filteredStudents = students.filter((s) =>
    (s.fullName || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.admissionNumber || "").toLowerCase().includes(studentSearch.toLowerCase())
  );

  const selectedStudent = students.find((s) => s.id === studentId);
  const canGenerate = !!studentId;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Report Card" size="md">
      <div className="space-y-5">
        {loadingMeta ? (
          <div className="space-y-3 py-4">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ) : (
          <>
            {/* Class Select */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <GraduationCap className="w-4 h-4 inline mr-1 -mt-0.5" /> Class
              </label>
              <select
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                value={classId}
                onChange={(e) => { setClassId(e.target.value); setStudentId(""); }}
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Student Select */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <User className="w-4 h-4 inline mr-1 -mt-0.5" /> Student
              </label>
              {classId ? (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  {loadingStudents ? (
                    <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  ) : filteredStudents.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStudentId(s.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition-colors ${
                            studentId === s.id
                              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div>
                            <span className="font-medium">{s.fullName}</span>
                            <span className="text-xs text-slate-400 ml-2">{s.admissionNumber}</span>
                          </div>
                          {studentId === s.id && (
                            <div className="w-2 h-2 rounded-full bg-primary-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      No students found
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  Select a class first
                </div>
              )}
            </div>

            {/* Term & Session */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" /> Term
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
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
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                >
                  <option value="">Select session</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStudent && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3">
                <div className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wide mb-1">Selected Student</div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {selectedStudent.fullName} <span className="text-slate-400 font-normal">({selectedStudent.admissionNumber})</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className="flex-1"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {generating ? "Generating..." : "Generate Report Card"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
