'use client';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  FileText,
  CreditCard,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BookOpen,
  BarChart3,
  Trash2,
  Award,
  CalendarDays,
  MessageSquare,
  Bell,
  Clock,
  Library,
  ClipboardList,
  TicketCheck,
  Gamepad2,
  UserCog,
  X,
  Menu,
} from 'lucide-react';
import AliSimbiLogo from '@/components/landing/AliSimbiLogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

// Platform Admin only sees platform-level items
const platformAdminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Schools', href: '/schools', icon: School },
  { name: 'Deletion Requests', href: '/admin/deletion-requests', icon: Trash2 },
  { name: 'Gradebook', href: '/gradebook', icon: Award },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// School Admin sees school management items
const schoolAdminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: UserCog, permission: 'user.read' },
  { name: 'Students', href: '/students', icon: Users, permission: 'student.read' },
  { name: 'Teachers', href: '/teachers', icon: GraduationCap, permission: 'teacher.read' },
  { name: 'Classes', href: '/classes', icon: School },
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
  { name: 'Promotions', href: '/promotions', icon: GraduationCap },
  { name: 'Content', href: '/content', icon: BookOpen, permission: 'cms.content.read' },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Holidays', href: '/holidays', icon: CalendarDays },
  { name: 'Timetable', href: '/timetable', icon: Clock },
  { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'ID Cards', href: '/id-cards', icon: CreditCard },
  { name: 'Report Cards', href: '/report-cards', icon: FileText },
  { name: 'Admissions', href: '/admissions', icon: TicketCheck },
  { name: 'Payments', href: '/payments', icon: CreditCard, permission: 'payment.read' },
  { name: 'Gradebook', href: '/gradebook', icon: Award, permission: 'student.grades.read' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'analytics.academic.view' },
  { name: 'Gamification', href: '/gamification', icon: Gamepad2 },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Roles', href: '/roles', icon: Shield, permission: 'role.read' },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const studentNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Results', href: '/student/results', icon: FileText },
  { name: 'My Fees', href: '/student/fees', icon: CreditCard },
  { name: 'Timetable', href: '/timetable', icon: Clock },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Holidays', href: '/holidays', icon: CalendarDays },
  { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'My Content', href: '/content', icon: BookOpen },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const parentNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Children', href: '/student/fees', icon: Users },
  { name: 'Results', href: '/parent/results', icon: Award },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Holidays', href: '/holidays', icon: CalendarDays },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const teacherNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Classes', href: '/teacher/my-classes', icon: School },
  { name: 'My Subjects', href: '/teacher/my-subjects', icon: BookOpen },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Attendance', href: '/teacher/attendance', icon: CalendarDays },
  { name: 'Assessments', href: '/teacher/assessments', icon: ClipboardList },
  { name: 'Gradebook', href: '/teacher/gradebook', icon: Award },
  { name: 'Promotions', href: '/promotions', icon: GraduationCap },
  { name: 'Content', href: '/content', icon: BookOpen },
  { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
  { name: 'Timetable', href: '/timetable', icon: Clock },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Holidays', href: '/holidays', icon: CalendarDays },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { user, currentSchool, hasPermission, isPlatformAdmin, logout } = useAuth();

  const roleName = currentSchool?.roleName?.toLowerCase() || '';

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const getNavItems = () => {
    if (isPlatformAdmin()) return platformAdminNavItems;
    if (roleName.includes('parent')) return parentNavItems;
    if (roleName.includes('student')) return studentNavItems;
    if (roleName.includes('teacher')) return teacherNavItems;
    // Default to school admin nav for anyone else with a school role (ADMIN, etc.)
    return schoolAdminNavItems;
  };

  const filteredNavItems = getNavItems().filter((item) => {
    if (item.permission) {
      // School admins bypass granular permission checks and see all management items
      if (roleName.includes('admin')) return true;
      return hasPermission(item.permission);
    }
    return true;
  });

  return (
    <>
      {/* Mobile hamburger - visible only on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 280,
          x: isMobile ? (mobileOpen ? 0 : -300) : 0,
        }}
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col border-r border-white/20 dark:border-slate-700/50',
          'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl lg:translate-x-0',
          mobileOpen && 'shadow-2xl'
        )}
        style={{
          width: mobileOpen ? 280 : undefined,
          minWidth: mobileOpen ? 280 : undefined,
        }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/20 dark:border-slate-700/50">
          <AnimatePresence mode="wait">
            {(!isCollapsed || mobileOpen) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AliSimbiLogo size="sm" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors hidden lg:block"
              aria-label="Collapse sidebar"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* User role badge - mobile always visible */}
        <div className="px-4 py-2 lg:hidden">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-xs truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          )}
          {currentSchool && (
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-semibold uppercase tracking-wide">
              {currentSchool.roleName || 'User'}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 sm:p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={cn(
                    'sidebar-item px-2 sm:px-3 py-2.5 sm:py-2.5 text-xs sm:text-sm gap-2 sm:gap-3',
                    isActive && 'active bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  )}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {(!isCollapsed || mobileOpen) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-2 sm:p-4 border-t border-white/20 dark:border-slate-700/50">
          <div className={cn('flex items-center gap-2 sm:gap-3', isCollapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <AnimatePresence mode="wait">
              {(!isCollapsed || mobileOpen) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden hidden lg:block"
                >
                  <p className="font-medium text-xs sm:text-sm truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  {currentSchool && (
                    <span className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[9px] font-bold uppercase tracking-wider">
                      {currentSchool.roleName || 'User'}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {(!isCollapsed || mobileOpen) && (
              <button
                onClick={logout}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors hidden lg:block"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          {/* Mobile logout button */}
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium lg:hidden"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
}
