'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const SCHOOL_ONLY_PATHS = [
  '/students',
  '/teachers',
  '/classes',
  '/users',
  '/content',
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

export function RouteGuard() {
  const { isAuthenticated, isLoading, isPlatformAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const isPlatform = isPlatformAdmin();
    const currentPath = pathname || '';

    if (isPlatform) {
      const isSchoolPath = SCHOOL_ONLY_PATHS.some((path) => currentPath.startsWith(path));
      if (isSchoolPath) {
        router.push('/dashboard');
      }
    } else {
      const isPlatformPath = PLATFORM_ONLY_PATHS.some((path) => currentPath.startsWith(path));
      if (isPlatformPath) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, isPlatformAdmin, pathname, router]);

  return null;
}
