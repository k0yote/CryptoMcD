import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useAccount, useSwitchChain } from 'wagmi';
import {
  type PaymentRequest,
  executePayment,
  waitForTransaction,
  getTransactionUrl,
  getTokenBalance,
  formatTokenAmount,
  isPaymentRequestValid,
} from '@/lib/payment';
import { SUPPORTED_NETWORKS, SUPPORTED_TOKENS } from '@/lib/payment-config';
import { WalletAvatar } from './WalletAvatar';

interface DirectPaymentProps {
  request: PaymentRequest;
  onSuccess: (txHash: string) => void;
  onCancel: () => void;
}

type PaymentStatus = 'idle' | 'checking' | 'confirming' | 'sending' | 'waiting' | 'success' | 'error';

export function DirectPayment({ request, onSuccess, onCancel }: DirectPaymentProps) {
  const { t } = useTranslation();
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const network = SUPPORTED_NETWORKS[request.network];
  const token = SUPPORTED_TOKENS[request.token];
  const expectedChainId = network.chainId;
  const isCorrectNetwork = chain?.id === expectedChainId;

  // Check balance on mount
  useEffect(() => {
    async function checkBalance() {
      if (!address) return;

      setStatus('checking');
      try {
        const bal = await getTokenBalance(address, request.token, request.network);
        setBalance(bal);
        setStatus('idle');
      } catch (err) {
        console.error('Failed to check balance:', err);
        setBalance(null);
        setStatus('idle');
      }
    }

    checkBalance();
  }, [address, request.token, request.network]);

  const hasSufficientBalance = balance !== null && parseFloat(balance) >= parseFloat(request.amount);

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: expectedChainId });
    } catch (err) {
      console.error('Failed to switch network:', err);
      setError(t('payment.networkSwitchFailed'));
    }
  };

  const handlePayment = async () => {
    if (!address) return;

    // Validate request
    if (!isPaymentRequestValid(request)) {
      setError(t('payment.requestExpired'));
      setStatus('error');
      return;
    }

    setStatus('confirming');
    setError(null);

    try {
      const result = await executePayment(request, address);

      if (!result.success) {
        setError(result.error || t('payment.failed'));
        setStatus('error');
        return;
      }

      setTxHash(result.txHash!);
      setStatus('waiting');

      // Wait for confirmation
      const confirmed = await waitForTransaction(result.txHash!, request.network);

      if (confirmed) {
        setStatus('success');
        setTimeout(() => {
          onSuccess(result.txHash!);
        }, 2000);
      } else {
        setError(t('payment.confirmationFailed'));
        setStatus('error');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err instanceof Error ? err.message : t('payment.failed'));
      setStatus('error');
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('payment.success')}</h3>
        <p className="text-gray-600 mb-4">{t('payment.successDescription')}</p>
        {txHash && (
          <a
            href={getTransactionUrl(txHash as `0x${string}`, request.network)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm"
          >
            {t('payment.viewTransaction')}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Wallet Info */}
      {address && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <WalletAvatar address={address} size={40} />
            <div className="flex-1">
              <p className="text-sm text-gray-500">{t('payment.payingFrom')}</p>
              <p className="font-mono text-sm text-gray-900">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details */}
      <div className="bg-indigo-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-indigo-700">{t('payment.amount')}</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{token.icon}</span>
            <span className="text-lg font-semibold text-indigo-900">
              {formatTokenAmount(request.amount, request.token)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-indigo-700">{t('payment.network')}</span>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: network.color }} />
            <span className="text-sm text-indigo-900">{network.name}</span>
          </div>
        </div>
      </div>

      {/* Balance Check */}
      {status === 'checking' ? (
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t('payment.checkingBalance')}</span>
        </div>
      ) : balance !== null && (
        <div className={`rounded-lg p-3 mb-6 ${
          hasSufficientBalance ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${hasSufficientBalance ? 'text-green-700' : 'text-red-700'}`}>
              {t('payment.yourBalance')}
            </span>
            <span className={`font-medium ${hasSufficientBalance ? 'text-green-800' : 'text-red-800'}`}>
              {formatTokenAmount(balance, request.token)}
            </span>
          </div>
          {!hasSufficientBalance && (
            <p className="text-xs text-red-600 mt-1">{t('payment.insufficientBalance')}</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Network Switch */}
      {!isCorrectNetwork && (
        <button
          onClick={handleSwitchNetwork}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl mb-4 flex items-center justify-center gap-2 transition-colors"
        >
          <Wallet className="w-5 h-5" />
          {t('payment.switchNetwork', { network: network.name })}
        </button>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={!isCorrectNetwork || !hasSufficientBalance || status !== 'idle'}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {status === 'confirming' && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('payment.confirmInWallet')}
          </>
        )}
        {status === 'waiting' && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('payment.waitingConfirmation')}
          </>
        )}
        {(status === 'idle' || status === 'error') && (
          <>
            <Wallet className="w-5 h-5" />
            {t('payment.payNow', { amount: request.amount, token: request.token })}
          </>
        )}
      </button>

      {/* Cancel */}
      <button
        onClick={onCancel}
        disabled={status === 'confirming' || status === 'waiting'}
        className="w-full text-gray-500 hover:text-gray-700 py-3 text-sm transition-colors disabled:opacity-50"
      >
        {t('common.cancel')}
      </button>
    </div>
  );
}
