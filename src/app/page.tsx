'use client';

import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import ParticleCanvas from '@/components/landing/ParticleCanvas';
import OrbitalRings from '@/components/landing/OrbitalRings';
import AliSimbiLogo from '@/components/landing/AliSimbiLogo';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { useTextScramble } from '@/components/landing/useTextScramble';
import {
  Users, GraduationCap, BookOpen, CreditCard, BarChart3,
  Shield, ArrowRight, Sparkles, Zap, Lock, Rocket, Star, ChevronRight,
  Globe, TrendingUp, Award, Calendar, Clock, MessageSquare, Receipt, FileText,
} from 'lucide-react';

const features = [
  { icon: Users, title: 'Student Management', desc: 'Complete records, enrollment & progress tracking', color: 'from-blue-500 to-cyan-400', delay: 0 },
  { icon: GraduationCap, title: 'Teacher Portal', desc: 'Class management, grading & attendance', color: 'from-emerald-500 to-green-400', delay: 0.1 },
  { icon: BookOpen, title: 'Content Management', desc: 'Rich content creation with approval workflows', color: 'from-violet-500 to-purple-400', delay: 0.2 },
  { icon: CreditCard, title: 'Fee & Payments', desc: 'Online payments, invoicing & financial reports', color: 'from-amber-500 to-orange-400', delay: 0.3 },
  { icon: BarChart3, title: 'Analytics', desc: 'Real-time insights & comprehensive reporting', color: 'from-rose-500 to-pink-400', delay: 0.4 },
  { icon: Shield, title: 'Role-Based Access', desc: 'Granular permissions for every user type', color: 'from-indigo-500 to-blue-400', delay: 0.5 },
];

