'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { useAuth } from '@/lib/auth';
import { rawCmsApi, cmsApi, classApi, subjectApi, dashboardApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ClassAssignment } from '@/types';
import { motion } from 'framer-motion';
import {
  Save,
  Send,
  Clock,
  History,
  ArrowLeft,
  Calendar,
  Star,
  Eye,
  Trash2,
  GraduationCap,
  CheckSquare,
  Square,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ContentVersion {
  id: string;
  versionNumber: number;
  title: string;
  body: string;
  createdAt: string;
  changeSummary: string;
  author?: {
    fullName: string;
  };
}

interface Folder {
  id: string;
  name: string;
}

export default function CreateContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { currentSchool, hasPermission, isTeacher, isPlatformAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [folderId, setFolderId] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);

  const [contentStatus, setContentStatus] = useState('DRAFT');
  const [isFeatured, setIsFeatured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [allSchoolSubjects, setAllSchoolSubjects] = useState<{ id: string; name: string; classIds?: string[] }[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<ClassAssignment[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [contentType, setContentType] = useState('NOTE');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  useEffect(() => {
    fetchFolders();
    fetchClasses();
    fetchSubjects();
    if (editId) {
      fetchContent(editId);
    }
  }, [editId, currentSchool?.id]);

  const fetchFolders = async () => {
    if (!currentSchool?.id) return;
    try {
      const response = await rawCmsApi.getFolders(currentSchool.id);
      setFolders(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchClasses = async () => {
    if (!currentSchool?.id) return;
    try {
      const response = await classApi.getAll(currentSchool.id, { size: 100 });
      setClasses(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    if (!currentSchool?.id) return;
    try {
      const [subjectsRes, teacherDashRes] = await Promise.all([
        subjectApi.getAll(currentSchool.id, { size: 100 }),
        isTeacher() ? dashboardApi.getTeacherDashboard(currentSchool.id) : Promise.resolve({ data: { myClasses: [] } }),
      ]);
      setAllSchoolSubjects((subjectsRes.data as any).content.map((s: any) => ({ id: s.id, name: s.name, classIds: s.classIds || [] })) || []);
      setTeacherAssignments(teacherDashRes.data?.myClasses || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchContent = async (id: string) => {
    if (!currentSchool?.id) return;
    try {
      const response = await rawCmsApi.getContent(currentSchool.id, id);
      const content = response.data;
      setTitle(content.title);
      setBody(content.body || '');
      setFolderId(content.folderId || '');
      setTags(content.tags?.join(', ') || '');
      setContentStatus(content.status);
      setIsFeatured(content.isFeatured || false);
      setUpdatedAt(content.updatedAt || null);
      setTargetClassIds(content.targetClassIds || []);
      setSubjectId(content.subjectId || '');
      setContentType(content.contentType || 'NOTE');
      setThumbnailUrl(content.thumbnailUrl || '');
    } catch (error) {
      toast.error('Failed to load content');
      router.push('/cms');
    }
  };

  const fetchVersionHistory = async () => {
    if (!editId) return;
    try {
      const response = await rawCmsApi.getVersions(editId);
      setVersions(response.data.content || []);
      setShowHistoryModal(true);
    } catch (error) {
      toast.error('Failed to fetch version history');
    }
  };

  const handleSave = async (submit = false) => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        body,
        contentType,
        folderId: folderId || null,
        subjectId: subjectId || null,
        schoolId: currentSchool?.id,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        targetClassIds: targetClassIds.length ? targetClassIds : undefined,
        thumbnailUrl: thumbnailUrl || undefined,
      };

      let response;
      if (editId) {
        response = await rawCmsApi.saveContent(editId, payload);

        await rawCmsApi.createVersion(editId, {
          changeSummary: 'Content updated',
        });
      } else {
        response = await rawCmsApi.saveContent(null, payload);
      }

      const contentId = response.data.id || editId;

      if (submit) {
        if (!contentId) {
          toast.error('Content ID is missing');
          return;
        }
        await cmsApi.submitForApproval(currentSchool!.id, contentId);
        toast.success('Content submitted for approval');
      } else {
        toast.success(editId ? 'Content saved' : 'Draft created');
      }

      if (!editId && contentId) {
        router.push(`/cms/create?edit=${contentId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save content');
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please select date and time');
      return;
    }

    const publishAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    try {
      await rawCmsApi.scheduleContent(editId!, { publishAt });
      toast.success('Content scheduled for publishing');
      setShowScheduleModal(false);
      setContentStatus('SCHEDULED');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule content');
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    try {
      await rawCmsApi.restoreVersion(editId!, versionNumber);
      toast.success(`Restored to version ${versionNumber}`);
      setShowHistoryModal(false);
      fetchContent(editId!);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore version');
    }
  };

  const handleToggleFeatured = async () => {
    if (!editId) return;
    try {
      await rawCmsApi.toggleFeatured(editId, !isFeatured);
      setIsFeatured(!isFeatured);
      toast.success(isFeatured ? 'Removed from featured' : 'Added to featured');
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDelete = async () => {
    if (!editId || !currentSchool) return;
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await cmsApi.deleteContent(currentSchool.id, editId);
      toast.success('Content deleted');
      router.push('/cms');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete content');
    }
  };

  // Teachers see only their assigned classes & subjects; admins see everything
  const isAdmin = isPlatformAdmin() || currentSchool?.roleName === 'ADMIN' || currentSchool?.roleName === 'SUPER_ADMIN';

  const assignedClassIds = new Set(teacherAssignments.map((a) => a.classId));
  const assignedSubjectIds = new Set(teacherAssignments.map((a) => a.subjectId).filter(Boolean));

  const availableClasses = isTeacher() && !isAdmin
    ? classes.filter((c) => assignedClassIds.has(c.id))
    : classes;

  let availableSubjects = isTeacher() && !isAdmin
    ? allSchoolSubjects.filter((s) => assignedSubjectIds.has(s.id))
    : allSchoolSubjects;

  // Fallback: if teacher has class assignments but no explicit subject assignments,
  // derive available subjects from the classes they are assigned to
  if (isTeacher() && !isAdmin && availableSubjects.length === 0 && assignedClassIds.size > 0) {
    availableSubjects = allSchoolSubjects.filter((s) =>
      s.classIds?.some((cid) => assignedClassIds.has(cid))
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/cms')} size="sm" className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {editId ? 'Edit Content' : 'Create Content'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Use the rich text editor to create engaging content
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {editId && (
            <>
              <Button variant="outline" onClick={fetchVersionHistory}>
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleFeatured}
                className={isFeatured ? 'text-yellow-500' : ''}
              >
                <Star className={`w-4 h-4 mr-2 ${isFeatured ? 'fill-current' : ''}`} />
                {isFeatured ? 'Featured' : 'Feature'}
              </Button>
              {contentStatus === 'APPROVED' && (
                <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          {hasPermission('CMS_CREATE') && (
            <Button
              onClick={() => {
                setIsSubmitting(true);
                handleSave(true);
              }}
              disabled={isSubmitting || isSaving}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content title..."
                  className="text-lg sm:text-xl font-semibold"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Content Body</CardTitle>
              </CardHeader>
              <CardContent>
                <TiptapEditor
                  content={body}
                  onChange={setBody}
                  placeholder="Start writing your content here..."
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    contentStatus === 'PUBLISHED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : contentStatus === 'APPROVED'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : contentStatus === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : contentStatus === 'SCHEDULED'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {contentStatus}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Folder</label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No subject</option>
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {isTeacher() && !isAdmin && availableSubjects.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">You are not assigned to any subjects.</p>
                  )}
                </div>

                <Input
                  label="Tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="math, science, grade-10"
                />
                <p className="text-xs text-slate-500 mt-1">Separate tags with commas</p>

                <Input
                  label="Thumbnail URL"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full h-24 object-cover rounded-lg mt-2"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Target Classes</label>
                  {availableClasses.length === 0 ? (
                    <p className="text-xs text-slate-500">No classes available.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableClasses.map((cls) => {
                        const selected = targetClassIds.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                setTargetClassIds(targetClassIds.filter((id) => id !== cls.id));
                              } else {
                                setTargetClassIds([...targetClassIds, cls.id]);
                              }
                            }}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                              selected
                                ? 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            )}
                          >
                            {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            {cls.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">Select one or more classes. Leave empty for all classes.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {editId && updatedAt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Last Edited</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    {new Date(updatedAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Publishing"
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <Input
            label="Time"
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedVersion(null);
        }}
        title="Version History"
        size="large"
      >
        <div className="space-y-4">
          {selectedVersion ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedVersion(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to list
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRestoreVersion(selectedVersion.versionNumber)}
                >
                  Restore this version
                </Button>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold mb-2">{selectedVersion.title}</h3>
                <div
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedVersion.body }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
              {versions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No version history available</p>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400">
                          v{version.versionNumber}
                        </div>
                        <div>
                          <p className="font-medium">{version.title}</p>
                          <p className="text-sm text-slate-500">
                            {version.changeSummary || 'No summary'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>{new Date(version.createdAt).toLocaleDateString()}</p>
                        <p>{version.author?.fullName || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
