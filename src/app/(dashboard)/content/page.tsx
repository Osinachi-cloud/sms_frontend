'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { cmsApi, classApi, subjectApi, dashboardApi, termApi, academicSessionApi } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { ContentItem, ContentFolder, SubjectWithFolders, Classroom, PageResponse, ClassAssignment } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Folder,
  FileText,
  Video,
  File,
  Link as LinkIcon,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  GraduationCap,
  BookOpen,
  X,
  Upload,
  ExternalLink,
  Check,
  CheckSquare,
  Square,
  Clock,
  FolderOpen,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { TiptapEditor } from '@/components/editor/TiptapEditor';

const contentSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  contentType: z.enum(['NOTE', 'PDF', 'VIDEO']),
  richText: z.string().optional(),
  videoLink: z.string().optional(),
  folderId: z.string().optional(),
  subjectId: z.string().optional(),
  termId: z.string().optional(),
  sessionId: z.string().optional(),
  targetClassIds: z.array(z.string()).optional(),
});

type ContentForm = z.infer<typeof contentSchema>;

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  description: z.string().optional(),
  subjectId: z.string().optional(),
});

type FolderForm = z.infer<typeof folderSchema>;

const getContentIcon = (type: string) => {
  switch (type) {
    case 'NOTE': return FileText;
    case 'PDF': return File;
    case 'VIDEO': return Video;
    default: return FileText;
  }
};

const getStatusBadge = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    DRAFT: 'default',
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    PUBLISHED: 'info',
  };
  return variants[status] || 'default';
};

