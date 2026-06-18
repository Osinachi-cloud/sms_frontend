'use client';

import { useAuth } from '@/lib/auth';
import { teacherApi, teacherAssignmentApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Calendar,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Teacher } from '@/types';
import toast from 'react-hot-toast';

export default function TeacherDetailPage() {
  const { currentSchool } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedClasses, setAssignedClasses] = useState<{ id: string; name: string }[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!currentSchool || !teacherId) return;
    fetchTeacher();
  }, [currentSchool, teacherId]);

  const fetchTeacher = async () => {
    try {
      setIsLoading(true);
      const [teacherRes, assignmentsRes] = await Promise.all([
        teacherApi.getOne(currentSchool!.id, teacherId),
        teacherAssignmentApi.getByTeacher(currentSchool!.id, teacherId, { size: 1000 }),
      ]);
      setTeacher(teacherRes.data);

      const raw = (assignmentsRes.data as any)?.content || (Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      const assignments = raw.filter((a: any) => a);

      const classMap = new Map<string, { id: string; name: string }>();
      const subjectMap = new Map<string, { id: string; name: string }>();

      assignments.forEach((a: any) => {
        if (a.classId && a.className) {
          classMap.set(a.classId, { id: a.classId, name: a.className });
        }
        if (a.subjectId && a.subjectName) {
          subjectMap.set(a.subjectId, { id: a.subjectId, name: a.subjectName });
        }
      });

      setAssignedClasses(Array.from(classMap.values()));
      setAssignedSubjects(Array.from(subjectMap.values()));
    } catch {
      toast.error('Failed to load teacher');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Teacher not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/teachers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teachers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/teachers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Badge className={teacher.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
          {teacher.status}
        </Badge>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{teacher.fullName}</h1>
              <p className="text-slate-500">{teacher.employeeId || 'No Employee ID'}</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  {teacher.email || 'No email'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4" />
                  {teacher.phone || 'No phone'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <GraduationCap className="w-4 h-4" />
                  {teacher.qualification || 'No qualification'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BookOpen className="w-4 h-4" />
                  {teacher.specialization || 'No specialization'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  Joined: {teacher.dateOfJoining || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Classes & Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assigned Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedClasses.length === 0 ? (
              <p className="text-sm text-slate-500">No classes assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {assignedClasses.map((c) => (
                  <li key={c.id} className="text-sm text-slate-700">{c.name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Assigned Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedSubjects.length === 0 ? (
              <p className="text-sm text-slate-500">No subjects assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {assignedSubjects.map((s) => (
                  <li key={s.id} className="text-sm text-slate-700">{s.name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
