import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081';

// Render free tier needs up to 60s to cold-start. Local dev stays snappy. Thank you Jesus
const isProduction = typeof window !== 'undefined'
  ? !window.location.hostname.includes('localhost')
  : API_BASE_URL !== 'http://localhost:8081';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: isProduction ? 60000 : 15000,
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

  forgotPassword: (data: { email: string }) =>
    api.post('/api/auth/forgot-password', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    api.post('/api/auth/verify-otp', data),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/api/auth/reset-password', data),
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
  getAll: (schoolId: string, params?: { page?: number; size?: number; search?: string; status?: string; classId?: string }) =>
    api.get(`/api/schools/${schoolId}/students`, { params }),

  getOne: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/students/${studentId}`),

  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/students`, data),

  update: (schoolId: string, studentId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/students/${studentId}`, data),

  delete: (schoolId: string, studentId: string) =>
    api.delete(`/api/schools/${schoolId}/students/${studentId}`),

  uploadPhoto: (schoolId: string, studentId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/api/schools/${schoolId}/students/${studentId}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
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

export const userApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; search?: string }) =>
    api.get(`/api/schools/${schoolId}/users`, { params }),

  create: (schoolId: string, data: { fullName: string; email: string; password: string; phone?: string; roleName: string }) =>
    api.post(`/api/schools/${schoolId}/users`, data),
};

export const uploadApi = {
  upload: (schoolId: string, file: File, category: string = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/schools/${schoolId}/uploads`, formData, {
      params: { category },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const cmsApi = {
  getFolders: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/cms/folders`, { params }),

  getFoldersBySubject: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/cms/folders/by-subject`),

  createFolder: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/cms/folders`, data),

  updateFolder: (schoolId: string, folderId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/cms/folders/${folderId}`, data),

  deleteFolder: (schoolId: string, folderId: string) =>
    api.delete(`/api/schools/${schoolId}/cms/folders/${folderId}`),

  getContent: (schoolId: string, params?: { page?: number; size?: number; status?: string; studentId?: string }) =>
    api.get(`/api/schools/${schoolId}/cms/content`, { params }),

  getContentByFolder: (schoolId: string, folderId: string, studentId?: string) =>
    api.get(`/api/schools/${schoolId}/cms/content/by-folder/${folderId}`, { params: { studentId } }),

  getPendingContent: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/cms/content/pending`, { params }),

  getContentItem: (schoolId: string, contentId: string, studentId?: string) =>
    api.get(`/api/schools/${schoolId}/cms/content/${contentId}`, { params: { studentId } }),

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

  uploadFile: (schoolId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/schools/${schoolId}/cms/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const paymentApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; status?: string }) =>
    api.get(`/api/schools/${schoolId}/payments`, { params }),

  initiate: (schoolId: string, data: { studentId: string; amount: number; studentFeeId?: string; currency?: string; callbackUrl?: string; description?: string }) =>
    api.post(`/api/schools/${schoolId}/payments/initialize`, data),

  record: (schoolId: string, data: { studentId: string; amount: number; studentFeeId?: string; currency?: string; paymentMethod?: string; description?: string }) =>
    api.post(`/api/schools/${schoolId}/payments/record`, data),

  verify: (schoolId: string, reference: string) =>
    api.get(`/api/schools/${schoolId}/payments/verify/${reference}`),

  getStudentPayments: (schoolId: string, studentId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/payments/student/${studentId}`, { params }),

  getParentViewOfStudentPayments: (schoolId: string, studentId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/payments/parent-view/${studentId}`, { params }),
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

export const gradebookApi = {
  getEntries: (schoolId: string, params?: {
    classId?: string;
    subjectId?: string;
    studentId?: string;
    termId?: string;
    sessionId?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => api.get(`/api/schools/${schoolId}/gradebook`, { params }),

  compute: (schoolId: string, classId?: string, subjectId?: string) =>
    api.get(`/api/schools/${schoolId}/gradebook/compute`, { params: { classId, subjectId } }),
};

export const attendanceApi = {
  // Student endpoints (new paths)
  getStudentAttendance: (schoolId: string, studentId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/api/schools/${schoolId}/attendance/students/${studentId}`, { params }),

  getStudentAttendanceSummary: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/attendance/students/${studentId}/summary`),

  // Class endpoints (teacher)
  getClassAttendance: (schoolId: string, classId: string, date: string) =>
    api.get(`/api/schools/${schoolId}/attendance/class/${classId}`, { params: { date } }),

  getClassReport: (schoolId: string, classId: string, params: { startDate: string; endDate: string }) =>
    api.get(`/api/schools/${schoolId}/attendance/class/${classId}/report`, { params }),

  mark: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/attendance/mark`, data),

  edit: (schoolId: string, attendanceId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/attendance/${attendanceId}`, data),

  // Parent endpoints
  getChildrenAttendance: (schoolId: string, parentId: string) =>
    api.get(`/api/schools/${schoolId}/attendance/parents/${parentId}/children`),

  // Bulk upload
  bulkUpload: (schoolId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/schools/${schoolId}/attendance/bulk-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  downloadTemplate: (schoolId: string, filename = 'attendance_template.xlsx') => {
    return api.get(`/api/schools/${schoolId}/attendance/template`, {
      responseType: 'blob',
    }).then((res) => {
      const blob = new Blob([res.data], { type: String(res.headers['content-type'] || 'application/octet-stream') });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  },
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
  getUnread: (params?: { page?: number; size?: number }) =>
    api.get('/api/notifications/unread', { params }),
  getCount: () => api.get('/api/notifications/count'),
  markAsRead: (id: string) => api.post(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
};

export const announcementApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/announcements`, { params }),
  getActive: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/announcements/active`, { params }),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/announcements`, data),
};

