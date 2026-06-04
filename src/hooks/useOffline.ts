import { useState, useEffect, useCallback } from 'react';
import { syncEngine, SyncStatus, getPendingCount } from '@/lib/offline';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    pendingCount: 0,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    syncEngine.getStatus().then(setSyncStatus);

    const unsubscribe = syncEngine.subscribe(setSyncStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const sync = useCallback(async () => {
    if (!isOnline) {
      console.log('Cannot sync while offline');
      return;
    }
    return syncEngine.sync();
  }, [isOnline]);

  const pullData = useCallback(
    async (schoolId: string) => {
      return syncEngine.pullData(schoolId);
    },
    []
  );

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setSyncStatus((prev) => ({ ...prev, pendingCount: count }));
  }, []);

  return {
    isOnline,
    syncStatus,
    sync,
    pullData,
    refreshPendingCount,
  };
}
