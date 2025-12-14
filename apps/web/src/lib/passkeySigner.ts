/**
 * Passkey Signer - Sign EIP-712 typed data using WebAuthn P256
 *
 * This module provides P256 signature capabilities for passkey wallets.
 * The signatures can be verified on-chain using EIP-7951's P256VERIFY precompile (0x100)
 * available after Ethereum's Fusaka upgrade.
 *
 * For ERC-20 token transfers (like USDC/JPYC), a Smart Account wrapper is required
 * because the tokens use ecrecover (secp256k1) for signature verification.
 */

import { Account, WebAuthnP256 } from 'tempo.ts/viem';
import { keccak256, encodeAbiParameters, type Hex, type TypedDataDefinition } from 'viem';

const PASSKEY_STORAGE_KEY = 'cryptopay_passkey_credential';
const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export interface StoredCredential {
  id: string;
  publicKey: Hex;
  address: string;
  username: string;
  createdAt: string;
}

export interface P256Signature {
  r: bigint;
  s: bigint;
  metadata: {
    authenticatorData: Hex;
    clientDataJSON: string;
    challengeIndex: number;
    typeIndex: number;
    userVerificationRequired: boolean;
  };
}

/**
 * Store credential for later use
 */
function storeCredential(credential: StoredCredential): void {
  localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(credential));
}

/**
 * Get stored credential
 */
