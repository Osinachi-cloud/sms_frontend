import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse } from '@/types';
import * as mockData from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const USE_MOCK_FALLBACK = true; // Set to false to disable mock data. DELETE THIS FILE SECTION BEFORE PROD.

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Helper to wrap API calls with mock fallback
const withMockFallback = <T>(apiCall: Promise<AxiosResponse<T>>, fallbackData: T): Promise<AxiosResponse<T>> => {
  if (!USE_MOCK_FALLBACK) return apiCall;
  return apiCall.catch((error) => {
    console.warn('API call failed, using mock data:', error?.config?.url || error?.message);
    return { data: fallbackData, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<T>;
  });
};

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
    withMockFallback(
      api.get('/api/admin/schools', { params }),
      { content: mockData.mockSchools, totalElements: mockData.mockSchools.length, totalPages: 1, size: 10, number: 0, first: true, last: true }
    ),

  getOne: (id: string) =>
    withMockFallback(
      api.get(`/api/admin/schools/${id}`),
      mockData.mockSchools.find((s) => s.id === id) || mockData.mockSchools[0]
    ),

  create: (data: any) => api.post('/api/admin/schools', data),

  update: (id: string, data: any) => api.put(`/api/admin/schools/${id}`, data),

  deactivate: (id: string) => api.put(`/api/admin/schools/${id}/deactivate`),

  reactivate: (id: string) => api.put(`/api/admin/schools/${id}/reactivate`),

  assignSuperAdmin: (schoolId: string, userId: string) =>
    api.post(`/api/admin/schools/${schoolId}/assign-super-admin`, { userId }),
};

export const roleApi = {
  getPermissions: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/permissions`),
      mockData.mockPermissions
    ),

  getPermissionsGrouped: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/permissions/grouped`),
      mockData.mockPermissionsGrouped
    ),

  getRoles: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/roles`),
      mockData.mockRoles
    ),

  createRole: (schoolId: string, data: { name: string; description?: string; permissions: string[] }) =>
    api.post(`/api/schools/${schoolId}/roles`, data),

  updateRole: (schoolId: string, roleId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/roles/${roleId}`, data),

  deleteRole: (schoolId: string, roleId: string) =>
    api.delete(`/api/schools/${schoolId}/roles/${roleId}`),
};

export const studentApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; search?: string; status?: string }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/students`, { params }),
      { content: mockData.mockStudents, totalElements: mockData.mockStudents.length, totalPages: 1, size: 10, number: 0, first: true, last: true }
    ),

  getOne: (schoolId: string, studentId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/students/${studentId}`),
      mockData.mockStudents.find((s) => s.id === studentId) || mockData.mockStudents[0]
    ),

  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/students`, data),

  update: (schoolId: string, studentId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/students/${studentId}`, data),

  delete: (schoolId: string, studentId: string) =>
    api.delete(`/api/schools/${schoolId}/students/${studentId}`),
};

export const teacherApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; search?: string; status?: string }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/teachers`, { params }),
      { content: mockData.mockTeachers, totalElements: mockData.mockTeachers.length, totalPages: 1, size: 10, number: 0, first: true, last: true }
    ),

  getOne: (schoolId: string, teacherId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/teachers/${teacherId}`),
      mockData.mockTeachers.find((t) => t.id === teacherId) || mockData.mockTeachers[0]
    ),

  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/teachers`, data),

  update: (schoolId: string, teacherId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/teachers/${teacherId}`, data),

  delete: (schoolId: string, teacherId: string) =>
    api.delete(`/api/schools/${schoolId}/teachers/${teacherId}`),
};

export const cmsApi = {
  getFolders: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/cms/folders`),
      mockData.mockCmsFolders
    ),

  createFolder: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/cms/folders`, data),

  getContent: (schoolId: string, params?: { page?: number; size?: number; status?: string }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/cms/content`, { params }),
      { content: mockData.mockCmsContent, totalElements: mockData.mockCmsContent.length, totalPages: 1, size: 10, number: 0, first: true, last: true }
    ),

  getPendingContent: (schoolId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/cms/content/pending`, { params }),
      { content: mockData.mockCmsContent.filter((c) => c.status === 'PENDING_APPROVAL') }
    ),

  getContentItem: (schoolId: string, contentId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/cms/content/${contentId}`),
      mockData.mockCmsContent.find((c) => c.id === contentId) || mockData.mockCmsContent[0]
    ),

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
    withMockFallback(
      api.get(`/api/schools/${schoolId}/payments`, { params }),
      { content: mockData.mockPayments, totalElements: mockData.mockPayments.length, totalPages: 1, size: 10, number: 0, first: true, last: true }
    ),

  initiate: (schoolId: string, data: { studentId: string; amount: number; studentFeeId?: string; callbackUrl?: string }) =>
    api.post(`/api/schools/${schoolId}/payments/initialize`, data),

  verify: (schoolId: string, reference: string) =>
    api.get(`/api/schools/${schoolId}/payments/verify/${reference}`),

  getStudentPayments: (schoolId: string, studentId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/payments/student/${studentId}`, { params }),
      { content: mockData.mockPayments.filter((p) => p.studentId === studentId) }
    ),
};

