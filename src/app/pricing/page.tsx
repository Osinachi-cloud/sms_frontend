'use client';

import React from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  Globe,
  Zap,
  Star,
  Users,
  Shield,
} from 'lucide-react';

import {
  Bot,
} from 'lucide-react';

const plans = [
  {
    name: 'Small School',
    price: '₦15,000',
    period: '/ month',
    meter: '~30 students',
    description: 'Perfect for small schools just getting started with digital management.',
    icon: Zap,
    gradient: 'from-slate-500 to-slate-400',
    features: [
      'Up to 30 students',
      '1 branch / location',
      'Full student & teacher management',
      'Fee tracking & invoicing',
      'Attendance tracking',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: false,
  },
  {
    name: 'Standard School',
    price: '₦45,000',
    period: '/ month',
    meter: '~100 students',
    description: 'For growing schools that need more power, AI assistance, and flexibility.',
    icon: Star,
    gradient: 'from-primary-600 to-purple-600',
    features: [
      'Up to 100 students',
      '3 branches / locations',
      'Online payments & invoicing',
      'Report cards & gradebook',
      'Parent portal',
      // 'AI Tutor integration',
      'Attendance tracking',
      'Priority support',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    meter: 'Unlimited students',
    description: 'For school groups and large institutions with custom needs.',
    icon: Shield,
    gradient: 'from-emerald-500 to-teal-400',
    features: [
      'Unlimited students',
      'Unlimited branches',
      'AI Tutor & custom AI features',
      'White-label branding',
      'Dedicated account manager',
      'Custom integrations',
      'API access',
      'Advanced analytics',
      'SLA & 24/7 support',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false,
  },
];

const faqs = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of the next billing term.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No setup fees for Small and Standard School plans. Enterprise plans may include a one-time onboarding fee depending on custom requirements.',
  },
  {
    q: 'Do you offer discounts for school groups?',
    a: 'Absolutely. We offer volume discounts for multi-school chains and franchise groups. Reach out via our Contact page.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept bank transfers, debit/credit cards, and direct Paystack integration for Nigerian schools.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-500">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-semibold mb-6">
            <Users className="w-3.5 h-3.5" />
            Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Plans that scale with
            <span className="block text-primary-600 dark:text-primary-400 mt-1">your school.</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Simple, predictable pricing starting from ~₦500 per student per month. No hidden fees, no surprises.
          </p>
        </motion.div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col transition-all hover:shadow-xl ${
                plan.popular
                  ? 'border-primary-200 dark:border-primary-800 bg-gradient-to-b from-primary-50/50 to-white dark:from-primary-900/10 dark:to-slate-900 shadow-lg scale-[1.02]'
                  : 'border-slate-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] hover:border-slate-200 dark:hover:border-white/[0.12]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5`}>
                <plan.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{plan.description}</p>

              <div className="mb-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-sm text-slate-400 ml-1">{plan.period}</span>
              </div>
              {plan.meter && (
                <p className="text-xs text-slate-400 mb-6">{plan.meter}</p>
              )}

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                  plan.popular
                    ? 'text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:shadow-lg hover:shadow-primary-500/20 hover:scale-105'
                    : 'text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature comparison teaser */}
      <section className="bg-slate-50/50 dark:bg-white/[0.02] py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Compare Plans</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Every plan includes our core promise: secure, reliable, and easy to use.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-white/[0.02]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03]">
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">Feature</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">Small School</th>
                    <th className="text-center py-4 px-6 font-semibold text-primary-600 dark:text-primary-400">Standard School</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Students', 'Up to 30', 'Up to 100', 'Unlimited'],
                    ['Branches', '1', '3', 'Unlimited'],
                    ['Online Payments', 'Included', 'Included', 'Included'],
                    ['Report Cards', 'Included', 'Included', 'Included'],
                    ['Parent Portal', '—', 'Included', 'Included'],
                    ['AI Tutor', '—', 'Included', 'Included'],
                    ['White-label', '—', '—', 'Included'],
                    ['API Access', '—', '—', 'Included'],
                    ['Support', 'Email', 'Priority', '24/7'],
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-white/[0.04]">
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-300">{row[0]}</td>
                      <td className="py-3 px-6 text-center text-slate-500 dark:text-slate-400">{row[1]}</td>
                      <td className="py-3 px-6 text-center text-slate-800 dark:text-slate-100 font-medium">{row[2]}</td>
                      <td className="py-3 px-6 text-center text-slate-500 dark:text-slate-400">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Highlight */}
      <section className="max-w-5xl mx-auto px-6 lg:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-slate-900 p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-800/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Bot className="w-3.5 h-3.5" />
                Special Perk
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                AI Tutor, built right in.
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Every Standard School and Enterprise plan includes our AI Tutor.
                Students get instant help, teachers get smart grading suggestions,
                and admins get intelligent insights — all powered by modern AI.
              </p>
              <ul className="space-y-3">
                {[
                  'Instant answers to student questions',
                  'Smart grading & feedback assistance',
                  'Personalized learning recommendations',
                  'Automated report summaries',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="w-4 h-4 text-primary-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-xl shadow-primary-500/20">
                <Bot className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-6 lg:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Frequently Asked Questions</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Everything you need to know about pricing and billing.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-500 shrink-0" />
                {faq.q}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Still have questions?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Our team is happy to help you find the right plan for your school.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-primary-700 bg-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all">
                Contact Sales <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white border border-white/30 rounded-2xl hover:bg-white/10 transition-all">
                Start Free
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
                <li>+2348167144768</li>
                <li>cstemagic@gmail.com</li>
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
