'use client';

import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { Toaster } from 'react-hot-toast';
import { ReactNode, useEffect } from 'react';

function ServiceWorkerCleanup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('Service Worker unregistered:', registration.scope);
          });
        });
      });
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ServiceWorkerCleanup />
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
