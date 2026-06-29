'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, AuthResponse, SchoolInfo } from '@/types';
import { authApi, temporaryPermissionApi } from './api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  currentSchool: SchoolInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, schoolId?: string) => Promise<void>;
  mockLogin: (role: 'platform-admin' | 'admin' | 'teacher' | 'student' | 'parent') => void;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  selectSchool: (school: SchoolInfo) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasTemporaryPermission: (permission: string) => boolean;
  isPlatformAdmin: () => boolean;
  isAppAdmin: () => boolean;
  isGeneralAdmin: () => boolean;
  isStudent: () => boolean;
  isParent: () => boolean;
  isTeacher: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, User> = {
  'platform-admin': {
    id: 'u-admin',
    email: 'cstemagic@gmail.com',
    fullName: 'Platform Admin',
    platformRole: 'APP_ADMIN',
    schools: [],
  },
  admin: {
    id: 'u-gf-admin',
    email: 'cstemagic@gmail.com',
    fullName: 'Mrs. Folake Adeleke',
    platformRole: '',
    schools: [
      {
        id: 'sch1',
        name: 'Greenfield Academy',
        code: 'GFA001',
        roleName: 'ADMIN',
        permissions: [
          'student.read', 'student.create', 'student.update', 'student.delete', 'student.bulk.enroll',
          'student.grades.read', 'student.grades.manage', 'student.attendance.read', 'student.attendance.manage',
          'teacher.read', 'teacher.create', 'teacher.update', 'teacher.delete', 'teacher.assign.class',
          'class.read', 'class.create', 'class.update', 'class.delete',
          'cms.folder.read', 'cms.folder.create', 'cms.content.read', 'cms.content.approve', 'cms.content.publish',
          'fee.read', 'fee.create', 'fee.update', 'payment.read', 'payment.create', 'payment.gateway.manage', 'payment.gateway.switch',
          'analytics.academic.view', 'analytics.finance.view', 'school.read', 'school.update',
          'role.read', 'role.create', 'role.delete',
          'user.read', 'user.create',
          'product.create', 'cms.content.edit.any', 'subject.create', 'subject.update', 'subject.delete',
          'timetable.read', 'timetable.create', 'timetable.update', 'timetable.delete',
        ],
      },
    ],
  },
  teacher: {
    id: 'u-gf-teacher',
    email: 'teacher@greenfield.edu',
    fullName: 'Mr. John Okafor',
    platformRole: '',
    schools: [
      {
        id: 'sch1',
        name: 'Greenfield Academy',
        code: 'GFA001',
        roleName: 'TEACHER',
        permissions: [
          'student.read', 'student.grades.read', 'student.grades.manage',
          'student.attendance.read', 'student.attendance.manage',
          'class.read', 'cms.folder.read', 'cms.folder.create', 'cms.content.read', 'cms.content.create',
          'cms.content.edit', 'cms.content.delete', 'cms.content.submit', 'subject.read',
          'timetable.read', 'timetable.create', 'timetable.update', 'timetable.delete',
        ],
      },
    ],
  },
  student: {
    id: 'u-gf-student',
    email: 'ade.johnson@student.com',
    fullName: 'Ade Johnson',
    platformRole: '',
    studentId: 'stu-ade-001',
    schools: [
      {
        id: 'sch1',
        name: 'Greenfield Academy',
        code: 'GFA001',
        roleName: 'STUDENT',
        permissions: [
          'student.grades.read', 'student.attendance.read',
          'cms.content.read', 'fee.read', 'payment.read',
        ],
      },
    ],
  },
    parent: {
    id: 'u-parent-01',
    email: 'cstemagic@gmail.com',
    fullName: 'Mrs Johnson',
    platformRole: '',
    children: [
      { id: 'stu-ade-001', fullName: 'Ade Johnson', className: 'JSS 1A' },
      { id: 'stu-joy-002', fullName: 'Joy Johnson', className: 'JSS 2B' },
    ],
    schools: [
      {
        id: 'sch1',
        name: 'Greenfield Academy',
        code: 'GFA001',
        roleName: 'PARENT',
        permissions: ['fee.read', 'payment.read', 'student.grades.read', 'student.attendance.read'],
      },
    ],
  },
  'temp-admin-teacher': {
    id: 'u-gf-teacher-temp',
    email: 'teacher@greenfield.edu',
    fullName: 'Mr. John Okafor (Temp Admin)',
    platformRole: '',
    schools: [
      {
        id: 'sch1',
        name: 'Greenfield Academy',
        code: 'GFA001',
        roleName: 'TEACHER',
        permissions: [
          'student.read', 'student.grades.read', 'student.grades.manage',
          'student.attendance.read', 'student.attendance.manage',
          'class.read', 'cms.folder.read', 'cms.folder.create', 'cms.content.read', 'cms.content.create',
          'cms.content.edit', 'cms.content.delete', 'cms.content.submit', 'subject.read',
          'timetable.read', 'timetable.create', 'timetable.update', 'timetable.delete',
        ],
      },
    ],
  },
};

