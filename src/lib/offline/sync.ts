import { api } from '@/lib/api';
import {
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  getStudentsBySchool,
  getTeachersBySchool,
  getContentBySchool,
  saveStudent,
  saveTeacher,
  saveContent,
  getPendingCount,
  setMetadata,
  getMetadata,
} from './db';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class SyncEngine {
  private syncing = false;
  private listeners: ((status: SyncStatus) => void)[] = [];

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(status: SyncStatus) {
    this.listeners.forEach((listener) => listener(status));
  }

  async sync(): Promise<SyncResult> {
    if (this.syncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    if (!navigator.onLine) {
      return { success: false, synced: 0, failed: 0, errors: ['No network connection'] };
    }

    this.syncing = true;
    this.notify({ status: 'syncing', pendingCount: await getPendingCount() });

    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    try {
      const queue = await getSyncQueue();

      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await removeSyncQueueItem(item.id);
          result.synced++;
        } catch (error: any) {
          item.retries++;
          item.error = error.message;

          if (item.retries >= MAX_RETRIES) {
            await removeSyncQueueItem(item.id);
            result.failed++;
            result.errors.push(`Failed to sync ${item.entity} ${item.entityId}: ${error.message}`);
          } else {
            await updateSyncQueueItem(item);
          }
        }
      }

      await setMetadata('lastSync', Date.now());
      this.notify({ status: 'idle', pendingCount: await getPendingCount(), lastSync: Date.now() });
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      this.notify({ status: 'error', pendingCount: await getPendingCount(), error: error.message });
    } finally {
      this.syncing = false;
    }

    return result;
  }

  private async processSyncItem(item: any) {
    const { action, entity, entityId, payload } = item;

    switch (entity) {
      case 'students':
        await this.syncStudent(action, entityId, payload);
        break;
      case 'teachers':
        await this.syncTeacher(action, entityId, payload);
        break;
      case 'content':
        await this.syncContent(action, entityId, payload);
        break;
    }
  }

  private async syncStudent(action: string, id: string, payload: any) {
    const { schoolId, ...data } = payload;

    switch (action) {
      case 'create':
        await api.post(`/schools/${schoolId}/students`, data);
        break;
      case 'update':
        await api.put(`/schools/${schoolId}/students/${id}`, data);
        break;
      case 'delete':
        await api.delete(`/schools/${schoolId}/students/${id}`);
        break;
    }
  }

  private async syncTeacher(action: string, id: string, payload: any) {
    const { schoolId, ...data } = payload;

    switch (action) {
      case 'create':
        await api.post(`/schools/${schoolId}/teachers`, data);
        break;
      case 'update':
        await api.put(`/schools/${schoolId}/teachers/${id}`, data);
        break;
      case 'delete':
        await api.delete(`/schools/${schoolId}/teachers/${id}`);
        break;
    }
  }

  private async syncContent(action: string, id: string, payload: any) {
    const { schoolId, ...data } = payload;

    switch (action) {
      case 'create':
        await api.post(`/cms/content`, data);
        break;
      case 'update':
        await api.put(`/cms/content/${id}`, data);
        break;
      case 'delete':
        await api.delete(`/cms/content/${id}`);
        break;
    }
  }

  async pullData(schoolId: string) {
    if (!navigator.onLine) {
      console.log('Offline - using cached data');
      return;
    }

    try {
      const [studentsRes, teachersRes, contentRes] = await Promise.all([
        api.get(`/schools/${schoolId}/students?size=1000`),
        api.get(`/schools/${schoolId}/teachers?size=1000`),
        api.get(`/cms/content?schoolId=${schoolId}&size=1000`),
      ]);

      for (const student of studentsRes.data.content || []) {
        await saveStudent({
          ...student,
          syncStatus: 'synced',
          lastModified: Date.now(),
        });
      }

      for (const teacher of teachersRes.data.content || []) {
        await saveTeacher({
          ...teacher,
          syncStatus: 'synced',
          lastModified: Date.now(),
        });
      }

      for (const content of contentRes.data.content || []) {
        await saveContent({
          ...content,
          syncStatus: 'synced',
          lastModified: Date.now(),
        });
      }

      await setMetadata('lastPull', Date.now());
      await setMetadata(`lastPull-${schoolId}`, Date.now());
    } catch (error) {
      console.error('Failed to pull data:', error);
    }
  }

  async getStatus(): Promise<SyncStatus> {
    const pendingCount = await getPendingCount();
    const lastSyncMeta = await getMetadata('lastSync');
    const lastSync = lastSyncMeta?.value;

    return {
      status: this.syncing ? 'syncing' : 'idle',
      pendingCount,
      lastSync,
    };
  }
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  pendingCount?: number;
  lastSync?: number;
  error?: string;
}

export const syncEngine = new SyncEngine();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online - starting sync...');
    syncEngine.sync();
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline - will sync when connection returns');
  });
}
