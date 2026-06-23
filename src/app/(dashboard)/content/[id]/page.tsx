'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { cmsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, FileText, Video, File, Link as LinkIcon, Calendar, User, BookOpen, GraduationCap, ArrowLeft, Pencil, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081';

function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

interface CmsContent {
  id: string;
  title: string;
  contentType: string;
  subjectName?: string;
  folderName?: string;
  termName?: string;
  sessionName?: string;
  richText?: string;
  body?: string;
  fileUrls?: string[];
  videoLinks?: string[];
  teacherName?: string;
  targetClassIds?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContentViewPage() {
  const params = useParams();
  const { currentSchool, user, hasPermission, isTeacher, isPlatformAdmin } = useAuth();
  const schoolId = currentSchool?.id;
  const contentId = params?.id as string;

  const [content, setContent] = useState<CmsContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !contentId) return;
    loadContent();
  }, [schoolId, contentId]);

  const loadContent = async () => {
    try {
      if (!schoolId || !contentId) return;
      const studentId = user?.studentId;
      const res = await cmsApi.getContentItem(schoolId, contentId, studentId);
      setContent(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!schoolId || !contentId) return;
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await cmsApi.deleteContent(schoolId, contentId);
      toast.success('Content deleted');
      window.location.href = '/content';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <FileText className="w-12 h-12 mb-3 opacity-50" />
        <p>Content not found or you do not have access.</p>
        <Link href="/content" className="mt-4">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Content
          </Button>
        </Link>
      </div>
    );
  }

  const contentTypeLabel = content.contentType?.toLowerCase() || 'material';
  const isAdmin = isPlatformAdmin() || currentSchool?.roleName === 'ADMIN' || currentSchool?.roleName === 'SUPER_ADMIN';
  const canEdit = isAdmin || (isTeacher() && content.teacherName === user?.fullName);
  const canDelete = isAdmin || (isTeacher() && content.teacherName === user?.fullName);
  const isReadOnly = !canEdit && !canDelete;

  // Build breadcrumb path from hierarchy metadata
  const breadcrumbParts = [
    content.sessionName,
    content.termName,
    content.subjectName,
    content.folderName,
  ].filter(Boolean);

  const htmlContent = content.richText || content.body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Back button */}
      <Link href="/content">
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Content
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-2">
        {/* Breadcrumb */}
        {breadcrumbParts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            {breadcrumbParts.map((part, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="w-3 h-3" />}
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 truncate max-w-[150px]">{part}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium capitalize">
            {contentTypeLabel}
          </span>
          <Badge variant={content.status === 'APPROVED' || content.status === 'PUBLISHED' ? 'success' : content.status === 'PENDING' ? 'warning' : 'default'}>
            {content.status}
          </Badge>
          {isReadOnly && (
            <Badge variant="info" className="text-[10px]">Read-only</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{content.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {content.teacherName && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {content.teacherName}
            </div>
          )}
          {content.subjectName && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {content.subjectName}
            </div>
          )}
          {content.folderName && (
            <div className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              {content.folderName}
            </div>
          )}
          {content.termName && (
            <div className="flex items-center gap-1">
              <Badge variant="info" className="text-[10px]">{content.termName}</Badge>
            </div>
          )}
          {content.sessionName && (
            <div className="flex items-center gap-1">
              <Badge variant="default" className="text-[10px]">{content.sessionName}</Badge>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(content.createdAt)}
          </div>
        </div>
      </div>

      {/* Rich Text / Body Content */}
      {htmlContent && (
        <Card>
          <CardContent className="prose dark:prose-invert max-w-none py-6">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </CardContent>
        </Card>
      )}

      {/* PDF Files */}
      {content.fileUrls && content.fileUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <File className="w-5 h-5 text-blue-500" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {content.fileUrls.map((url, idx) => (
              <a
                key={idx}
                href={resolveUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <File className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{url.split('/').pop()}</span>
                <LinkIcon className="w-4 h-4 text-slate-400 ml-auto" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Video Links */}
      {content.videoLinks && content.videoLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-5 h-5 text-red-500" />
              Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {content.videoLinks.map((link, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video">
                {link.includes('youtube.com') || link.includes('youtu.be') ? (
                  <iframe
                    src={link.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Video ${idx + 1}`}
                  />
                ) : (
                  <a href={resolveUrl(link)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full text-primary-500 hover:underline">
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Open Video
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {(canEdit || canDelete) && (
        <div className="flex items-center gap-3 pt-4">
          {canEdit && (
            <Link href={`/content?id=${content.id}&edit=true`}>
              <Button variant="secondary" size="sm">
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" className="text-red-600" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
