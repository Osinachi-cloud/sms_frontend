'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  subjectId?: string;
  currency?: string;
  description?: string;
}

export function useInlinePayment({ schoolId, onSuccess, onError }: UseInlinePaymentOptions) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [reference, setReference] = useState<string | null>(null);
  const abortRef = useRef(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pollTimerRef = useRef<any>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const closeModal = useCallback(() => {
    stopPolling();
    if (modalRef.current) {
      modalRef.current.remove();
      modalRef.current = null;
    }
    iframeRef.current = null;
  }, [stopPolling]);

  const verify = useCallback(
    async (ref: string) => {
      if (abortRef.current) return;
      setStatus('verifying');
      try {
        const res = await paymentApi.verify(schoolId, ref);
        const data = (res as any).data;
        if (data?.status === 'SUCCESS') {
          setStatus('success');
          toast.success('Payment successful!');
          closeModal();
          onSuccess?.();
        } else if (data?.status === 'FAILED') {
          setStatus('failed');
          toast.error(`Payment failed: ${data?.status || 'Unknown'}`);
          onError?.(`Payment ${data?.status || 'failed'}`);
        } else {
          // Still pending/abandoned — keep polling
          setStatus('pending');
        }
      } catch {
        setStatus('failed');
        toast.error('Payment verification failed');
        onError?.('Verification failed');
        closeModal();
      }
    },
    [schoolId, onSuccess, onError, closeModal]
  );

  const startPolling = useCallback(
    (ref: string) => {
      stopPolling();
      // Poll immediately, then every 4 seconds
      verify(ref);
      pollTimerRef.current = setInterval(() => {
        if (!abortRef.current) {
          verify(ref);
        }
      }, 4000);

      // Stop polling after 5 minutes
      setTimeout(() => {
        stopPolling();
      }, 5 * 60 * 1000);
    },
    [verify, stopPolling]
  );

  const buildInitBody = (payload: InitiatePayload) => {
    const body: any = {
      studentId: payload.studentId,
      amount: payload.amount,
      currency: payload.currency || 'NGN',
    };
    if (payload.studentFeeId) body.studentFeeId = payload.studentFeeId;
    if (payload.subjectId) body.subjectId = payload.subjectId;
    if (payload.description) body.description = payload.description;
    return body;
  };

  // Listen for postMessage from callback page inside iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PAYSTACK_PAYMENT_COMPLETE') {
        const ref = event.data?.reference;
        if (ref) {
          verify(ref);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [verify]);

  // Expose global hooks so the callback page (same-origin) can call us directly
  useEffect(() => {
    const win = window as any;
    win.__verifyPayment = (ref: string) => verify(ref);
    win.__closePaymentModal = () => closeModal();
    return () => {
      delete win.__verifyPayment;
      delete win.__closePaymentModal;
    };
  }, [verify, closeModal]);

  const openModal = useCallback((authorizationUrl: string, paymentRef: string) => {
    closeModal();

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      width: 95%;
      max-width: 480px;
      height: 85vh;
      max-height: 640px;
      position: relative;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 14px 18px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;

    const title = document.createElement('span');
    title.textContent = 'Complete Payment';
    title.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      background: none; border: none; font-size: 22px;
      cursor: pointer; color: #6b7280;
      padding: 4px 8px; border-radius: 6px;
      transition: background 0.2s;
    `;
    closeBtn.onmouseenter = () => { closeBtn.style.background = '#f3f4f6'; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = 'transparent'; };
    closeBtn.onclick = () => {
      setStatus('cancelled');
      toast('Payment cancelled');
      closeModal();
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    const iframeContainer = document.createElement('div');
    iframeContainer.style.cssText = `
      flex: 1; position: relative; background: #f9fafb;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    `;
    spinner.innerHTML = `
      <div style="width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px;"></div>
      <div style="color: #6b7280; font-size: 13px;">Loading payment gateway...</div>
    `;

    if (!document.getElementById('paystack-spin-style')) {
      const style = document.createElement('style');
      style.id = 'paystack-spin-style';
      style.textContent = `@keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    iframeContainer.appendChild(spinner);

    const iframe = document.createElement('iframe');
    iframe.src = authorizationUrl;
    iframe.style.cssText = `
      width: 100%; height: 100%; border: none; display: none;
    `;
    iframe.allow = 'payment';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';

    iframe.onload = () => {
      spinner.style.display = 'none';
      iframe.style.display = 'block';
    };

    iframe.onerror = () => {
      spinner.innerHTML = `
        <div style="color: #ef4444; font-size: 16px; margin-bottom: 8px;">⚠️</div>
        <div style="color: #6b7280; font-size: 14px;">Failed to load payment page.</div>
      `;
    };

    iframeContainer.appendChild(iframe);
    iframeRef.current = iframe;

    modal.appendChild(header);
    modal.appendChild(iframeContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modalRef.current = overlay;
  }, [closeModal]);

  const openPaystack = useCallback(
    async (payload: InitiatePayload, studentEmail: string, studentName: string) => {
      if (!schoolId) return;
      abortRef.current = false;
      setStatus('initializing');

      try {
        const configRes = await paymentGatewayApi.getConfig(schoolId);
        const config = (configRes as any).data || {};
        const publicKey = config.paystackPublicKey;

        if (!publicKey) {
          toast.error('Paystack public key not configured.');
          onError?.('Paystack public key not configured');
          return;
        }

        const initRes = await paymentApi.initiate(schoolId, {
          ...buildInitBody(payload),
          callbackUrl: `${window.location.origin}/payment-callback`,
        });

        const initData = (initRes as any).data;
        const ref = initData.paymentReference;
        setReference(ref);
        setStatus('pending');

        const authUrl = initData.authorizationUrl;
        if (!authUrl) {
          const accessCode = initData.paystackAccessCode;
          if (accessCode) {
            openModal(`https://checkout.paystack.com/${accessCode}`, ref);
          } else {
            throw new Error('No payment URL or access code received');
          }
        } else {
          openModal(authUrl, ref);
        }

        // Start polling immediately after modal opens
        startPolling(ref);
      } catch (error: any) {
        setStatus('failed');
        toast.error(error.response?.data?.message || error.message || 'Failed to initialize payment');
        onError?.(error.response?.data?.message || error.message || 'Initialization failed');
        closeModal();
      }
    },
    [schoolId, onError, openModal, closeModal, startPolling]
  );

  const startPayment = useCallback(
    async (
      gateway: 'PAYSTACK' | 'FLUTTERWAVE',
      payload: InitiatePayload,
      studentEmail: string,
      studentName: string
    ) => {
      if (gateway === 'PAYSTACK') {
        await openPaystack(payload, studentEmail, studentName);
      } else {
        // Flutterwave — same iframe approach
        try {
          const configRes = await paymentGatewayApi.getConfig(schoolId);
          const config = (configRes as any).data || {};
          const publicKey = config.flutterwavePublicKey;

          if (!publicKey) {
            toast.error('Flutterwave public key not configured');
            return;
          }

          const initRes = await paymentApi.initiate(schoolId, {
            ...buildInitBody(payload),
            callbackUrl: `${window.location.origin}/payment-callback`,
          });

          const initData = (initRes as any).data;
          const ref = initData.paymentReference;
          setReference(ref);
          setStatus('pending');

          const authUrl = initData.authorizationUrl;
          if (authUrl) {
            openModal(authUrl, ref);
            startPolling(ref);
          } else {
            throw new Error('No payment URL received');
          }
        } catch (error: any) {
          setStatus('failed');
          toast.error(error.response?.data?.message || error.message || 'Failed to initialize payment');
          onError?.(error.response?.data?.message || error.message || 'Initialization failed');
          closeModal();
        }
      }
    },
    [schoolId, openPaystack, openModal, startPolling, closeModal, onError]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setReference(null);
    closeModal();
  }, [closeModal]);

  useEffect(() => {
    return () => {
      closeModal();
    };
  }, [closeModal]);

  return { status, reference, startPayment, verify, reset };
}
