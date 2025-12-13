import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, polygonAmoy, sepolia, avalancheFuji } from 'viem/chains';
import type { NetworkId } from '@cryptopay/shared';

// Chain configurations for viem (testnets only)
export const VIEM_CHAINS = {
  sepolia: sepolia,
  'base-sepolia': baseSepolia,
  'polygon-amoy': polygonAmoy,
  'avalanche-fuji': avalancheFuji,
} as const;

// RPC URLs from environment
function getRpcUrl(network: NetworkId): string {
  const envKey = `RPC_URL_${network.toUpperCase().replace('-', '_')}`;
  const rpcUrl = process.env[envKey];

  if (rpcUrl) return rpcUrl;

  // Fallback to default RPCs (testnets only)
  const defaults: Record<NetworkId, string> = {
    sepolia: 'https://rpc.sepolia.org',
    'base-sepolia': 'https://sepolia.base.org',
    'polygon-amoy': 'https://rpc-amoy.polygon.technology',
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
