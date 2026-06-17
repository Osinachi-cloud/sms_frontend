'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { NavigationLoader } from '@/components/layout/NavigationLoader';
import { AiTutorWidget } from '@/components/ai/AiTutorWidget';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

const SCHOOL_ONLY_PATHS = [
  '/students',
  '/teachers',
  '/classes',
  '/users',
  '/cms',
  '/calendar',
  '/timetable',
  '/quizzes',
  '/library',
  '/id-cards',
  '/report-cards',
  '/admissions',
  '/payments',
  '/analytics',
  '/gamification',
  '/messages',
  '/notifications',
  '/roles',
];

const PLATFORM_ONLY_PATHS = [
  '/schools',
  '/admin/deletion-requests',
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isPlatformAdmin, currentSchool } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Route guards: prevent platform admins from accessing school-specific pages
  // and non-platform admins from accessing platform-only pages
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const isPlatform = isPlatformAdmin();
    const currentPath = pathname || '';

    if (isPlatform) {
      const isSchoolPath = SCHOOL_ONLY_PATHS.some(path => currentPath.startsWith(path));
      if (isSchoolPath) {
        router.push('/dashboard');
      }
    } else {
      const isPlatformPath = PLATFORM_ONLY_PATHS.some(path => currentPath.startsWith(path));
      if (isPlatformPath) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, isPlatformAdmin, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <NavigationLoader />
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
      <AiTutorWidget />
    </div>
  );
}