export const eventApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/events`, { params }),
  getUpcoming: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/events/upcoming`, { params }),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/events`, data),
};

export const messageApi = {
  getConversations: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/messages/conversations`, { params }),
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
  getByStudent: (schoolId: string, studentId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/parents/student/${studentId}`, { params }),
};

export const quizApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; studentId?: string }) =>
    api.get(`/api/schools/${schoolId}/quizzes`, { params }),
  getOne: (schoolId: string, quizId: string, studentId?: string) =>
    api.get(`/api/schools/${schoolId}/quizzes/${quizId}`, { params: studentId ? { studentId } : undefined }),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/quizzes`, data),
  update: (schoolId: string, quizId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/quizzes/${quizId}`, data),
  delete: (schoolId: string, quizId: string) =>
    api.delete(`/api/schools/${schoolId}/quizzes/${quizId}`),
  start: (schoolId: string, quizId: string, studentId: string) =>
    api.post(`/api/schools/${schoolId}/quizzes/${quizId}/start`, { studentId }),
  submit: (schoolId: string, quizId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/quizzes/${quizId}/submit`, data),
  getSubmissions: (schoolId: string, quizId: string) =>
    api.get(`/api/schools/${schoolId}/quizzes/${quizId}/submissions`),
  getParticipants: (schoolId: string, quizId: string, params?: { search?: string; status?: string; minScore?: number; maxScore?: number }) =>
    api.get(`/api/schools/${schoolId}/quizzes/${quizId}/participants`, { params }),
  getStudentHistory: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/quizzes/student/${studentId}/history`),
  toggleEnabled: (schoolId: string, quizId: string) =>
    api.post(`/api/schools/${schoolId}/quizzes/${quizId}/toggle`),
  releaseResults: (schoolId: string, quizId: string) =>
    api.post(`/api/schools/${schoolId}/quizzes/${quizId}/release-results`),
  addToGrades: (schoolId: string, quizId: string) =>
    api.post(`/api/schools/${schoolId}/quizzes/${quizId}/add-to-grades`),
};

export const assessmentApi = {
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/assessments`, data),
  list: (schoolId: string, params?: { teacherId?: string; search?: string; page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/assessments`, { params }),
  getOne: (schoolId: string, assessmentId: string) =>
    api.get(`/api/schools/${schoolId}/assessments/${assessmentId}`),
  update: (schoolId: string, assessmentId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/assessments/${assessmentId}`, data),
  delete: (schoolId: string, assessmentId: string) =>
    api.delete(`/api/schools/${schoolId}/assessments/${assessmentId}`),
  saveScores: (schoolId: string, assessmentId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/assessments/${assessmentId}/scores`, data),
  getScores: (schoolId: string, assessmentId: string) =>
    api.get(`/api/schools/${schoolId}/assessments/${assessmentId}/scores`),
  listAdmin: (schoolId: string, params?: { classId?: string; subjectId?: string; termId?: string }) =>
    api.get(`/api/schools/${schoolId}/assessments/admin`, { params }),
  getAvailable: (schoolId: string, params: { classId: string; subjectId: string; termId: string }) =>
    api.get(`/api/schools/${schoolId}/assessments/available`, { params }),
  saveGradingScheme: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/assessments/grading-scheme`, data),
  getGradingScheme: (schoolId: string, params: { classId: string; subjectId: string; termId: string }) =>
    api.get(`/api/schools/${schoolId}/assessments/grading-scheme`, { params }),
  computeGradedScores: (schoolId: string, params: { classId: string; subjectId: string; termId: string }) =>
    api.get(`/api/schools/${schoolId}/assessments/graded-scores`, { params }),
};

