import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
  isStripeConfigured,
  initiateStripeCheckout,
  type CheckoutItem,
} from '@/lib/stripe';

interface StripeCheckoutProps {
  items: CheckoutItem[];
  total: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type CheckoutStatus = 'idle' | 'processing' | 'success' | 'error';

export function StripeCheckout({ items, total, onSuccess, onCancel }: StripeCheckoutProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const stripeConfigured = isStripeConfigured();

  const handleStripeCheckout = async () => {
    setStatus('processing');
    setError(null);

    try {
      if (stripeConfigured) {
        // Real Stripe checkout
        await initiateStripeCheckout(items);
        // Note: User will be redirected to Stripe, so this won't be reached
      } else {
        // Demo mode - simulate checkout
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error('Stripe checkout failed:', err);
      setError(err instanceof Error ? err.message : t('stripe.checkoutFailed'));
      setStatus('error');
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('checkout.paymentSuccessful')}
          </h3>
          <p className="text-gray-600">{t('checkout.orderConfirmed')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('stripe.cardPayment')}
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={status === 'processing'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {t('checkout.orderSummary')}
            </h4>
            <div className="space-y-2 mb-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">{t('common.total')}</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Demo Mode Notice */}
          {!stripeConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                {t('stripe.demoMode')}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Stripe Info */}
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
            <span>{t('checkout.poweredByStripe')}</span>
            <svg className="w-10 h-4" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M59.64 14.28c0-4.44-2.16-7.92-6.24-7.92-4.2 0-6.6 3.48-6.6 7.92 0 5.16 2.88 7.8 7.08 7.8 2.04 0 3.6-.48 4.8-1.2v-3.36c-1.2.6-2.52.96-4.2.96-1.68 0-3.12-.6-3.36-2.64h8.4c0-.24.12-1.08.12-1.56zm-8.52-1.68c0-1.92 1.2-2.76 2.28-2.76 1.08 0 2.16.84 2.16 2.76h-4.44zM40.2 6.48c-1.68 0-2.76.84-3.36 1.44l-.24-1.08h-3.72v19.2l4.2-.84v-4.68c.6.48 1.56 1.08 3.12 1.08 3.12 0 6-2.52 6-8.04-.12-5.04-2.88-7.08-6-7.08zm-1.08 10.92c-1.08 0-1.68-.36-2.16-.84v-6.6c.48-.48 1.2-.84 2.16-.84 1.68 0 2.76 1.8 2.76 4.08.12 2.4-1.08 4.2-2.76 4.2zM26.88 5.52l4.2-.84V1.2l-4.2.84v3.48zM26.88 6.72h4.2v15h-4.2v-15zM22.2 8.16l-.24-1.44H18.6v15h4.2v-10.2c.96-1.32 2.64-1.08 3.24-.84V6.72c-.72-.24-2.64-.72-3.84 1.44zM14.04 2.88l-4.08.84-.12 13.68c0 2.52 1.92 4.44 4.44 4.44 1.44 0 2.4-.24 3-.6v-3.36c-.48.24-3 .96-3-1.56V10.2h3V6.72h-3l.12-3.84h-.36zM4.08 11.04c0-.72.6-1.08 1.56-1.08 1.44 0 3.12.48 4.56 1.2V7.2C8.64 6.6 7.2 6.36 5.64 6.36 2.28 6.36 0 8.28 0 11.28c0 4.68 6.36 3.96 6.36 5.88 0 .84-.72 1.08-1.68 1.08-1.44 0-3.36-.6-4.8-1.44v4.08c1.56.72 3.24 1.08 4.8 1.08 3.48 0 5.88-1.68 5.88-4.8-.12-4.92-6.48-4.2-6.48-6.12z" fill="#635BFF"/>
            </svg>
          </div>

          {/* Pay Button */}
          <button
            onClick={handleStripeCheckout}
            disabled={status === 'processing'}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {status === 'processing' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('stripe.processing')}
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                {t('checkout.payWithCard', { amount: `$${total.toFixed(2)}` })}
              </>
            )}
          </button>

          {/* Cancel */}
          <button
            onClick={onCancel}
            disabled={status === 'processing'}
            className="w-full text-gray-500 hover:text-gray-700 py-3 text-sm transition-colors disabled:opacity-50 mt-2"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
