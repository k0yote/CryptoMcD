import type { Address, Hex } from 'viem';
import type { NetworkId, TokenSymbol } from '../constants';

/**
 * x402 Protocol Types
 * Based on: https://github.com/coinbase/x402
 */

/** Payment scheme supported by the protocol */
export type PaymentScheme = 'eip3009' | 'exact';

/** Payment requirement returned in HTTP 402 response */
export interface PaymentRequirement {
  /** Payment scheme (e.g., 'eip3009' for gasless transfers) */
  scheme: PaymentScheme;
  /** Network identifier */
  network: NetworkId;
  /** Token to pay with */
  token: TokenSymbol;
  /** Amount in token's smallest unit (e.g., wei for 18 decimals) */
  amount: string;
  /** Recipient address (store/merchant) */
  recipient: Address;
  /** Unique payment ID for tracking */
  paymentId: string;
  /** Unix timestamp when payment expires */
  expiresAt: number;
  /** Optional: Resource being accessed */
  resource?: string;
  /** Optional: Additional metadata */
  metadata?: Record<string, unknown>;
}

/** EIP-3009 transferWithAuthorization parameters */
export interface EIP3009Authorization {
  /** Token holder (payer) */
  from: Address;
  /** Recipient address */
  to: Address;
  /** Transfer amount */
  value: bigint;
  /** Unix timestamp - transfer not valid before this time */
  validAfter: bigint;
  /** Unix timestamp - transfer not valid after this time */
  validBefore: bigint;
  /** Unique nonce to prevent replay attacks */
  nonce: Hex;
}

/** Signed EIP-3009 authorization */
export interface SignedEIP3009Authorization extends EIP3009Authorization {
  /** ECDSA signature components */
  v: number;
  r: Hex;
  s: Hex;
}

/** Payment payload sent in PAYMENT-SIGNATURE header */
export interface PaymentPayload {
  /** Original payment requirement */
  requirement: PaymentRequirement;
  /** Signed authorization based on scheme */
  authorization: SignedEIP3009Authorization;
  /** Payer's address */
  payer: Address;
  /** Timestamp when payment was created */
  createdAt: number;
}

/** Facilitator verify request */
export interface VerifyRequest {
  payload: PaymentPayload;
}

/** Facilitator verify response */
export interface VerifyResponse {
  valid: boolean;
  error?: string;
}

/** Facilitator settle request */
export interface SettleRequest {
  payload: PaymentPayload;
}

/** Facilitator settle response */
export interface SettleResponse {
  success: boolean;
  transactionHash?: Hex;
  error?: string;
}

/** Payment status */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

/** Payment record for history */
export interface PaymentRecord {
  id: string;
  paymentId: string;
  status: PaymentStatus;
  amount: string;
  token: TokenSymbol;
  network: NetworkId;
  payer: Address;
  recipient: Address;
  transactionHash?: Hex;
  createdAt: number;
  completedAt?: number;
  error?: string;
}
