import { useTranslation } from 'react-i18next';
import { X, Clock, CheckCircle2, CreditCard, Coins, ArrowLeft } from 'lucide-react';

interface PaymentRecord {
  id: string;
  date: string;
  items: Array<{
    nameKey?: string;
    name?: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: 'USDC' | 'JPYC' | 'Stripe';
  network?: 'sepolia' | 'base-sepolia' | 'polygon-amoy' | 'avalanche-fuji';
  status: 'completed';
}

interface PaymentHistoryProps {
  history: PaymentRecord[];
  onBack: () => void;
}

export function PaymentHistory({ history, onBack }: PaymentHistoryProps) {
  const { t, i18n } = useTranslation();

  const getItemName = (item: { nameKey?: string; name?: string }) => {
    if (item.nameKey) {
      return t(item.nameKey);
    }
    return item.name || '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'ja' ? 'ja-JP' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('paymentHistory.title')}</h1>

        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-gray-900">{t('paymentHistory.noHistory')}</h3>
            <p className="text-gray-600">{t('paymentHistory.noHistoryDescription')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900">
                        {t('paymentHistory.order')} #{record.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl text-gray-900">${record.total.toFixed(2)}</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      {record.paymentMethod === 'Stripe' ? (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>{t('paymentHistory.card')}</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4" />
                          <span>{record.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <div className="space-y-2">
                    {record.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {getItemName(item)} ×{item.quantity}
                        </span>
                        <span className="text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Network Info */}
                {record.network && (
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        record.network === 'base-sepolia'
                          ? 'bg-blue-500'
                          : record.network === 'polygon-amoy'
                            ? 'bg-purple-500'
                            : record.network === 'avalanche-fuji'
                              ? 'bg-red-500'
                              : 'bg-gray-700'
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600 capitalize">
                      {record.network} {t('paymentHistory.network')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
