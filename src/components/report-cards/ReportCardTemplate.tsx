"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  Printer,
  Download,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  Award,
  BookOpen,
  User,
  School,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function resolveGrade(total: number | null, gradingScale: any[]): string {
  if (total === null || total === undefined) return "-";
  const sorted = [...gradingScale].sort((a, b) => (b.minScore ?? 0) - (a.minScore ?? 0));
  for (const entry of sorted) {
    const min = Number(entry.minScore ?? 0);
    const max = Number(entry.maxScore ?? 100);
    if (total >= min && total <= max) {
      return String(entry.grade ?? "-");
    }
  }
  return "F";
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
    case "B":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    case "C":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "D":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
    default:
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  }
}

function gradeBg(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-emerald-50 dark:bg-emerald-950/30";
    case "B":
      return "bg-blue-50 dark:bg-blue-950/30";
    case "C":
      return "bg-amber-50 dark:bg-amber-950/30";
    case "D":
      return "bg-orange-50 dark:bg-orange-950/30";
    default:
      return "bg-red-50 dark:bg-red-950/30";
  }
}

function getRatingLabel(rating: any): string {
  if (rating === null || rating === undefined) return "-";
  const n = Number(rating);
  if (n >= 5) return "Excellent";
  if (n >= 4) return "Very Good";
  if (n >= 3) return "Good";
  if (n >= 2) return "Fair";
  return "Poor";
}

