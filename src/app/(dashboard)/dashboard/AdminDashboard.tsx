'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { dashboardApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  School,
  FileCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function AdminDashboard() {
  const { user, currentSchool, isPlatformAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!currentSchool) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await dashboardApi.getSchoolStats(currentSchool.id);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [currentSchool]);

  const statCards = stats ? [
    {
      name: 'Total Students',
      value: stats.activeStudents.toLocaleString(),
      subValue: `${stats.totalStudents} total`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Active Teachers',
      value: stats.activeTeachers.toString(),
      subValue: `${stats.totalTeachers} total`,
      icon: GraduationCap,
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Total Classes',
      value: stats.totalClasses.toString(),
      subValue: 'Active classes',
      icon: School,
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Revenue (Total)',
      value: `₦${(stats.totalRevenue / 1000000).toFixed(1)}M`,
      subValue: 'All payments',
      icon: CreditCard,
      color: 'from-orange-500 to-orange-600',
    },
  ] : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2" data-tour="welcome">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
            {isPlatformAdmin()
              ? 'Platform Administrator Dashboard'
              : currentSchool
              ? `${currentSchool.name} - ${currentSchool.roleName || 'Admin'} Dashboard`
              : 'Select a school to continue'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          data-tour="stats"
        >
          {statCards.map((stat) => (
            <motion.div key={stat.name} variants={item}>
              <Card hover>
                <CardContent className="p-0">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {stat.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{stat.value}</span>
                      </div>
                      <p className="text-xs text-slate-400">{stat.subValue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats?.pendingContentApprovals || 0}</p>
                      <p className="text-sm text-slate-500">Pending Approvals</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">₦{((stats?.totalRevenue || 0) / 1000).toFixed(0)}K</p>
                      <p className="text-sm text-slate-500">Total Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Bell className="w-5 h-5 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats?.recentActivities || []).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                  >
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500">
                        by {activity.user}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))}
                {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          data-tour="actions"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Add Student', icon: Users, href: '/students' },
                  { label: 'Add Teacher', icon: GraduationCap, href: '/teachers' },
                  { label: 'Create Content', icon: BookOpen, href: '/cms/create' },
                  { label: 'View Payments', icon: CreditCard, href: '/payments' },
                ].map((action, index) => (
                  <a
                    key={index}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <action.icon className="w-6 h-6 text-primary-500" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardContent>
              {currentSchool ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <School className="w-10 h-10 text-primary-500" />
                    <div>
                      <p className="font-semibold">{currentSchool.name}</p>
                      <p className="text-sm text-slate-500">Code: {currentSchool.code}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-slate-500">Your Role</p>
                      <p className="font-medium">{currentSchool.roleName || 'Admin'}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-slate-500">Permissions</p>
                      <p className="font-medium">{currentSchool.permissions?.length || 0} granted</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">No school selected</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