function getTokenExpiration(token: string): number | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentSchool, setCurrentSchool] = useState<SchoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [temporaryPermissions, setTemporaryPermissions] = useState<string[]>([]);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentSchool');
      setUser(null);
      setCurrentSchool(null);
      setTemporaryPermissions([]);
      router.push('/login');
    }
  }, [router]);

  const prevSchoolId = useRef<string | null>(null);
  const prevUserId = useRef<string | null>(null);

  // Fetch temporary permissions whenever user or school changes
  useEffect(() => {
    if (!user?.id || !currentSchool?.id) {
      setTemporaryPermissions([]);
      prevSchoolId.current = null;
      prevUserId.current = null;
      return;
    }

    // Avoid redundant calls if the IDs haven't changed
    if (prevSchoolId.current === currentSchool.id && prevUserId.current === user.id) {
      return;
    }

    prevSchoolId.current = currentSchool.id;
    prevUserId.current = user.id;

    temporaryPermissionApi.getUserPermissions(currentSchool.id, user.id)
      .then((res: any) => {
        const perms = (res.data || []).map((p: any) => p.permissionKey || p.permission);
        setTemporaryPermissions(perms);
      })
      .catch(() => {
        // silent — user may lack permission to view their own temp permissions
        setTemporaryPermissions([]);
      });
  }, [user?.id, currentSchool?.id]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedSchool = localStorage.getItem('currentSchool');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      const exp = getTokenExpiration(accessToken);
      if (exp && Date.now() >= exp) {
        logout();
      } else {
        setUser(JSON.parse(storedUser));
        if (storedSchool) {
          setCurrentSchool(JSON.parse(storedSchool));
        }
      }
    }
    setIsLoading(false);
  }, [logout]);

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const exp = getTokenExpiration(token);
      if (exp && Date.now() >= exp) {
        logout();
      }
    }, 30000); // check every 30 seconds

    return () => clearInterval(interval);
  }, [logout]);

  const login = async (email: string, password: string, schoolId?: string) => {
    // First login without schoolId to get user info and available schools
    const initialResponse = await authApi.login({ email, password });
    const initialData = initialResponse.data;

    // If user has schools and no schoolId was provided, re-login with first school
    const targetSchoolId = schoolId || (initialData.user.schools.length > 0 ? initialData.user.schools[0].id : undefined);

    if (targetSchoolId && !initialData.user.platformRole) {
      // Re-login with schoolId to get proper token with school permissions
      const response = await authApi.login({ email, password, schoolId: targetSchoolId });
      const data = response.data;

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      const selectedSchool = data.user.schools.find((s: SchoolInfo) => s.id === targetSchoolId);
      if (selectedSchool) {
        setCurrentSchool(selectedSchool);
        localStorage.setItem('currentSchool', JSON.stringify(selectedSchool));
      }
    } else {
      // Platform admin or no schools - use initial response
      localStorage.setItem('accessToken', initialData.accessToken);
      localStorage.setItem('refreshToken', initialData.refreshToken);
      localStorage.setItem('user', JSON.stringify(initialData.user));
      setUser(initialData.user);

      if (initialData.user.schools.length === 1) {
        setCurrentSchool(initialData.user.schools[0]);
        localStorage.setItem('currentSchool', JSON.stringify(initialData.user.schools[0]));
      }
    }
  };

  const mockLogin = (role: 'platform-admin' | 'admin' | 'teacher' | 'student' | 'parent') => {
    const mockUser = MOCK_USERS[role];
    const token = `mock-jwt-token-${role}`;

    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', `mock-refresh-${role}`);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);

    if (mockUser.schools.length > 0) {
      setCurrentSchool(mockUser.schools[0]);
      localStorage.setItem('currentSchool', JSON.stringify(mockUser.schools[0]));
    } else {
      setCurrentSchool(null);
      localStorage.removeItem('currentSchool');
    }

    router.push('/dashboard');
  };

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    const response = await authApi.register({ fullName, email, password, phone });
    const data = response.data;

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    setUser(data.user);
  };

  const selectSchool = async (school: SchoolInfo) => {
    try {
      // Call switch-school endpoint to get new token with school permissions
      const response = await authApi.switchSchool(school.id);
      const data = response.data;

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      // Get the updated school info with proper permissions from the response
      const updatedSchool = data.user.schools.find((s: SchoolInfo) => s.id === school.id) || school;
      setCurrentSchool(updatedSchool);
      localStorage.setItem('currentSchool', JSON.stringify(updatedSchool));
    } catch (error) {
      console.error('Failed to switch school:', error);
      // Fallback to just setting the school locally
      setCurrentSchool(school);
      localStorage.setItem('currentSchool', JSON.stringify(school));
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isPlatformAdmin()) return true;
    if (!currentSchool) return false;
    if (currentSchool.permissions.includes(permission)) return true;
    return temporaryPermissions.includes(permission);
  };

  const hasTemporaryPermission = (permission: string): boolean => {
    return temporaryPermissions.includes(permission);
  };

  const isPlatformAdmin = (): boolean => {
    return user?.platformRole === 'APP_ADMIN' || user?.platformRole === 'GENERAL_ADMIN';
  };

  const isAppAdmin = (): boolean => {
    return user?.platformRole === 'APP_ADMIN';
  };

  const isGeneralAdmin = (): boolean => {
    return user?.platformRole === 'GENERAL_ADMIN';
  };

  const isStudent = (): boolean => {
    return currentSchool?.roleName === 'STUDENT' || !!user?.studentId;
  };

  const isParent = (): boolean => {
    return currentSchool?.roleName === 'PARENT' || (!!user?.children && user.children.length > 0);
  };

  const isTeacher = (): boolean => {
    return currentSchool?.roleName === 'TEACHER';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentSchool,
        isLoading,
        isAuthenticated: !!user,
        login,
        mockLogin,
        register,
        logout,
        selectSchool,
        hasPermission,
        hasTemporaryPermission,
        isPlatformAdmin,
        isAppAdmin,
        isGeneralAdmin,
        isStudent,
        isParent,
        isTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
