"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  Printer,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { reportCardApi } from "@/lib/api";
import toast from "react-hot-toast";

const DARK_BLUE = "#0b1d3a";

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

function getRatingLabel(rating: any): string {
  if (rating === null || rating === undefined) return "-";
  const n = Number(rating);
  if (n >= 80) return "Excellent";
  if (n >= 70) return "Very Good";
  if (n >= 60) return "Good";
  if (n >= 50) return "Fair";
  return "Poor";
}

interface ReportCardTemplateProps {
  report: any;
  schoolId?: string;
}

export default function ReportCardTemplate({ report, schoolId }: ReportCardTemplateProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = useCallback(() => {
    if (!reportRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups to print.");
      return;
    }

    const html = reportRef.current.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${report?.student?.name || "Student"}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { margin: 0; padding: 0; background: #fff; font-family: system-ui, -apple-system, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { border-collapse: collapse; width: 100%; }
            td, th { vertical-align: middle; }
          </style>
        </head>
        <body style="background:#fff;">
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  }, [report]);

  const handleDownload = useCallback(async () => {
    const studentId = report?.student?.id;
    const termId = report?.term?.id;

    // Prefer backend PDF endpoint
    if (schoolId && studentId) {
      setDownloading(true);
      try {
        const res = await reportCardApi.downloadPdf(schoolId, studentId, termId || undefined);
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report?.student?.name || "report-card"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("PDF downloaded");
        return;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "Unknown error";
        console.error("Backend PDF error:", msg, err);
        toast.error("Backend PDF failed, trying local generation...");
      } finally {
        setDownloading(false);
      }
    }

    // Fallback: html2pdf.js
    if (!reportRef.current) {
      toast.error("Nothing to download");
      return;
    }
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const studentName = report?.student?.name || "report-card";
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${studentName}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: 794,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] as any },
      };
      await html2pdf().set(opt).from(reportRef.current).save();
      toast.success("PDF downloaded");
    } catch (err: any) {
      console.error("Local PDF error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }, [report, schoolId]);

  if (!report) return null;

  const school = report.school || {};
  const student = report.student || {};
  const term = report.term || {};
  const attendance = report.attendance || {};
  const subjects = report.subjects || [];
  const affective = report.affective_domain || [];

  const overallAverage = report.overall_average;
  const overallGrade = report.overall_grade;

  const gradingScale = report.grading_scale || [
    { grade: "A", minScore: 70, maxScore: 100, label: "Excellent" },
    { grade: "B", minScore: 60, maxScore: 69, label: "Very Good" },
    { grade: "C", minScore: 50, maxScore: 59, label: "Good" },
    { grade: "D", minScore: 45, maxScore: 49, label: "Fair" },
    { grade: "F", minScore: 0, maxScore: 44, label: "Poor" },
  ];

  const allComponentNames: string[] = Array.from(
    new Set<string>(
      subjects.flatMap((sub: any) =>
        (sub.components || []).map((c: any) => c.component_name)
      )
    )
  );

  return (
    <div className="space-y-6 max-w-[210mm] mx-auto">
      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Report Card</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Report Card Paper - always light mode, no dark classes */}
      <div
        ref={reportRef}
        className="bg-white text-black"
        style={{ maxWidth: "210mm", fontSize: "9px", lineHeight: 1.35, fontFamily: "'Segoe UI', Arial, sans-serif" }}
      >
        {/* ===== HEADER ===== */}
        <table style={{ width: "100%", borderCollapse: "collapse", background: DARK_BLUE, color: "#fff" }}>
          <tbody>
            <tr>
              <td style={{ padding: "12px 14px" }}>
                <p style={{ margin: 0, fontSize: "17px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {school.name || "School Name"}
                </p>
                <p style={{ margin: "2px 0 0 0", fontSize: "8px", opacity: 0.85 }}>
                  {school.address || ""} {school.address && "\u2022"} Tel: {school.phone || ""} {school.phone && "\u2022"} Email: {school.email || ""}
                </p>
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "7px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.7, fontWeight: 700 }}>Academic Report</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", fontWeight: 700 }}>{term.name || "Current Term"}</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "8px", opacity: 0.85 }}>{term.session_name || ""}</p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ===== STUDENT INFO ===== */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.5px", background: "#f5f7fa", width: "18%" }}>Student Name</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 600, fontSize: "9px" }}>{student.name || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.5px", background: "#f5f7fa", width: "18%" }}>Admission No</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 600, fontSize: "9px" }}>{student.admission_number || "-"}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.5px", background: "#f5f7fa" }}>Class</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 600, fontSize: "9px" }}>{student.class_name || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.5px", background: "#f5f7fa" }}>Gender</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 600, fontSize: "9px" }}>{student.gender || "-"}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.5px", background: "#f5f7fa" }}>Date of Birth</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 600, fontSize: "9px" }}>{student.date_of_birth || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.5px", background: "#f5f7fa" }}>Class Teacher</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 600, fontSize: "9px" }}>{student.class_teacher_name || "-"}</td>
            </tr>
            <tr style={{ background: "#f5f7fa" }}>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.5px", color: DARK_BLUE }}>Overall Average</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 900, fontSize: "15px", color: DARK_BLUE }}>{overallAverage !== null && overallAverage !== undefined ? overallAverage : "-"}%</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.5px", color: DARK_BLUE }}>Overall Grade</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px" }}>
                {overallGrade ? (
                  <span style={{ display: "inline-block", width: 22, height: 22, fontSize: "10px", fontWeight: 900, lineHeight: "22px", textAlign: "center", background: DARK_BLUE, color: "#fff" }}>{overallGrade}</span>
                ) : (
                  <span style={{ fontWeight: 600, fontSize: "9px" }}>-</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ===== GRADING SCALE ===== */}
        <p style={{ margin: "6px 0 0 0", padding: "3px 0", borderBottom: "1px solid #000", fontSize: "8px", fontWeight: 600 }}>
          <span style={{ fontWeight: 700, color: DARK_BLUE, marginRight: "6px" }}>Grading Scale:</span>
          {gradingScale.map((entry: any, idx: number) => (
            <span key={idx} style={{ marginRight: "10px" }}>
              {entry.grade}: {entry.minScore}-{entry.maxScore}% ({entry.label})
            </span>
          ))}
        </p>

        {/* ===== ACADEMIC PERFORMANCE ===== */}
        <p style={{ margin: "10px 0 5px 0", fontSize: "8px", fontWeight: 700, color: DARK_BLUE, textTransform: "uppercase", letterSpacing: "1px", borderBottom: `1.5px solid ${DARK_BLUE}`, paddingBottom: "3px" }}>
          Academic Performance
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
          <thead>
            <tr style={{ background: DARK_BLUE, color: "#fff" }}>
              <th style={{ border: `1px solid ${DARK_BLUE}`, padding: "5px 7px", fontSize: "7px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>Subject</th>
              {allComponentNames.map((name, i) => (
                <th key={i} style={{ border: `1px solid ${DARK_BLUE}`, padding: "5px 7px", fontSize: "7px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center" }}>{name}</th>
              ))}
              <th style={{ border: `1px solid ${DARK_BLUE}`, padding: "5px 7px", fontSize: "7px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center" }}>Total</th>
              <th style={{ border: `1px solid ${DARK_BLUE}`, padding: "5px 7px", fontSize: "7px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center" }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub: any, idx: number) => {
              const total = sub.total ?? null;
              const grade = resolveGrade(total, gradingScale);
              return (
                <tr key={idx} style={idx % 2 === 1 ? { background: "#f9fafb" } : {}}>
                  <td style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "8.5px", fontWeight: 600, textAlign: "left" }}>{sub.subject_name || "-"}</td>
                  {allComponentNames.map((name, i) => {
                    const comp = (sub.components || []).find((c: any) => c.component_name === name);
                    return (
                      <td key={i} style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "8.5px", textAlign: "center" }}>
                        {comp ? (
                          <span>
                            <strong>{comp.score === null || comp.score === undefined ? "-" : comp.score}</strong>
                            <span style={{ color: "#666", fontSize: "8px" }}> /{comp.weight}</span>
                          </span>
                        ) : (
                          <span style={{ color: "#999" }}>-</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "8.5px", textAlign: "center", fontWeight: 700 }}>{total !== null && total !== undefined ? total : "-"}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "8.5px", textAlign: "center", fontWeight: 700 }}>{grade}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ===== AFFECTIVE + ATTENDANCE ===== */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <tbody>
            <tr>
              {/* Affective */}
              <td style={{ width: "55%", paddingRight: "8px", verticalAlign: "top" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "7px", fontWeight: 700, color: DARK_BLUE, textTransform: "uppercase", letterSpacing: "1px", borderBottom: `1px solid ${DARK_BLUE}`, paddingBottom: "2px" }}>
                  Affective Domain
                </p>
                {affective.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
                    <thead>
                      <tr style={{ background: "#f5f7fa" }}>
                        <th style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "7px", fontWeight: 700, textTransform: "uppercase", textAlign: "left" }}>Trait</th>
                        <th style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "7px", fontWeight: 700, textTransform: "uppercase", textAlign: "center" }}>Rating</th>
                        <th style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "7px", fontWeight: 700, textTransform: "uppercase", textAlign: "center" }}>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affective.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "8.5px" }}>{item.trait}</td>
                          <td style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "8.5px", textAlign: "center" }}>{item.rating !== null && item.rating !== undefined ? item.rating : "-"}</td>
                          <td style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "8.5px", textAlign: "center" }}>{getRatingLabel(item.rating)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ margin: 0, fontSize: "8px", padding: "6px", border: "1px solid #000", color: "#555" }}>No affective ratings available.</p>
                )}
              </td>

              {/* Attendance */}
              <td style={{ width: "45%", verticalAlign: "top" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "7px", fontWeight: 700, color: DARK_BLUE, textTransform: "uppercase", letterSpacing: "1px", borderBottom: `1px solid ${DARK_BLUE}`, paddingBottom: "2px" }}>
                  Attendance Summary
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px" }}>
                        <p style={{ margin: 0, border: "1px solid #000", textAlign: "center", padding: "6px 4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: DARK_BLUE }}>{attendance.present ?? 0}</span>
                          <br />
                          <span style={{ fontSize: "7px", fontWeight: 700, textTransform: "uppercase", color: "#333" }}>Present</span>
                        </p>
                      </td>
                      <td style={{ padding: "3px" }}>
                        <p style={{ margin: 0, border: "1px solid #000", textAlign: "center", padding: "6px 4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: DARK_BLUE }}>{attendance.absent ?? 0}</span>
                          <br />
                          <span style={{ fontSize: "7px", fontWeight: 700, textTransform: "uppercase", color: "#333" }}>Absent</span>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px" }}>
                        <p style={{ margin: 0, border: "1px solid #000", textAlign: "center", padding: "6px 4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: DARK_BLUE }}>{attendance.late ?? 0}</span>
                          <br />
                          <span style={{ fontSize: "7px", fontWeight: 700, textTransform: "uppercase", color: "#333" }}>Late</span>
                        </p>
                      </td>
                      <td style={{ padding: "3px" }}>
                        <p style={{ margin: 0, border: "1px solid #000", textAlign: "center", padding: "6px 4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: DARK_BLUE }}>{attendance.percentage ?? 0}%</span>
                          <br />
                          <span style={{ fontSize: "7px", fontWeight: 700, textTransform: "uppercase", color: "#333" }}>Attendance</span>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ===== COMMENTS ===== */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", paddingRight: "6px", verticalAlign: "top" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "7px", fontWeight: 700, color: DARK_BLUE, textTransform: "uppercase", letterSpacing: "1px", borderBottom: `1px solid ${DARK_BLUE}`, paddingBottom: "2px" }}>
                  Teacher&apos;s Comment
                </p>
                <p style={{ margin: 0, border: "1px solid #000", padding: "8px 10px", fontSize: "8.5px", color: "#222", fontStyle: "italic", minHeight: 36, background: "#fff" }}>
                  {report.teacher_comment || "No comment provided."}
                </p>
              </td>
              <td style={{ width: "50%", paddingLeft: "6px", verticalAlign: "top" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "7px", fontWeight: 700, color: DARK_BLUE, textTransform: "uppercase", letterSpacing: "1px", borderBottom: `1px solid ${DARK_BLUE}`, paddingBottom: "2px" }}>
                  Principal&apos;s Comment
                </p>
                <p style={{ margin: 0, border: "1px solid #000", padding: "8px 10px", fontSize: "8.5px", color: "#222", fontStyle: "italic", minHeight: 36, background: "#fff" }}>
                  {report.principal_comment || "No comment provided."}
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ===== SIGNATURES ===== */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "14px" }}>
          <tbody>
            <tr>
              <td style={{ textAlign: "center", padding: "0 8px" }}>
                <p style={{ margin: "28px 0 0 0", borderTop: "1px solid #000", paddingTop: "4px" }}>
                  <span style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase" }}>Class Teacher&apos;s Signature</span>
                  <br />
                  <span style={{ fontSize: "7px", color: "#444", marginTop: "2px" }}>{student.class_teacher_name || ""}</span>
                </p>
              </td>
              <td style={{ textAlign: "center", padding: "0 8px" }}>
                <p style={{ margin: "28px 0 0 0", borderTop: "1px solid #000", paddingTop: "4px" }}>
                  <span style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase" }}>Principal&apos;s Signature</span>
                  <br />
                  <span style={{ fontSize: "7px", color: "#444", marginTop: "2px" }}>Date: {new Date().toLocaleDateString()}</span>
                </p>
              </td>
              <td style={{ textAlign: "center", padding: "0 8px" }}>
                <p style={{ margin: "28px 0 0 0", borderTop: "1px solid #000", paddingTop: "4px" }}>
                  <span style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase" }}>Parent / Guardian&apos;s Signature</span>
                  <br />
                  <span style={{ fontSize: "7px", color: "#444", marginTop: "2px" }}>{student.parent_name || ""}</span>
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ===== FOOTER ===== */}
        <p style={{ margin: "6px 0 0 0", textAlign: "center", fontSize: "7px", color: "#555", paddingTop: "5px", borderTop: "1px solid #000" }}>
          Powered by School SaaS &mdash; Official Academic Report
        </p>
      </div>
    </div>
  );
}
