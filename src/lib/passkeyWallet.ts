/**
 * Passkey Wallet - Generate Ethereum wallet using WebAuthn/Passkey
 *
 * Uses secp256r1 (P-256) curve which is now supported on Ethereum via EIP-7212/RIP-7212
 * after the Fusaka upgrade (EIP-7951).
 *
 * The wallet is a Smart Account that can verify P-256 signatures on-chain.
 */

import { keccak256, encodePacked, getAddress } from 'viem';

const RP_NAME = 'CryptoPay Wallet';
const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const WALLET_STORAGE_KEY = 'cryptopay_passkey_wallet';

export interface PasskeyWallet {
  id: string;
  credentialId: string;
  publicKey: string;
  publicKeyBytes: Uint8Array;
  address: string;
  username: string;
  createdAt: string;
  isSmartAccount: boolean;
}

interface StoredWallet {
  id: string;
  credentialId: string;
  publicKey: string;
  publicKeyBytesBase64: string;
  address: string;
  username: string;
  createdAt: string;
  isSmartAccount: boolean;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function generateUserId(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Extract the raw public key coordinates from SPKI format
 * The public key from getPublicKey() is in SPKI (SubjectPublicKeyInfo) format
 */
async function extractPublicKeyCoordinates(spkiKey: ArrayBuffer): Promise<{ x: Uint8Array; y: Uint8Array } | null> {
  try {
    // Import the SPKI key using Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      spkiKey,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['verify']
    );

    // Export as JWK to get x and y coordinates
    const jwk = await crypto.subtle.exportKey('jwk', cryptoKey);

    if (!jwk.x || !jwk.y) {
      return null;
    }

    // JWK x and y are base64url encoded
    const x = base64UrlToUint8Array(jwk.x);
    const y = base64UrlToUint8Array(jwk.y);

    return { x, y };
  } catch (error) {
    console.error('Failed to extract public key coordinates:', error);

    // Fallback: try to parse SPKI directly
    return extractPublicKeyFromSPKI(spkiKey);
  }
}

/**
 * Convert base64url to Uint8Array
 */
function base64UrlToUint8Array(base64url: string): Uint8Array {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' if needed
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Fallback: Extract public key coordinates directly from SPKI format
 */
function extractPublicKeyFromSPKI(spkiKey: ArrayBuffer): { x: Uint8Array; y: Uint8Array } | null {
  try {
    const key = new Uint8Array(spkiKey);

    // SPKI format for P-256:
    // - SEQUENCE (outer)
    //   - SEQUENCE (algorithm identifier)
    //     - OID for ecPublicKey (1.2.840.10045.2.1)
    //     - OID for P-256 (1.2.840.10045.3.1.7)
    //   - BIT STRING (public key point)
    //     - 0x00 (unused bits)
    //     - 0x04 (uncompressed point indicator)
    //     - x coordinate (32 bytes)
    //     - y coordinate (32 bytes)

    // Look for 0x04 marker (uncompressed point) followed by 64 bytes
    for (let i = 0; i < key.length - 65; i++) {
      if (key[i] === 0x04) {
        const remaining = key.length - i - 1;
        if (remaining >= 64) {
          const x = key.slice(i + 1, i + 33);
          const y = key.slice(i + 33, i + 65);

          // Validate: x and y should not be all zeros
          const xIsValid = x.some(b => b !== 0);
          const yIsValid = y.some(b => b !== 0);

          if (xIsValid && yIsValid) {
            return { x, y };
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Derive Ethereum address from P-256 public key
 *
 * For Smart Accounts, we create a deterministic counterfactual address
 * based on the public key. The actual smart contract will be deployed
 * on first transaction.
 */
function deriveAddressFromPublicKey(publicKeyX: Uint8Array, publicKeyY: Uint8Array): string {
  // Concatenate x and y coordinates
  const publicKeyBytes = new Uint8Array(64);
  publicKeyBytes.set(publicKeyX, 0);
  publicKeyBytes.set(publicKeyY, 32);

  // Hash the public key using keccak256
  const publicKeyHex = uint8ArrayToHex(publicKeyBytes);
  const hash = keccak256(publicKeyHex as `0x${string}`);

  // Take the last 20 bytes (40 hex characters) as the address
  const address = '0x' + hash.slice(-40);

  return getAddress(address);
}

/**
 * Create a new Passkey Wallet
 * Generates a new P-256 keypair using WebAuthn and derives an Ethereum address
 */
export async function createPasskeyWallet(username: string): Promise<{ success: boolean; wallet?: PasskeyWallet; error?: string }> {
  if (!window.PublicKeyCredential) {
    return { success: false, error: 'WebAuthn is not supported' };
  }

  try {
    const challenge = generateChallenge();
    const userId = generateUserId();

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: RP_NAME,
        id: RP_ID,
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        // P-256 (secp256r1) - now supported on Ethereum via EIP-7951
        { alg: -7, type: 'public-key' },   // ES256 (ECDSA with P-256)
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      timeout: 60000,
      attestation: 'direct', // We want to get the public key
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Credential creation cancelled' };
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const publicKeyBuffer = response.getPublicKey();

    if (!publicKeyBuffer) {
      return { success: false, error: 'Failed to get public key' };
    }

    // Extract x and y coordinates from the public key
    const coords = await extractPublicKeyCoordinates(publicKeyBuffer);
    if (!coords) {
      return { success: false, error: 'Failed to extract public key coordinates' };
    }

    // Derive Ethereum address from public key
    const address = deriveAddressFromPublicKey(coords.x, coords.y);

    // Create public key bytes (uncompressed format: 04 || x || y)
    const publicKeyBytes = new Uint8Array(65);
    publicKeyBytes[0] = 0x04;
    publicKeyBytes.set(coords.x, 1);
    publicKeyBytes.set(coords.y, 33);

    const wallet: PasskeyWallet = {
      id: credential.id,
      credentialId: arrayBufferToBase64(credential.rawId),
      publicKey: uint8ArrayToHex(publicKeyBytes),
      publicKeyBytes,
      address,
      username,
      createdAt: new Date().toISOString(),
      isSmartAccount: true,
    };

    // Store wallet
    saveWallet(wallet);

    return { success: true, wallet };
  } catch (error) {
    console.error('Failed to create passkey wallet:', error);

    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'User cancelled the operation' };
      }
      if (error.name === 'SecurityError') {
        return { success: false, error: 'Security error: HTTPS required' };
      }
    }

    return { success: false, error: 'Failed to create wallet' };
  }
}

/**
 * Sign a message with Passkey
 * Returns a P-256 signature that can be verified on-chain via EIP-7212
 */
export async function signWithPasskey(message: string): Promise<{ success: boolean; signature?: string; error?: string }> {
  const wallet = getStoredWallet();
  if (!wallet) {
    return { success: false, error: 'No wallet found' };
  }

  try {
    // Hash the message
    const messageBytes = new TextEncoder().encode(message);
    const messageHash = await crypto.subtle.digest('SHA-256', messageBytes);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(messageHash),
      rpId: RP_ID,
      timeout: 60000,
      userVerification: 'required',
      allowCredentials: [{
        id: base64ToUint8Array(wallet.credentialId),
        type: 'public-key',
        transports: ['internal'],
      }],
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Signing cancelled' };
    }

    const response = assertion.response as AuthenticatorAssertionResponse;
    const signature = arrayBufferToBase64(response.signature);

    return { success: true, signature };
  } catch (error) {
    console.error('Failed to sign with passkey:', error);
    return { success: false, error: 'Failed to sign message' };
  }
}

/**
 * Authenticate with existing Passkey Wallet
 */
export async function authenticatePasskeyWallet(): Promise<{ success: boolean; wallet?: PasskeyWallet; error?: string }> {
  const storedWallet = getStoredWallet();
  if (!storedWallet) {
    return { success: false, error: 'No wallet found' };
  }

  try {
    const challenge = generateChallenge();

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: RP_ID,
      timeout: 60000,
      userVerification: 'required',
      allowCredentials: [{
        id: base64ToUint8Array(storedWallet.credentialId),
        type: 'public-key',
        transports: ['internal'],
      }],
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Authentication cancelled' };
    }

    // Convert stored wallet back to PasskeyWallet format
    const wallet: PasskeyWallet = {
      ...storedWallet,
      publicKeyBytes: base64ToUint8Array(storedWallet.publicKeyBytesBase64),
    };

    return { success: true, wallet };
  } catch (error) {
    console.error('Failed to authenticate passkey wallet:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

function saveWallet(wallet: PasskeyWallet): void {
  const storedWallet: StoredWallet = {
    id: wallet.id,
    credentialId: wallet.credentialId,
    publicKey: wallet.publicKey,
    publicKeyBytesBase64: arrayBufferToBase64(wallet.publicKeyBytes.buffer),
    address: wallet.address,
    username: wallet.username,
    createdAt: wallet.createdAt,
    isSmartAccount: wallet.isSmartAccount,
  };
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(storedWallet));
}

function getStoredWallet(): StoredWallet | null {
  const stored = localStorage.getItem(WALLET_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function hasPasskeyWallet(): boolean {
  return getStoredWallet() !== null;
}

export function getPasskeyWalletAddress(): string | null {
  const wallet = getStoredWallet();
  return wallet?.address ?? null;
}

export function getPasskeyWalletInfo(): { address: string; username: string; isSmartAccount: boolean } | null {
  const wallet = getStoredWallet();
  if (!wallet) return null;
  return {
    address: wallet.address,
    username: wallet.username,
    isSmartAccount: wallet.isSmartAccount,
  };
}

export function clearPasskeyWallet(): void {
  localStorage.removeItem(WALLET_STORAGE_KEY);
}
