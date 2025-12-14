/**
 * EIP-3009 Gasless Payment Implementation
 * User signs typed data, facilitator executes transaction
 *
 * Supports both:
 * - External wallets (secp256k1 signatures via wagmi)
 * - Passkey wallets (P256 signatures via WebAuthn)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  parseUnits,
  keccak256,
  encodeAbiParameters,
  type Address,
  type Hex,
} from 'viem';
import { baseSepolia, polygonAmoy, sepolia, avalancheFuji } from 'viem/chains';
import {
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  generateNonce,
  getValidityWindow,
  EIP3009_ABI,
  type PaymentPayload,
  type PaymentRequirement,
  type SignedEIP3009Authorization,
} from '@cryptopay/shared';
import {
  SUPPORTED_TOKENS,
  SUPPORTED_NETWORKS,
  STORE_ADDRESS,
  type NetworkId,
  type TokenSymbol,
  getTokenAddress,
} from './payment-config';
import { WebAuthnP256 } from 'tempo.ts/viem';
import { getStoredCredential } from './passkeySigner';

// Chain mapping
const CHAINS = {
  sepolia,
  'base-sepolia': baseSepolia,
  'polygon-amoy': polygonAmoy,
  'avalanche-fuji': avalancheFuji,
} as const;

// Facilitator API URL
const FACILITATOR_URL = import.meta.env.VITE_FACILITATOR_URL || 'http://localhost:3003';

interface EIP3009SignResult {
  success: boolean;
  payload?: PaymentPayload;
  error?: string;
}

interface SettleResult {
  success: boolean;
  transactionHash?: Hex;
  error?: string;
}

/**
 * Get EIP-712 domain for a token on a network
 */
async function getTokenDomain(
  tokenAddress: Address,
  network: NetworkId
): Promise<{ name: string; version: string; chainId: number; verifyingContract: Address }> {
  const chain = CHAINS[network];
  const publicClient = createPublicClient({
    chain,
    transport: http(SUPPORTED_NETWORKS[network].rpcUrl),
  });

  // Read token name and version from contract
  const [name, version] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: EIP3009_ABI,
      functionName: 'name',
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: EIP3009_ABI,
      functionName: 'version',
    }).catch(() => '1'), // Default to '1' if version() not implemented
  ]);

  return {
    name: name as string,
    version: version as string,
    chainId: chain.id,
    verifyingContract: tokenAddress,
  };
}

/**
 * Create and sign EIP-3009 authorization
 * User signs typed data (no gas cost)
 */
export async function createEIP3009Authorization(
  from: Address,
  amount: string,
  token: TokenSymbol,
  network: NetworkId,
  paymentId: string
): Promise<EIP3009SignResult> {
  try {
    // Check if window.ethereum exists
    if (!window.ethereum) {
      return { success: false, error: 'No wallet found' };
    }

    const chain = CHAINS[network];
    const tokenAddress = getTokenAddress(token, network) as Address;
    const decimals = SUPPORTED_TOKENS[token].decimals;
    const value = parseUnits(amount, decimals);
    const to = STORE_ADDRESS as Address;

    // Get validity window (15 minutes)
    const { validAfter, validBefore } = getValidityWindow(900);
    const nonce = generateNonce();

    // Get EIP-712 domain
    const domain = await getTokenDomain(tokenAddress, network);

    // Create wallet client for signing
    const walletClient = createWalletClient({
      chain,
      transport: custom(window.ethereum),
      account: from,
    });

    // Sign typed data (EIP-712)
    const signature = await walletClient.signTypedData({
      account: from,
      domain,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: 'TransferWithAuthorization',
      message: {
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
      },
    });

    // Parse signature into v, r, s components
    const r = `0x${signature.slice(2, 66)}` as Hex;
    const s = `0x${signature.slice(66, 130)}` as Hex;
    const v = parseInt(signature.slice(130, 132), 16);

    const authorization: SignedEIP3009Authorization = {
      from,
      to,
      value,
      validAfter,
      validBefore,
      nonce,
      v,
      r,
      s,
    };

    const requirement: PaymentRequirement = {
      scheme: 'eip3009',
      network,
      token,
      amount: value.toString(),
      recipient: to,
      paymentId,
      expiresAt: Number(validBefore),
    };

    const payload: PaymentPayload = {
      requirement,
      authorization,
      payer: from,
      createdAt: Math.floor(Date.now() / 1000),
    };

    return { success: true, payload };
  } catch (error) {
    console.error('EIP-3009 signing failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
        return { success: false, error: 'Signature rejected by user' };
      }
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to sign authorization' };
  }
}

/**
 * Extended payment payload for passkey wallets
 * Includes P256 signature data for off-chain or on-chain (EIP-7951) verification
 */
export interface PasskeyPaymentPayload extends PaymentPayload {
  /** Indicates this is a passkey (P256) signed payment */
  isPasskeyPayment: true;
  /** P256 signature components */
  p256Signature: {
    r: string; // Hex string
    s: string; // Hex string
  };
  /** WebAuthn metadata for signature verification */
  webauthnMetadata: {
    authenticatorData: Hex;
    clientDataJSON: string;
    challengeIndex: number;
    typeIndex: number;
    userVerificationRequired: boolean;
  };
  /** User's P256 public key for verification */
  publicKey: Hex;
}

const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

/**
 * Create and sign EIP-3009-style authorization using passkey (P256)
 *
 * Note: Since token contracts use ecrecover (secp256k1), this P256 signature
 * must be verified either:
 * 1. Off-chain by the facilitator
 * 2. On-chain via EIP-7951's P256VERIFY precompile (0x100)
 *
 * For demo purposes, the facilitator verifies the signature and executes
 * a transfer from its pre-funded account.
 */
