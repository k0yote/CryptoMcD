import { CreditCard, Coins } from 'lucide-react';

type PaymentMethod = 'USDC' | 'JPYC' | 'Stripe';
type Network = 'base' | 'polygon' | 'avalanche' | 'ethereum';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  network: Network;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onNetworkChange: (network: Network) => void;
}

const paymentMethods: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: 'USDC', label: 'USDC', icon: Coins },
  { value: 'JPYC', label: 'JPYC', icon: Coins },
  { value: 'Stripe', label: 'Stripe', icon: CreditCard },
];

const networks: { value: Network; label: string; color: string }[] = [
  { value: 'base', label: 'Base', color: 'bg-blue-500' },
  { value: 'polygon', label: 'Polygon', color: 'bg-purple-500' },
  { value: 'avalanche', label: 'Avalanche', color: 'bg-red-500' },
  { value: 'ethereum', label: 'Ethereum', color: 'bg-gray-700' },
];

export function PaymentMethodSelector({
  paymentMethod,
  network,
  onPaymentMethodChange,
  onNetworkChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Payment Method */}
      <div className="mb-6">
        <label className="block mb-3 text-gray-700">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = paymentMethod === method.value;
            return (
              <button
                key={method.value}
                onClick={() => onPaymentMethodChange(method.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                />
                <div className={`text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {method.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Network Selection - Only show for crypto payments */}
      {paymentMethod !== 'Stripe' && (
        <div>
          <label className="block mb-3 text-gray-700">
            Network
          </label>
          <div className="grid grid-cols-2 gap-3">
            {networks.map((net) => {
              const isSelected = network === net.value;
              return (
                <button
                  key={net.value}
                  onClick={() => onNetworkChange(net.value)}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${net.color}`}></div>
                  <span className={`text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {net.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