export const classApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number; search?: string }) =>
    api.get(`/api/schools/${schoolId}/classes`, { params }),
  getOne: (schoolId: string, classId: string) =>
    api.get(`/api/schools/${schoolId}/classes/${classId}`),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/classes`, data),
  update: (schoolId: string, classId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/classes/${classId}`, data),
  delete: (schoolId: string, classId: string) =>
    api.delete(`/api/schools/${schoolId}/classes/${classId}`),
};

export const timetableApi = {
  getPeriods: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/timetable/periods`, { params }),
  createPeriod: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/timetable/periods`, data),
  updatePeriod: (schoolId: string, periodId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/timetable/periods/${periodId}`, data),
  deletePeriod: (schoolId: string, periodId: string) =>
    api.delete(`/api/schools/${schoolId}/timetable/periods/${periodId}`),
  getClassTimetable: (schoolId: string, classId: string) =>
    api.get(`/api/schools/${schoolId}/timetable/classes/${classId}`),
  createEntry: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/timetable/entries`, data),
  updateEntry: (schoolId: string, entryId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/timetable/entries/${entryId}`, data),
  deleteEntry: (schoolId: string, entryId: string) =>
    api.delete(`/api/schools/${schoolId}/timetable/entries/${entryId}`),
};

export const libraryApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/library/books`, { params }),
  search: (schoolId: string, query: string) =>
    api.get(`/api/schools/${schoolId}/library/books/search`, { params: { query } }),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/library/books`, data),
  delete: (schoolId: string, bookId: string) =>
    api.delete(`/api/schools/${schoolId}/library/books/${bookId}`),
};

export const gamificationApi = {
  getBadges: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/gamification/badges`, { params }),
  getUserBadges: (schoolId: string, userId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/gamification/users/${userId}/badges`, { params }),
  getLeaderboard: (schoolId: string, limit?: number) =>
    api.get(`/api/schools/${schoolId}/gamification/leaderboard`, { params: { limit } }),
  getUserPoints: (schoolId: string, userId: string) =>
    api.get(`/api/schools/${schoolId}/gamification/users/${userId}/points`),
};

export const affectiveRatingApi = {
  getForStudent: (schoolId: string, studentId: string, termId: string, weekNumber?: number) =>
    api.get(`/api/schools/${schoolId}/affective-ratings/student/${studentId}`, { params: { termId, weekNumber } }),
  getForTerm: (schoolId: string, termId: string, weekNumber?: number) =>
    api.get(`/api/schools/${schoolId}/affective-ratings`, { params: { termId, weekNumber } }),
  saveForStudent: (schoolId: string, studentId: string, termId: string, weekNumber: number, ratings: any[]) =>
    api.post(`/api/schools/${schoolId}/affective-ratings/student/${studentId}?termId=${termId}&weekNumber=${weekNumber}`, ratings),
  delete: (schoolId: string, ratingId: string) =>
    api.delete(`/api/schools/${schoolId}/affective-ratings/${ratingId}`),
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
  getStudentCards: (studentId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/any/report-cards/student/${studentId}`, { params }),
  generate: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/report-cards`, data),
  getStudentReport: (schoolId: string, studentId: string, termId?: string) =>
    api.get(`/api/schools/${schoolId}/report-cards/student/${studentId}/report`, { params: { termId } }),
  downloadPdf: (schoolId: string, studentId: string, termId?: string) =>
    api.get(`/api/schools/${schoolId}/report-cards/student/${studentId}/pdf`, {
      params: { termId },
      responseType: 'blob',
    }),
  emailToParent: (schoolId: string, reportCardId: string) =>
    api.post(`/api/schools/${schoolId}/report-cards/${reportCardId}/email`),
  bulkEmailToParents: (schoolId: string, data: { classIds: string[]; termId: string }) =>
    api.post(`/api/schools/${schoolId}/report-cards/bulk-email`, data),
};

export const schoolSettingsApi = {
  get: (schoolId: string) => api.get(`/api/schools/${schoolId}/settings`),
  update: (schoolId: string, data: any) => api.put(`/api/schools/${schoolId}/settings`, data),
};

export const idCardApi = {
  getTemplates: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/id-cards/templates`, { params }),
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