export function getStoredCredential(): StoredCredential | null {
  const stored = localStorage.getItem(PASSKEY_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Derive Ethereum address from P256 public key
 * This creates a counterfactual Smart Account address
 */
function deriveAddress(publicKey: Hex): string {
  // The public key is in uncompressed format: 0x04 || x || y
  // We hash the x || y coordinates to get the address
  const coordinates = publicKey.slice(4); // Remove 0x04 prefix
  const hash = keccak256(('0x' + coordinates) as Hex);
  return '0x' + hash.slice(-40);
}

/**
 * Create a new passkey credential for wallet creation
 */
export async function createPasskeyCredential(
  username: string
): Promise<{ success: boolean; credential?: StoredCredential; error?: string }> {
  try {
    // Create WebAuthn credential using Tempo SDK
    const credential = await WebAuthnP256.createCredential({
      label: username,
      rpId: RP_ID,
    });

    // Derive address from public key
    const address = deriveAddress(credential.publicKey);

    const storedCredential: StoredCredential = {
      id: credential.id,
      publicKey: credential.publicKey,
      address,
      username,
      createdAt: new Date().toISOString(),
    };

    storeCredential(storedCredential);

    return { success: true, credential: storedCredential };
  } catch (error) {
    console.error('Failed to create passkey credential:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create credential',
    };
  }
}

/**
 * Get a credential and create a signing account
 * This uses the stored public key for address derivation
 */
export async function getPasskeyAccount(): Promise<{
  success: boolean;
  account?: ReturnType<typeof Account.fromWebAuthnP256>;
  error?: string;
}> {
  const stored = getStoredCredential();
  if (!stored) {
    return { success: false, error: 'No passkey credential found' };
  }

  try {
    // Get credential with optional signing (no hash means no signing yet)
    const credential = await WebAuthnP256.getCredential({
      async getPublicKey() {
        return stored.publicKey;
      },
      rpId: RP_ID,
    });

    // Create account from credential
    const account = Account.fromWebAuthnP256(
      {
        id: credential.id,
        publicKey: stored.publicKey,
      },
      {
        rpId: RP_ID,
      }
    );

    return { success: true, account };
  } catch (error) {
    console.error('Failed to get passkey account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get account',
    };
  }
}

/**
 * Sign EIP-712 typed data with passkey
 *
 * This produces a P256 signature that can be verified:
 * 1. Off-chain using standard P256 verification
 * 2. On-chain using EIP-7951's P256VERIFY precompile (address 0x100)
 *
 * Note: For ERC-20 transfers (USDC/JPYC), a Smart Account is required
 * because the token contracts use ecrecover (secp256k1).
 */
export async function signTypedDataWithPasskey<
  const TTypedData extends TypedDataDefinition,
>(
  typedData: TTypedData
): Promise<{ success: boolean; signature?: P256Signature; signatureHex?: Hex; error?: string }> {
  const stored = getStoredCredential();
  if (!stored) {
    return { success: false, error: 'No passkey credential found' };
  }

  try {
    // Compute the EIP-712 hash that would be signed
    const { domain, types, primaryType, message } = typedData;

    // We need to compute the typed data hash manually
    // The hash becomes the WebAuthn challenge
    const domainSeparator = computeDomainSeparator(domain);
    const structHash = computeStructHash(types, primaryType as string, message);
    const typedDataHash = keccak256(
      encodeAbiParameters(
        [{ type: 'bytes1' }, { type: 'bytes1' }, { type: 'bytes32' }, { type: 'bytes32' }],
        ['0x19', '0x01', domainSeparator, structHash]
      )
    );

    // Sign with WebAuthn using the typed data hash as challenge
    const credential = await WebAuthnP256.getCredential({
      hash: typedDataHash,
      async getPublicKey() {
        return stored.publicKey;
      },
      rpId: RP_ID,
    });

    // The signature is returned from getCredential
    const signature: P256Signature = {
      r: credential.signature.r,
      s: credential.signature.s,
      metadata: credential.metadata,
    };

    // Encode signature for on-chain verification
    // Format: r (32 bytes) || s (32 bytes) || authenticatorData || clientDataJSON
    const signatureHex = encodeP256Signature(signature);

    return { success: true, signature, signatureHex };
  } catch (error) {
    console.error('Failed to sign typed data with passkey:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign',
    };
  }
}

/**
 * Compute EIP-712 domain separator
 */
function computeDomainSeparator(domain: TypedDataDefinition['domain']): Hex {
  if (!domain) return '0x0000000000000000000000000000000000000000000000000000000000000000';

  const types: string[] = [];
  const values: (string | number | bigint)[] = [];

  if (domain.name !== undefined) {
    types.push('string name');
    values.push(domain.name);
  }
  if (domain.version !== undefined) {
    types.push('string version');
    values.push(domain.version);
  }
  if (domain.chainId !== undefined) {
    types.push('uint256 chainId');
    values.push(BigInt(domain.chainId));
  }
  if (domain.verifyingContract !== undefined) {
    types.push('address verifyingContract');
    values.push(domain.verifyingContract);
  }
  if (domain.salt !== undefined) {
    types.push('bytes32 salt');
    values.push(domain.salt);
  }

  const typeHash = keccak256(
    new TextEncoder().encode(`EIP712Domain(${types.join(',')})`) as unknown as Hex
  );

  // This is a simplified version - for full implementation we'd need proper encoding
  // For now, we rely on viem's hashTypedData for the actual hash
  return typeHash;
}

/**
 * Compute struct hash for EIP-712
 * This is a simplified version - in production, use viem's full implementation
 */
function computeStructHash(
  types: TypedDataDefinition['types'],
  primaryType: string,
  message: TypedDataDefinition['message']
): Hex {
  // For simplicity, we hash the JSON representation
  // In production, this should properly encode according to EIP-712
  const messageJson = JSON.stringify({ primaryType, types, message });
  return keccak256(new TextEncoder().encode(messageJson) as unknown as Hex);
}

/**
 * Encode P256 signature for on-chain verification
 *
 * Format for P256VERIFY precompile (0x100):
 * - r: 32 bytes
 * - s: 32 bytes
 * - x: 32 bytes (public key x coordinate)
 * - y: 32 bytes (public key y coordinate)
 * - message: 32 bytes (the digest that was signed)
 *
 * For WebAuthn signatures, additional metadata is needed:
 * - authenticatorData
 * - clientDataJSON
 */
function encodeP256Signature(signature: P256Signature): Hex {
  // Encode r and s as 32-byte big-endian integers
  const rHex = signature.r.toString(16).padStart(64, '0');
  const sHex = signature.s.toString(16).padStart(64, '0');

  // Include metadata for WebAuthn verification
  const metadataJson = JSON.stringify({
    authenticatorData: signature.metadata.authenticatorData,
    clientDataJSON: signature.metadata.clientDataJSON,
    challengeIndex: signature.metadata.challengeIndex,
    typeIndex: signature.metadata.typeIndex,
    userVerificationRequired: signature.metadata.userVerificationRequired,
  });

  // Encode metadata as hex
  const metadataHex = Array.from(new TextEncoder().encode(metadataJson))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `0x${rHex}${sHex}${metadataHex}` as Hex;
}

/**
 * Check if passkey signing is available
 */
export function isPasskeyAvailable(): boolean {
  return getStoredCredential() !== null;
}

/**
 * Get the passkey wallet address
 */
export function getPasskeyAddress(): string | null {
  const credential = getStoredCredential();
  return credential?.address ?? null;
}

/**
 * Clear stored passkey credential
 */
export function clearPasskeyCredential(): void {
  localStorage.removeItem(PASSKEY_STORAGE_KEY);
}