export async function createPasskeyEIP3009Authorization(
  from: Address,
  amount: string,
  token: TokenSymbol,
  network: NetworkId,
  paymentId: string
): Promise<EIP3009SignResult & { payload?: PasskeyPaymentPayload }> {
  try {
    // Get stored credential
    const credential = getStoredCredential();
    if (!credential) {
      return { success: false, error: 'No passkey credential found' };
    }

    const chain = CHAINS[network];
    const tokenAddress = getTokenAddress(token, network) as Address;
    const decimals = SUPPORTED_TOKENS[token].decimals;
    const value = parseUnits(amount, decimals);
    const to = STORE_ADDRESS as Address;

    // Get validity window (15 minutes)
    const { validAfter, validBefore } = getValidityWindow(900);
    const nonce = generateNonce();

    // Get EIP-712 domain
    const domain = await getTokenDomain(tokenAddress, network);

    // Create EIP-712 typed data hash manually
    // This is what we sign with the passkey
    const domainSeparator = computeDomainSeparator(domain);
    const message = {
      from,
      to,
      value,
      validAfter,
      validBefore,
      nonce,
    };
    const structHash = computeTransferAuthorizationHash(message);

    // Final EIP-712 hash
    const typedDataHash = keccak256(
      encodeAbiParameters(
        [{ type: 'bytes' }],
        [`0x1901${domainSeparator.slice(2)}${structHash.slice(2)}`]
      )
    );

    console.log('[Passkey] Signing typed data hash:', typedDataHash);

    // Sign with WebAuthn using Tempo SDK
    const signResult = await WebAuthnP256.getCredential({
      hash: typedDataHash,
      async getPublicKey() {
        return credential.publicKey;
      },
      rpId: RP_ID,
    });

    console.log('[Passkey] Signature obtained:', signResult.signature);

    // Create authorization with dummy v, r, s (since token contract won't verify P256)
    // The actual P256 signature is in p256Signature
    const authorization: SignedEIP3009Authorization = {
      from,
      to,
      value,
      validAfter,
      validBefore,
      nonce,
      // Dummy values - P256 signature is in separate field
      v: 0,
      r: '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
      s: '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
    };

    const requirement: PaymentRequirement = {
      scheme: 'eip3009',
      network,
      token,
      amount: value.toString(),
      recipient: to,
      paymentId,
      expiresAt: Number(validBefore),
    };

    const payload: PasskeyPaymentPayload = {
      requirement,
      authorization,
      payer: from,
      createdAt: Math.floor(Date.now() / 1000),
      isPasskeyPayment: true,
      p256Signature: {
        r: signResult.signature.r.toString(16).padStart(64, '0'),
        s: signResult.signature.s.toString(16).padStart(64, '0'),
      },
      webauthnMetadata: signResult.metadata,
      publicKey: credential.publicKey,
    };

    return { success: true, payload };
  } catch (error) {
    console.error('Passkey EIP-3009 signing failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('User') || error.message.includes('cancel')) {
        return { success: false, error: 'Signature rejected by user' };
      }
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to sign with passkey' };
  }
}

/**
 * Compute EIP-712 domain separator
 */
function computeDomainSeparator(domain: {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
}): Hex {
  const typeHash = keccak256(
    new TextEncoder().encode(
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    ) as unknown as Hex
  );

  const nameHash = keccak256(new TextEncoder().encode(domain.name) as unknown as Hex);
  const versionHash = keccak256(new TextEncoder().encode(domain.version) as unknown as Hex);

  return keccak256(
    encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'address' },
      ],
      [typeHash, nameHash, versionHash, BigInt(domain.chainId), domain.verifyingContract]
    )
  );
}

/**
 * Compute struct hash for TransferWithAuthorization
 */
function computeTransferAuthorizationHash(message: {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
}): Hex {
  const typeHash = keccak256(
    new TextEncoder().encode(
      'TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)'
    ) as unknown as Hex
  );

  return keccak256(
    encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'address' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'bytes32' },
      ],
      [
        typeHash,
        message.from,
        message.to,
        message.value,
        message.validAfter,
        message.validBefore,
        message.nonce,
      ]
    )
  );
}

/**
 * Custom JSON serializer that converts BigInt to string
 */
function serializeWithBigInt(obj: unknown): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

/**
 * Send signed authorization to facilitator for execution
 * Facilitator pays gas, executes transferWithAuthorization
 */
export async function settlePayment(payload: PaymentPayload): Promise<SettleResult> {
  try {
    const response = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: serializeWithBigInt({ payload }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Settlement failed',
      };
    }

    return {
      success: result.success,
      transactionHash: result.transactionHash,
      error: result.error,
    };
  } catch (error) {
    console.error('Settlement request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Execute gasless payment flow
 * 1. User signs EIP-3009 authorization (no gas)
 * 2. Send to facilitator
 * 3. Facilitator executes transaction (pays gas)
 */
export async function executeGaslessPayment(
  from: Address,
  amount: string,
  token: TokenSymbol,
  network: NetworkId,
  paymentId: string
): Promise<SettleResult> {
  // Step 1: Create and sign authorization
  const signResult = await createEIP3009Authorization(from, amount, token, network, paymentId);

  if (!signResult.success || !signResult.payload) {
    return {
      success: false,
      error: signResult.error || 'Failed to create authorization',
    };
  }

  // Step 2: Send to facilitator for execution
  const settleResult = await settlePayment(signResult.payload);

  return settleResult;
}
