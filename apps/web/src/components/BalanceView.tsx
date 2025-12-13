import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { WalletAvatar } from './WalletAvatar';
import { createPublicClient, http, formatUnits, defineChain } from 'viem';
import {
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
  isTokenAvailable,
  type NetworkId,
  type TokenSymbol,
} from '@/lib/payment-config';

interface BalanceViewProps {
  address: string;
  username?: string;
  onBack: () => void;
}

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  icon: string;
  available: boolean;
}

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function BalanceView({ address, username, onBack }: BalanceViewProps) {
  const { t } = useTranslation();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('base');

  const networkConfig = SUPPORTED_NETWORKS[selectedNetwork];

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a custom chain definition for viem
      const customChain = defineChain({
        id: networkConfig.chainId,
        name: networkConfig.name,
        nativeCurrency: networkConfig.nativeCurrency,
        rpcUrls: {
          default: { http: [networkConfig.rpcUrl] },
        },
        blockExplorers: {
          default: { name: networkConfig.name, url: networkConfig.explorerUrl },
        },
      });

      const client = createPublicClient({
        chain: customChain,
        transport: http(networkConfig.rpcUrl),
      });

      // Fetch native token balance
      const nativeBal = await client.getBalance({ address: address as `0x${string}` });
      setNativeBalance(formatUnits(nativeBal, networkConfig.nativeCurrency.decimals));

      // Fetch token balances
      const tokenBalances: TokenBalance[] = [];

      for (const [symbol, token] of Object.entries(SUPPORTED_TOKENS)) {
        const tokenSymbol = symbol as TokenSymbol;
        const available = isTokenAvailable(tokenSymbol, selectedNetwork);
        const tokenAddress = token.addresses[selectedNetwork];

        if (available && tokenAddress) {
          try {
            const balance = await client.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            });

            tokenBalances.push({
              symbol,
              name: token.name,
              balance: formatUnits(balance, token.decimals),
              decimals: token.decimals,
              icon: token.icon,
              available: true,
            });
          } catch (err) {
            console.error(`Failed to fetch ${symbol} balance:`, err);
            tokenBalances.push({
              symbol,
              name: token.name,
              balance: '0',
              decimals: token.decimals,
              icon: token.icon,
              available: true,
            });
          }
        } else {
          // Token not available on this network
          tokenBalances.push({
            symbol,
            name: token.name,
            balance: '-',
            decimals: token.decimals,
            icon: token.icon,
            available: false,
          });
        }
      }

      setBalances(tokenBalances);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      setError(t('balance.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [address, selectedNetwork, networkConfig, t]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: string, decimals: number = 4) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{t('balance.title')}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Wallet Info Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <WalletAvatar address={address} size={56} className="ring-4 ring-white/20" />
            <div>
              {username && <p className="font-medium text-lg">{username}</p>}
              <p className="text-white/80 font-mono text-sm">{truncateAddress(address)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">{t('balance.network')}</p>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value as NetworkId)}
                className="bg-white/20 text-white rounded-lg px-3 py-1.5 text-sm font-medium border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {(Object.keys(SUPPORTED_NETWORKS) as NetworkId[]).map((networkId) => {
                  const net = SUPPORTED_NETWORKS[networkId];
                  return (
                    <option key={networkId} value={networkId} className="text-gray-900">
                      {net.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              onClick={fetchBalances}
              disabled={isLoading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Native Token Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${networkConfig.color}20` }}
            >
              {networkConfig.nativeCurrency.symbol === 'ETH'
                ? '⟠'
                : networkConfig.nativeCurrency.symbol === 'AVAX'
                  ? '🔺'
                  : '🟣'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{networkConfig.nativeCurrency.name}</p>
              <p className="text-sm text-gray-500">{networkConfig.nativeCurrency.symbol}</p>
            </div>
            <div className="text-right">
              {isLoading ? (
                <div className="w-20 h-6 bg-gray-100 animate-pulse rounded" />
              ) : (
                <p className="font-semibold text-gray-900">
                  {formatBalance(nativeBalance, 6)} {networkConfig.nativeCurrency.symbol}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Token Balances */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">{t('balance.tokens')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {balances.map((token) => (
              <div
                key={token.symbol}
                className={`flex items-center gap-4 p-4 ${!token.available ? 'opacity-50' : ''}`}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {token.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{token.name}</p>
                  <p className="text-sm text-gray-500">{token.symbol}</p>
                  {!token.available && (
                    <p className="text-xs text-orange-600 mt-0.5">
                      {t('balance.notAvailable', { network: networkConfig.name })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <div className="w-20 h-6 bg-gray-100 animate-pulse rounded" />
                  ) : token.available ? (
                    <p className="font-semibold text-gray-900">
                      {formatBalance(token.balance, 2)} {token.symbol}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm">-</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">{t('balance.infoTitle')}</p>
              <p className="text-sm text-blue-700 mt-1">{t('balance.infoDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
