"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getGrade(total: number | null): string {
  if (total === null) return "-";
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  return "F";
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "B":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "C":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "D":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    default:
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
}

export default function StudentReportView({
  schoolId,
  studentId,
}: {
  schoolId: string;
  studentId: string;
}) {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/schools/${schoolId}/report-cards/student/${studentId}/report`)
      .then((res) => res.json())
      .then(setReport);
  }, [schoolId, studentId]);

  const handlePrint = () => {
    window.print();
  };

  if (!report) return <div>Loading report...</div>;

  // Gather all unique component names across subjects for table headers
  const allComponentNames: string[] = Array.from(
    new Set<string>(
      (report.subjects || []).flatMap((sub: any) =>
        (sub.components || []).map((c: any) => c.component_name)
      )
    )
  );

  const getComponentDisplay = (subject: any, name: string) => {
    const comp = (subject.components || []).find(
      (c: any) => c.component_name === name
    );
    if (!comp) return "-";
    if (comp.score === null) return "...";
    if (comp.score === "-") return "Missed";
    return `${comp.score} / ${comp.weight}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 print:p-0">
      {/* Actions */}
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">Student Report Card</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button
            onClick={() =>
              window.open(
                `/api/schools/${schoolId}/report-cards/student/${studentId}/pdf`
              )
            }
          >
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader className="text-center border-b pb-6">
          <div className="text-2xl font-black uppercase tracking-widest">
            School Management System
          </div>
          <CardTitle className="text-xl mt-2">
            STUDENT ACADEMIC REPORT
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-left text-sm">
            <div>
              <span className="font-semibold">Student Name:</span>{" "}
              {report.student_name}
            </div>
            <div>
              <span className="font-semibold">Overall Average:</span>{" "}
              {report.overall_average ?? "N/A"}%
              {report.overall_grade ? (
                <span
                  className={`ml-2 inline-block px-2 py-0.5 rounded-md text-xs font-bold ${gradeColor(
                    report.overall_grade
                  )}`}
                >
                  {report.overall_grade}
                </span>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {report.subjects && report.subjects.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Subject</TableHead>
                    {allComponentNames.map((name, i) => (
                      <TableHead
                        key={i}
                        className="text-center whitespace-nowrap capitalize"
                      >
                        {name}
                      </TableHead>
                    ))}
                    <TableHead className="text-center whitespace-nowrap">
                      Score (%)
                    </TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.subjects.map((sub: any, idx: number) => {
                    const total = sub.total ?? null;
                    const grade = getGrade(total);
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {sub.subject_name || "-"}
                        </TableCell>
                        {allComponentNames.map((name, i) => (
                          <TableCell
                            key={i}
                            className="text-center text-sm text-slate-600 dark:text-slate-300"
                          >
                            {getComponentDisplay(sub, name)}
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {total !== null ? total : "PENDING"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${gradeColor(
                              grade
                            )}`}
                          >
                            {grade}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">
              No subject results available for this student.
            </p>
          )}

          {/* Grade scale */}
          <div className="text-xs text-slate-500 mt-2">
            <span className="font-semibold">Grading Scale:</span> A = 70-100% |
            B = 60-69% | C = 50-59% | D = 45-49% | F = Below 45%
          </div>

          {/* Signatures */}
          <div className="mt-12 grid grid-cols-2 gap-20">
            <div className="border-t pt-2 text-center text-sm">
              <div className="font-semibold">Class Teacher&apos;s Signature</div>
            </div>
            <div className="border-t pt-2 text-center text-sm">
              <div className="font-semibold">Principal&apos;s Signature</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\:hidden {
            display: none !important;
          }
          .print\:shadow-none {
            box-shadow: none !important;
          }
          .print\:border-none {
            border: none !important;
          }
          .print\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
