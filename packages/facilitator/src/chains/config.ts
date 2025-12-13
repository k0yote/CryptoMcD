import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia, polygon, polygonAmoy, mainnet, sepolia, avalanche, avalancheFuji } from 'viem/chains';
import type { NetworkId } from '@cryptopay/shared';

// Chain configurations for viem
export const VIEM_CHAINS = {
  ethereum: mainnet,
  sepolia: sepolia,
  base: base,
  'base-sepolia': baseSepolia,
  polygon: polygon,
  'polygon-amoy': polygonAmoy,
  avalanche: avalanche,
  'avalanche-fuji': avalancheFuji,
} as const;

// RPC URLs from environment
function getRpcUrl(network: NetworkId): string {
  const envKey = `RPC_URL_${network.toUpperCase().replace('-', '_')}`;
  const rpcUrl = process.env[envKey];

  if (rpcUrl) return rpcUrl;

  // Fallback to default RPCs
  const defaults: Record<NetworkId, string> = {
    ethereum: 'https://eth.llamarpc.com',
    sepolia: 'https://rpc.sepolia.org',
    base: 'https://mainnet.base.org',
    'base-sepolia': 'https://sepolia.base.org',
    polygon: 'https://polygon-rpc.com',
    'polygon-amoy': 'https://rpc-amoy.polygon.technology',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    'avalanche-fuji': 'https://api.avax-test.network/ext/bc/C/rpc',
  };

  return defaults[network];
}

// Get public client for reading blockchain state
export function getPublicClient(network: NetworkId) {
  const chain = VIEM_CHAINS[network];
  return createPublicClient({
    chain,
    transport: http(getRpcUrl(network)),
  });
}

// Get wallet client for sending transactions
export function getWalletClient(network: NetworkId) {
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FACILITATOR_PRIVATE_KEY environment variable is required');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const chain = VIEM_CHAINS[network];

  return createWalletClient({
    account,
    chain,
    transport: http(getRpcUrl(network)),
  });
}

// Get facilitator account address
export function getFacilitatorAddress(): `0x${string}` {
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FACILITATOR_PRIVATE_KEY environment variable is required');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return account.address;
}