export const paymentGatewayApi = {
  getConfig: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/payment-gateway-config`),
      {
        id: 'pgc-1',
        schoolId,
        paystackPublicKey: 'pk_tes****test',
        flutterwavePublicKey: 'FLWPUBK_tes****test',
        activeGateway: 'PAYSTACK',
        fallbackEnabled: false,
        paystackEnabled: true,
        flutterwaveEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ),

  updateConfig: (schoolId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/payment-gateway-config`, data),
};

export const dashboardApi = {
  getSchoolStats: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/dashboard/stats`),
      mockData.mockDashboardStats
    ),

  getStudentDashboard: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/dashboard/student`),
      mockData.mockStudentDashboard
    ),

  getStudentDashboardById: (schoolId: string, studentId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/dashboard/student/${studentId}`),
      mockData.mockStudentDashboard
    ),

  getTeacherDashboard: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/dashboard/teacher`),
      mockData.mockTeacherDashboard
    ),

  getTeacherDashboardById: (schoolId: string, teacherId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/dashboard/teacher/${teacherId}`),
      mockData.mockTeacherDashboard
    ),
};

export const gradeApi = {
  getStudentGrades: (schoolId: string, studentId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/students/${studentId}/grades`),
      mockData.mockGrades.filter((g) => g.studentId === studentId)
    ),

  getStudentGradesByTerm: (schoolId: string, studentId: string, termId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/students/${studentId}/grades/term/${termId}`),
      mockData.mockGrades.filter((g) => g.studentId === studentId && g.termId === termId)
    ),
};

export const attendanceApi = {
  getStudentAttendance: (schoolId: string, studentId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/students/${studentId}/attendance`),
      []
    ),

  getStudentAttendanceSummary: (schoolId: string, studentId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/students/${studentId}/attendance/summary`),
      mockData.mockAttendanceSummary
    ),
};

export const onboardingApi = {
  getSteps: (page: string, role: string) =>
    withMockFallback(
      api.get('/api/onboarding/steps', { params: { page, role } }),
      [] as any
    ),
  completeStep: (stepKey: string) =>
    api.post(`/api/onboarding/steps/${stepKey}/complete`),
};

export const notificationApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get('/api/notifications', { params }),
      { content: mockData.mockNotifications, totalElements: mockData.mockNotifications.length }
    ),
  getUnread: () =>
    withMockFallback(
      api.get('/api/notifications/unread'),
      mockData.mockNotifications.filter((n) => !n.isRead)
    ),
  getCount: () =>
    withMockFallback(
      api.get('/api/notifications/count'),
      mockData.mockNotifications.filter((n) => !n.isRead).length
    ),
  markAsRead: (id: string) => api.post(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
};

export const announcementApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/announcements`, { params }),
      { content: mockData.mockAnnouncements }
    ),
  getActive: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/announcements/active`),
      mockData.mockAnnouncements
    ),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/announcements`, data),
};

export const eventApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/events`, { params }),
      { content: mockData.mockEvents }
    ),
  getUpcoming: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/events/upcoming`),
      mockData.mockEvents
    ),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/events`, data),
};

export const messageApi = {
  getConversations: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/messages/conversations`),
      mockData.mockConversations
    ),
  createConversation: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/messages/conversations`, data),
  getMessages: (conversationId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/any/messages/conversations/${conversationId}/messages`, { params }),
      { content: mockData.mockMessages }
    ),
  sendMessage: (conversationId: string, data: any) =>
    api.post(`/api/schools/any/messages/conversations/${conversationId}/messages`, data),
  markAsRead: (schoolId: string, conversationId: string) =>
    api.post(`/api/schools/${schoolId}/messages/conversations/${conversationId}/read`),
};

export const parentApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/parents`, { params }),
      { content: mockData.mockParents }
    ),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/parents`, data),
  getByStudent: (studentId: string) =>
    withMockFallback(
      api.get(`/api/schools/any/parents/student/${studentId}`),
      mockData.mockParents.filter((p) => p.students.some((s) => s.studentId === studentId))
    ),
};

