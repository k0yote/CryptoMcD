/**
 * Payment Utilities
 * EIP-712 signing and ERC-20 transfer for stablecoin payments
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  custom,
  type Address,
  type Hash,
} from 'viem';
import { base, baseSepolia, polygon, polygonAmoy } from 'viem/chains';
import {
  STORE_ADDRESS,
  SUPPORTED_TOKENS,
  SUPPORTED_NETWORKS,
  type NetworkId,
  type TokenSymbol,
  getTokenAddress,
  PAYMENT_EXPIRY_SECONDS,
} from './payment-config';

// Chain mapping
const CHAINS = {
  base,
  'base-sepolia': baseSepolia,
  polygon,
  'polygon-amoy': polygonAmoy,
} as const;

// ERC-20 ABI for transfer and balanceOf
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

export interface PaymentRequest {
  id: string;
  amount: string; // Human readable amount (e.g., "10.00")
  token: TokenSymbol;
  network: NetworkId;
  recipient: Address;
  description?: string;
  expiresAt: number; // Unix timestamp
  createdAt: number;
}

export interface PaymentResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
}

/**
 * Create a payment request
 */
export function createPaymentRequest(
  amount: string,
  token: TokenSymbol,
  network: NetworkId,
  description?: string
): PaymentRequest {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    amount,
    token,
    network,
    recipient: STORE_ADDRESS as Address,
    description,
    expiresAt: now + PAYMENT_EXPIRY_SECONDS,
    createdAt: now,
  };
}

/**
 * Encode payment request to QR data
 */
export function encodePaymentRequestToQR(request: PaymentRequest): string {
  const params = new URLSearchParams({
    id: request.id,
    amount: request.amount,
    token: request.token,
    network: request.network,
    to: request.recipient,
    exp: request.expiresAt.toString(),
  });
  if (request.description) {
    params.set('desc', request.description);
  }
  return `cryptopay:${params.toString()}`;
}

/**
 * Decode QR data to payment request
 */
export function decodeQRToPaymentRequest(qrData: string): PaymentRequest | null {
  try {
    if (!qrData.startsWith('cryptopay:')) {
      return null;
    }

    const params = new URLSearchParams(qrData.slice(10));
    const id = params.get('id');
    const amount = params.get('amount');
    const token = params.get('token') as TokenSymbol;
    const network = params.get('network') as NetworkId;
    const recipient = params.get('to') as Address;
    const expiresAt = parseInt(params.get('exp') || '0', 10);
    const description = params.get('desc') || undefined;

    if (!id || !amount || !token || !network || !recipient || !expiresAt) {
      return null;
    }

    return {
      id,
      amount,
      token,
      network,
      recipient,
      description,
      expiresAt,
      createdAt: 0, // Unknown from QR
    };
  } catch {
    return null;
  }
}

/**
 * Check if payment request is valid (not expired)
 */
export function isPaymentRequestValid(request: PaymentRequest): boolean {
  const now = Math.floor(Date.now() / 1000);
  return request.expiresAt > now;
}

/**
 * Get remaining time for payment request in seconds
 */
export function getPaymentRequestRemainingTime(request: PaymentRequest): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, request.expiresAt - now);
}

/**
 * Get public client for a network
 */
export function getPublicClient(network: NetworkId) {
  const chain = CHAINS[network];
  return createPublicClient({
    chain,
    transport: http(SUPPORTED_NETWORKS[network].rpcUrl),
  });
}

/**
 * Get token balance for an address
 */
export async function getTokenBalance(
  address: Address,
  token: TokenSymbol,
  network: NetworkId
): Promise<string> {
  const client = getPublicClient(network);
  const tokenAddress = getTokenAddress(token, network) as Address;
  const decimals = SUPPORTED_TOKENS[token].decimals;

  const balance = await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  return formatUnits(balance, decimals);
}

/**
 * Check if user has sufficient balance
 */
export async function hasSufficientBalance(
  address: Address,
  amount: string,
  token: TokenSymbol,
  network: NetworkId
): Promise<boolean> {
  const balance = await getTokenBalance(address, token, network);
  return parseFloat(balance) >= parseFloat(amount);
}

/**
 * Execute ERC-20 transfer payment
 * Used for direct wallet payment (user clicks "Pay" button)
 */
export async function executePayment(
  request: PaymentRequest,
  signer: Address
): Promise<PaymentResult> {
  try {
    // Validate request
    if (!isPaymentRequestValid(request)) {
      return { success: false, error: 'Payment request has expired' };
    }

    // Check if window.ethereum exists
    if (!window.ethereum) {
      return { success: false, error: 'No wallet found' };
    }

    const chain = CHAINS[request.network];
    const tokenAddress = getTokenAddress(request.token, request.network) as Address;
    const decimals = SUPPORTED_TOKENS[request.token].decimals;
    const amountInUnits = parseUnits(request.amount, decimals);

    // Create wallet client
    const walletClient = createWalletClient({
      chain,
      transport: custom(window.ethereum),
      account: signer,
    });

    // Check balance
    const hasBalance = await hasSufficientBalance(
      signer,
      request.amount,
      request.token,
      request.network
    );
    if (!hasBalance) {
      return { success: false, error: `Insufficient ${request.token} balance` };
    }

    // Execute transfer
    const txHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [request.recipient, amountInUnits],
    });

    return { success: true, txHash };
  } catch (error) {
    console.error('Payment execution failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
        return { success: false, error: 'Transaction rejected by user' };
      }
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Payment failed' };
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(txHash: Hash, network: NetworkId): Promise<boolean> {
  try {
    const client = getPublicClient(network);
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });
    return receipt.status === 'success';
  } catch {
    return false;
  }
}

/**
 * Get transaction explorer URL
 */
export function getTransactionUrl(txHash: Hash, network: NetworkId): string {
  const explorer = SUPPORTED_NETWORKS[network].explorerUrl;
  return `${explorer}/tx/${txHash}`;
}

/**
 * Format amount with token symbol
 */
export function formatTokenAmount(amount: string, token: TokenSymbol): string {
  const num = parseFloat(amount);
  return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${token}`;
}

/**
 * Convert USD to token amount (simplified - assumes 1:1 for stablecoins)
 * In production, this should use real-time price feeds
 */
export function usdToTokenAmount(usdAmount: number, token: TokenSymbol): string {
  if (token === 'USDC') {
    return usdAmount.toFixed(2);
  }
  if (token === 'JPYC') {
    // Approximate USD to JPY conversion (should use real rate in production)
    const jpyAmount = usdAmount * 150; // ~150 JPY per USD
    return jpyAmount.toFixed(0);
  }
  return usdAmount.toFixed(2);
}
