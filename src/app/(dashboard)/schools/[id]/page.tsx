'use client';

import { useAuth } from '@/lib/auth';
import { schoolApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Globe,
  Shield,
  Users,
  CreditCard,
  BookOpen,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

type SchoolConfig = Record<string, any>;

interface SchoolDetail {
  id: string;
  name: string;
  subdomain?: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  status: string;
  config: SchoolConfig;
  createdAt: string;
  updatedAt: string;
  admin?: {
    fullName: string;
    email: string;
  };
}

export default function SchoolDetailPage() {
  const { isPlatformAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchool = async () => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await schoolApi.getOne(schoolId);
      setSchool(res.data as SchoolDetail);
    } catch {
      toast.error('Failed to load school details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchool();
  }, [schoolId]);

  if (!isPlatformAdmin()) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">School not found.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      INACTIVE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
  };

  const configEntries = Object.entries(school.config || {});

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/schools')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{school.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {school.code} {school.subdomain && `· ${school.subdomain}.schoolsaas.com`}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(school.status)}>{school.status}</Badge>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* School Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">School Name</p>
                    <p className="font-medium">{school.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Subdomain</p>
                    <p className="font-medium">{school.subdomain || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium">{school.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium">{school.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="font-medium">{school.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          {configEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-500" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {configEntries.map(([key, value]) => (
                    <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="font-medium text-sm">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3.5 h-3.5" /> Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <XCircle className="w-3.5 h-3.5" /> Disabled
                            </span>
                          )
                        ) : (
                          String(value ?? '-')
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* School Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-500" />
                School Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              {school.admin ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{school.admin.fullName}</p>
                      <p className="text-xs text-slate-500">Super Admin</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                    <Mail className="w-3 h-3" /> {school.admin.email}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No admin assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-400">Students</span>
                </div>
                <span className="font-bold text-blue-700 dark:text-blue-400">
                  {school.config?.totalStudents ?? '-'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-400">Teachers</span>
                </div>
                <span className="font-bold text-green-700 dark:text-green-400">
                  {school.config?.totalTeachers ?? '-'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-purple-700 dark:text-purple-400">Classes</span>
                </div>
                <span className="font-bold text-purple-700 dark:text-purple-400">
                  {school.config?.totalClasses ?? '-'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-700 dark:text-orange-400">Revenue</span>
                </div>
                <span className="font-bold text-orange-700 dark:text-orange-400">
                  ₦{(school.config?.totalRevenue ?? 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-medium">{formatDate(school.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(school.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
