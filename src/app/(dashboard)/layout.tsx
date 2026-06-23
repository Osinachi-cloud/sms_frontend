import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { NavigationLoader } from '@/components/layout/NavigationLoader';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { AiTutorWidget } from '@/components/ai/AiTutorWidget';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <RouteGuard />
      <NavigationLoader />
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto min-h-0 p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
      <AiTutorWidget />
    </div>
  );
}
