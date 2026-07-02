'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    // If we are inside an iframe, tell the parent to close the modal / verify
    if (window.parent !== window) {
      try {
        window.parent.postMessage(
          { type: 'PAYSTACK_PAYMENT_COMPLETE', reference },
          '*'
        );
      } catch {
        // silent
      }

      try {
        const parentWin = window.parent as any;
        if (parentWin.__closePaymentModal) {
          parentWin.__closePaymentModal();
        }
        if (parentWin.__verifyPayment && reference) {
          parentWin.__verifyPayment(reference);
        }
      } catch {
        // silent — cross-origin will throw
      }
    }

    // Auto-close this window/tab if it was opened as a popup (fallback)
    const timer = setTimeout(() => {
      if (window.opener) {
        window.close();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-xl font-semibold text-slate-800">Processing Payment</h1>
        <p className="text-slate-500">Please wait while we confirm your payment...</p>
        {reference && (
          <p className="text-xs text-slate-400 font-mono">Ref: {reference}</p>
        )}
        <button
          onClick={() => {
            if (window.parent !== window) {
              try { (window.parent as any).__closePaymentModal?.(); } catch {}
            }
            window.close();
          }}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
        >
          Close Window
        </button>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-xl font-semibold text-slate-800">Processing Payment</h1>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
