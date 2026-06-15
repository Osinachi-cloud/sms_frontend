'use client';

import { useState } from 'react';
import PaymentGatewaySettings from './PaymentGatewaySettings';
import PaymentAccountsSettings from './PaymentAccountsSettings';
import FeeManagement from './FeeManagement';
import { useAuth } from '@/lib/auth';
import { CreditCard, Landmark, BookOpen } from 'lucide-react';

interface PaymentSettingsProps {
  schoolId: string;
}

const tabs = [
  { key: 'gateway', label: 'Payment Gateway', icon: CreditCard },
  { key: 'accounts', label: 'Payment Accounts', icon: Landmark },
  { key: 'fees', label: 'Fee Management', icon: BookOpen },
];

export default function PaymentSettings({ schoolId }: PaymentSettingsProps) {
  const [activeTab, setActiveTab] = useState('gateway');
  const roleName = '';

  return (
    <div className="space-y-4">
      {/* Sub-tabs for payment settings */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
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

      {/* Active panel */}
      {activeTab === 'gateway' && <PaymentGatewaySettings schoolId={schoolId} />}
      {activeTab === 'accounts' && <PaymentAccountsSettings schoolId={schoolId} />}
      {activeTab === 'fees' && <FeeManagement schoolId={schoolId} />}
    </div>
  );
}
