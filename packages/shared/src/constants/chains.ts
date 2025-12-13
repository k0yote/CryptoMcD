import type { Address } from 'viem';

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  color: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet?: boolean;
}

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
    isTestnet: true,
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
    isTestnet: true,
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
    isTestnet: true,
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
    isTestnet: true,
  },
} as const satisfies Record<string, NetworkConfig>;

export type NetworkId = keyof typeof SUPPORTED_NETWORKS;

export const CHAIN_ID_TO_NETWORK: Record<number, NetworkId> = Object.entries(
  SUPPORTED_NETWORKS
).reduce(
  (acc, [networkId, config]) => {
    acc[config.chainId] = networkId as NetworkId;
    return acc;
  },
  {} as Record<number, NetworkId>
);

export const DEFAULT_NETWORK: NetworkId = 'base-sepolia';

export function getNetworkConfig(network: NetworkId): NetworkConfig {
  return SUPPORTED_NETWORKS[network];
}

export function getNetworkByChainId(chainId: number): NetworkId | undefined {
  return CHAIN_ID_TO_NETWORK[chainId];
}

export const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
