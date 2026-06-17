'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { StudentDashboardView } from './StudentDashboard';
import { TeacherDashboardView } from './TeacherDashboard';

export default function DashboardPage() {
  const { user, currentSchool, isPlatformAdmin, isParent } = useAuth();
  const router = useRouter();

  if (!currentSchool && !isPlatformAdmin()) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to Ali &amp; Simbi</h2>
          <p className="text-slate-500">Please select a school to continue.</p>
        </div>
      </div>
    );
  }

  const roleName = currentSchool?.roleName?.toLowerCase() || '';

  // Parents should land on the fees page where they can view their children's payments
  if (isParent() || roleName.includes('parent')) {
    useEffect(() => {
      router.replace('/student/fees');
    }, [router]);
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (roleName.includes('student')) {
    return <StudentDashboardView />;
  }

  if (roleName.includes('teacher')) {
    return <TeacherDashboardView />;
  }

  return <AdminDashboard />;
}
