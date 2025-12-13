/**
 * Payment Configuration
 * Store address and supported tokens/networks
 */

// Store wallet address - receives all payments
// This should be set via environment variable in production
export const STORE_ADDRESS =
  import.meta.env.VITE_STORE_ADDRESS || '0x0000000000000000000000000000000000000000';

// Supported networks
export const SUPPORTED_NETWORKS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    color: '#627EEA',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    color: '#627EEA',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    color: '#0052FF',
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
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    color: '#8247E5',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  },
  'polygon-amoy': {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    color: '#8247E5',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    color: '#E84142',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
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

// Supported tokens per network
// USDC: Ethereum, Base, Polygon, Avalanche (all testnets)
// JPYC: Ethereum, Polygon, Avalanche (NOT on Base)
export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
    addresses: {
      ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      'polygon-amoy': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
      avalanche: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      'avalanche-fuji': '0x5425890298aed601595a70AB815c96711a31Bc65',
    } as Record<NetworkId, string>,
  },
  JPYC: {
    symbol: 'JPYC',
    name: 'JPY Coin',
    decimals: 18,
    icon: '💴',
    addresses: {
      ethereum: '0x2370f9d504c7a6E775bf6E14B3F12846b594cD53',
      sepolia: '0x0000000000000000000000000000000000000000', // Not available on Sepolia
      base: '0x0000000000000000000000000000000000000000', // Not available on Base
      'base-sepolia': '0x0000000000000000000000000000000000000000', // Not available on Base Sepolia
      polygon: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB',
      'polygon-amoy': '0xAc5e2848c22052D5C674892562Fd900e512D5428',
      avalanche: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB',
      'avalanche-fuji': '0x0000000000000000000000000000000000000000', // Not available on Fuji testnet
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
