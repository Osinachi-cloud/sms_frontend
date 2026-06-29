'use client';

import { useTheme } from '@/lib/theme';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/landing/LandingNavbar';
import AliSimbiLogo from '@/components/landing/AliSimbiLogo';
import {
  Shield,
  ArrowRight,
  Users,
  GraduationCap,
  CreditCard,
  BarChart3,
  Globe,
  BookOpen,
  Zap,
  Lock,
  CheckCircle2,
  Star,
  Sparkles,
  HeartHandshake,
  Clock,
  CalendarDays,
  LayoutDashboard,
  School,
  FileText,
  ClipboardList,
  Wallet,
  Settings,
  Bell,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  UserCheck,
  MessageSquare,
  Award,
} from 'lucide-react';

/* ───────────────────── Feature Mockup Components ───────────────────── */

function DashboardMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">Dashboard</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          { label: 'Students', val: '1,247', color: 'bg-blue-500', icon: Users },
          { label: 'Teachers', val: '84', color: 'bg-green-500', icon: GraduationCap },
          { label: 'Revenue', val: '₦4.2M', color: 'bg-purple-500', icon: CreditCard },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
            <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{s.val}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="px-4 pb-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Revenue Trend</span>
            <span className="text-[10px] text-emerald-500 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +12%</span>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {[35,55,42,68,52,78,65,88,72,95,80,92].map((h,i)=> (
              <div key={i} className="flex-1 bg-gradient-to-t from-primary-500 to-primary-300 rounded-sm opacity-80" style={{height:`${h}%`}} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendanceMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><UserCheck className="w-4 h-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Attendance</span>
        </div>
        <span className="text-[10px] text-white/80 bg-white/20 px-2 py-0.5 rounded-full">JSS 1A</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[{l:'Present',v:'32',c:'bg-emerald-500'},{l:'Absent',v:'3',c:'bg-red-500'},{l:'Late',v:'2',c:'bg-amber-500'}].map(x=> (
            <div key={x.l} className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-2">
              <p className={`text-lg font-bold ${x.c.replace('bg-','text-')}`}>{x.v}</p>
              <p className="text-[10px] text-slate-500">{x.l}</p>
            </div>
          ))}
        </div>
        {/* Student rows */}
        <div className="space-y-1.5">
          {['Ade Johnson','Chioma Nwosu','Emeka Okafor','Fatima Bello'].map((name,i)=> (
            <div key={name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {name.split(' ').map(n=>n[0]).join('')}
                </div>
                <span className="text-xs text-slate-700 dark:text-slate300">{name}</span>
              </div>
              <div className="flex gap-1">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${i===1?'bg-red-100 text-red-600':i===2?'bg-amber-100 text-amber-600':'bg-emerald-100 text-emerald-600'}`}>
                  {i===1?<X className="w-3 h-3"/>:i===2?<Clock className="w-3 h-3"/>:<Check className="w-3 h-3"/>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Analytics</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 mb-1">Avg. Score</p>
            <div className="flex items-end gap-2">
              <p className="text-xl font-bold text-slate-900 dark:text-white">76%</p>
              <span className="text-[10px] text-emerald-500 mb-0.5">+5%</span>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 mb-1">Pass Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-xl font-bold text-slate-900 dark:text-white">92%</p>
              <span className="text-[10px] text-emerald-500 mb-0.5">+2%</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mb-2">Performance by Subject</p>
          {[
            {s:'Mathematics',p:82,c:'bg-blue-500'},
            {s:'English',p:76,c:'bg-emerald-500'},
            {s:'Science',p:88,c:'bg-purple-500'},
            {s:'History',p:64,c:'bg-amber-500'},
          ].map(sub=> (
            <div key={sub.s} className="flex items-center gap-2 mb-2 last:mb-0">
              <span className="text-[10px] text-slate-500 w-16 truncate">{sub.s}</span>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${sub.c} rounded-full`} style={{width:`${sub.p}%`}} />
              </div>
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 w-6 text-right">{sub.p}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ParentPortalMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Parent Portal</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Child card */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 text-white text-sm font-bold flex items-center justify-center">AJ</div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Ade Johnson</p>
            <p className="text-[10px] text-slate-500">JSS 1A • Admission: 2023/001</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-bold text-emerald-500">96%</p>
            <p className="text-[10px] text-slate-500">Average</p>
          </div>
        </div>
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2">
          {[{l:'Fees Due',v:'₦45,000',i:Wallet},{l:'Attendance',v:'95%',i:UserCheck}].map(x=> (
            <div key={x.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center"><x.i className="w-3.5 h-3.5 text-primary-600" /></div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{x.v}</p>
                <p className="text-[9px] text-slate-500">{x.l}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Recent grades */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mb-2">Recent Grades</p>
          {[
            {s:'Mathematics',g:'A',c:'text-emerald-500'},
            {s:'English Language',g:'B',c:'text-blue-500'},
            {s:'Basic Science',g:'A',c:'text-emerald-500'},
          ].map(gr=> (
            <div key={gr.s} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <span className="text-[10px] text-slate-600 dark:text-slate-300">{gr.s}</span>
              <span className={`text-xs font-bold ${gr.c}`}>{gr.g}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentFeatureMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><BookOpen className="w-4 h-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Content</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Subject folders */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Mathematics</p>
          {['Week 1 - Introduction','Week 2 - Algebra Basics','Week 3 - Geometry'].map((f,i)=> (
            <div key={f} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${i===2?'bg-purple-100 text-purple-600':'bg-primary-100 text-primary-600'}`}>
                {i===2?<FileText className="w-3.5 h-3.5" />:<School className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">{f}</span>
              <span className="text-[9px] text-slate-400">{i===2?'PDF':'3 items'}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">English</p>
          {['Term 1 Notes','Essay Writing Guide'].map((f,i)=> (
            <div key={f} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center"><School className="w-3.5 h-3.5" /></div>
              <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">{f}</span>
              <span className="text-[9px] text-slate-400">{i===0?'5 items':'Video'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RolesMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Settings className="w-4 h-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Roles & Permissions</span>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        {[
          {role:'Admin',color:'bg-purple-500',perms:['All Access','User Management','Settings']},
          {role:'Teacher',color:'bg-blue-500',perms:['Gradebook','Attendance','Content']},
          {role:'Parent',color:'bg-emerald-500',perms:['View Grades','Pay Fees','Messages']},
          {role:'Student',color:'bg-amber-500',perms:['View Content','Take Quizzes','Results']},
        ].map((r)=> (
          <div key={r.role} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 ${r.color} rounded-lg flex items-center justify-center`}>
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.role}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {r.perms.map(p=> (
                <span key={p} className="text-[9px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600">{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Wallet className="w-4 h-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Payments</span>
        </div>
        <span className="text-[10px] text-white/80 bg-white/20 px-2 py-0.5 rounded-full">Term 1 2025</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[{l:'Total Due',v:'₦120K',c:'text-red-500'},{l:'Paid',v:'₦85K',c:'text-emerald-500'},{l:'Balance',v:'₦35K',c:'text-amber-500'}].map(x=> (
            <div key={x.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg py-2 text-center">
              <p className={`text-sm font-bold ${x.c}`}>{x.v}</p>
              <p className="text-[9px] text-slate-500">{x.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mb-2">Recent Transactions</p>
          {[
            {d:'School Fees - Term 1',a:'₦45,000',s:'success'},
            {d:'PTA Levy',a:'₦5,000',s:'success'},
            {d:'Sports Wear',a:'₦8,500',s:'pending'},
          ].map((tx,i)=> (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <span className="text-xs text-slate-700 dark:text-slate-300">{tx.d}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-900 dark:text-white">{tx.a}</span>
                <div className={`w-2 h-2 rounded-full ${tx.s==='success'?'bg-emerald-500':'bg-amber-500'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimetableMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><CalendarDays className="w-4 h-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Timetable</span>
        </div>
        <span className="text-[10px] text-white/80 bg-white/20 px-2 py-0.5 rounded-full">JSS 1A</span>
      </div>
      <div className="p-4 space-y-2.5">
        {/* Time slots */}
        {[
          {t:'8:00 - 9:00',s:'Mathematics',r:'Room 101',c:'bg-blue-500'},
          {t:'9:00 - 10:00',s:'English Language',r:'Room 102',c:'bg-emerald-500'},
          {t:'10:00 - 10:30',s:'Break',r:'-',c:'bg-slate-300'},
          {t:'10:30 - 11:30',s:'Basic Science',r:'Lab A',c:'bg-purple-500'},
          {t:'11:30 - 12:30',s:'History',r:'Room 103',c:'bg-amber-500'},
        ].map((slot,i)=> (
          <div key={i} className={`flex items-center gap-3 rounded-xl p-2.5 ${slot.s==='Break'?'bg-slate-50 dark:bg-slate-800/50':'bg-slate-50 dark:bg-slate-800'}`}>
            <div className="w-14 text-[9px] text-slate-500 font-medium leading-tight">{slot.t}</div>
            <div className={`w-1 h-6 rounded-full ${slot.c}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${slot.s==='Break'?'text-slate-400':'text-slate-900 dark:text-white'}`}>{slot.s}</p>
              {slot.r!=='-' && <p className="text-[9px] text-slate-400">{slot.r}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────── Data Arrays ───────────────────── */

const stats = [
  { value: '50+', label: 'Partner Schools' },
  { value: '12K+', label: 'Students Managed' },
  { value: '850+', label: 'Active Teachers' },
  { value: '99.9%', label: 'Uptime' },
];

const values = [
  { icon: HeartHandshake, title: 'Built for Educators', desc: 'Designed alongside school administrators and teachers to solve real operational challenges.' },
  { icon: Shield, title: 'Security First', desc: 'Enterprise-grade security with role-based access controls, data encryption, and compliance.' },
  { icon: Globe, title: 'Multi-Branch Ready', desc: 'Manage one school or a hundred from a single dashboard with complete data isolation.' },
  { icon: Zap, title: 'Always Evolving', desc: 'Continuous updates driven by feedback from schools across Africa and beyond.' },
];

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'A unified command center with real-time stats on students, revenue, and school operations at a glance.',
    gradient: 'from-primary-600 to-purple-600',
    mockup: DashboardMockup,
  },
  {
    icon: UserCheck,
    title: 'Attendance',
    desc: 'Mark class attendance in seconds with visual status indicators and automated summary reports.',
    gradient: 'from-emerald-600 to-teal-600',
    mockup: AttendanceMockup,
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Track academic performance trends, class averages, and subject-wise results with beautiful charts.',
    gradient: 'from-indigo-600 to-blue-600',
    mockup: AnalyticsMockup,
  },
  {
    icon: Users,
    title: 'Parent Portal',
    desc: 'Parents get secure access to their child\'s grades, attendance, fees, and school announcements.',
    gradient: 'from-pink-600 to-rose-600',
    mockup: ParentPortalMockup,
  },
  {
    icon: BookOpen,
    title: 'Content',
    desc: 'Organize lesson notes, PDFs, and videos into subject folders. Target specific classes with each upload.',
    gradient: 'from-violet-600 to-purple-600',
    mockup: ContentFeatureMockup,
  },
  {
    icon: Settings,
    title: 'Roles & Access',
    desc: 'Granular role-based permissions for admins, teachers, students, parents, and accountants.',
    gradient: 'from-orange-600 to-amber-600',
    mockup: RolesMockup,
  },
  {
    icon: Wallet,
    title: 'Payments',
    desc: 'Automated fee invoicing, online payments via multiple gateways, and real-time financial tracking.',
    gradient: 'from-cyan-600 to-blue-600',
    mockup: PaymentsMockup,
  },
  {
    icon: CalendarDays,
    title: 'Timetable',
    desc: 'Beautifully structured class schedules with room assignments, teacher slots, and break periods.',
    gradient: 'from-rose-600 to-pink-600',
    mockup: TimetableMockup,
  },
];

const moreCapabilities = [
  { icon: ClipboardList, title: 'CBT & Quizzes', desc: 'Create computer-based tests with automatic grading and instant result delivery.' },
  { icon: FileText, title: 'Report Cards', desc: 'Generate beautiful termly report cards with one click, complete with grades and remarks.' },
  { icon: Award, title: 'Gamification', desc: 'Award badges and points to students to boost motivation and healthy competition.' },
  { icon: MessageSquare, title: 'Messaging', desc: 'Built-in messaging between teachers, parents, and admins with read receipts.' },
  { icon: Bell, title: 'Notifications', desc: 'Push and email notifications for fees, results, events, and announcements.' },
  { icon: School, title: 'Multi-School', desc: 'Platform admin can onboard and manage multiple schools from one super dashboard.' },
];

/* ───────────────────── Main Page ───────────────────── */

export default function AboutPage() {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-500">
      <LandingNavbar />

      {/* ========== HERO ========== */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 lg:px-12 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              About Ali &amp; Simbi
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              School management,
              <span className="block text-primary-600 dark:text-primary-400 mt-1">reinvented.</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
              We built Ali &amp; Simbi because schools deserve modern tools.
              From enrollment to graduation, fee collection to report cards,
              everything your school needs in one beautifully simple platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-2xl hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all">
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                View Demo
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
            <div className="relative h-[420px] lg:h-[480px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/10 to-emerald-500/10 rounded-3xl" />
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-4 left-4 w-56 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
                  <div><p className="text-sm font-semibold text-slate-900 dark:text-white">Students</p><p className="text-xs text-slate-500">1,247 enrolled</p></div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" /></div>
              </motion.div>
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute top-24 right-4 w-56 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center"><CreditCard className="w-5 h-5 text-white" /></div>
                  <div><p className="text-sm font-semibold text-slate-900 dark:text-white">Revenue</p><p className="text-xs text-slate-500">&#8358;4.2M this term</p></div>
                </div>
                <div className="flex gap-1 h-10 items-end">
                  {[40,65,45,80,60,95,75].map((h,i)=><div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/50 to-emerald-400/20 rounded-sm" style={{height:`${h}%`}} />)}
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="absolute bottom-8 left-12 w-52 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                  <div><p className="text-sm font-semibold text-slate-900 dark:text-white">Ade Johnson</p><p className="text-xs text-slate-500">JSS 1A — 96%</p></div>
                </div>
                <div className="flex gap-1">{[1,2,3,4,5].map(s=><Star key={s} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />)}</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="border-y border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat,i)=> (
              <motion.div key={stat.label} initial={{ opacity: 0, y:20 }} whileInView={{ opacity: 1, y:0 }} viewport={{ once: true }} transition={{ delay: i*0.1 }} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CORE FEATURES SHOWCASE ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <motion.div initial={{ opacity: 0, y:20 }} whileInView={{ opacity: 1, y:0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See what Ali &amp; Simbi can do</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Every feature is designed to save time, reduce workload, and give every stakeholder the right information.
          </p>
        </motion.div>

        <div className="space-y-24">
          {features.map((feat,i)=> {
            const isEven = i % 2 === 0;
            const Mockup = feat.mockup;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6 }}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${isEven?'':'lg:grid-flow-dense'}`}
              >
                {/* Text */}
                <div className={isEven?'':'lg:col-start-2'}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${feat.gradient} bg-clip-text text-transparent border border-slate-100 dark:border-white/10 mb-5`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feat.gradient} flex items-center justify-center`}>
                      <feat.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{feat.title}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">{feat.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{feat.desc}</p>
                  <div className="space-y-3">
                    {[
                      'Intuitive, modern interface built for speed',
                      'Works on mobile, tablet, and desktop',
                      'Real-time updates across all users',
                    ].map((item,idx)=> (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${feat.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Mockup */}
                <div className={isEven?'':'lg:col-start-1 lg:row-start-1'}>
                  <div className="relative group">
                    {/* Glow behind */}
                    <div className={`absolute -inset-4 bg-gradient-to-r ${feat.gradient} opacity-10 blur-2xl rounded-3xl group-hover:opacity-20 transition-opacity`} />
                    <div className="relative">
                      <Mockup />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========== MORE CAPABILITIES GRID ========== */}
      <section className="bg-slate-50/50 dark:bg-white/[0.02] py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y:20 }} whileInView={{ opacity: 1, y:0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">And so much more</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              We did not stop at the basics. Here are more powerful features your school will love.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moreCapabilities.map((cap,i)=> (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <cap.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-base font-semibold mb-2">{cap.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== VALUES ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <motion.div initial={{ opacity: 0, y:20 }} whileInView={{ opacity: 1, y:0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What drives us</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Four principles that shape every feature, design decision, and update we ship.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v,i)=> (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg dark:hover:shadow-none transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                <v.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========== SECURITY ========== */}
      <section className="bg-slate-50/50 dark:bg-white/[0.02] py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Your data is safe with us</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                We understand that school data is sensitive. That&apos;s why security is built into every layer of Ali &amp; Simbi, not bolted on as an afterthought.
              </p>
              <div className="space-y-4">
                {[
                  'End-to-end encryption for sensitive records',
                  'Role-based access with audit trails',
                  'SOC 2 Type II compliant infrastructure',
                  'Automatic backups with point-in-time recovery',
                ].map(item=> (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-[360px] rounded-3xl bg-gradient-to-br from-primary-500/5 via-purple-500/5 to-emerald-500/5 border border-slate-100 dark:border-white/5 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <p className="text-2xl font-bold mb-2">Enterprise Security</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Every school gets an isolated tenant. Your data never mixes with another school&apos;s.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-12 md:p-16 rounded-3xl bg-gradient-to-br from-primary-600 to-purple-700 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your school?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join schools already using Ali &amp; Simbi to save time, reduce costs, and delight parents.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-primary-700 bg-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white border border-white/30 rounded-2xl hover:bg-white/10 transition-all">
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-slate-200/70 dark:border-white/5 px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AliSimbiLogo size="sm" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Modern multi-tenant school management for Africa and beyond.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                <li><Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Dashboard</Link></li>
                <li><Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Students</Link></li>
                <li><Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Payments</Link></li>
                <li><Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                <li><span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">Documentation</span></li>
                <li><span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">API Reference</span></li>
                <li><span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">Changelog</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                <li><Link href="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About</Link></li>
                <li><span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">Contact</span></li>
                <li><span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">Privacy</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200/70 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 dark:text-slate-600">
              &copy; {new Date().getFullYear()} Ali &amp; Simbi. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Globe className="w-4 h-4 text-slate-400 dark:text-slate-600" />
              <span className="text-xs text-slate-400 dark:text-slate-600">Built for scale. Designed for schools.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