export const enrollmentApi = {
  getStudentEnrollments: (schoolId: string, studentId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/enrollments/students/${studentId}`, { params }),
  getSubjectEnrollments: (schoolId: string, subjectId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/enrollments/subjects/${subjectId}`, { params }),
  enroll: (schoolId: string, studentId: string, subjectId: string) =>
    api.post(`/api/schools/${schoolId}/enrollments/students/${studentId}/subjects/${subjectId}`),
  pay: (schoolId: string, studentId: string, subjectId: string, callbackUrl?: string) =>
    api.post(`/api/schools/${schoolId}/enrollments/students/${studentId}/subjects/${subjectId}/pay`, { callbackUrl }),
  confirmPayment: (schoolId: string, studentId: string, subjectId: string, paymentId: string) =>
    api.post(`/api/schools/${schoolId}/enrollments/students/${studentId}/subjects/${subjectId}/confirm-payment`, { paymentId }),
  drop: (schoolId: string, enrollmentId: string) =>
    api.delete(`/api/schools/${schoolId}/enrollments/${enrollmentId}`),
};

export const temporaryPermissionApi = {
  getUserPermissions: (schoolId: string, userId: string) =>
    api.get(`/api/schools/${schoolId}/temporary-permissions/users/${userId}`),
  grant: (schoolId: string, userId: string, data: { permissionKey: string; expiresAt: string }) =>
    api.post(`/api/schools/${schoolId}/temporary-permissions/users/${userId}`, data),
  revoke: (schoolId: string, permissionId: string) =>
    api.delete(`/api/schools/${schoolId}/temporary-permissions/${permissionId}`),
};

export const courseContentApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/course-contents`, { params }),
  getBySubject: (schoolId: string, subjectId: string, studentId?: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/course-contents/subject/${subjectId}`, { params: { studentId, ...params } }),
  getByClass: (schoolId: string, classId: string, studentId?: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/course-contents/class/${classId}`, { params: { studentId, ...params } }),
  getByTeacher: (schoolId: string, teacherId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/course-contents/teacher/${teacherId}`, { params }),
  getOne: (schoolId: string, contentId: string, studentId?: string) =>
    api.get(`/api/schools/${schoolId}/course-contents/${contentId}`, { params: { studentId } }),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/course-contents`, data),
  update: (schoolId: string, contentId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/course-contents/${contentId}`, data),
  delete: (schoolId: string, contentId: string) =>
    api.delete(`/api/schools/${schoolId}/course-contents/${contentId}`),
};

