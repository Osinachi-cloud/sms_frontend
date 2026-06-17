'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { School, Mail, Lock, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(5, 'OTP must be exactly 5 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

type Step = 'email' | 'reset';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', otp: '', newPassword: '', confirmPassword: '' },
  });

  const onRequestOtp = async (data: EmailForm) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: data.email });
      toast.success('OTP sent! Use 12345 if email is not configured.');
      setSubmittedEmail(data.email);
      resetForm.setValue('email', data.email);
      setStep('reset');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Password reset successfully! Please log in.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mb-4"
          >
            <School className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold gradient-text">Reset Password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {step === 'email'
              ? 'Enter your email to receive a reset OTP'
              : 'Enter the OTP and your new password'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={emailForm.handleSubmit(onRequestOtp)} className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <Input
                  {...emailForm.register('email')}
                  type="email"
                  placeholder="Email address"
                  className="pl-10"
                />
              </div>
              {emailForm.formState.errors.email?.message && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send OTP
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <Input
                  {...resetForm.register('email')}
                  type="email"
                  placeholder="Email address"
                  className="pl-10"
                  readOnly
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <Input
                  {...resetForm.register('otp')}
                  type="text"
                  placeholder="Enter OTP (default: 12345)"
                  maxLength={5}
                  className="pl-10"
                />
              </div>
              {resetForm.formState.errors.otp?.message && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">
                  {resetForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <Input
                  {...resetForm.register('newPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {resetForm.formState.errors.newPassword?.message && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <Input
                  {...resetForm.register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="pl-10"
                />
              </div>
              {resetForm.formState.errors.confirmPassword?.message && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Reset Password
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="inline-flex items-center gap-1 text-primary-600 hover:underline font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Resend OTP
              </button>
              <Link href="/login" className="text-primary-600 hover:underline font-medium">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
