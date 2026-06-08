'use client';

import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { Toaster } from 'react-hot-toast';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
        <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass',
          duration: 4000,
          style: {
            padding: '16px',
            borderRadius: '12px',
          },
        }}
      />
      </ThemeProvider>
    </AuthProvider>
  );
}
