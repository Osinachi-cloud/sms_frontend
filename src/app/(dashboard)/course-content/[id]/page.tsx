'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { courseContentApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, FileText, Video, Link as LinkIcon, Calendar, User, BookOpen, GraduationCap } from 'lucide-react';

interface CourseContent {
  id: string;
  title: string;
  description?: string;
  subjectName?: string;
  className?: string;
  weekNumber?: number;
  contentType?: string;
  fileUrls?: string[];
  videoLinks?: string[];
  thumbnailUrl?: string;
  richText?: string;
  teacherName?: string;
  createdAt: string;
}

export default function CourseContentViewPage() {
  const params = useParams();
  const { currentSchool, user } = useAuth();
  const schoolId = currentSchool?.id;
  const contentId = params?.id as string;
  const studentId = user?.id;

  const [content, setContent] = useState<CourseContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !contentId) return;
    loadContent();
  }, [schoolId, contentId]);

  const loadContent = async () => {
    try {
      if (!schoolId || !contentId) return;
      const res = await courseContentApi.getOne(schoolId, contentId, studentId || '');
      setContent(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
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
      </div>
    );
  }

  const contentTypeLabel = content.contentType?.toLowerCase() || 'material';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        {content.thumbnailUrl && (
          <div className="w-full h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {content.weekNumber && (
            <span className="px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium">
              Week {content.weekNumber}
            </span>
          )}
          <span className="capitalize">{contentTypeLabel}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{content.title}</h1>
        <p className="text-slate-500">{content.description}</p>
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
          {content.className && (
            <div className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              {content.className}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(content.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Rich Text Content */}
      {content.richText && (
        <Card>
          <CardContent className="prose dark:prose-invert max-w-none py-6">
            <div dangerouslySetInnerHTML={{ __html: content.richText }} />
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
                  <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full text-primary-500 hover:underline">
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Open Video
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Files */}
      {content.fileUrls && content.fileUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {content.fileUrls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{url.split('/').pop()}</span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
