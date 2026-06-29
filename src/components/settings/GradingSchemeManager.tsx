"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, Star, Award, Save } from "lucide-react";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { settingsApi } from "@/lib/api";

const STANDARD_COMPONENTS = ["Quiz", "Assignment", "Assessment", "Exam"];

interface Component {
  name: string;
  weight: number;
}

interface GradingScheme {
  id?: string;
  name: string;
  isDefault: boolean;
  components: Component[];
}

interface ScaleEntry {
  grade: string;
  min: number;
  max: number;
  remarks: string;
}

export default function GradingSchemeManager({ schoolId }: { schoolId: string }) {
  const [schemes, setSchemes] = useState<GradingScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null);

  // Grading Scale
  const [gradingScale, setGradingScale] = useState<ScaleEntry[]>([
    { grade: "A", min: 70, max: 100, remarks: "Excellent" },
    { grade: "B", min: 60, max: 69, remarks: "Very Good" },
    { grade: "C", min: 50, max: 59, remarks: "Good" },
    { grade: "D", min: 45, max: 49, remarks: "Fair" },
    { grade: "F", min: 0, max: 44, remarks: "Poor" },
  ]);
  const [scaleLoading, setScaleLoading] = useState(true);
  const [scaleSaving, setScaleSaving] = useState(false);

  const getHeaders = (): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "X-School-Id": schoolId,
    };
    if (token) {
      h["Authorization"] = `Bearer ${token}`;
    }
    return h;
  };

  useEffect(() => {
    if (schoolId) {
      fetchSchemes();
      fetchGradingScale();
    }
  }, [schoolId]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schools/${schoolId}/grading-schemes`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSchemes(data);
    } catch (error) {
      console.error("Failed to fetch schemes", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGradingScale = async () => {
    try {
      setScaleLoading(true);
      const res = await settingsApi.get(schoolId);
      const data = res.data;
      if (data?.gradingScale && Array.isArray(data.gradingScale) && data.gradingScale.length > 0) {
        const mapped = data.gradingScale.map((entry: any) => ({
          grade: entry.grade || "",
          min: Number(entry.minScore ?? entry.min ?? 0),
          max: Number(entry.maxScore ?? entry.max ?? 0),
          remarks: entry.label || entry.remarks || "",
        }));
        setGradingScale(mapped);
      }
      // else keep defaults
    } catch {
      // keep defaults
    } finally {
      setScaleLoading(false);
    }
  };

  const usedComponentNames = editingScheme?.components.map((c) => c.name) || [];
  const availableComponents = STANDARD_COMPONENTS.filter((name) => !usedComponentNames.includes(name));

  const addComponent = () => {
    if (!editingScheme) return;
    if (availableComponents.length === 0) {
      toast.error("All standard components have been added.");
      return;
    }
    setEditingScheme({
      ...editingScheme,
      components: [...editingScheme.components, { name: availableComponents[0], weight: 0 }],
    });
  };

  const removeComponent = (index: number) => {
    if (!editingScheme) return;
    const newComponents = [...editingScheme.components];
    newComponents.splice(index, 1);
    setEditingScheme({ ...editingScheme, components: newComponents });
  };

  const updateComponent = (index: number, field: keyof Component, value: string | number) => {
    if (!editingScheme) return;
    const newComponents = [...editingScheme.components];
    if (field === "name") {
      const newName = value as string;
      if (newComponents.some((c, i) => i !== index && c.name === newName)) {
        toast.error(`Component "${newName}" already exists in this scheme.`);
        return;
      }
    }
    (newComponents[index] as any)[field] = value;
    setEditingScheme({ ...editingScheme, components: newComponents });
  };

  const totalWeight = editingScheme?.components.reduce((sum, c) => sum + Number(c.weight), 0) || 0;

  const handleSave = async () => {
    if (!editingScheme) return;
    if (totalWeight !== 100) {
      toast.error(`Total weight must be exactly 100. Current total: ${totalWeight}`);
      return;
    }
    if (editingScheme.components.length === 0) {
      toast.error("A scheme must have at least one component.");
      return;
    }

    try {
      const url = editingScheme.id
        ? `/api/schools/${schoolId}/grading-schemes/${editingScheme.id}`
        : `/api/schools/${schoolId}/grading-schemes`;
      const method = editingScheme.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(editingScheme),
      });

      if (res.ok) {
        toast.success("Grading scheme saved.");
        setEditingScheme(null);
        fetchSchemes();
      } else {
        let errMsg = "Failed to save scheme";
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (e) {
          errMsg = res.statusText || `HTTP ${res.status}`;
        }
        throw new Error(errMsg);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSetDefault = async (schemeId: string) => {
    try {
      const res = await fetch(`/api/schools/${schoolId}/grading-schemes/${schemeId}/set-default`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to set default");
      toast.success("Default scheme updated.");
      fetchSchemes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (schemeId: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error("Cannot delete the default scheme. Please set another scheme as default first.");
      return;
    }
    if (!confirm("Are you sure you want to delete this grading scheme? Subjects using it will fall back to the default.")) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}/grading-schemes/${schemeId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete scheme");
      }
      toast.success("Grading scheme deleted.");
      fetchSchemes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // --- Grading Scale handlers ---
  const handleScaleChange = (index: number, field: keyof ScaleEntry, value: string | number) => {
    const updated = [...gradingScale];
    if (field === "grade" || field === "remarks") {
      (updated[index] as any)[field] = value;
    } else {
      (updated[index] as any)[field] = Number(value);
    }
    setGradingScale(updated);
  };

  const handleSaveScale = async () => {
    try {
      setScaleSaving(true);
      const payload = gradingScale.map((s) => ({
        grade: s.grade,
        minScore: s.min,
        maxScore: s.max,
        label: s.remarks,
      }));
      await settingsApi.update(schoolId, { gradingScale: payload });
      toast.success("Grading scale saved.");
    } catch {
      toast.error("Failed to save grading scale.");
    } finally {
      setScaleSaving(false);
    }
  };

  if (loading || scaleLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* --- Grading Scale Section --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              Grading Scale
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Define score ranges for each letter grade used across report cards and results.
            </p>
          </div>
          <Button size="sm" onClick={handleSaveScale} isLoading={scaleSaving}>
            <Save className="w-4 h-4 mr-1.5" /> Save Scale
          </Button>
        </div>

        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-2">
              {gradingScale.map((item, index) => (
                <div
                  key={item.grade}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.grade}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Min Score</label>
                      <Input
                        type="number"
                        value={item.min}
                        onChange={(e) => handleScaleChange(index, "min", e.target.value)}
                        min={0}
                        max={100}
                        className="mt-1 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Max Score</label>
                      <Input
                        type="number"
                        value={item.max}
                        onChange={(e) => handleScaleChange(index, "max", e.target.value)}
                        min={0}
                        max={100}
                        className="mt-1 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Remarks</label>
                      <Input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleScaleChange(index, "remarks", e.target.value)}
                        placeholder="Remarks"
                        className="mt-1 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <hr className="border-slate-200 dark:border-slate-700" />

      {/* --- Grading Schemes Section --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Grading Schemes</h2>
            <p className="text-sm text-slate-500 mt-1">
              Define component weights (Quiz, Assignment, Assessment, Exam). Weights must sum to exactly 100.
            </p>
          </div>
          {!editingScheme && (
            <Button
              onClick={() => setEditingScheme({ name: "", isDefault: false, components: [] })}
              className="shadow-md shadow-primary-500/15"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Scheme
            </Button>
          )}
        </div>

        {editingScheme ? (
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{editingScheme.id ? "Edit Scheme" : "New Scheme"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Scheme Name</label>
                <Input
                  value={editingScheme.name}
                  onChange={(e) => setEditingScheme({ ...editingScheme, name: e.target.value })}
                  placeholder="e.g. Standard Secondary Scheme"
                  className="bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Components</label>
                  <Button variant="outline" size="sm" onClick={addComponent} disabled={availableComponents.length === 0}>
                    <Plus className="w-4 h-4 mr-1" /> Add Component
                  </Button>
                </div>

                <div className="space-y-2">
                  {editingScheme.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
                    >
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Component</label>
                        <select
                          className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                          value={comp.name}
                          onChange={(e) => updateComponent(idx, "name", e.target.value)}
                        >
                          <option value="">Select type...</option>
                          {STANDARD_COMPONENTS.map((name) => (
                            <option key={name} value={name} disabled={editingScheme.components.some((c, i) => i !== idx && c.name === name)}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Weight</label>
                        <Input
                          className="mt-1"
                          type="number"
                          min={0}
                          max={100}
                          placeholder="e.g. 20"
                          value={comp.weight}
                          onChange={(e) => updateComponent(idx, "weight", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-4 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => removeComponent(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">
                    {editingScheme.components.length} component{editingScheme.components.length !== 1 ? "s" : ""}
                  </span>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-lg ${
                      totalWeight === 100
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    Total Weight: {totalWeight} / 100
                  </span>
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingScheme(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={totalWeight !== 100}>
                Save Scheme
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemes.map((scheme) => (
              <Card key={scheme.id} className="border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-bold">{scheme.name}</CardTitle>
                    {scheme.isDefault && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                        <Star className="w-3 h-3 mr-1 fill-amber-500" /> Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scheme.components.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                        <Badge
                          variant="default"
                          className="text-[10px] border-0 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold"
                        >
                          {c.weight}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Total</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {scheme.components.reduce((s, c) => s + Number(c.weight), 0)}%
                    </span>
                  </div>
                </CardContent>
                <div className="px-6 pb-4 flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingScheme(scheme)}>
                    Edit
                  </Button>
                  {!scheme.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-slate-600 hover:text-primary-600"
                      onClick={() => handleSetDefault(scheme.id!)}
                    >
                      <Star className="w-3.5 h-3.5 mr-1" /> Make Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(scheme.id!, scheme.isDefault)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
