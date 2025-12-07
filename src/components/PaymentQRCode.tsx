import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import {
  type PaymentRequest,
  encodePaymentRequestToQR,
  getPaymentRequestRemainingTime,
  isPaymentRequestValid,
  formatTokenAmount,
} from '@/lib/payment';
import { SUPPORTED_NETWORKS, SUPPORTED_TOKENS } from '@/lib/payment-config';

interface PaymentQRCodeProps {
  request: PaymentRequest;
  onClose: () => void;
  onPaymentDetected?: (txHash: string) => void;
}

export function PaymentQRCode({
  request,
  onClose,
  onPaymentDetected: _onPaymentDetected,
}: PaymentQRCodeProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState(getPaymentRequestRemainingTime(request));
  const [isExpired, setIsExpired] = useState(!isPaymentRequestValid(request));

  const qrData = encodePaymentRequestToQR(request);
  const network = SUPPORTED_NETWORKS[request.network];
  const token = SUPPORTED_TOKENS[request.token];

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getPaymentRequestRemainingTime(request);
      setRemainingTime(remaining);
      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [request]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(request.recipient);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  if (isExpired) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('payment.expired')}</h2>
          <p className="text-gray-600 mb-6">{t('payment.expiredDescription')}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl transition-colors"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{t('payment.scanToPay')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Timer */}
          <div
            className={`rounded-lg p-3 mb-6 text-center ${
              remainingTime < 60
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <p className={`text-sm ${remainingTime < 60 ? 'text-red-800' : 'text-yellow-800'}`}>
              {t('payment.expiresIn')}{' '}
              <span className="font-mono font-semibold">{formatTime(remainingTime)}</span>
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center">
              <QRCodeSVG
                value={qrData}
                size={220}
                level="M"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4 mb-6">
            {/* Amount */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('payment.amount')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{token.icon}</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatTokenAmount(request.amount, request.token)}
                  </span>
                </div>
              </div>
            </div>

            {/* Network */}
            <div className="flex items-center justify-between px-4">
              <span className="text-sm text-gray-600">{t('payment.network')}</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: network.color }} />
                <span className="text-gray-900">{network.name}</span>
              </div>
            </div>

            {/* Recipient Address */}
            <div>
              <div className="text-sm text-gray-600 mb-2 px-4">{t('payment.sendTo')}</div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 mx-0">
                <span className="text-xs font-mono text-gray-700 flex-1 truncate">
                  {truncateAddress(request.recipient)}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  title={t('payment.copyAddress')}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <h4 className="text-sm font-medium text-indigo-900 mb-2">{t('payment.howToPay')}</h4>
            <ol className="text-sm text-indigo-700 space-y-1.5 list-decimal list-inside">
              <li>{t('payment.step1')}</li>
              <li>{t('payment.step2')}</li>
              <li>{t('payment.step3', { amount: request.amount, token: request.token })}</li>
            </ol>
          </div>

          {/* Status */}
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t('payment.waitingForPayment')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
