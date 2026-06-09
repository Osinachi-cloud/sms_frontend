import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<AuthResponse>(
          `${API_BASE_URL}/api/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { fullName: string; email: string; password: string; phone?: string }) =>
    api.post<AuthResponse>('/api/auth/register', data),

  login: (data: { email: string; password: string; schoolId?: string }) =>
    api.post<AuthResponse>('/api/auth/login', data),

  logout: () => api.post('/api/auth/logout'),

  switchSchool: (schoolId: string) =>
    api.post<AuthResponse>('/api/auth/switch-school', { schoolId }),
};

export const schoolApi = {
  getAll: (params?: { page?: number; size?: number; search?: string }) =>
    api.get('/api/admin/schools', { params }),

  getOne: (id: string) => api.get(`/api/admin/schools/${id}`),

  create: (data: any) => api.post('/api/admin/schools', data),

  update: (id: string, data: any) => api.put(`/api/admin/schools/${id}`, data),

  deactivate: (id: string) => api.put(`/api/admin/schools/${id}/deactivate`),

  reactivate: (id: string) => api.put(`/api/admin/schools/${id}/reactivate`),

  assignSuperAdmin: (schoolId: string, userId: string) =>
    api.post(`/api/admin/schools/${schoolId}/assign-super-admin`, { userId }),
};

export const roleApi = {
  getPermissions: (schoolId: string) => api.get(`/api/schools/${schoolId}/permissions`),

  getPermissionsGrouped: (schoolId: string) => api.get(`/api/schools/${schoolId}/permissions/grouped`),

  getRoles: (schoolId: string) => api.get(`/api/schools/${schoolId}/roles`),

  createRole: (schoolId: string, data: { name: string; description?: string; permissions: string[] }) =>
    api.post(`/api/schools/${schoolId}/roles`, data),

  updateRole: (schoolId: string, roleId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/roles/${roleId}`, data),

  deleteRole: (schoolId: string, roleId: string) =>
    api.delete(`/api/schools/${schoolId}/roles/${roleId}`),
};

export const studentApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; search?: string; status?: string }) =>
    api.get(`/api/schools/${schoolId}/students`, { params }),

  getOne: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/students/${studentId}`),

  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/students`, data),

  update: (schoolId: string, studentId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/students/${studentId}`, data),

  delete: (schoolId: string, studentId: string) =>
    api.delete(`/api/schools/${schoolId}/students/${studentId}`),
};

export const teacherApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; search?: string; status?: string }) =>
    api.get(`/api/schools/${schoolId}/teachers`, { params }),

  getOne: (schoolId: string, teacherId: string) =>
    api.get(`/api/schools/${schoolId}/teachers/${teacherId}`),

  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/teachers`, data),

  update: (schoolId: string, teacherId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/teachers/${teacherId}`, data),

  delete: (schoolId: string, teacherId: string) =>
    api.delete(`/api/schools/${schoolId}/teachers/${teacherId}`),
};

export const cmsApi = {
  getFolders: (schoolId: string) => api.get(`/api/schools/${schoolId}/cms/folders`),

  createFolder: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/cms/folders`, data),

  getContent: (schoolId: string, params?: { page?: number; size?: number; status?: string }) =>
    api.get(`/api/schools/${schoolId}/cms/content`, { params }),

  getPendingContent: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/cms/content/pending`, { params }),

  getContentItem: (schoolId: string, contentId: string) =>
    api.get(`/api/schools/${schoolId}/cms/content/${contentId}`),

  createContent: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/cms/content`, data),

  updateContent: (schoolId: string, contentId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/cms/content/${contentId}`, data),

  submitForApproval: (schoolId: string, contentId: string) =>
    api.put(`/api/schools/${schoolId}/cms/content/${contentId}/submit`),

  approveContent: (schoolId: string, contentId: string) =>
    api.put(`/api/schools/${schoolId}/cms/content/${contentId}/approve`),

  rejectContent: (schoolId: string, contentId: string, reason: string) =>
    api.put(`/api/schools/${schoolId}/cms/content/${contentId}/reject`, { reason }),

  deleteContent: (schoolId: string, contentId: string) =>
    api.delete(`/api/schools/${schoolId}/cms/content/${contentId}`),
};

export const paymentApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; status?: string }) =>
    api.get(`/api/schools/${schoolId}/payments`, { params }),

  initiate: (schoolId: string, data: { studentId: string; amount: number; studentFeeId?: string; callbackUrl?: string }) =>
    api.post(`/api/schools/${schoolId}/payments/initialize`, data),

  verify: (schoolId: string, reference: string) =>
    api.get(`/api/schools/${schoolId}/payments/verify/${reference}`),

  getStudentPayments: (schoolId: string, studentId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/payments/student/${studentId}`, { params }),
};

export const paymentGatewayApi = {
  getConfig: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/payment-gateway-config`),

  updateConfig: (schoolId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/payment-gateway-config`, data),
};

export const dashboardApi = {
  getSchoolStats: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/dashboard/stats`),

  getStudentDashboard: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/dashboard/student`),

  getStudentDashboardById: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/dashboard/student/${studentId}`),

  getTeacherDashboard: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/dashboard/teacher`),

  getTeacherDashboardById: (schoolId: string, teacherId: string) =>
    api.get(`/api/schools/${schoolId}/dashboard/teacher/${teacherId}`),
};

