import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { baseSepolia, polygonAmoy, sepolia, avalancheFuji } from 'viem/chains';
import type { NetworkId } from '@cryptopay/shared';
import {
  createSignerFromEnv,
  getSignerDescription,
  type Signer,
  LocalSigner,
} from '../signers';

// Chain configurations for viem (testnets only)
export const VIEM_CHAINS = {
  sepolia: sepolia,
  'base-sepolia': baseSepolia,
  'polygon-amoy': polygonAmoy,
  'avalanche-fuji': avalancheFuji,
} as const;

// Cached signer instance
let cachedSigner: Signer | null = null;

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

/**
 * Get the configured signer instance
 * Uses cached instance for subsequent calls
 */
export function getSigner(): Signer {
  if (!cachedSigner) {
    cachedSigner = createSignerFromEnv();
    console.log(`🔐 Signer initialized: ${getSignerDescription(cachedSigner)}`);
  }
  return cachedSigner;
}

/**
 * Reset cached signer (useful for testing)
 */
export function resetSigner(): void {
  cachedSigner = null;
}

// Get public client for reading blockchain state
export function getPublicClient(network: NetworkId) {
  const chain = VIEM_CHAINS[network];
  return createPublicClient({
    chain,
    transport: http(getRpcUrl(network)),
  });
}

/**
 * Get wallet client for sending transactions
 * Only works with LocalSigner - KMS signers require manual signing
 */
export function getWalletClient(network: NetworkId) {
  const signer = getSigner();

  // For local signer, we can use the account directly
  if (signer instanceof LocalSigner) {
    const chain = VIEM_CHAINS[network];
    return createWalletClient({
      account: signer.getAccount(),
      chain,
      transport: http(getRpcUrl(network)),
    });
  }

  // For KMS signers, we need to use custom transaction signing
  throw new Error(
    `Wallet client is not supported for ${signer.type} signer. ` +
      'Use signAndSendTransaction() for KMS signers.'
  );
}

/**
 * Get facilitator account address
 */
export async function getFacilitatorAddress(): Promise<Address> {
  const signer = getSigner();
  return signer.getAddress();
}

/**
 * Get facilitator address synchronously (for backward compatibility)
 * Only works with LocalSigner
 * @deprecated Use getFacilitatorAddress() instead
 */
export function getFacilitatorAddressSync(): Address {
  const signer = getSigner();

  if (signer instanceof LocalSigner) {
    return signer.getAccount().address;
  }

  throw new Error(
    `Synchronous address retrieval is not supported for ${signer.type} signer. ` +
      'Use getFacilitatorAddress() instead.'
  );
}