export default function ContentPage() {
  const { currentSchool, hasPermission, user, isTeacher, isStudent, isPlatformAdmin } = useAuth();
  const [subjects, setSubjects] = useState<SubjectWithFolders[]>([]);
  const [unassignedFolders, setUnassignedFolders] = useState<ContentFolder[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [allSchoolSubjects, setAllSchoolSubjects] = useState<{ id: string; name: string; classIds?: string[] }[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<ClassAssignment[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [editingFolder, setEditingFolder] = useState<ContentFolder | null>(null);
  const [creatingFolderForSubject, setCreatingFolderForSubject] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContentForm>({
    resolver: zodResolver(contentSchema),
    defaultValues: { contentType: 'NOTE', targetClassIds: [] },
  });

  const {
    register: registerFolder,
    handleSubmit: handleSubmitFolder,
    reset: resetFolder,
    formState: { errors: folderErrors, isSubmitting: isFolderSubmitting },
  } = useForm<FolderForm>({
    resolver: zodResolver(folderSchema),
  });

  const {
    register: registerEditFolder,
    handleSubmit: handleSubmitEditFolder,
    reset: resetEditFolder,
    formState: { errors: editFolderErrors, isSubmitting: isEditFolderSubmitting },
  } = useForm<FolderForm>({
    resolver: zodResolver(folderSchema),
  });

  const contentType = watch('contentType');

  const fetchData = useCallback(async () => {
    if (!currentSchool) return;
    try {
      setIsLoading(true);
      const promises: any[] = [
        cmsApi.getFoldersBySubject(currentSchool.id),
        classApi.getAll(currentSchool.id, { size: 100 }),
        subjectApi.getAll(currentSchool.id, { size: 100 }),
        termApi.getAll(currentSchool.id, { size: 100 }),
        academicSessionApi.getAll(currentSchool.id, { size: 100 }),
        hasPermission('cms.content.approve')
          ? cmsApi.getPendingContent(currentSchool.id, { size: 1 })
          : Promise.resolve({ data: { totalElements: 0 } }),
      ];

      // If teacher, fetch their assignments so we can scope subjects/classes
      if (isTeacher()) {
        promises.push(dashboardApi.getTeacherDashboard(currentSchool.id));
      }

      const [foldersRes, classesRes, subjectsRes, termsRes, sessionsRes, pendingRes, teacherDashRes] = await Promise.all(promises);

      const folderData = foldersRes.data as any;
      setSubjects((folderData.subjects || []) as SubjectWithFolders[]);
      setUnassignedFolders((folderData.unassignedFolders || []) as ContentFolder[]);
      setClasses((classesRes.data as PageResponse<Classroom>).content || []);
      setAllSchoolSubjects((subjectsRes.data as PageResponse<any>).content.map((s: any) => ({ id: s.id, name: s.name, classIds: s.classIds || [] })) || []);
      setTerms((termsRes.data as PageResponse<any>).content.map((t: any) => ({ id: t.id, name: t.name })) || []);
      setSessions((sessionsRes.data as PageResponse<any>).content.map((s: any) => ({ id: s.id, name: s.name })) || []);
      setPendingApprovalCount((pendingRes.data as PageResponse<any>)?.totalElements || 0);

      if (teacherDashRes) {
        setTeacherAssignments(teacherDashRes.data?.myClasses || []);
      }

      // Auto-expand first subject if any
      const subs = (folderData.subjects || []) as SubjectWithFolders[];
      if (subs.length > 0 && !selectedSubjectId) {
        setExpandedSubjects(new Set([subs[0].id]));
        setSelectedSubjectId(subs[0].id);
      }
    } catch (error) {
      toast.error('Failed to load content organization');
    } finally {
      setIsLoading(false);
    }
  }, [currentSchool, hasPermission, selectedSubjectId, isTeacher]);

  const fetchFolderContents = useCallback(async (folderId: string) => {
    if (!currentSchool) return;
    try {
      const res = await cmsApi.getContentByFolder(currentSchool.id, folderId, user?.studentId || undefined);
      const data = res.data;
      // Backend may return either a wrapped PageResponse { content: [...] } or a raw array
      const items = Array.isArray(data) ? data : (data?.content || []);
      setContents(items);
    } catch (error) {
      toast.error('Failed to load folder contents');
    }
  }, [currentSchool, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedFolderId) {
      fetchFolderContents(selectedFolderId);
    } else {
      setContents([]);
    }
  }, [selectedFolderId, fetchFolderContents]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
    setSelectedSubjectId(subjectId);
  };

  const handleCreateFolder = async (data: FolderForm) => {
    if (!currentSchool) return;
    try {
      await cmsApi.createFolder(currentSchool.id, {
        name: data.name,
        description: data.description,
        subjectId: data.subjectId || selectedSubjectId,
      });
      toast.success('Folder created');
      setIsFolderModalOpen(false);
      resetFolder();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleEditFolder = async (data: FolderForm) => {
    if (!currentSchool || !editingFolder) return;
    try {
      await cmsApi.updateFolder(currentSchool.id, editingFolder.id, {
        name: data.name,
        description: data.description,
        subjectId: data.subjectId,
      });
      toast.success('Folder updated');
      setIsEditFolderModalOpen(false);
      setEditingFolder(null);
      resetEditFolder();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!currentSchool) return;
    if (!confirm('Are you sure? Contents in this folder will become unassigned.')) return;
    try {
      await cmsApi.deleteFolder(currentSchool.id, folderId);
      toast.success('Folder deleted');
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete folder');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSchool) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Max 20MB.');
      return;
    }
    setUploadingFile(true);
    try {
      const res = await cmsApi.uploadFile(currentSchool.id, file);
      const url = (res.data as any).url;
      const currentUrls = watch('richText') || '';
      setValue('richText', currentUrls + '\n' + url);
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmitContent = async (data: ContentForm) => {
    if (!currentSchool) return;
    try {
      const payload: any = {
        title: data.title,
        contentType: data.contentType,
        folderId: data.folderId || selectedFolderId,
        subjectId: data.subjectId || selectedSubjectId,
        termId: data.termId || undefined,
        sessionId: data.sessionId || undefined,
        targetClassIds: data.targetClassIds?.length ? data.targetClassIds : undefined,
        richText: data.contentType === 'NOTE' ? data.richText : undefined,
        videoLinks: data.contentType === 'VIDEO' && data.videoLink ? [data.videoLink] : undefined,
        fileUrls: data.contentType === 'PDF' && data.richText ? [data.richText.trim()] : undefined,
      };

      if (editingContent) {
        await cmsApi.updateContent(currentSchool.id, editingContent.id, payload);
        toast.success('Content updated');
      } else {
        await cmsApi.createContent(currentSchool.id, payload);
        toast.success('Content created');
      }

      setIsContentModalOpen(false);
      setEditingContent(null);
      reset();
      if (selectedFolderId) {
        fetchFolderContents(selectedFolderId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save content');
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!currentSchool) return;
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await cmsApi.deleteContent(currentSchool.id, contentId);
      toast.success('Content deleted');
      if (selectedFolderId) {
        fetchFolderContents(selectedFolderId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete content');
    }
  };

  const openCreateContent = (folderId?: string, subjectId?: string) => {
    setEditingContent(null);
    reset({
      title: '',
      contentType: 'NOTE',
      richText: '',
      videoLink: '',
      folderId: folderId || selectedFolderId || '',
      subjectId: subjectId || selectedSubjectId || '',
      termId: '',
      sessionId: '',
      targetClassIds: [],
    });
    setIsContentModalOpen(true);
  };

  const openEditContent = (item: ContentItem) => {
    setEditingContent(item);
    reset({
      title: item.title,
      contentType: (item.contentType as any) || 'NOTE',
      richText: item.richText || item.fileUrls?.[0] || '',
      videoLink: item.videoLinks?.[0] || '',
      folderId: item.folderId || '',
      subjectId: item.subjectId || '',
      termId: item.termId || '',
      sessionId: item.sessionId || '',
      targetClassIds: item.targetClassIds || [],
    });
    setIsContentModalOpen(true);
  };

  const openEditFolder = (folder: ContentFolder) => {
    setEditingFolder(folder);
    resetEditFolder({
      name: folder.name,
      description: folder.description || '',
      subjectId: folder.subjectId || '',
    });
    setIsEditFolderModalOpen(true);
  };

  // Any teacher or admin can create/manage content and folders.
  // The backend enforces actual ownership / authorization.
  const isAdmin = isPlatformAdmin() || currentSchool?.roleName === 'ADMIN' || currentSchool?.roleName === 'SUPER_ADMIN';
  const canEditAny = hasPermission('cms.content.edit.any');
  const canManageContent = isAdmin || canEditAny || isTeacher() || hasPermission('cms.content.create');
  const canManageFolders = isAdmin || canEditAny || isTeacher() || hasPermission('cms.folder.create');

  // Teachers see only their assigned classes & subjects; admins see everything
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

  const filteredSubjects = subjects
    .filter((s) => {
      if (!isTeacher() || isAdmin) return true;
      const hasExplicitAssignment = assignedSubjectIds.has(s.id);
      if (hasExplicitAssignment) return true;
      // If teacher has explicit assignments, hide unassigned subjects
      if (assignedSubjectIds.size > 0) return false;
      // No explicit subject assignments: fallback to class-linked subjects
      if (assignedClassIds.size === 0) return false;
      const subjectInfo = allSchoolSubjects.find((sub) => sub.id === s.id);
      return subjectInfo?.classIds?.some((cid) => assignedClassIds.has(cid));
    })
    .filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.folders.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const filteredContents = contents.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentSchool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Please select a school to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="content-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Content</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Organized learning materials by subject and folder
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('cms.content.approve') && pendingApprovalCount > 0 && (
            <Link href="/cms">
              <Badge variant="warning" className="cursor-pointer">
                <Clock className="w-3 h-3 mr-1" />
                {pendingApprovalCount} pending
              </Badge>
            </Link>
          )}
          {canManageFolders && (
            <Button variant="secondary" size="sm" onClick={() => { setCreatingFolderForSubject(false); setIsFolderModalOpen(true); resetFolder(); }}>
              <Folder className="w-4 h-4 mr-1" />
              New Folder
            </Button>
          )}
          {canManageContent && (
            <Button size="sm" onClick={() => openCreateContent()}>
              <Plus className="w-4 h-4 mr-1" />
              New Content
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search subjects, folders, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input pl-9 w-full text-sm"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Subjects & Folders */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-500" />
                Subjects
              </CardTitle>
              <span className="text-xs text-slate-500">{subjects.length} total</span>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredSubjects.length === 0 && unassignedFolders.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No subjects or folders yet
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSubjects.map((subject) => {
                    const isExpanded = expandedSubjects.has(subject.id);
                    return (
                      <div key={subject.id} className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <button
                          onClick={() => toggleSubject(subject.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors',
                            isExpanded ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          )}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <BookOpen className="w-4 h-4" />
                          <span className="text-sm font-medium flex-1">{subject.name}</span>
                          <span className="text-xs text-slate-400">{subject.folders.length}</span>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-2 pb-2 space-y-0.5">
                                {subject.folders.map((folder) => {
                                  const isSelected = selectedFolderId === folder.id;
                                  return (
                                    <button
                                      key={folder.id}
                                      onClick={() => setSelectedFolderId(folder.id)}
                                      className={cn(
                                        'group w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors',
                                        isSelected
                                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      )}
                                    >
                                      {isSelected ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                                      <span className="flex-1 truncate">{folder.name}</span>
                                      {canManageFolders && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            onClick={() => openEditFolder(folder)}
                                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                            title="Edit folder"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteFolder(folder.id)}
                                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                                            title="Delete folder"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                                {subject.folders.length === 0 && (
                                  <p className="text-xs text-slate-400 px-3 py-2">No folders yet</p>
                                )}
                                  {canManageFolders && (
                                    <button
                                      onClick={() => {
                                        setSelectedSubjectId(subject.id);
                                        setCreatingFolderForSubject(true);
                                        setIsFolderModalOpen(true);
                                        resetFolder({ subjectId: subject.id });
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add folder to {subject.name}
                                    </button>
                                  )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {unassignedFolders.length > 0 && (
                    <div className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden mt-2">
                      <div className="px-3 py-2.5 text-sm font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                        Unassigned Folders
                      </div>
                      <div className="px-2 pb-2 space-y-0.5">
                        {unassignedFolders.map((folder) => {
                          const isSelected = selectedFolderId === folder.id;
                          return (
                            <button
                              key={folder.id}
                              onClick={() => setSelectedFolderId(folder.id)}
                              className={cn(
                                'group w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors',
                                isSelected
                                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                              )}
                            >
                              {isSelected ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                              <span className="flex-1 truncate">{folder.name}</span>
                              {canManageFolders && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => openEditFolder(folder)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                    title="Edit folder"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFolder(folder.id)}
                                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                                    title="Delete folder"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Contents */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base">
                {selectedFolderId
                  ? contents.length > 0
                    ? `${contents[0]?.folderName || 'Folder'} Contents`
                    : 'Folder Contents'
                  : 'All Content'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:text-slate-600')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:text-slate-600')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedFolderId ? (
                <div className="text-center py-16 text-slate-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a folder to view its contents</p>
                  <p className="text-xs mt-1">Or use the search to find content across all folders</p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : filteredContents.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No content in this folder yet</p>
                  {canManageContent && (
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => openCreateContent(selectedFolderId)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Content
                    </Button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredContents.map((item) => {
                    const Icon = getContentIcon(item.contentType);
                    const canEditItem = isAdmin || (isTeacher() && item.teacherId === user?.id) || hasPermission('cms.content.edit.any');
                    const canDeleteItem = isAdmin || (isTeacher() && item.teacherId === user?.id) || hasPermission('cms.content.delete.any');
                    const pathParts = [item.sessionName, item.termName, item.subjectName, item.folderName].filter(Boolean);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm transition-all"
                      >
                        <Link href={`/content/${item.id}`} className="block">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-sm truncate">{item.title}</h3>
                                <Badge variant={getStatusBadge(item.status)} className="text-[10px]">
                                  {item.status}
                                </Badge>
                              </div>
                              {pathParts.length > 0 && (
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                  {pathParts.join(' › ')}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-0.5">
                                by {item.teacherName || 'Unknown'} • {formatDate(item.createdAt)}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {item.targetClassIds && item.targetClassIds.length > 0 ? (
                                  item.targetClassIds.map((cid) => {
                                    const cls = classes.find((c) => c.id === cid);
                                    return cls ? (
                                      <span key={cid} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                                        <GraduationCap className="w-3 h-3 mr-0.5" />
                                        {cls.name}
                                      </span>
                                    ) : null;
                                  })
                                ) : (
                                  <span className="text-[10px] text-slate-400">All classes</span>
                                )}
                                {item.termName && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] text-blue-600 dark:text-blue-400">
                                    {item.termName}
                                  </span>
                                )}
                                {item.sessionName && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-[10px] text-purple-600 dark:text-purple-400">
                                    {item.sessionName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                          <Link href={`/content/${item.id}`} className="flex-1">
                            <Button variant="ghost" size="sm" className="w-full text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open
                            </Button>
                          </Link>
                          {canEditItem && (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEditContent(item)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                          )}
                          {canDeleteItem && (
                            <Button variant="ghost" size="sm" className="text-xs text-red-600" onClick={() => handleDeleteContent(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredContents.map((item) => {
                    const Icon = getContentIcon(item.contentType);
                    const canEditItem = isAdmin || (isTeacher() && item.teacherId === user?.id) || hasPermission('cms.content.edit.any');
                    const canDeleteItem = isAdmin || (isTeacher() && item.teacherId === user?.id) || hasPermission('cms.content.delete.any');
                    const pathParts = [item.sessionName, item.termName, item.subjectName, item.folderName].filter(Boolean);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <Link href={`/content/${item.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{item.title}</p>
                              <Badge variant={getStatusBadge(item.status)} className="text-[10px]">
                                {item.status}
                              </Badge>
                            </div>
                            {pathParts.length > 0 && (
                              <p className="text-[10px] text-slate-500 truncate">
                                {pathParts.join(' › ')}
                              </p>
                            )}
                            <p className="text-xs text-slate-500">
                              by {item.teacherName || 'Unknown'} • {formatDate(item.createdAt)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {item.targetClassIds && item.targetClassIds.length > 0 ? (
                                item.targetClassIds.map((cid) => {
                                  const cls = classes.find((c) => c.id === cid);
                                  return cls ? (
                                    <span key={cid} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                                      <GraduationCap className="w-3 h-3 mr-0.5" />
                                      {cls.name}
                                    </span>
                                  ) : null;
                                })
                              ) : (
                                <span className="text-[10px] text-slate-400">All classes</span>
                              )}
                              {item.termName && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] text-blue-600 dark:text-blue-400">
                                  {item.termName}
                                </span>
                              )}
                              {item.sessionName && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-[10px] text-purple-600 dark:text-purple-400">
                                  {item.sessionName}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-1">
                          <Link href={`/content/${item.id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                          {canEditItem && (
                            <Button variant="ghost" size="sm" onClick={() => openEditContent(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeleteItem && (
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteContent(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Content Modal */}
      <Modal
        isOpen={isContentModalOpen}
        onClose={() => { setIsContentModalOpen(false); setEditingContent(null); reset(); }}
        title={editingContent ? 'Edit Content' : 'Create Content'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitContent)} className="space-y-4">
          <Input
            {...register('title')}
            label="Title"
            placeholder="Content title"
            error={errors.title?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Content Type
              </label>
              <select {...register('contentType')} className="glass-input w-full">
                <option value="NOTE">Note / Lesson</option>
                <option value="PDF">PDF Document</option>
                <option value="VIDEO">Video / Embedded Link</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Folder
              </label>
              <select {...register('folderId')} className="glass-input w-full">
                <option value="">No folder</option>
                {subjects.flatMap((s) => s.folders).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
                {unassignedFolders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <select {...register('subjectId')} className="glass-input w-full">
              <option value="">No subject</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {isTeacher() && !isAdmin && availableSubjects.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">You are not assigned to any subjects.</p>
            )}
          </div>

          {contentType === 'NOTE' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Content
              </label>
              <TiptapEditor
                content={watch('richText') || ''}
                onChange={(val) => setValue('richText', val, { shouldDirty: true })}
                placeholder="Enter your lesson notes here..."
              />
            </div>
          )}

          {contentType === 'PDF' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                PDF File
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('richText')}
                  placeholder="Paste file URL or upload below"
                  className="glass-input flex-1"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploadingFile}
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">Enter a URL or upload a PDF (max 20MB)</p>
            </div>
          )}

          {contentType === 'VIDEO' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Video / Embed Link
              </label>
              <input
                type="text"
                {...register('videoLink')}
                placeholder="https://youtube.com/watch?v=... or any embed link"
                className="glass-input w-full"
              />
              <p className="text-xs text-slate-500 mt-1">Paste a YouTube, Vimeo, or any video link</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Term
              </label>
              <select {...register('termId')} className="glass-input w-full">
                <option value="">No term</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Session
              </label>
              <select {...register('sessionId')} className="glass-input w-full">
                <option value="">No session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Target Classes
            </label>
            {availableClasses.length === 0 ? (
              <p className="text-xs text-slate-500">No classes available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableClasses.map((cls) => {
                  const selected = (watch('targetClassIds') || []).includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        const current = watch('targetClassIds') || [];
                        if (selected) {
                          setValue('targetClassIds', current.filter((id: string) => id !== cls.id), { shouldDirty: true });
                        } else {
                          setValue('targetClassIds', [...current, cls.id], { shouldDirty: true });
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsContentModalOpen(false); setEditingContent(null); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingContent ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => { setIsFolderModalOpen(false); resetFolder(); }}
        title="Create Folder"
        size="md"
      >
        <form onSubmit={handleSubmitFolder(handleCreateFolder)} className="space-y-4">
          <Input
            {...registerFolder('name')}
            label="Folder Name"
            placeholder="e.g., Week 1 - Introduction"
            error={folderErrors.name?.message}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              {...registerFolder('description')}
              rows={3}
              className="glass-input"
              placeholder="Brief description of this folder's contents..."
            />
          </div>
          {!creatingFolderForSubject && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Subject
              </label>
              <select {...registerFolder('subjectId')} className="glass-input w-full">
                <option value="">No subject</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsFolderModalOpen(false); setCreatingFolderForSubject(false); resetFolder(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isFolderSubmitting}>
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal
        isOpen={isEditFolderModalOpen}
        onClose={() => { setIsEditFolderModalOpen(false); setEditingFolder(null); resetEditFolder(); }}
        title="Edit Folder"
        size="md"
      >
        <form onSubmit={handleSubmitEditFolder(handleEditFolder)} className="space-y-4">
          <Input
            {...registerEditFolder('name')}
            label="Folder Name"
            placeholder="e.g., Week 1 - Introduction"
            error={editFolderErrors.name?.message}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              {...registerEditFolder('description')}
              rows={3}
              className="glass-input"
              placeholder="Brief description of this folder's contents..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <select {...registerEditFolder('subjectId')} className="glass-input w-full">
              <option value="">No subject</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsEditFolderModalOpen(false); setEditingFolder(null); resetEditFolder(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isEditFolderSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