export const gradeApi = {
  getStudentGrades: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/students/${studentId}/grades`),

  getStudentGradesByTerm: (schoolId: string, studentId: string, termId: string) =>
    api.get(`/api/schools/${schoolId}/students/${studentId}/grades/term/${termId}`),
};

export const attendanceApi = {
  getStudentAttendance: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/students/${studentId}/attendance`),

  getStudentAttendanceSummary: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/students/${studentId}/attendance/summary`),
};

export const onboardingApi = {
  getSteps: (page: string, role: string) =>
    api.get('/api/onboarding/steps', { params: { page, role } }),
  completeStep: (stepKey: string) =>
    api.post(`/api/onboarding/steps/${stepKey}/complete`),
};

export const notificationApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    api.get('/api/notifications', { params }),
  getUnread: () => api.get('/api/notifications/unread'),
  getCount: () => api.get('/api/notifications/count'),
  markAsRead: (id: string) => api.post(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
};

export const announcementApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/announcements`, { params }),
  getActive: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/announcements/active`),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/announcements`, data),
};

export const eventApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/events`, { params }),
  getUpcoming: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/events/upcoming`),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/events`, data),
};

export const messageApi = {
  getConversations: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/messages/conversations`),
  createConversation: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/messages/conversations`, data),
  getMessages: (conversationId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/any/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId: string, data: any) =>
    api.post(`/api/schools/any/messages/conversations/${conversationId}/messages`, data),
  markAsRead: (schoolId: string, conversationId: string) =>
    api.post(`/api/schools/${schoolId}/messages/conversations/${conversationId}/read`),
};

export const parentApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/parents`, { params }),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/parents`, data),
  getByStudent: (studentId: string) =>
    api.get(`/api/schools/any/parents/student/${studentId}`),
};

export const quizApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/quizzes`, { params }),
  getOne: (quizId: string) =>
    api.get(`/api/schools/any/quizzes/${quizId}`),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/quizzes`, data),
  start: (quizId: string, studentId: string) =>
    api.post(`/api/schools/any/quizzes/${quizId}/start`, { studentId }),
  submit: (quizId: string, data: any) =>
    api.post(`/api/schools/any/quizzes/${quizId}/submit`, data),
};

export const timetableApi = {
  getPeriods: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/timetable/periods`),
  createPeriod: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/timetable/periods`, data),
  getClassTimetable: (schoolId: string, classId: string) =>
    api.get(`/api/schools/${schoolId}/timetable/classes/${classId}`),
  createEntry: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/timetable/entries`, data),
};

export const libraryApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/library/books`, { params }),
  search: (schoolId: string, query: string) =>
    api.get(`/api/schools/${schoolId}/library/books/search`, { params: { query } }),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/library/books`, data),
};

export const gamificationApi = {
  getBadges: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/gamification/badges`),
  getLeaderboard: (schoolId: string, limit?: number) =>
    api.get(`/api/schools/${schoolId}/gamification/leaderboard`, { params: { limit } }),
  getUserPoints: (schoolId: string, userId: string) =>
    api.get(`/api/schools/${schoolId}/gamification/users/${userId}/points`),
};

export const admissionApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; status?: string }) =>
    api.get(`/api/schools/${schoolId}/admissions`, { params }),
  submit: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/admissions`, data),
  review: (applicationId: string, data: any) =>
    api.post(`/api/schools/any/admissions/${applicationId}/review`, data),
};

export const reportCardApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/report-cards`, { params }),
  getStudentCards: (studentId: string) =>
    api.get(`/api/schools/any/report-cards/student/${studentId}`),
  generate: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/report-cards`, data),
};

export const idCardApi = {
  getTemplates: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/id-cards/templates`),
  createTemplate: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/id-cards/templates`, data),
  generate: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/id-cards/generate`, data),
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/id-cards`, { params }),
};

export const searchApi = {
  search: (schoolId: string, query: string) =>
    api.get(`/api/schools/${schoolId}/search`, { params: { q: query } }),
};

export const analyticsApi = {
  getAcademic: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/analytics/academic`),
  getFinance: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/analytics/finance`),
  getAttendance: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/analytics/attendance`),
};

export const deletionRequestApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    api.get('/api/admin/deletion-requests', { params }),
  approve: (id: string) =>
    api.post(`/api/admin/deletion-requests/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/api/admin/deletion-requests/${id}/reject`, { reason }),
};

export const settingsApi = {
  get: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/settings`),
  update: (schoolId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/settings`, data),
};

const rawApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

rawApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const rawBulkEnrollApi = {
  preview: (schoolId: string, formData: FormData) =>
    rawApi.post(`/api/schools/${schoolId}/bulk-enroll/preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getFields: (schoolId: string) =>
    rawApi.get(`/api/schools/${schoolId}/bulk-enroll/fields`),

  process: (schoolId: string, formData: FormData) =>
    rawApi.post(`/api/schools/${schoolId}/bulk-enroll/process`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getJob: (schoolId: string, jobId: string) =>
    rawApi.get(`/api/schools/${schoolId}/bulk-enroll/jobs/${jobId}`),
};

export default api;