export const subjectApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/subjects`, { params }),
  getForStudent: (schoolId: string, studentId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/subjects/student/${studentId}`, { params }),
  create: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/subjects`, data),
  update: (schoolId: string, subjectId: string, data: any) =>
    api.put(`/api/schools/${schoolId}/subjects/${subjectId}`, data),
  delete: (schoolId: string, subjectId: string) =>
    api.delete(`/api/schools/${schoolId}/subjects/${subjectId}`),
};

export const teacherAssignmentApi = {
  getByClass: (schoolId: string, classId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/teacher-assignments/classes/${classId}`, { params }),
  getByTeacher: (schoolId: string, teacherId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/teacher-assignments/teachers/${teacherId}`, { params }),
  getMyAssignments: (schoolId: string) =>
    api.get(`/api/schools/${schoolId}/teacher-assignments/me`),
  assign: (schoolId: string, data: any) =>
    api.post(`/api/schools/${schoolId}/teacher-assignments`, data),
  remove: (schoolId: string, assignmentId: string) =>
    api.delete(`/api/schools/${schoolId}/teacher-assignments/${assignmentId}`),
};

export const teacherStudentApi = {
  getStudents: (schoolId: string, teacherId: string, params?: { classId?: string; subjectId?: string; page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/teacher-students/teachers/${teacherId}`, { params }),

  getMyStudents: (schoolId: string, params?: { classId?: string; subjectId?: string; page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/teacher-students/me`, { params }),

  getMyStudentsWithParents: (schoolId: string, params?: { classId?: string; subjectId?: string; page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/teacher-students/me/with-parents`, { params }),

  getStudentParents: (schoolId: string, studentId: string) =>
    api.get(`/api/schools/${schoolId}/teacher-students/students/${studentId}/parents`),
};

const rawApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

export const rawCmsApi = {
  getFolders: (schoolId: string) => rawApi.get(`/api/schools/${schoolId}/cms/folders`),
  getContent: (schoolId: string, id: string) =>
    rawApi.get(`/api/schools/${schoolId}/cms/content/${id}`),
  getVersions: (contentId: string, params?: { page?: number; size?: number }) =>
    rawApi.get(`/api/cms/content/${contentId}/versions`, { params }),
  saveContent: (id: string | null, data: any) =>
    id
      ? rawApi.put(`/api/schools/${data.schoolId}/cms/content/${id}`, data)
      : rawApi.post(`/api/schools/${data.schoolId}/cms/content`, data),
  createVersion: (contentId: string, data: any) =>
    rawApi.post(`/api/cms/content/${contentId}/versions`, data),
  submitContent: (contentId: string) =>
    rawApi.put(`/api/cms/content/${contentId}/submit`),
  scheduleContent: (contentId: string, data: { publishAt: string }) =>
    rawApi.post(`/api/cms/content/${contentId}/versions/schedule`, data),
  restoreVersion: (contentId: string, versionNumber: number) =>
    rawApi.post(`/api/cms/content/${contentId}/versions/${versionNumber}/restore`),
  toggleFeatured: (contentId: string, featured: boolean) =>
    rawApi.post(`/api/cms/content/${contentId}/versions/featured`, null, {
      params: { featured },
    }),
};

export const rawDeletionRequestApi = {
  getAll: (params?: { page?: number; size?: number; status?: string }) =>
    rawApi.get('/api/admin/deletion-requests', { params }),

  review: (id: string, data: { approved: boolean; notes?: string }) =>
    rawApi.post(`/api/admin/deletion-requests/${id}/review`, data),

  forward: (id: string, data: { notes?: string }) =>
    rawApi.post(`/api/admin/deletion-requests/${id}/forward`, data),

  decide: (id: string, data: { approved: boolean; notes?: string }) =>
    rawApi.post(`/api/admin/deletion-requests/${id}/decide`, data),
};

