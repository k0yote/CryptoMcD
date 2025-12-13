/**
 * Payment Configuration
 * Store address and supported tokens/networks
 * Testnet only - mainnet support will be added after thorough testing
 */

// Store wallet address - receives all payments
// This should be set via environment variable in production
export const STORE_ADDRESS =
  import.meta.env.VITE_STORE_ADDRESS || '0x0000000000000000000000000000000000000000';

// Supported networks (testnet only)
export const SUPPORTED_NETWORKS = {
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    color: '#627EEA',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  'base-sepolia': {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    color: '#0052FF',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  'polygon-amoy': {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    color: '#8247E5',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  },
  'avalanche-fuji': {
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    color: '#E84142',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
} as const;

export type NetworkId = keyof typeof SUPPORTED_NETWORKS;

// Supported tokens per network (testnet only)
export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
    addresses: {
      sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      'polygon-amoy': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
      'avalanche-fuji': '0x5425890298aed601595a70AB815c96711a31Bc65',
    } as Record<NetworkId, string>,
  },
  JPYC: {
    symbol: 'JPYC',
    name: 'JPY Coin',
    decimals: 18,
    icon: '💴',
    addresses: {
      sepolia: '0x0000000000000000000000000000000000000000',
      'base-sepolia': '0x0000000000000000000000000000000000000000',
      'polygon-amoy': '0xAc5e2848c22052D5C674892562Fd900e512D5428',
      'avalanche-fuji': '0x0000000000000000000000000000000000000000',
    } as Record<NetworkId, string>,
  },
} as const;

export type TokenSymbol = keyof typeof SUPPORTED_TOKENS;

// Default network for payments
export const DEFAULT_NETWORK: NetworkId = 'base-sepolia';

// Payment expiry time in seconds (15 minutes)
export const PAYMENT_EXPIRY_SECONDS = 900;

// Get token address for a specific network
export function getTokenAddress(token: TokenSymbol, network: NetworkId): string {
  return SUPPORTED_TOKENS[token].addresses[network];
}

// Get network config
export function getNetworkConfig(network: NetworkId) {
  return SUPPORTED_NETWORKS[network];
}

// Check if token is available on network
export function isTokenAvailable(token: TokenSymbol, network: NetworkId): boolean {
  const address = getTokenAddress(token, network);
  return address !== '0x0000000000000000000000000000000000000000';
}

// Get available tokens for a network
export function getAvailableTokens(network: NetworkId): TokenSymbol[] {
  return (Object.keys(SUPPORTED_TOKENS) as TokenSymbol[]).filter((token) =>
    isTokenAvailable(token, network)
  );
}

// Get available networks for a token
export function getAvailableNetworks(token: TokenSymbol): NetworkId[] {
  return (Object.keys(SUPPORTED_NETWORKS) as NetworkId[]).filter((network) =>
    isTokenAvailable(token, network)
  );
}
