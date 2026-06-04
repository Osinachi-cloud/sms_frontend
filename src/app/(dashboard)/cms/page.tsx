'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { cmsApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { ContentItem, ContentFolder, PageResponse } from '@/types';
import { motion } from 'framer-motion';
import {
  Plus,
  Folder,
  FileText,
  Video,
  File,
  Check,
  X,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const contentSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  contentType: z.string(),
  richText: z.string().optional(),
});

type ContentForm = z.infer<typeof contentSchema>;

const getContentIcon = (type: string) => {
  switch (type) {
    case 'NOTE': return FileText;
    case 'VIDEO': return Video;
    case 'FILE': return File;
    default: return FileText;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    DRAFT: 'default',
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    PUBLISHED: 'info',
  };
  return variants[status] || 'default';
};

export default function CMSPage() {
  const { currentSchool, hasPermission } = useAuth();
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContentForm>({
    resolver: zodResolver(contentSchema),
    defaultValues: { contentType: 'NOTE' },
  });

  const fetchContent = async () => {
    if (!currentSchool) return;
    try {
      const [contentRes, pendingRes, foldersRes] = await Promise.all([
        cmsApi.getContent(currentSchool.id, { size: 20 }),
        cmsApi.getPendingContent(currentSchool.id, { size: 100 }),
        cmsApi.getFolders(currentSchool.id),
      ]);
      setContent((contentRes.data as PageResponse<ContentItem>).content);
      setPendingCount((pendingRes.data as PageResponse<ContentItem>).totalElements);
      setFolders(foldersRes.data as ContentFolder[]);
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [currentSchool]);

  const onSubmit = async (data: ContentForm) => {
    if (!currentSchool) return;
    try {
      await cmsApi.createContent(currentSchool.id, data);
      toast.success('Content created successfully');
      setIsModalOpen(false);
      reset();
      fetchContent();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create content');
    }
  };

  const handleApprove = async (contentId: string) => {
    if (!currentSchool) return;
    try {
      await cmsApi.approveContent(currentSchool.id, contentId);
      toast.success('Content approved');
      fetchContent();
    } catch (error) {
      toast.error('Failed to approve content');
    }
  };

  const handleReject = async (contentId: string) => {
    if (!currentSchool) return;
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await cmsApi.rejectContent(currentSchool.id, contentId, reason);
      toast.success('Content rejected');
      fetchContent();
    } catch (error) {
      toast.error('Failed to reject content');
    }
  };

  const handleSubmitForApproval = async (contentId: string) => {
    if (!currentSchool) return;
    try {
      await cmsApi.submitForApproval(currentSchool.id, contentId);
      toast.success('Submitted for approval');
      fetchContent();
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  if (!currentSchool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Please select a school to continue.</p>
      </div>
    );
  }

  const displayContent = activeTab === 'pending'
    ? content.filter(c => c.status === 'PENDING')
    : content;

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="cms-list">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Content Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Create and manage educational content</p>
        </div>
        {hasPermission('cms.content.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Content
          </Button>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          All Content
        </button>
        {hasPermission('cms.content.approve') && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Pending Approval
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Folders</CardTitle>
            </CardHeader>
            <CardContent>
              {folders.length === 0 ? (
                <p className="text-sm text-slate-500">No folders yet</p>
              ) : (
                <div className="space-y-1">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <Folder className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{folder.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : displayContent.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  {activeTab === 'pending' ? 'No pending content' : 'No content yet'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayContent.map((item) => {
                    const Icon = getContentIcon(item.contentType);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-sm text-slate-500">
                            by {item.teacherName || 'Unknown'} • {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <Badge variant={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                        <div className="flex gap-2">
                          {item.status === 'DRAFT' && hasPermission('cms.content.submit') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSubmitForApproval(item.id)}
                            >
                              <Clock className="w-4 h-4" />
                              Submit
                            </Button>
                          )}
                          {item.status === 'PENDING' && hasPermission('cms.content.approve') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(item.id)}
                                className="text-green-600"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(item.id)}
                                className="text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="Create Content"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('title')}
            label="Title"
            placeholder="Content title"
            error={errors.title?.message}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Content Type
            </label>
            <select {...register('contentType')} className="glass-input">
              <option value="NOTE">Note/Lesson</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="VIDEO">Video</option>
              <option value="FILE">File</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Content
            </label>
            <textarea
              {...register('richText')}
              rows={6}
              className="glass-input"
              placeholder="Enter your content here..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Content
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
