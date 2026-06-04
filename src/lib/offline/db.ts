import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SchoolSaasDB extends DBSchema {
  students: {
    key: string;
    value: {
      id: string;
      schoolId: string;
      fullName: string;
      email?: string;
      phone?: string;
      gender?: string;
      admissionNumber: string;
      classId?: string;
      status: string;
      syncStatus: 'synced' | 'pending' | 'error';
      lastModified: number;
    };
    indexes: { 'by-school': string; 'by-sync-status': string };
  };
  teachers: {
    key: string;
    value: {
      id: string;
      schoolId: string;
      fullName: string;
      email: string;
      phone?: string;
      department?: string;
      syncStatus: 'synced' | 'pending' | 'error';
      lastModified: number;
    };
    indexes: { 'by-school': string; 'by-sync-status': string };
  };
  content: {
    key: string;
    value: {
      id: string;
      schoolId: string;
      title: string;
      body: string;
      folderId?: string;
      status: string;
      syncStatus: 'synced' | 'pending' | 'error';
      lastModified: number;
    };
    indexes: { 'by-school': string; 'by-sync-status': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      entity: 'students' | 'teachers' | 'content';
      entityId: string;
      payload: any;
      timestamp: number;
      retries: number;
      error?: string;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      lastUpdated: number;
    };
  };
}

let db: IDBPDatabase<SchoolSaasDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<SchoolSaasDB>> {
  if (db) return db;

  db = await openDB<SchoolSaasDB>('school-saas-offline', 1, {
    upgrade(database) {
      const studentsStore = database.createObjectStore('students', { keyPath: 'id' });
      studentsStore.createIndex('by-school', 'schoolId');
      studentsStore.createIndex('by-sync-status', 'syncStatus');

      const teachersStore = database.createObjectStore('teachers', { keyPath: 'id' });
      teachersStore.createIndex('by-school', 'schoolId');
      teachersStore.createIndex('by-sync-status', 'syncStatus');

      const contentStore = database.createObjectStore('content', { keyPath: 'id' });
      contentStore.createIndex('by-school', 'schoolId');
      contentStore.createIndex('by-sync-status', 'syncStatus');

      database.createObjectStore('syncQueue', { keyPath: 'id' });
      database.createObjectStore('metadata', { keyPath: 'key' });
    },
  });

  return db;
}

export async function saveStudent(student: SchoolSaasDB['students']['value']) {
  const database = await getDB();
  await database.put('students', {
    ...student,
    lastModified: Date.now(),
  });
}

export async function getStudentsBySchool(schoolId: string) {
  const database = await getDB();
  return database.getAllFromIndex('students', 'by-school', schoolId);
}

export async function saveTeacher(teacher: SchoolSaasDB['teachers']['value']) {
  const database = await getDB();
  await database.put('teachers', {
    ...teacher,
    lastModified: Date.now(),
  });
}

export async function getTeachersBySchool(schoolId: string) {
  const database = await getDB();
  return database.getAllFromIndex('teachers', 'by-school', schoolId);
}

export async function saveContent(content: SchoolSaasDB['content']['value']) {
  const database = await getDB();
  await database.put('content', {
    ...content,
    lastModified: Date.now(),
  });
}

export async function getContentBySchool(schoolId: string) {
  const database = await getDB();
  return database.getAllFromIndex('content', 'by-school', schoolId);
}

export async function addToSyncQueue(
  action: 'create' | 'update' | 'delete',
  entity: 'students' | 'teachers' | 'content',
  entityId: string,
  payload: any
) {
  const database = await getDB();
  await database.add('syncQueue', {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    entity,
    entityId,
    payload,
    timestamp: Date.now(),
    retries: 0,
  });
}

export async function getSyncQueue() {
  const database = await getDB();
  return database.getAll('syncQueue');
}

export async function removeSyncQueueItem(id: string) {
  const database = await getDB();
  await database.delete('syncQueue', id);
}

export async function updateSyncQueueItem(item: SchoolSaasDB['syncQueue']['value']) {
  const database = await getDB();
  await database.put('syncQueue', item);
}

export async function getPendingCount() {
  const database = await getDB();
  const students = await database.getAllFromIndex('students', 'by-sync-status', 'pending');
  const teachers = await database.getAllFromIndex('teachers', 'by-sync-status', 'pending');
  const content = await database.getAllFromIndex('content', 'by-sync-status', 'pending');
  const queue = await database.getAll('syncQueue');
  return students.length + teachers.length + content.length + queue.length;
}

export async function setMetadata(key: string, value: any) {
  const database = await getDB();
  await database.put('metadata', { key, value, lastUpdated: Date.now() });
}

export async function getMetadata(key: string) {
  const database = await getDB();
  return database.get('metadata', key);
}

export async function clearAllData() {
  const database = await getDB();
  const tx = database.transaction(['students', 'teachers', 'content', 'syncQueue', 'metadata'], 'readwrite');
  await tx.objectStore('students').clear();
  await tx.objectStore('teachers').clear();
  await tx.objectStore('content').clear();
  await tx.objectStore('syncQueue').clear();
  await tx.objectStore('metadata').clear();
  await tx.done;
}
