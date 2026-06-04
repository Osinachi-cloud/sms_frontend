'use client';

import { useAuth } from '@/lib/auth';
import { AdminDashboard } from './AdminDashboard';
import { StudentDashboardView } from './StudentDashboard';
import { TeacherDashboardView } from './TeacherDashboard';

export default function DashboardPage() {
  const { user, currentSchool, isPlatformAdmin, hasPermission } = useAuth();

  if (!currentSchool && !isPlatformAdmin()) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to SchoolSaaS</h2>
          <p className="text-slate-500">Please select a school to continue.</p>
        </div>
      </div>
    );
  }

  const roleName = currentSchool?.roleName?.toLowerCase() || '';

  if (roleName.includes('student')) {
    return <StudentDashboardView />;
  }

  if (roleName.includes('teacher')) {
    return <TeacherDashboardView />;
  }

  return <AdminDashboard />;
}
