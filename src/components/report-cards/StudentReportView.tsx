"use client";

import React, { useEffect, useState } from "react";
import ReportCardTemplate from "./ReportCardTemplate";
import { reportCardApi } from "@/lib/api";

export default function StudentReportView({
  schoolId,
  studentId,
  termId,
}: {
  schoolId: string;
  studentId: string;
  termId?: string;
}) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !studentId) return;
    setLoading(true);
    reportCardApi
      .getStudentReport(schoolId, studentId, termId)
      .then((res) => setReport(res.data))
      .finally(() => setLoading(false));
  }, [schoolId, studentId, termId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-5xl mx-auto p-4 text-center">
        <p className="text-slate-500">Failed to load report.</p>
      </div>
    );
  }

  return (
    <ReportCardTemplate
      report={report}
      onPrint={() => window.print()}
      onDownload={() => {
        window.open(`/api/schools/${schoolId}/report-cards/student/${studentId}/pdf`);
      }}
    />
  );
}