export const rawAnalyticsApi = {
  dashboard: (schoolId: string) => rawApi.get(`/api/schools/${schoolId}/dashboard/stats`),
  revenueChart: (schoolId: string, months = 12) =>
    rawApi.get(`/api/schools/${schoolId}/analytics/revenue`, { params: { months } }),
  enrollmentTrend: (schoolId: string, months = 12) =>
    rawApi.get(`/api/schools/${schoolId}/analytics/enrollment`, { params: { months } }),
  genderDistribution: (schoolId: string) =>
    rawApi.get(`/api/schools/${schoolId}/analytics/gender`),
  classDistribution: (schoolId: string) =>
    rawApi.get(`/api/schools/${schoolId}/analytics/class`),
};

export const promotionApi = {
  getEligibleStudents: (schoolId: string, classId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/promotions/classes/${classId}`, { params }),
  promoteStudent: (schoolId: string, studentId: string, force = false) =>
    api.post(`/api/schools/${schoolId}/promotions/students/${studentId}?force=${force}`),
  promoteBatch: (schoolId: string, classId: string, studentIds: string[]) =>
    api.post(`/api/schools/${schoolId}/promotions/classes/${classId}/batch`, { studentIds }),
};

export const academicSessionApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/sessions`, { params }),
  getCurrent: (schoolId: string) => api.get(`/api/schools/${schoolId}/sessions/current`),
  create: (schoolId: string, data: any) => api.post(`/api/schools/${schoolId}/sessions`, data),
  update: (schoolId: string, sessionId: string, data: any) => api.put(`/api/schools/${schoolId}/sessions/${sessionId}`, data),
  delete: (schoolId: string, sessionId: string) => api.delete(`/api/schools/${schoolId}/sessions/${sessionId}`),
};

export const termApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/terms`, { params }),
  getCurrent: (schoolId: string) => api.get(`/api/schools/${schoolId}/terms/current`),
  getBySession: (schoolId: string, sessionId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/terms/session/${sessionId}`, { params }),
  create: (schoolId: string, data: any) => api.post(`/api/schools/${schoolId}/terms`, data),
  update: (schoolId: string, termId: string, data: any) => api.put(`/api/schools/${schoolId}/terms/${termId}`, data),
  delete: (schoolId: string, termId: string) => api.delete(`/api/schools/${schoolId}/terms/${termId}`),
};

export const holidayApi = {
  getAll: (schoolId: string, params?: { page?: number; size?: number }) =>
    api.get(`/api/schools/${schoolId}/holidays`, { params }),
  create: (schoolId: string, data: any) => api.post(`/api/schools/${schoolId}/holidays`, data),
  update: (schoolId: string, holidayId: string, data: any) => api.put(`/api/schools/${schoolId}/holidays/${holidayId}`, data),
  delete: (schoolId: string, holidayId: string) => api.delete(`/api/schools/${schoolId}/holidays/${holidayId}`),
  previewBulkUpload: (schoolId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/schools/${schoolId}/holidays/bulk-upload/preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  bulkUpload: (schoolId: string, holidays: any[]) => {
    return api.post(`/api/schools/${schoolId}/holidays/bulk-upload`, holidays);
  },
  downloadTemplate: (schoolId: string, filename = 'holiday_template.xlsx') => {
    return api.get(`/api/schools/${schoolId}/holidays/template`, {
      responseType: 'blob',
    }).then((res) => {
      const blob = new Blob([res.data], { type: String(res.headers['content-type'] || 'application/octet-stream') });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  },
};

export const emailApi = {
  broadcast: (schoolId: string, data: { recipients: string[]; subject: string; htmlBody: string }) =>
    api.post(`/api/schools/${schoolId}/email/broadcast`, data),
};

export default api;
