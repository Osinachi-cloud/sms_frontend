'use client';

import { useOffline } from '@/hooks/useOffline';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, CloudOff, Cloud, Check } from 'lucide-react';
import { useState } from 'react';

export function OfflineIndicator() {
  const { isOnline, syncStatus, sync } = useOffline();
  const [showDetails, setShowDetails] = useState(false);

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You&apos;re offline</span>
          </motion.div>
        )}
      </AnimatePresence>

      {syncStatus.pendingCount !== undefined && syncStatus.pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-white dark:bg-slate-800 shadow-lg rounded-xl px-4 py-2 flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {syncStatus.status === 'syncing' ? (
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <CloudOff className="w-4 h-4 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              {syncStatus.pendingCount} pending
            </span>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 shadow-xl rounded-xl p-4 w-64 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Sync Status</h3>
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      isOnline ? 'text-green-500' : 'text-orange-500'
                    }`}
                  >
                    {isOnline ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        Offline
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pending changes</span>
                    <span className="font-medium">{syncStatus.pendingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last sync</span>
                    <span className="font-medium">
                      {formatLastSync(syncStatus.lastSync)}
                    </span>
                  </div>
                </div>

                {isOnline && syncStatus.pendingCount > 0 && (
                  <button
                    onClick={() => sync()}
                    disabled={syncStatus.status === 'syncing'}
                    className="mt-3 w-full bg-primary-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {syncStatus.status === 'syncing' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4" />
                        Sync Now
                      </>
                    )}
                  </button>
                )}

                {syncStatus.status === 'error' && syncStatus.error && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400">
                    {syncStatus.error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
