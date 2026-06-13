'use client';

import { notificationApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { normalizeListResponse } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await notificationApi.getAll({ size: 50 });
    setNotifications(normalizeListResponse<any>(res.data).items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT': return 'bg-blue-100 text-blue-600';
      case 'GRADE': return 'bg-green-100 text-green-600';
      case 'FEE': return 'bg-amber-100 text-amber-600';
      case 'MESSAGE': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6" data-tour="notifications">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">Notifications</h1>
        <button onClick={markAllRead} className="btn-secondary text-sm self-start">
          <Check className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 glass-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-xl p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                !n.isRead ? 'border-l-4 border-primary-500 bg-primary-50/20 dark:bg-primary-900/10' : ''
              }`}
              onClick={() => markRead(n.id)}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getIcon(n.type)}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString()}</p>
              </div>
              {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
