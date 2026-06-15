'use client';

import { useState, useCallback, useRef } from 'react';
import { paymentApi, paymentGatewayApi } from './api';
import toast from 'react-hot-toast';

type PaymentStatus = 'idle' | 'initializing' | 'pending' | 'verifying' | 'success' | 'failed' | 'cancelled';

interface UseInlinePaymentOptions {
  schoolId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface InitiatePayload {
  studentId: string;
  amount: number;
  studentFeeId?: string;
  currency?: string;
  description?: string;
}

export function useInlinePayment({ schoolId, onSuccess, onError }: UseInlinePaymentOptions) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [reference, setReference] = useState<string | null>(null);
  const abortRef = useRef(false);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  };

  const verify = useCallback(
    async (ref: string) => {
      setStatus('verifying');
      try {
        const res = await paymentApi.verify(schoolId, ref);
        const data = (res as any).data;
        if (data?.status === 'SUCCESS') {
          setStatus('success');
          toast.success('Payment successful!');
          onSuccess?.();
        } else {
          setStatus('failed');
          toast.error(`Payment status: ${data?.status || 'Unknown'}`);
          onError?.(`Payment ${data?.status || 'failed'}`);
        }
      } catch {
        setStatus('failed');
        toast.error('Payment verification failed');
        onError?.('Verification failed');
      }
    },
    [schoolId, onSuccess, onError]
  );

  const fallbackRedirect = useCallback(
    async (payload: InitiatePayload) => {
      try {
        const initRes = await paymentApi.initiate(schoolId, {
          studentId: payload.studentId,
          amount: payload.amount,
          studentFeeId: payload.studentFeeId,
          currency: payload.currency || 'NGN',
          callbackUrl: window.location.href,
          description: payload.description,
        });

        const initData = (initRes as any).data;
        const ref = initData.paymentReference;
        setReference(ref);
        setStatus('pending');

        if (initData.authorizationUrl) {
          window.open(initData.authorizationUrl, '_blank');
          toast('Payment opened in a new tab. Complete it and come back.');
        } else {
          throw new Error('No payment URL returned');
        }
      } catch (error: any) {
        setStatus('failed');
        toast.error(error.response?.data?.message || 'Failed to initialize payment');
        onError?.(error.response?.data?.message || 'Initialization failed');
      }
    },
    [schoolId, onError]
  );

  const openPaystack = useCallback(
    async (payload: InitiatePayload, studentEmail: string, studentName: string) => {
      if (!schoolId) return;
      abortRef.current = false;
      setStatus('initializing');

      try {
        // 1. Fetch gateway config to get public key
        const configRes = await paymentGatewayApi.getConfig(schoolId);
        const config = (configRes as any).data || {};
        const publicKey = config.paystackPublicKey;

        // 2. If no public key configured, fall back to redirect
        if (!publicKey) {
          toast('Inline keys not configured. Opening secure payment page...');
          await fallbackRedirect(payload);
          return;
        }

        // 3. Initialize payment on backend
        const initRes = await paymentApi.initiate(schoolId, {
          studentId: payload.studentId,
          amount: payload.amount,
          studentFeeId: payload.studentFeeId,
          currency: payload.currency || 'NGN',
          callbackUrl: window.location.href,
          description: payload.description,
        });

        const initData = (initRes as any).data;
        const ref = initData.paymentReference;
        setReference(ref);
        setStatus('pending');

        // 4. Load Paystack SDK and open inline
        await loadScript('https://js.paystack.co/v1/inline.js');

        const handler = (window as any).PaystackPop.setup({
          key: publicKey,
          email: studentEmail || `${payload.studentId}@student.school`,
          amount: Math.round(payload.amount * 100),
          ref,
          currency: payload.currency || 'NGN',
          metadata: {
            custom_fields: [
              { display_name: 'Student Name', variable_name: 'student_name', value: studentName || 'Student' },
            ],
          },
          callback: (response: any) => {
            if (abortRef.current) return;
            verify(response.reference || ref);
          },
          onClose: () => {
            setStatus('cancelled');
            toast('Payment window closed. If you completed the payment, it will be verified shortly.');
          },
        });

        handler.openIframe();
      } catch (error: any) {
        setStatus('failed');
        toast.error(error.response?.data?.message || 'Failed to initialize payment');
        onError?.(error.response?.data?.message || 'Initialization failed');
      }
    },
    [schoolId, verify, onError, fallbackRedirect]
  );

  const openFlutterwave = useCallback(
    async (payload: InitiatePayload, studentEmail: string, studentName: string) => {
      if (!schoolId) return;
      abortRef.current = false;
      setStatus('initializing');

      try {
        // 1. Fetch gateway config to get public key
        const configRes = await paymentGatewayApi.getConfig(schoolId);
        const config = (configRes as any).data || {};
        const publicKey = config.flutterwavePublicKey;

        // 2. If no public key configured, fall back to redirect
        if (!publicKey) {
          toast('Inline keys not configured. Opening secure payment page...');
          await fallbackRedirect(payload);
          return;
        }

        // 3. Initialize payment on backend
        const initRes = await paymentApi.initiate(schoolId, {
          studentId: payload.studentId,
          amount: payload.amount,
          studentFeeId: payload.studentFeeId,
          currency: payload.currency || 'NGN',
          callbackUrl: window.location.href,
          description: payload.description,
        });

        const initData = (initRes as any).data;
        const ref = initData.paymentReference;
        setReference(ref);
        setStatus('pending');

        // 4. Load Flutterwave SDK and open inline
        await loadScript('https://checkout.flutterwave.com/v3.js');

        (window as any).FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: ref,
          amount: payload.amount,
          currency: payload.currency || 'NGN',
          customer: {
            email: studentEmail || `${payload.studentId}@student.school`,
            name: studentName || 'Student',
          },
          customizations: {
            title: 'School Fee Payment',
            description: payload.description || `Payment for ${studentName || 'school fees'}`,
            logo: '',
          },
          callback: (data: any) => {
            if (abortRef.current) return;
            verify(data.tx_ref || ref);
          },
          onclose: () => {
            setStatus('cancelled');
            toast('Payment window closed. If you completed the payment, it will be verified shortly.');
          },
        });
      } catch (error: any) {
        setStatus('failed');
        toast.error(error.response?.data?.message || 'Failed to initialize payment');
        onError?.(error.response?.data?.message || 'Initialization failed');
      }
    },
    [schoolId, verify, onError, fallbackRedirect]
  );

  const startPayment = useCallback(
    async (
      gateway: 'PAYSTACK' | 'FLUTTERWAVE',
      payload: InitiatePayload,
      studentEmail: string,
      studentName: string
    ) => {
      if (gateway === 'FLUTTERWAVE') {
        await openFlutterwave(payload, studentEmail, studentName);
      } else {
        await openPaystack(payload, studentEmail, studentName);
      }
    },
    [openPaystack, openFlutterwave]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setReference(null);
  }, []);

  return { status, reference, startPayment, verify, reset };
}
