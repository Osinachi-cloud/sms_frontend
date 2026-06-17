'use client';

import { cn, normalizeListResponse } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Bell, Moon, Sun, Search, ChevronDown, X, MessageSquare, Check, Shield, GraduationCap, BookOpen, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationApi, searchApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const getRoleIcon = (role?: string) => {
  if (!role) return User;
  if (role.includes('ADMIN')) return Shield;
  if (role.includes('TEACHER')) return GraduationCap;
  if (role.includes('STUDENT')) return BookOpen;
  return User;
};

const getRoleColor = (role?: string) => {
  if (!role) return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  if (role.includes('ADMIN')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  if (role.includes('TEACHER')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (role.includes('STUDENT')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
};

export function Header() {
  const { user, currentSchool, hasPermission, isPlatformAdmin } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  useEffect(() => {
    if (currentSchool?.id) {
      notificationApi.getCount().then((r) => setNotifCount(r.data));
      notificationApi.getUnread().then((r) => setNotifications(normalizeListResponse<any>(r.data).items));
    }
  }, [currentSchool]);

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newValue);
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length > 1 && currentSchool?.id) {
      const res = await searchApi.search(currentSchool.id, q);
      setSearchResults(res.data || []);
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  };

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const RoleIcon = getRoleIcon(currentSchool?.roleName);

  return (
    <header className="glass sticky top-0 z-40 border-b border-white/20 dark:border-slate-700/50">
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4">
        {/* Search */}
        <div className="flex-1 max-w-xl ml-10 sm:ml-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search students, books, content..."
              className="glass-input pl-9 sm:pl-10 w-full text-sm"
            />
            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[60vh] overflow-auto z-50"
                >
                  {searchResults.map((r, i) => (
                    <Link
                      key={i}
                      href={
                        r.type === 'CONTENT'
                          ? `/cms`
                          : r.type === 'BOOK'
                          ? `/library`
                          : '/'
                      }
                      onClick={() => setShowSearch(false)}
                    >
                      <div className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors">
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-slate-500">{r.type}</p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Role badge - visible on all screens */}
          {currentSchool?.roleName && (
            <div className={cn('hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold', getRoleColor(currentSchool.roleName))}>
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">{currentSchool.roleName}</span>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-2 w-[90vw] max-w-[360px] glass-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  </div>
                  <div className="max-h-[50vh] overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                            !n.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                          }`}
                        >
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700/50 text-center">
                    <Link href="/notifications" onClick={() => setShowNotifs(false)} className="text-xs text-primary-600 hover:underline">
                      View all notifications
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile school name */}
          {currentSchool && (
            <div className="flex sm:hidden items-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              {currentSchool.logoUrl ? (
                <img
                  src={currentSchool.logoUrl}
                  alt=""
                  className="w-4 h-4 rounded object-contain flex-shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
              <span className="text-[10px] font-medium text-primary-700 dark:text-primary-400 truncate max-w-[80px]">
                {currentSchool.name}
              </span>
            </div>
          )}

          {/* Desktop school dropdown */}
          {currentSchool && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/30">
              {currentSchool.logoUrl ? (
                <img
                  src={currentSchool.logoUrl}
                  alt=""
                  className="w-5 h-5 rounded object-contain flex-shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
              <span className="text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-400 truncate max-w-[100px] lg:max-w-[180px]">
                {currentSchool.name}
              </span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-primary-500 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
