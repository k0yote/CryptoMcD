import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CreditCard, CheckCircle2, QrCode, Wallet, Loader2 } from 'lucide-react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { PaymentQRCode } from './PaymentQRCode';
import { DirectPayment } from './DirectPayment';
import { StripeCheckout } from './StripeCheckout';
import {
  createPaymentRequest,
  usdToTokenAmount,
  type PaymentRequest,
} from '@/lib/payment';
import {
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
  getAvailableNetworks,
  type NetworkId,
  type TokenSymbol,
} from '@/lib/payment-config';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface SimpleCheckoutProps {
  items: CartItem[];
  total: number;
  onBack: () => void;
  onComplete: (paymentMethod: 'USDC' | 'JPYC' | 'Stripe', network?: NetworkId) => void;
}

type PaymentMethod = 'USDC' | 'JPYC' | 'Stripe' | null;
type PaymentFlow = 'direct' | 'qr' | null;
type Step = 'payment-method' | 'payment-flow' | 'qr' | 'direct' | 'stripe' | 'success';

export function SimpleCheckout({ items, total, onBack, onComplete }: SimpleCheckoutProps) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const [step, setStep] = useState<Step>('payment-method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [network, setNetwork] = useState<NetworkId | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Get available networks for the selected token
  const availableNetworks = paymentMethod && paymentMethod !== 'Stripe'
    ? getAvailableNetworks(paymentMethod)
    : [];

  // Auto-select first available network when token changes
  useEffect(() => {
    if (paymentMethod && paymentMethod !== 'Stripe' && availableNetworks.length > 0) {
      // Check if current network is still available
      if (!network || !availableNetworks.includes(network)) {
        setNetwork(availableNetworks[0]);
      }
    }
  }, [paymentMethod, availableNetworks]);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setNetwork(null); // Reset network selection

    if (method === 'Stripe') {
      // Show Stripe checkout
      setStep('stripe');
    }
  };

  const handleNetworkSelect = async (net: NetworkId) => {
    setNetwork(net);

    // If wallet is connected, try to switch chain
    if (isConnected) {
      const targetChainId = SUPPORTED_NETWORKS[net].chainId;
      if (chainId !== targetChainId) {
        try {
          await switchChain({ chainId: targetChainId });
        } catch (err) {
          console.error('Failed to switch chain:', err);
          // Still allow selection even if switch fails
        }
      }
    }
  };

  const handleProceedToPayment = () => {
    if (!paymentMethod || paymentMethod === 'Stripe' || !network) return;

    // Always show payment flow selection screen
    setStep('payment-flow');
  };

  const handlePaymentFlowSelect = (flow: PaymentFlow) => {
    if (!paymentMethod || paymentMethod === 'Stripe' || !network) return;

    // Create payment request
    const tokenAmount = usdToTokenAmount(total, paymentMethod);
    const request = createPaymentRequest(
      tokenAmount,
      paymentMethod,
      network,
      `Order: ${items.map(i => `${i.name} x${i.quantity}`).join(', ')}`
    );
    setPaymentRequest(request);

    if (flow === 'qr') {
      setStep('qr');
    } else if (flow === 'direct') {
      setStep('direct');
    }
  };

  const handlePaymentSuccess = (hash: string) => {
    setTxHash(hash);
    setStep('success');
  };

  const handleComplete = () => {
    if (paymentMethod) {
      onComplete(paymentMethod, paymentMethod !== 'Stripe' ? network : undefined);
    }
  };

  // Payment Method Selection
  if (step === 'payment-method') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>

          <h1 className="text-2xl font-bold mb-2 text-gray-900">{t('checkout.selectPaymentMethod')}</h1>
          <p className="text-gray-600 mb-8">{t('checkout.choosePayment')}</p>

          {/* Crypto Options */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">{t('checkout.stablecoins')}</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {(['USDC', 'JPYC'] as TokenSymbol[]).map((token) => {
                const tokenInfo = SUPPORTED_TOKENS[token];

                return (
                  <button
                    key={token}
                    onClick={() => handlePaymentMethodSelect(token)}
                    className={`bg-white border-2 rounded-xl p-6 text-left transition-all ${
                      paymentMethod === token
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                        {tokenInfo.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{token}</h4>
                        <p className="text-xs text-gray-500">{tokenInfo.name}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Network Selection - Show only available networks for selected token */}
            {(paymentMethod === 'USDC' || paymentMethod === 'JPYC') && availableNetworks.length > 0 && (
              <div className="bg-white rounded-xl p-6 mb-6 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">{t('checkout.selectNetwork')}</h4>
                  {isSwitchingChain && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('payment.switchingNetwork')}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {availableNetworks.map((net) => {
                    const netInfo = SUPPORTED_NETWORKS[net];
                    const isCurrentChain = chainId === netInfo.chainId;
                    return (
                      <button
                        key={net}
                        onClick={() => handleNetworkSelect(net)}
                        disabled={isSwitchingChain}
                        className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          network === net
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isSwitchingChain ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: netInfo.color }}
                        />
                        <span className="text-sm text-gray-900 flex-1">{netInfo.name}</span>
                        {isCurrentChain && isConnected && (
                          <span className="text-xs text-green-600">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card Option */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">{t('checkout.traditionalPayment')}</h3>
            <button
              onClick={() => handlePaymentMethodSelect('Stripe')}
              className={`w-full bg-white border-2 rounded-xl p-6 text-left transition-all ${
                paymentMethod === 'Stripe'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{t('checkout.creditDebitCard')}</h4>
                  <p className="text-xs text-gray-500">{t('checkout.poweredByStripe')}</p>
                </div>
              </div>
            </button>
          </div>

          {/* Order Summary */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">{t('checkout.orderSummary')}</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.image}</span>
                    <span className="text-gray-700">{item.name} x{item.quantity}</span>
                  </div>
                  <span className="text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">{t('common.total')}</span>
                <span className="text-xl font-semibold text-gray-900">${total.toFixed(2)}</span>
              </div>
              {paymentMethod && paymentMethod !== 'Stripe' && (
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>≈ {usdToTokenAmount(total, paymentMethod)} {paymentMethod}</span>
                </div>
              )}
            </div>

            {/* Proceed Button */}
            {paymentMethod && paymentMethod !== 'Stripe' && (
              <button
                onClick={handleProceedToPayment}
                disabled={!network || isSwitchingChain}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSwitchingChain ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('payment.switchingNetwork')}
                  </>
                ) : (
                  t('checkout.payWithCrypto', { amount: `$${total.toFixed(2)}`, currency: paymentMethod })
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Payment Flow Selection (QR or Direct)
  if (step === 'payment-flow') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <button onClick={() => setStep('payment-method')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>

          <h1 className="text-2xl font-bold mb-2 text-gray-900">{t('payment.selectPaymentFlow')}</h1>
          <p className="text-gray-600 mb-8">
            {t('common.total')}: ${total.toFixed(2)} ({usdToTokenAmount(total, paymentMethod!)} {paymentMethod})
          </p>

          <div className="space-y-4">
            {/* Direct Payment Option */}
            <button
              onClick={() => handlePaymentFlowSelect('direct')}
              className="w-full bg-white border-2 border-indigo-200 hover:border-indigo-500 rounded-xl p-6 text-left transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('payment.directPayment')}</h3>
                  <p className="text-sm text-gray-500">{t('payment.directPaymentDescription')}</p>
                </div>
              </div>
            </button>

            {/* QR Payment Option */}
            <button
              onClick={() => handlePaymentFlowSelect('qr')}
              className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl p-6 text-left transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('payment.qrPayment')}</h3>
                  <p className="text-sm text-gray-500">{t('payment.qrPaymentDescription')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QR Payment
  if (step === 'qr' && paymentRequest) {
    return (
      <PaymentQRCode
        request={paymentRequest}
        onClose={() => setStep('payment-flow')}
        onPaymentDetected={handlePaymentSuccess}
      />
    );
  }

  // Direct Payment
  if (step === 'direct' && paymentRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto p-4 md:p-8">
          <button onClick={() => setStep('payment-flow')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">{t('payment.directPayment')}</h2>
            </div>
            <DirectPayment
              request={paymentRequest}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setStep('payment-flow')}
            />
          </div>
        </div>
      </div>
    );
  }

  // Stripe Payment
  if (step === 'stripe') {
    return (
      <StripeCheckout
        items={items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))}
        total={total}
        onSuccess={() => {
          setStep('success');
        }}
        onCancel={() => setStep('payment-method')}
      />
    );
  }

  // Success
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{t('checkout.paymentSuccessful')}</h2>
          <p className="text-gray-600 mb-8">{t('checkout.orderConfirmed')}</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">{t('checkout.orderTotal')}</div>
            <div className="text-2xl font-semibold text-gray-900">${total.toFixed(2)}</div>
          </div>

          <button
            onClick={handleComplete}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl transition-colors"
          >
            {t('checkout.done')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
