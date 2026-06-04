'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { paymentGatewayApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CreditCard, Shield, RefreshCw, AlertTriangle } from 'lucide-react';

interface GatewayConfig {
  paystackSecretKey: string;
  paystackPublicKey: string;
  flutterwaveSecretKey: string;
  flutterwavePublicKey: string;
  activeGateway: 'PAYSTACK' | 'FLUTTERWAVE';
  fallbackEnabled: boolean;
  paystackEnabled: boolean;
  flutterwaveEnabled: boolean;
}

export default function PaymentGatewaySettings({ schoolId }: { schoolId: string }) {
  const { isAppAdmin, currentSchool, hasPermission } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const [config, setConfig] = useState<GatewayConfig>({
    paystackSecretKey: '',
    paystackPublicKey: '',
    flutterwaveSecretKey: '',
    flutterwavePublicKey: '',
    activeGateway: 'PAYSTACK',
    fallbackEnabled: false,
    paystackEnabled: false,
    flutterwaveEnabled: false,
  });

  useEffect(() => {
    if (!schoolId) return;
    paymentGatewayApi.getConfig(schoolId).then((res: any) => {
      const data = res.data;
      setConfig({
        paystackSecretKey: data.paystackSecretKey || '',
        paystackPublicKey: data.paystackPublicKey || '',
        flutterwaveSecretKey: data.flutterwaveSecretKey || '',
        flutterwavePublicKey: data.flutterwavePublicKey || '',
        activeGateway: data.activeGateway || 'PAYSTACK',
        fallbackEnabled: data.fallbackEnabled ?? false,
        paystackEnabled: data.paystackEnabled ?? false,
        flutterwaveEnabled: data.flutterwaveEnabled ?? false,
      });
    }).catch(() => {
      toast.error('Failed to load payment gateway config');
    });
  }, [schoolId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await paymentGatewayApi.updateConfig(schoolId, config);
      toast.success('Payment gateway configuration saved');
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleField = (field: keyof GatewayConfig) => {
    setConfig((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const isAdmin = isAppAdmin() || currentSchool?.roleName === 'ACCOUNTANT' || hasPermission('payment.gateway.manage');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You are viewing this configuration in read-only mode. Only Super Admins and Finance Admins can edit payment gateway settings.
          </p>
        </div>
      )}

      {/* Paystack */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <CardTitle>Paystack Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-sm">Enable Paystack</p>
              <p className="text-xs text-slate-500">Allow payments through Paystack</p>
            </div>
            <button
              onClick={() => toggleField('paystackEnabled')}
              disabled={!isAdmin}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                config.paystackEnabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                config.paystackEnabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Secret Key"
              type={showSecrets ? 'text' : 'password'}
              value={config.paystackSecretKey}
              onChange={(e) => setConfig({ ...config, paystackSecretKey: e.target.value })}
              placeholder="sk_test_..."
              disabled={!isAdmin}
            />
            <Input
              label="Public Key"
              type={showSecrets ? 'text' : 'password'}
              value={config.paystackPublicKey}
              onChange={(e) => setConfig({ ...config, paystackPublicKey: e.target.value })}
              placeholder="pk_test_..."
              disabled={!isAdmin}
            />
          </div>
        </CardContent>
      </Card>

      {/* Flutterwave */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <CardTitle>Flutterwave Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-sm">Enable Flutterwave</p>
              <p className="text-xs text-slate-500">Allow payments through Flutterwave</p>
            </div>
            <button
              onClick={() => toggleField('flutterwaveEnabled')}
              disabled={!isAdmin}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                config.flutterwaveEnabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                config.flutterwaveEnabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Secret Key"
              type={showSecrets ? 'text' : 'password'}
              value={config.flutterwaveSecretKey}
              onChange={(e) => setConfig({ ...config, flutterwaveSecretKey: e.target.value })}
              placeholder="FLWSECK_TEST-..."
              disabled={!isAdmin}
            />
            <Input
              label="Public Key"
              type={showSecrets ? 'text' : 'password'}
              value={config.flutterwavePublicKey}
              onChange={(e) => setConfig({ ...config, flutterwavePublicKey: e.target.value })}
              placeholder="FLWPUBK_TEST-..."
              disabled={!isAdmin}
            />
          </div>
        </CardContent>
      </Card>

      {/* Routing & Fallback */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <CardTitle>Routing & Fallback</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Active Payment Gateway
            </label>
            <div className="flex gap-3">
              {(['PAYSTACK', 'FLUTTERWAVE'] as const).map((gw) => (
                <button
                  key={gw}
                  onClick={() => isAdmin && setConfig((prev) => ({ ...prev, activeGateway: gw }))}
                  disabled={!isAdmin}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                    config.activeGateway === gw
                      ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {gw === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-sm">Enable Fallback</p>
              <p className="text-xs text-slate-500">
                If the active gateway fails, automatically route to the other enabled gateway
              </p>
            </div>
            <button
              onClick={() => toggleField('fallbackEnabled')}
              disabled={!isAdmin}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                config.fallbackEnabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                config.fallbackEnabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button onClick={handleSave} isLoading={isSaving}>
            <Shield className="w-4 h-4 mr-1" />
            Save Gateway Configuration
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowSecrets((s) => !s)}>
            {showSecrets ? 'Hide Keys' : 'Show Keys'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