export const quizApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/quizzes`, { params }),
      { content: mockData.mockQuizzes }
    ),
  getOne: (quizId: string) =>
    withMockFallback(
      api.get(`/api/schools/any/quizzes/${quizId}`),
      mockData.mockQuizzes.find((q) => q.id === quizId) || mockData.mockQuizzes[0]
    ),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/quizzes`, data),
  start: (quizId: string, studentId: string) =>
    withMockFallback(
      api.post(`/api/schools/any/quizzes/${quizId}/start`, { studentId }),
      mockData.mockQuizzes.find((q) => q.id === quizId) || mockData.mockQuizzes[0]
    ),
  submit: (quizId: string, data: any) =>
    withMockFallback(
      api.post(`/api/schools/any/quizzes/${quizId}/submit`, data),
      { score: 40, totalMarks: 50, percentage: 80, gradeLetter: 'A', answers: [] }
    ),
};

export const timetableApi = {
  getPeriods: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/timetable/periods`),
      mockData.mockTimetablePeriods
    ),
  createPeriod: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/timetable/periods`, data),
  getClassTimetable: (schoolId: string, classId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/timetable/classes/${classId}`),
      mockData.mockTimetableEntries.filter((e) => e.classId === classId)
    ),
  createEntry: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/timetable/entries`, data),
};

export const libraryApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/library/books`, { params }),
      { content: mockData.mockLibraryBooks }
    ),
  search: (schoolId: string, query: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/library/books/search`, { params: { query } }),
      mockData.mockLibraryBooks.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()))
    ),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/library/books`, data),
};

export const gamificationApi = {
  getBadges: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/gamification/badges`),
      mockData.mockBadges
    ),
  getLeaderboard: (schoolId: string, limit?: number) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/gamification/leaderboard`, { params: { limit } }),
      mockData.mockLeaderboard
    ),
  getUserPoints: (schoolId: string, userId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/gamification/users/${userId}/points`),
      980
    ),
};

export const admissionApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; status?: string }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/admissions`, { params }),
      { content: mockData.mockAdmissions }
    ),
  submit: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/admissions`, data),
  review: (applicationId: string, data: any) =>
    api.post(`/api/schools/any/admissions/${applicationId}/review`, data),
};

export const reportCardApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/report-cards`, { params }),
      { content: mockData.mockReportCards }
    ),
  getStudentCards: (studentId: string) =>
    withMockFallback(
      api.get(`/api/schools/any/report-cards/student/${studentId}`),
      mockData.mockReportCards
    ),
  generate: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/report-cards`, data),
};

export const idCardApi = {
  getTemplates: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/id-cards/templates`),
      [{ id: 'tmpl1', name: 'Standard Student ID', isDefault: true, isActive: true, createdAt: new Date().toISOString() }]
    ),
  createTemplate: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/id-cards/templates`, data),
  generate: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/id-cards/generate`, data),
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/id-cards`, { params }),
      { content: mockData.mockIdCards }
    ),
};

export const searchApi = {
  search: (schoolId: string, query: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/search`, { params: { q: query } }),
      mockData.mockSearchResults.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
    ),
};

export const analyticsApi = {
  getAcademic: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/analytics/academic`),
      mockData.mockAnalytics.academic
    ),
  getFinance: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/analytics/finance`),
      mockData.mockAnalytics.finance
    ),
  getAttendance: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/analytics/attendance`),
      mockData.mockAnalytics.attendance
    ),
};

export const deletionRequestApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    withMockFallback(
      api.get('/api/admin/deletion-requests', { params }),
      { content: mockData.mockDeletionRequests }
    ),
  approve: (id: string) =>
    api.post(`/api/admin/deletion-requests/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/api/admin/deletion-requests/${id}/reject`, { reason }),
};

