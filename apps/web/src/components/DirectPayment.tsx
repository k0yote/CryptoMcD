import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Loader2, CheckCircle2, AlertCircle, ExternalLink, Fingerprint } from 'lucide-react';
import { useAccount, useSwitchChain, useConnectorClient } from 'wagmi';
import {
  type PaymentRequest,
  getTransactionUrl,
  getTokenBalance,
  formatTokenAmount,
  isPaymentRequestValid,
} from '@/lib/payment';
import { createEIP3009Authorization, createPasskeyEIP3009Authorization, settlePayment } from '@/lib/eip3009';
import { SUPPORTED_NETWORKS, SUPPORTED_TOKENS } from '@/lib/payment-config';
import { WalletAvatar } from './WalletAvatar';

interface DirectPaymentProps {
  request: PaymentRequest;
  onSuccess: (txHash: string) => void;
  onCancel: () => void;
  /** If provided, use passkey wallet instead of wagmi wallet */
  passkeyAddress?: string;
  /** Username for passkey wallet display */
  passkeyUsername?: string;
}

type PaymentStatus =
  | 'idle'
  | 'checking'
  | 'signing'      // User signing EIP-3009 authorization
  | 'processing'   // Facilitator executing transaction
  | 'success'
  | 'error';

export function DirectPayment({ request, onSuccess, onCancel, passkeyAddress, passkeyUsername }: DirectPaymentProps) {
  const { t } = useTranslation();
  const { address: wagmiAddress, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  // Use passkey address if provided, otherwise use wagmi address
  const isPasskeyWallet = !!passkeyAddress;
  const address = passkeyAddress || wagmiAddress;

  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const network = SUPPORTED_NETWORKS[request.network];
  const token = SUPPORTED_TOKENS[request.token];
  const expectedChainId = network.chainId;
  // Passkey wallets don't need network switching - facilitator handles the network
  const isCorrectNetwork = isPasskeyWallet ? true : chain?.id === expectedChainId;

  // Debug log for chain checking
  console.log('[DirectPayment] Current chain:', chain?.id, 'Expected:', expectedChainId, 'isCorrect:', isCorrectNetwork, 'isPasskey:', isPasskeyWallet);

  const isInitialLoad = useRef(true);

  // Balance fetching function
  const fetchBalance = useCallback(async () => {
    if (!address) return;

    try {
      const bal = await getTokenBalance(address, request.token, request.network);
      setBalance(bal);
      setStatus((prev) => (prev === 'checking' ? 'idle' : prev));
    } catch (err) {
      console.error('Failed to check balance:', err);
      setStatus((prev) => (prev === 'checking' ? 'idle' : prev));
    }
  }, [address, request.token, request.network]);

  // Initial balance check
  useEffect(() => {
    if (isInitialLoad.current && address) {
      isInitialLoad.current = false;
      setStatus('checking');
      fetchBalance();
    }
  }, [address, fetchBalance]);

  // Auto-refresh balance every 5 seconds
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [address, fetchBalance]);

  const hasSufficientBalance =
    balance !== null && parseFloat(balance) >= parseFloat(request.amount);

  const { data: connectorClient } = useConnectorClient();

  const handleSwitchNetwork = async () => {
    console.log('[SwitchNetwork] Starting switch to chainId:', expectedChainId);
    console.log('[SwitchNetwork] Network config:', network);
    console.log('[SwitchNetwork] Current chain:', chain);
    console.log('[SwitchNetwork] ConnectorClient:', connectorClient);
    console.log('[SwitchNetwork] switchChain function:', switchChain);

    try {
      // First try to switch directly
      console.log('[SwitchNetwork] Attempting switchChain...');
      await switchChain({ chainId: expectedChainId });
      console.log('[SwitchNetwork] switchChain succeeded!');
    } catch (switchError: unknown) {
      console.error('[SwitchNetwork] switchChain failed:', switchError);
      const err = switchError as { code?: number; message?: string };
      console.log('[SwitchNetwork] Error code:', err.code);
      console.log('[SwitchNetwork] Error message:', err.message);

      // If chain is not added (error 4902), try to add it first
      if (err.code === 4902 && connectorClient) {
        console.log('[SwitchNetwork] Chain not found, attempting to add...');
        try {
          const addChainParams = {
            chainId: `0x${expectedChainId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: network.nativeCurrency,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.explorerUrl],
          };
          console.log('[SwitchNetwork] addEthereumChain params:', addChainParams);

          await connectorClient.request({
            method: 'wallet_addEthereumChain',
            params: [addChainParams],
          });
          console.log('[SwitchNetwork] Chain added, attempting switch again...');
          // After adding, the wallet should auto-switch, but try again just in case
          await switchChain({ chainId: expectedChainId });
          console.log('[SwitchNetwork] Switch after add succeeded!');
        } catch (addError) {
          console.error('[SwitchNetwork] Failed to add network:', addError);
          setError(t('payment.networkSwitchFailed'));
        }
      } else {
        console.error('[SwitchNetwork] Unhandled error, code:', err.code);
        setError(t('payment.networkSwitchFailed'));
      }
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

    setStatus('signing');
    setError(null);

    try {
      // Step 1: User signs EIP-3009 authorization (no gas cost)
      // Use passkey signing for passkey wallets, wagmi signing for external wallets
      const signResult = isPasskeyWallet
        ? await createPasskeyEIP3009Authorization(
            address as `0x${string}`,
            request.amount,
            request.token,
            request.network,
            request.id
          )
        : await createEIP3009Authorization(
            address as `0x${string}`,
            request.amount,
            request.token,
            request.network,
            request.id
          );

      if (!signResult.success || !signResult.payload) {
        setError(signResult.error || t('payment.failed'));
        setStatus('error');
        return;
      }

      // Step 2: Send to facilitator for execution (facilitator pays gas)
      setStatus('processing');

      const settleResult = await settlePayment(signResult.payload);

      if (!settleResult.success) {
        setError(settleResult.error || t('payment.failed'));
        setStatus('error');
        return;
      }

      setTxHash(settleResult.transactionHash!);
      setStatus('success');
      // Don't auto-close - let user view transaction first
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
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm mb-6"
          >
            {t('payment.viewTransaction')}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={() => onSuccess(txHash!)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl transition-colors mt-4"
        >
          {t('checkout.done')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Wallet Info */}
      {address && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            {isPasskeyWallet ? (
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-indigo-600" />
              </div>
            ) : (
              <WalletAvatar address={address} size={40} />
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-500">{t('payment.payingFrom')}</p>
              {isPasskeyWallet && passkeyUsername ? (
                <p className="font-medium text-sm text-gray-900">{passkeyUsername}</p>
              ) : (
                <p className="font-mono text-sm text-gray-900">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              )}
            </div>
            {isPasskeyWallet && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                Passkey
              </span>
            )}
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
      ) : (
        balance !== null && (
          <div
            className={`rounded-lg p-3 mb-6 ${
              hasSufficientBalance
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${hasSufficientBalance ? 'text-green-700' : 'text-red-700'}`}
              >
                {t('payment.yourBalance')}
              </span>
              <span
                className={`font-medium ${hasSufficientBalance ? 'text-green-800' : 'text-red-800'}`}
              >
                {formatTokenAmount(balance, request.token)}
              </span>
            </div>
            {!hasSufficientBalance && (
              <p className="text-xs text-red-600 mt-1">{t('payment.insufficientBalance')}</p>
            )}
          </div>
        )
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Network Switch - Only show for external wallets, not passkey wallets */}
      {!isCorrectNetwork && !isPasskeyWallet && (
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
        {status === 'signing' && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('payment.signInWallet')}
          </>
        )}
        {status === 'processing' && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('payment.processing')}
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
        disabled={status === 'signing' || status === 'processing'}
        className="w-full text-gray-500 hover:text-gray-700 py-3 text-sm transition-colors disabled:opacity-50"
      >
        {t('common.cancel')}
      </button>
    </div>
  );
}
