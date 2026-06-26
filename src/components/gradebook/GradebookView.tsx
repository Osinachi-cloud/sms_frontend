"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

interface ComponentResult {
  component_name: string;
  weight: number;
  score: number | string | null;
}

interface StudentRow {
  student_id: string;
  student_name: string;
  components: ComponentResult[];
  total: number | null;
}

export default function GradebookView({ schoolId, classId, subjectId }: { schoolId: string, classId: string, subjectId: string }) {
  const [data, setData] = useState<{ grading_scheme: string, students: StudentRow[] } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (classId && subjectId) {
      fetch(`/api/schools/${schoolId}/gradebook/compute?classId=${classId}&subjectId=${subjectId}`)
        .then(res => res.json())
        .then(setData);
    }
  }, [schoolId, classId, subjectId]);

  if (!data) return <div>Select class and subject to view gradebook</div>;

  const filteredStudents = data.students.filter(s => 
    s.student_name.toLowerCase().includes(search.toLowerCase())
  );

  // Extract component columns from the first student (all have same scheme)
  const componentCols = data.students[0]?.components.map(c => c.component_name) || [];

  const getGrade = (total: number | null) => {
    if (total === null) return '-';
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    return 'F';
  };

  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'B': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'C': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'D': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-500">
          Scheme: <span className="font-semibold text-slate-700 dark:text-slate-200">{data.grading_scheme}</span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Student</TableHead>
              {componentCols.map((name, i) => (
                <TableHead key={i} className="text-center whitespace-nowrap">
                  {name}
                </TableHead>
              ))}
              <TableHead className="text-center whitespace-nowrap">Score (%)</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => {
              const grade = getGrade(student.total);
              return (
                <TableRow key={student.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{student.student_name}</span>
                    </div>
                  </TableCell>
                  {student.components.map((c, i) => (
                    <TableCell key={i} className="text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        c.score === null
                          ? 'text-slate-400'
                          : c.score === '-'
                            ? 'text-red-500'
                            : Number(c.score) >= (c.weight * 0.5)
                              ? 'text-slate-700 dark:text-slate-200'
                              : 'text-red-600'
                      }`}>
                        {c.score === null ? '...' : c.score}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">/ {c.weight}</span>
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {student.total !== null ? student.total : '...'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${gradeColor(grade)}`}>
                      {grade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/gradebook/student/${student.student_id}`}>
                        <FileText className="w-4 h-4 mr-1" /> Report
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
