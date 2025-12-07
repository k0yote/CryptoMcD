import { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, X, Copy, Check } from 'lucide-react';

interface QRPaymentProps {
  amount: string;
  currency: string;
  network: string;
  recipient: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function QRPayment({ amount, currency, network, recipient, onClose, onSuccess }: QRPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes

  // Generate mock payment URL
  const paymentUrl = `cryptopay://${network}/${recipient}?amount=${amount}&currency=${currency}`;
  const paymentAddress = recipient || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate payment detection after 5 seconds
    const paymentTimer = setTimeout(() => {
      setIsPaid(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 5000);

    return () => clearTimeout(paymentTimer);
  }, [onSuccess]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isPaid) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="mb-2 text-gray-900">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your payment has been confirmed on the blockchain
          </p>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-gray-900">Scan to Pay</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Timer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-center">
          <p className="text-sm text-yellow-800">
            Payment expires in <span className="font-mono">{formatTime(timeRemaining)}</span>
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white border-4 border-gray-200 rounded-2xl p-8 mb-6">
          <div className="bg-gray-900 rounded-xl p-8 flex items-center justify-center aspect-square">
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 ${
                    Math.random() > 0.5 ? 'bg-white' : 'bg-gray-900'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Amount</span>
              <span className="text-gray-900">{amount} {currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Network</span>
              <span className="text-gray-900 capitalize">{network}</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Payment Address</div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
              <span className="text-xs font-mono text-gray-900 flex-1 truncate">
                {paymentAddress}
              </span>
              <button
                onClick={() => handleCopy(paymentAddress)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <h4 className="text-sm text-indigo-900 mb-2">How to pay:</h4>
          <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
            <li>Open your crypto wallet app</li>
            <li>Scan this QR code or copy the address</li>
            <li>Send exactly {amount} {currency}</li>
            <li>Wait for confirmation</li>
          </ol>
        </div>

        {/* Status */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
          <span className="text-sm">Waiting for payment...</span>
        </div>
      </div>
    </div>
  );
}
