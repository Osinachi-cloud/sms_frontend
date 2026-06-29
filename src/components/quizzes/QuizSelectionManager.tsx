"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Undo, Redo, CheckCircle, Circle } from "lucide-react";
import toast from "react-hot-toast";

interface Quiz {
  id: string;
  title: string;
  quizType: string;
  isSelectedForGrade: boolean;
}

interface Component {
  name: string;
  weight: number;
}

export default function QuizSelectionManager({ classId, subjectId }: { classId: string; subjectId: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [schemeComponents, setSchemeComponents] = useState<Component[]>([]);

  useEffect(() => {
    if (classId && subjectId) {
      fetchData();
    }
  }, [classId, subjectId]);

  const fetchData = async () => {
    try {
      const qRes = await fetch(`/api/teacher/quizzes?class_id=${classId}&subject_id=${subjectId}`);
      const qData = await qRes.json();
      setQuizzes(qData);

      const sRes = await fetch(`/api/gradebook/scheme?subject_id=${subjectId}`);
      const sData = await sRes.json();
      setSchemeComponents(sData.components);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const selectQuiz = async (componentType: string, quizId: string | null) => {
    try {
      const res = await fetch("/api/teacher/grade-selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: classId, subject_id: subjectId, component_type: componentType, quiz_id: quizId }),
      });
      if (res.ok) {
        toast.success("Selection Updated");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to update selection");
    }
  };

  const handleUndo = async () => {
    await fetch("/api/teacher/grade-selections/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: classId, subject_id: subjectId }),
    });
    fetchData();
  };

  const handleRedo = async () => {
    await fetch("/api/teacher/grade-selections/redo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: classId, subject_id: subjectId }),
    });
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Select Quizzes for Grading</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleUndo}><Undo className="w-4 h-4 mr-1" /> Undo</Button>
          <Button variant="outline" size="sm" onClick={handleRedo}><Redo className="w-4 h-4 mr-1" /> Redo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {schemeComponents.map((comp) => {
          const selectedQuiz = quizzes.find(q => q.quizType === comp.name.toUpperCase() && q.isSelectedForGrade);
          const typeQuizzes = quizzes.filter(q => q.quizType === comp.name.toUpperCase());

          return (
            <Card key={comp.name}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold">{comp.name} ({comp.weight}%)</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedQuiz ? `Selected: ${selectedQuiz.title}` : "None selected"}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedQuiz?.id || "none"}
                    onChange={(e) => selectQuiz(comp.name, e.target.value === "none" ? null : e.target.value)}
                    className="w-[200px] px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  >
                    <option value="none">None</option>
                    {typeQuizzes.map(q => (
                      <option key={q.id} value={q.id}>{q.title}</option>
                    ))}
                  </select>
                  {selectedQuiz ? <CheckCircle className="text-green-500 w-5 h-5" /> : <Circle className="text-gray-300 w-5 h-5" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