export const settingsApi = {
  get: (schoolId: string) =>
    withMockFallback(
      api.get(`/api/schools/${schoolId}/settings`),
      mockData.mockSettings
    ),
  update: (schoolId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/settings`, data),
};

// ------------------------------------------------------------------
// Additional endpoints used directly by some pages (with mock fallback)
// DELETE BEFORE PRODUCTION
// ------------------------------------------------------------------

export const rawAnalyticsApi = {
  dashboard: (schoolId: string) =>
    withMockFallback(
      api.get(`/schools/${schoolId}/analytics/dashboard`),
      { totalStudents: 125, totalTeachers: 18, monthlyRevenue: 750000, contentCount: 42, revenueGrowth: 12 }
    ),
  revenueChart: (schoolId: string, months = 6) =>
    withMockFallback(
      api.get(`/schools/${schoolId}/analytics/revenue-chart?months=${months}`),
      mockData.mockAnalytics.finance.monthlyRevenue
    ),
  enrollmentTrend: (schoolId: string, months = 6) =>
    withMockFallback(
      api.get(`/schools/${schoolId}/analytics/enrollment-trend?months=${months}`),
      [
        { month: 'Jan', enrollments: 12 },
        { month: 'Feb', enrollments: 18 },
        { month: 'Mar', enrollments: 15 },
        { month: 'Apr', enrollments: 22 },
        { month: 'May', enrollments: 20 },
        { month: 'Jun', enrollments: 25 },
      ]
    ),
  genderDistribution: (schoolId: string) =>
    withMockFallback(
      api.get(`/schools/${schoolId}/analytics/gender-distribution`),
      { data: [{ name: 'Male', value: 58 }, { name: 'Female', value: 67 }] }
    ),
  classDistribution: (schoolId: string) =>
    withMockFallback(
      api.get(`/schools/${schoolId}/analytics/class-distribution`),
      [
        { className: 'JSS 1', students: 35 },
        { className: 'JSS 2', students: 32 },
        { className: 'SS 1', students: 30 },
        { className: 'SS 2', students: 28 },
      ]
    ),
};

export const rawCmsApi = {
  getFolders: (schoolId: string) =>
    withMockFallback(
      api.get(`/cms/folders?schoolId=${schoolId}`),
      { content: mockData.mockCmsFolders }
    ),
  getContent: (id: string) =>
    withMockFallback(
      api.get(`/cms/content/${id}`),
      { id, title: 'Sample Content', body: '<p>Sample body</p>', folderId: '', tags: [], status: 'DRAFT', isFeatured: false }
    ),
  getVersions: (id: string) =>
    withMockFallback(
      api.get(`/cms/content/${id}/versions`),
      { content: [] }
    ),
  saveContent: (id: string | null, payload: any) =>
    withMockFallback(
      id ? api.put(`/cms/content/${id}`, payload) : api.post('/cms/content', payload),
      { id: id || 'new-cms-id' }
    ),
  createVersion: (id: string, data: any) =>
    withMockFallback(
      api.post(`/cms/content/${id}/versions`, data),
      {}
    ),
  submitContent: (id: string) =>
    withMockFallback(
      api.put(`/cms/content/${id}/submit`),
      {}
    ),
  scheduleContent: (id: string, data: any) =>
    withMockFallback(
      api.post(`/cms/content/${id}/versions/schedule`, data),
      {}
    ),
  restoreVersion: (id: string, versionNumber: number) =>
    withMockFallback(
      api.post(`/cms/content/${id}/versions/${versionNumber}/restore`),
      {}
    ),
  toggleFeatured: (id: string, featured: boolean) =>
    withMockFallback(
      api.post(`/cms/content/${id}/versions/featured?featured=${featured}`),
      {}
    ),
};

export const rawDeletionRequestApi = {
  getAll: (tab: string) => {
    const endpoint = tab === 'all' ? '/admin/deletion-requests' : `/admin/deletion-requests/${tab}`;
    return withMockFallback(
      api.get(endpoint),
      { content: mockData.mockDeletionRequests.filter((d) => tab === 'all' || d.status.toLowerCase() === tab) }
    );
  },
  review: (id: string, data: any) =>
    withMockFallback(
      api.post(`/admin/deletion-requests/${id}/review`, data),
      {}
    ),
  forward: (id: string, data: any) =>
    withMockFallback(
      api.post(`/admin/deletion-requests/${id}/forward`, data),
      {}
    ),
  decide: (id: string, data: any) =>
    withMockFallback(
      api.post(`/admin/deletion-requests/${id}/decision`, data),
      {}
    ),
};

export const rawBulkEnrollApi = {
  preview: (schoolId: string, formData: FormData) =>
    withMockFallback(
      api.post(`/schools/${schoolId}/bulk-enroll/preview`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
      { headers: ['Name', 'Email', 'Class'], rows: [['Demo Student', 'demo@example.com', 'JSS 1']], totalRows: 1 }
    ),
  getFields: (schoolId: string) =>
    withMockFallback(
      api.get(`/schools/${schoolId}/bulk-enroll/fields`),
      [
        { key: 'fullName', label: 'Full Name', required: true },
        { key: 'email', label: 'Email', required: false },
        { key: 'className', label: 'Class', required: true },
      ]
    ),
  process: (schoolId: string, formData: FormData) =>
    withMockFallback(
      api.post(`/schools/${schoolId}/bulk-enroll/process`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
      { jobId: 'job-001' }
    ),
  getJob: (schoolId: string, jobId: string) =>
    withMockFallback(
      api.get(`/schools/${schoolId}/bulk-enroll/jobs/${jobId}`),
      { id: jobId, fileName: 'students.csv', status: 'COMPLETED', totalRows: 1, successfulRows: 1, failedRows: 0, errorLog: '', createdAt: new Date().toISOString(), completedAt: new Date().toISOString() }
    ),
};

export default api;