function getRatingColor(rating: any): string {
  if (rating === null || rating === undefined) return "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
  const n = Number(rating);
  if (n >= 5) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (n >= 4) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (n >= 3) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (n >= 2) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

interface ReportCardTemplateProps {
  report: any;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function ReportCardTemplate({ report, onPrint, onDownload }: ReportCardTemplateProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const studentName = report?.student?.name || "report-card";
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${studentName}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };
      await html2pdf().set(opt).from(reportRef.current).save();
    } finally {
      setDownloading(false);
    }
  }, [report]);

  if (!report) return null;

  const school = report.school || {};
  const student = report.student || {};
  const term = report.term || {};
  const attendance = report.attendance || {};
  const subjects = report.subjects || [];
  const affective = report.affective_domain || [];

  const overallAverage = report.overall_average;
  const overallGrade = report.overall_grade;

  // School branding colors
  const primaryColor = school.primaryColor || "#3b82f6";
  const secondaryColor = school.secondaryColor || "#8b5cf6";
  const accentColor = school.accentColor || "#10b981";

  // Grading scale from backend config (with sensible defaults)
  const gradingScale = report.grading_scale || [
    { grade: "A", minScore: 70, maxScore: 100, label: "Excellent" },
    { grade: "B", minScore: 60, maxScore: 69, label: "Very Good" },
    { grade: "C", minScore: 50, maxScore: 59, label: "Good" },
    { grade: "D", minScore: 45, maxScore: 49, label: "Fair" },
    { grade: "F", minScore: 0, maxScore: 44, label: "Poor" },
  ];

  // Extract all unique component names across subjects for column ordering
  const allComponentNames: string[] = Array.from(
    new Set<string>(
      subjects.flatMap((sub: any) =>
        (sub.components || []).map((c: any) => c.component_name)
      )
    )
  );

  const getComponentDisplay = (subject: any, name: string) => {
    const comp = (subject.components || []).find((c: any) => c.component_name === name);
    if (!comp) return "-";
    if (comp.score === null || comp.score === undefined) return "...";
    if (comp.score === "-") return "Missed";
    return `${comp.score}`;
  };

  const getComponentWeight = (subject: any, name: string) => {
    const comp = (subject.components || []).find((c: any) => c.component_name === name);
    return comp?.weight ?? "-";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Actions Bar */}
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Report Card</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={onDownload || handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Report Card Paper */}
      <div ref={reportRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Header Banner — uses school's custom branding colors */}
        <div
          className="relative text-white px-8 py-8"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative flex items-center gap-6">
            {/* School Logo Placeholder */}
            <div className="w-20 h-20 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/25 shrink-0">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt="School Logo" className="w-16 h-16 object-contain" />
              ) : (
                <School className="w-10 h-10 text-white/90" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {school.name || "School Name"}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-white/80">
                {school.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {school.address}
                  </span>
                )}
                {school.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {school.phone}
                  </span>
                )}
                {school.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {school.email}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs uppercase tracking-wider text-white/60 font-semibold">Academic Report</div>
              <div className="text-lg font-bold">{term.name || "Current Term"}</div>
              {term.session_name && <div className="text-sm text-white/70">{term.session_name}</div>}
            </div>
          </div>
        </div>

        {/* Grading Scale Strip */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-8 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">Grading Scale:</span>
            {gradingScale.map((entry: any, idx: number) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${gradeColor(entry.grade)}`}
                title={`${entry.minScore} - ${entry.maxScore}% (${entry.label})`}
              >
                {entry.grade}: {entry.minScore}-{entry.maxScore}% {entry.label ? `(${entry.label})` : ""}
              </span>
            ))}
          </div>
        </div>

        {/* Student Info Section */}
        <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            {/* Student Avatar */}
            <div className="sm:col-span-2 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-3xl font-bold text-slate-500 border-4 border-white dark:border-slate-800 shadow-lg">
                {student.name?.charAt(0) || "?"}
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Student</div>
              </div>
            </div>

            {/* Student Details */}
            <div className="sm:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Full Name</span>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">{student.name || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Admission Number</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{student.admission_number || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Class</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    {student.class_name || "-"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Gender</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{student.gender || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Date of Birth</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {student.date_of_birth || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Class Teacher</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {student.class_teacher_name || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="sm:col-span-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3 text-center">Overall Performance</div>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {overallAverage !== null && overallAverage !== undefined ? overallAverage : "-"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">Average (%)</div>
                  </div>
                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center">
                    {overallGrade ? (
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-xl font-black border-2 ${gradeColor(overallGrade)}`}>
                        {overallGrade}
                      </div>
                    ) : (
                      <div className="text-3xl font-black text-slate-300">-</div>
                    )}
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">Grade</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Performance */}
        <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Academic Performance</h3>
          </div>

          {subjects.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider">Subject</th>
                    {allComponentNames.map((name, i) => (
                      <th key={i} className="text-center py-3 px-3 font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider whitespace-nowrap">
                        {name}
                        <span className="block text-[10px] font-normal text-slate-400 normal-case">(Score / Weight)</span>
                      </th>
                    ))}
                    <th className="text-center py-3 px-3 font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider whitespace-nowrap">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub: any, idx: number) => {
                    const total = sub.total ?? null;
                    const isComplete = sub.total_complete === true;
                    const grade = resolveGrade(total, gradingScale);
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${gradeBg(grade)}`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {sub.subject_name || "-"}
                        </td>
                        {allComponentNames.map((name, i) => {
                          const comp = (sub.components || []).find((c: any) => c.component_name === name);
                          return (
                            <td key={i} className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                              {comp ? (
                                <span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {comp.score === null || comp.score === undefined ? "..." : comp.score}
                                  </span>
                                  <span className="text-slate-400 text-xs"> / {comp.weight}</span>
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {total !== null && total !== undefined ? total : "..."}
                          </span>
                          {!isComplete && total !== null && (
                            <span className="block text-[9px] text-amber-500 font-semibold uppercase tracking-wide mt-0.5">Partial</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {grade !== "-" ? (
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${gradeColor(grade)}`}>
                              {grade}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No subject results available.</p>
            </div>
          )}
        </div>

        {/* Affective Domain & Attendance Grid */}
        <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Affective Domain — side-by-side grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Affective Domain</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {affective.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.trait}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.rating ? (
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${getRatingColor(item.rating)}`}>
                          {item.rating}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                      <span className={`text-[10px] font-medium w-16 text-right ${item.rating ? "text-slate-600 dark:text-slate-300" : "text-slate-300"}`}>
                        {getRatingLabel(item.rating)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-2.5 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">{attendance.present ?? 0}</div>
                  <div className="text-[10px] font-semibold text-emerald-600/80 uppercase tracking-wide">Present</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-2.5 text-center">
                  <XCircle className="w-4 h-4 text-red-600 mx-auto mb-0.5" />
                  <div className="text-lg font-black text-red-700 dark:text-red-400">{attendance.absent ?? 0}</div>
                  <div className="text-[10px] font-semibold text-red-600/80 uppercase tracking-wide">Absent</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-2.5 text-center">
                  <AlertCircle className="w-4 h-4 text-amber-600 mx-auto mb-0.5" />
                  <div className="text-lg font-black text-amber-700 dark:text-amber-400">{attendance.late ?? 0}</div>
                  <div className="text-[10px] font-semibold text-amber-600/80 uppercase tracking-wide">Late</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-2.5 text-center">
                  <TrendingUp className="w-4 h-4 text-blue-600 mx-auto mb-0.5" />
                  <div className="text-lg font-black text-blue-700 dark:text-blue-400">{attendance.percentage ?? 0}%</div>
                  <div className="text-[10px] font-semibold text-blue-600/80 uppercase tracking-wide">Attendance</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teacher Comment */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Teacher&apos;s Comment</h4>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 min-h-[80px]">
                <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                  {report.teacher_comment || "No comment provided."}
                </p>
              </div>
            </div>

            {/* Principal Comment */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <School className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Principal&apos;s Comment</h4>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 min-h-[80px]">
                <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                  {report.principal_comment || "No comment provided."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Signatures */}
        <div className="px-8 py-8 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="border-t-2 border-slate-400 dark:border-slate-600 pt-2 mt-12">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Class Teacher&apos;s Signature</div>
                <div className="text-xs text-slate-500 mt-0.5">{student.class_teacher_name || "________________"}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-slate-400 dark:border-slate-600 pt-2 mt-12">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Principal&apos;s Signature</div>
                <div className="text-xs text-slate-500 mt-0.5">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-slate-400 dark:border-slate-600 pt-2 mt-12">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Parent/Guardian&apos;s Signature</div>
                <div className="text-xs text-slate-500 mt-0.5">{student.parent_name || "________________"}</div>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 text-[10px] text-slate-400 uppercase tracking-widest">
            Powered by School SaaS &bull; Official Academic Report
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
