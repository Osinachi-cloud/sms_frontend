'use client';

import React, { useState } from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowRight,
  Globe,
  CheckCircle2,
  MessageSquare,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-500">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-semibold mb-6">
              <MessageSquare className="w-3.5 h-3.5" />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              Let&apos;s start a
              <span className="block text-primary-600 dark:text-primary-400 mt-1">conversation.</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-lg leading-relaxed">
              Whether you want a demo, have a question, or need support — we are here to help.
              Reach out and our team will respond within 24 hours.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Phone</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">+2348167144768</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Email</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">cstemagic@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Support Hours</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Mon — Fri, 8:00 AM — 6:00 PM WAT</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@school.edu"
                  className="w-full px-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="border-y border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Visit Our Office</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              We are headquartered in Lagos, Nigeria, and work with schools across Africa.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-72 md:h-96 bg-slate-100 dark:bg-slate-900 flex items-center justify-center"
          >
            <div className="text-center">
              <MapPin className="w-10 h-10 text-primary-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lagos, Nigeria</p>
              <p className="text-xs text-slate-400 mt-1">Remote teams across Africa</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24 pt-16">
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

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-white/5 px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
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
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                <li><Link href="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact</Link></li>
                <li><Link href="/pricing" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +2348167144768</li>
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> cstemagic@gmail.com</li>
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
