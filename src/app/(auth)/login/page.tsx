'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { School, Lock, Eye, EyeOff, AtSign } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      const isNetworkError = !error.response;

      if (isTimeout) {
        toast.error(
          'Server is waking up (takes ~30s on free hosting). Please try again in a moment.',
          { duration: 6000 }
        );
      } else if (isNetworkError) {
        toast.error(
          'Cannot reach the backend server. Please check your internet connection and try again.',
          { duration: 5000 }
        );
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      }
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
          <h1 className="text-2xl font-bold gradient-text">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
              <Input
                {...register('email')}
                type="text"
                placeholder="Email or username"
                className="pl-10"
              />
            </div>
            {errors.email?.message && (
              <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
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
            {errors.password?.message && (
              <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
              />
              <span className="text-slate-600 dark:text-slate-400">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-primary-600 hover:underline font-medium">Forgot password?</Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