const highlights = [
  { icon: Receipt, label: 'Automated Fee Collection', sub: 'Parents pay online or by transfer. Reconcile in seconds.' },
  { icon: FileText, label: 'Instant Report Cards', sub: 'Generate term reports for every student with one click.' },
  { icon: MessageSquare, label: 'Parent Communication', sub: 'Grades, fees, announcements — all in one place for parents.' },
  { icon: Users, label: 'Multi-Branch Control', sub: 'Run all your school locations from a single dashboard.' },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = target;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

function TypingCursor() {
  return (
    <motion.span
      className="inline-block w-[3px] h-[1em] bg-primary-500 dark:bg-primary-400 ml-1 align-middle"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
    />
  );
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const { display: line1 } = useTextScramble('Modern School', mounted, 800);
  const { display: line2 } = useTextScramble('Management System', mounted, 1200);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-500">
      {/* ========== HERO SECTION ========== */}
      <motion.section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Particle canvas background */}
        <div className="absolute inset-0 z-0">
          <ParticleCanvas />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 z-[1] opacity-[0.03] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Orbital rings */}
        <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
          <OrbitalRings />
        </div>

        {/* Radial glow */}
        <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.06)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />

        {/* Navbar */}
        <motion.nav
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 sm:py-5"
        >
          <AliSimbiLogo size="md" animated />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all hover:scale-105 whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm text-sm font-medium mb-8 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-default">
              <Sparkles className="w-4 h-4 text-primary-500 dark:text-primary-400" />
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-300 dark:to-purple-300 bg-clip-text text-transparent">
                Multi-Tenant School Management Platform
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </div>
          </motion.div>

          {/* Heading with scramble */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="block bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent font-mono">
              {line1}
            </span>
            <span className="block bg-gradient-to-r from-primary-600 via-purple-500 to-pink-500 dark:from-primary-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mt-2">
              {line2}
              <TypingCursor />
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Streamline your school operations with our comprehensive platform.
            Manage students, teachers, content, payments, and more — all in one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-105"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-white dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all backdrop-blur-sm shadow-sm"
            >
              View Demo
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-20 flex flex-col items-center gap-2"
          >
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-5 h-8 rounded-full border border-slate-400 dark:border-slate-600 flex items-start justify-center p-1.5"
            >
              <div className="w-1 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10" />
      </motion.section>

      {/* ========== STATS / HIGHLIGHTS ========== */}
      <section className="relative z-10 px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {highlights.map((h, i) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] hover:bg-white dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 text-center shadow-sm dark:shadow-none"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <h.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <p className="font-semibold text-slate-900 dark:text-white mb-1">{h.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">{h.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== ANIMATED COUNTERS ========== */}
      <section className="relative z-10 px-6 lg:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: 50, suffix: '+', label: 'Schools' },
              { value: 12000, suffix: '+', label: 'Students' },
              { value: 850, suffix: '+', label: 'Teachers' },
              { value: 99, suffix: '%', label: 'Uptime' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring' }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== FEATURES GRID ========== */}
      <section className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              A complete suite of tools to manage your school efficiently
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: feature.delay, duration: 0.5 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="group relative p-6 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.15] transition-all duration-500 overflow-hidden shadow-sm dark:shadow-none"
              >
                {/* Hover glow */}
                {hoveredFeature === index && (
                  <motion.div
                    layoutId="featureGlow"
                    className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-2xl"
                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                  />
                )}

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>

                <div className="mt-4 flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== LARGE FEATURE SHOWCASE ========== */}
      <section className="relative z-10 px-6 lg:px-12 py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-medium mb-4">
                <Star className="w-3.5 h-3.5" />
                Trusted by educators
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Built for Scale. Designed for Simplicity.
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Whether you run a single school or a nationwide chain, Ali &amp; Simbi adapts to your needs.
                Our multi-tenant architecture means each school gets its own isolated environment with
                custom branding, fees, and user roles.
              </p>
              <div className="space-y-3">
                {[
                  'White-label with your school branding & colors',
                  'Role-based access for admins, teachers, students & parents',
                  'Automatic fee calculation with discounts & deadlines',
                  'Real-time payment tracking & financial reports',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Rocket className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Floating cards visual */}
              <div className="relative h-[400px]">
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-0 left-0 w-64 p-5 rounded-2xl bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xl dark:shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Students</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">1,247 enrolled</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute top-24 right-0 w-64 p-5 rounded-2xl bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xl dark:shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Revenue</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">₦4.2M this term</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[60, 80, 45, 90, 70, 100, 85].map((h, i) => (
                      <div key={i} className="flex-1 flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500/60 to-emerald-400/30 rounded-sm"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  className="absolute bottom-0 left-12 w-56 p-4 rounded-2xl bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xl dark:shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Top Performer</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Ade Johnson</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">JSS 1A — 96% average</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS / TRUST ========== */}
      <section className="relative z-10 px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Loved by School Administrators
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                quote: 'Ali & Simbi cut our administrative workload by 70%. Fee collection is now fully automated.',
                name: 'Mrs. Folake Adeleke',
                role: 'Principal, Greenfield Academy',
              },
              {
                quote: 'The multi-tenant setup lets us manage all 5 branches from a single dashboard. Incredible.',
                name: 'Mr. John Okafor',
                role: 'Director, Excel Schools Group',
              },
              {
                quote: 'Parents love the self-service portal. They can see grades, pay fees, and message teachers instantly.',
                name: 'Dr. Sarah Mensah',
                role: 'IT Admin, Hope International',
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all shadow-sm dark:shadow-none"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="relative z-10 px-6 lg:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <div className="p-12 md:p-16 rounded-3xl bg-gradient-to-br from-primary-600/10 via-purple-600/10 to-primary-600/10 dark:from-primary-600/20 dark:via-purple-600/20 dark:to-primary-600/20 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm relative overflow-hidden">
            {/* Animated background orbs inside CTA */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent relative z-10">
              Ready to Transform Your School?
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto relative z-10">
              Join schools already using Ali &amp; Simbi to streamline their operations and delight parents.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl hover:shadow-xl hover:shadow-primary-500/20 transition-all hover:scale-105"
              >
                Get Started Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-slate-700 dark:text-white border border-slate-200 dark:border-white/20 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="relative z-10 px-6 lg:px-12 py-12 border-t border-slate-200/70 dark:border-white/5">
        <div className="max-w-6xl mx-auto">
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
                <li><span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">About</span></li>
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
