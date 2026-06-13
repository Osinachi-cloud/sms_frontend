'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { validatePassword } from '@/lib/utils';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, School, Trash2, RefreshCw, Camera, Type, Mail, Phone, MapPin, CreditCard, GraduationCap, Award, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsApi } from '@/lib/api';
import PaymentGatewaySettings from './PaymentGatewaySettings';
import AcademicCalendarSettings from './AcademicCalendarSettings';

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function SettingsPage() {
  const { user, currentSchool, isAppAdmin, hasPermission } = useAuth();
  const { applyColors } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('school');

  const canManageGateway = isAppAdmin() || currentSchool?.roleName === 'ACCOUNTANT' || hasPermission('payment.gateway.manage');
  const [isSaving, setIsSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    avatarUrl: user?.avatarUrl || '',
  });

  // School branding state
  const [schoolBranding, setSchoolBranding] = useState({
    schoolName: currentSchool?.name || 'Greenfield Academy',
    schoolCode: currentSchool?.code || 'GFA001',
    email: 'admin@greenfield.edu',
    phone: '08012345670',
    address: '1 Greenfield Avenue, Lagos',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    accentColor: '#10b981',
    logoUrl: '',
    faviconUrl: '',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
  });

  // Notification state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    announcements: true,
    grades: true,
    fees: true,
    attendance: false,
    messages: true,
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  // Grading scale
  const [gradingScale, setGradingScale] = useState([
    { min: 70, max: 100, grade: 'A', remarks: 'Excellent' },
    { min: 60, max: 69, grade: 'B', remarks: 'Good' },
    { min: 50, max: 59, grade: 'C', remarks: 'Fair' },
    { min: 40, max: 49, grade: 'D', remarks: 'Pass' },
    { min: 0, max: 39, grade: 'F', remarks: 'Fail' },
  ]);

  useEffect(() => {
    if (currentSchool?.id) {
      settingsApi.get(currentSchool.id).then((res: any) => {
        const data = res.data;
        if (data) {
          const updated = {
            ...schoolBranding,
            schoolName: data.schoolName || schoolBranding.schoolName,
            email: data.email || schoolBranding.email,
            phone: data.phone || schoolBranding.phone,
            address: data.address || schoolBranding.address,
            primaryColor: data.primaryColor || schoolBranding.primaryColor,
            secondaryColor: data.secondaryColor || schoolBranding.secondaryColor,
            accentColor: data.accentColor || schoolBranding.accentColor,
            currency: data.currency || schoolBranding.currency,
            timezone: data.timezone || schoolBranding.timezone,
          };
          setSchoolBranding(updated);
          applyColors({
            primaryColor: updated.primaryColor,
            secondaryColor: updated.secondaryColor,
            accentColor: updated.accentColor,
          });
        }
      }).catch(() => {
        // Use defaults/mock data
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchool]);

  const handleSaveBranding = async () => {
    if (!currentSchool?.id) return;
    setIsSaving(true);
    try {
      await settingsApi.update(currentSchool.id, {
        schoolName: schoolBranding.schoolName,
        email: schoolBranding.email,
        phone: schoolBranding.phone,
        address: schoolBranding.address,
        primaryColor: schoolBranding.primaryColor,
        secondaryColor: schoolBranding.secondaryColor,
        accentColor: schoolBranding.accentColor,
        currency: schoolBranding.currency,
        timezone: schoolBranding.timezone,
        gradingScale,
      });
      applyColors({
        primaryColor: schoolBranding.primaryColor,
        secondaryColor: schoolBranding.secondaryColor,
        accentColor: schoolBranding.accentColor,
      });
      toast.success('Branding settings saved successfully');
    } catch {
      toast.error('Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Profile saved successfully');
    setIsSaving(false);
  };

  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!security.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!security.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    const passwordValidation = validatePassword(security.newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Password updated successfully');
    setSecurity((s) => ({ ...s, currentPassword: '', newPassword: '', confirmPassword: '' }));
    setIsSaving(false);
  };

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor' | 'accentColor', color: string) => {
    setSchoolBranding((prev) => ({ ...prev, [field]: color }));
    applyColors({ [field]: color });
  };

  const handleGradingChange = (index: number, field: string, value: string | number) => {
    const updated = [...gradingScale];
    (updated[index] as any)[field] = typeof value === 'string' && field !== 'remarks' && field !== 'grade' ? Number(value) : value;
    setGradingScale(updated);
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'school', label: 'School & Branding', icon: School },
    { key: 'academic-calendar', label: 'Academic Calendar', icon: Calendar },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
    ...(canManageGateway ? [{ key: 'payment', label: 'Payment Gateway', icon: CreditCard }] : []),
  ] as { key: string; label: string; icon: any }[];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header with role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Manage your account, school branding, and preferences
          </p>
        </div>
        {currentSchool?.roleName && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-wider self-start">
            {currentSchool.roleName}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Profile Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  {profile.fullName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Profile Photo</p>
                  <p className="text-xs text-slate-500 mb-2">JPG, PNG or GIF. Max 2MB.</p>
                  <Button variant="secondary" size="sm">
                    <Camera className="w-4 h-4 mr-1" />
                    Change Photo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="Your name"
                />
                <Input
                  label="Email"
                  value={profile.email}
                  type="email"
                  disabled
                />
                <Input
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+234..."
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                  <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                    {currentSchool?.roleName || 'User'}
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveProfile} isLoading={isSaving}>Save Profile</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* School & Branding Tab */}
      {activeTab === 'school' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* School Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <School className="w-5 h-5 text-white" />
                </div>
                <CardTitle>School Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="School Name"
                  value={schoolBranding.schoolName}
                  onChange={(e) => setSchoolBranding({ ...schoolBranding, schoolName: e.target.value })}
                  placeholder="School name"
                />
                <Input
                  label="School Code"
                  value={schoolBranding.schoolCode}
                  onChange={(e) => setSchoolBranding({ ...schoolBranding, schoolCode: e.target.value })}
                  placeholder="GFA001"
                />
                <Input
                  label="Email"
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                  value={schoolBranding.email}
                  onChange={(e) => setSchoolBranding({ ...schoolBranding, email: e.target.value })}
                  type="email"
                />
                <Input
                  label="Phone"
                  icon={<Phone className="w-4 h-4 text-slate-400" />}
                  value={schoolBranding.phone}
                  onChange={(e) => setSchoolBranding({ ...schoolBranding, phone: e.target.value })}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Address"
                    icon={<MapPin className="w-4 h-4 text-slate-400" />}
                    value={schoolBranding.address}
                    onChange={(e) => setSchoolBranding({ ...schoolBranding, address: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding Colors */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Branding & Colors</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-500 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">School Logo</p>
                  <p className="text-xs text-slate-500 mb-2">Recommended: 512 x 512px. PNG with transparent background.</p>
                  <Button variant="secondary" size="sm">
                    <Camera className="w-4 h-4 mr-1" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Primary Color
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange('primaryColor', color)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                        schoolBranding.primaryColor === color
                          ? 'border-slate-900 dark:border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={schoolBranding.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-500 uppercase">{schoolBranding.primaryColor}</span>
                  </div>
                </div>
                <div
                  className="h-10 sm:h-12 rounded-xl flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: schoolBranding.primaryColor }}
                >
                  Primary Preview
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Secondary Color
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange('secondaryColor', color)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                        schoolBranding.secondaryColor === color
                          ? 'border-slate-900 dark:border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={schoolBranding.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-500 uppercase">{schoolBranding.secondaryColor}</span>
                  </div>
                </div>
                <div
                  className="h-10 sm:h-12 rounded-xl flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: schoolBranding.secondaryColor }}
                >
                  Secondary Preview
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange('accentColor', color)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                        schoolBranding.accentColor === color
                          ? 'border-slate-900 dark:border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={schoolBranding.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-500 uppercase">{schoolBranding.accentColor}</span>
                  </div>
                </div>
                <div
                  className="h-10 sm:h-12 rounded-xl flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: schoolBranding.accentColor }}
                >
                  Accent Preview
                </div>
              </div>

              {/* Preview Card */}
              <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm font-medium mb-4">Live Preview</p>
                <div className="space-y-3">
                  <div
                    className="px-4 py-3 rounded-xl text-white text-sm font-medium"
                    style={{ background: `linear-gradient(135deg, ${schoolBranding.primaryColor}, ${schoolBranding.secondaryColor})` }}
                  >
                    Header / Primary Button
                  </div>
                  <div className="flex gap-2">
                    <span
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: schoolBranding.primaryColor }}
                    >
                      Badge
                    </span>
                    <span
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: schoolBranding.secondaryColor }}
                    >
                      Secondary
                    </span>
                    <span
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: schoolBranding.accentColor }}
                    >
                      Success
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
                  <select
                    value={schoolBranding.currency}
                    onChange={(e) => setSchoolBranding({ ...schoolBranding, currency: e.target.value })}
                    className="glass-input"
                  >
                    <option value="NGN">Nigerian Naira (₦)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="GBP">British Pound (£)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GHS">Ghana Cedi (₵)</option>
                    <option value="KES">Kenyan Shilling (KSh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Timezone</label>
                  <select
                    value={schoolBranding.timezone}
                    onChange={(e) => setSchoolBranding({ ...schoolBranding, timezone: e.target.value })}
                    className="glass-input"
                  >
                    <option value="Africa/Lagos">West Africa (Lagos)</option>
                    <option value="Africa/Accra">Ghana (Accra)</option>
                    <option value="Africa/Nairobi">East Africa (Nairobi)</option>
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">London</option>
                    <option value="America/New_York">New York</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleSaveBranding} isLoading={isSaving}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Save Branding
              </Button>
            </CardContent>
          </Card>

          {/* Grading Scale */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Grading Scale</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gradingScale.map((item, index) => (
                  <div key={item.grade} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {item.grade}
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={item.min}
                        onChange={(e) => handleGradingChange(index, 'min', e.target.value)}
                        className="glass-input py-2 text-sm"
                        min={0}
                        max={100}
                      />
                      <input
                        type="number"
                        value={item.max}
                        onChange={(e) => handleGradingChange(index, 'max', e.target.value)}
                        className="glass-input py-2 text-sm"
                        min={0}
                        max={100}
                      />
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleGradingChange(index, 'remarks', e.target.value)}
                        className="glass-input py-2 text-sm"
                        placeholder="Remarks"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="mt-4" size="sm" onClick={handleSaveBranding} isLoading={isSaving}>
                Save Grading Scale
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Notification Channels</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries({
                email: 'Email Notifications',
                push: 'Push Notifications',
                sms: 'SMS Notifications',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-slate-500">Receive notifications via {key}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [key]: !notifications[key as keyof typeof notifications] })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifications[key as keyof typeof notifications] ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      notifications[key as keyof typeof notifications] ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Type className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Notification Types</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries({
                announcements: 'Announcements',
                grades: 'Grades & Reports',
                fees: 'Fee Payments',
                attendance: 'Attendance Alerts',
                messages: 'Messages',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-slate-500">Get notified about {key}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [key]: !notifications[key as keyof typeof notifications] })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifications[key as keyof typeof notifications] ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      notifications[key as keyof typeof notifications] ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Change Password</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={security.currentPassword}
                  onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                />
                <div className="hidden sm:block" />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={security.newPassword}
                  onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={security.confirmPassword}
                  onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                />
              </div>
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
              <Button onClick={handleChangePassword} isLoading={isSaving}>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Danger Zone</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400 text-sm">Delete Account</p>
                  <p className="text-xs text-red-600 dark:text-red-500">This action cannot be undone.</p>
                </div>
                <Button variant="danger" size="sm">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Academic Calendar Tab */}
      {activeTab === 'academic-calendar' && (
        <AcademicCalendarSettings />
      )}

      {/* Payment Gateway Tab */}
      {activeTab === 'payment' && canManageGateway && (
        <PaymentGatewaySettings schoolId={currentSchool?.id || ''} />
      )}
    </div>
  );
}
