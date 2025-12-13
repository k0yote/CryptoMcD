import { KeyManagementServiceClient } from '@google-cloud/kms';
import {
  type Address,
  type Hash,
  type Hex,
  type SignableMessage,
  type TypedDataDefinition,
  hashMessage,
  hashTypedData,
  keccak256,
  toHex,
  concat,
} from 'viem';
import type { Signer, GcpKmsP256Config } from './types';

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const buffer = new ArrayBuffer(cleanHex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * GCP KMS P-256 (secp256r1) signer
 *
 * P-256 signatures require on-chain verification via:
 * - EIP-7212 / RIP-7212 precompile (0x0100)
 * - Smart Account with P-256 signature verification
 *
 * This signer is primarily used for Smart Account based wallets
 * that support passkey/WebAuthn authentication.
 */
export class GcpKmsP256Signer implements Signer {
  readonly type = 'gcp-kms-p256' as const;
  private readonly client: KeyManagementServiceClient;
  private readonly keyVersionName: string;
  private cachedPublicKey: { x: Uint8Array; y: Uint8Array } | null = null;

  constructor(private readonly config: GcpKmsP256Config) {
    this.client = new KeyManagementServiceClient();
    this.keyVersionName = this.client.cryptoKeyVersionPath(
      config.projectId,
      config.locationId,
      config.keyRingId,
      config.keyId,
      config.keyVersion || '1'
    );
  }

  /**
   * Get the Ethereum address derived from P-256 public key
   * Note: This is NOT a standard EOA address - it's derived for identification purposes
   * The actual on-chain address should be the Smart Account address
   */
  async getAddress(): Promise<Address> {
    if (this.config.smartAccountAddress) {
      return this.config.smartAccountAddress;
    }

    // Derive an address from the P-256 public key for identification
    const { x, y } = await this.getPublicKeyCoordinates();
    const publicKeyBytes = concat([toHex(x), toHex(y)]);
    const hash = keccak256(publicKeyBytes);
    return `0x${hash.slice(-40)}` as Address;
  }

  async signMessage(message: SignableMessage): Promise<Hex> {
    const hash = hashMessage(message);
    return this.signHash(hash);
  }

  async signTypedData<T extends TypedDataDefinition>(typedData: T): Promise<Hex> {
    const hash = hashTypedData(typedData as any);
    return this.signHash(hash);
  }

  async signTransaction(hash: Hash): Promise<Hex> {
    return this.signHash(hash);
  }

  /**
   * Get the P-256 public key coordinates
   */
  async getPublicKeyCoordinates(): Promise<{ x: Uint8Array; y: Uint8Array }> {
    if (this.cachedPublicKey) {
      return this.cachedPublicKey;
    }

    const [publicKey] = await this.client.getPublicKey({
      name: this.keyVersionName,
    });

    if (!publicKey.pem) {
      throw new Error('Failed to get public key from KMS');
    }

    this.cachedPublicKey = this.parseP256PublicKeyPem(publicKey.pem);
    return this.cachedPublicKey;
  }

  /**
   * Get the raw public key for Smart Account registration
   * Returns concatenated x and y coordinates (64 bytes total)
   */
  async getRawPublicKey(): Promise<Hex> {
    const { x, y } = await this.getPublicKeyCoordinates();
    return concat([toHex(x), toHex(y)]);
  }

  /**
   * Parse PEM-encoded P-256 public key to x, y coordinates
   */
  private parseP256PublicKeyPem(pem: string): { x: Uint8Array; y: Uint8Array } {
    // Remove PEM headers and decode base64
    const base64 = pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');

    const der = Buffer.from(base64, 'base64');

    // For P-256, the public key is 65 bytes: 0x04 + 32 bytes X + 32 bytes Y
    const publicKeyStart = der.length - 65;

    if (der[publicKeyStart] !== 0x04) {
      throw new Error('Expected uncompressed public key format');
    }

    const x = new Uint8Array(der.slice(publicKeyStart + 1, publicKeyStart + 33));
    const y = new Uint8Array(der.slice(publicKeyStart + 33, publicKeyStart + 65));

    return { x, y };
  }

  /**
   * Sign a hash using GCP KMS with P-256
   * Returns signature in format suitable for EIP-7212 / Smart Account verification
   */
  private async signHash(hash: Hex): Promise<Hex> {
    const hashBytes = hexToBytes(hash);

    // Sign with KMS using SHA-256 (P-256 uses SHA-256)
    const [signResponse] = await this.client.asymmetricSign({
      name: this.keyVersionName,
      digest: {
        sha256: hashBytes,
      },
    });

    if (!signResponse.signature) {
      throw new Error('Failed to sign with KMS');
    }

    // Parse DER signature to r and s
    const signatureBytes =
      signResponse.signature instanceof Uint8Array
        ? signResponse.signature
        : new Uint8Array(signResponse.signature as unknown as ArrayBuffer);
    const { r, s } = this.parseDerSignature(signatureBytes);

    // Return signature in format: r (32 bytes) || s (32 bytes)
    // This format is used by EIP-7212 precompile and most Smart Account implementations
    return concat([toHex(r), toHex(s)]);
  }

  /**
   * Parse DER-encoded signature to r and s values
   */
  private parseDerSignature(der: Uint8Array): { r: Uint8Array; s: Uint8Array } {
    let offset = 0;

    if (der[offset++] !== 0x30) {
      throw new Error('Invalid DER signature: expected SEQUENCE');
    }

    // Skip total length
    offset++;

    if (der[offset++] !== 0x02) {
      throw new Error('Invalid DER signature: expected INTEGER for r');
    }

    const rLength = der[offset++];
    let r = der.slice(offset, offset + rLength);
    offset += rLength;

    // Remove leading zero if present
    if (r[0] === 0x00 && r.length > 32) {
      r = r.slice(1);
    }

    // Pad to 32 bytes
    if (r.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(r, 32 - r.length);
      r = padded;
    }

    if (der[offset++] !== 0x02) {
      throw new Error('Invalid DER signature: expected INTEGER for s');
    }

    const sLength = der[offset++];
    let s = der.slice(offset, offset + sLength);

    // Remove leading zero if present
    if (s[0] === 0x00 && s.length > 32) {
      s = s.slice(1);
    }

    // Pad to 32 bytes
    if (s.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(s, 32 - s.length);
      s = padded;
    }

    // For P-256, we may need to normalize s to the lower half of the curve order
    // P-256 curve order: 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
    const curveOrder = BigInt(
      '0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551'
    );
    const halfOrder = curveOrder / 2n;
    const sValue = BigInt(toHex(s));

    if (sValue > halfOrder) {
      const newS = curveOrder - sValue;
      const newSHex = newS.toString(16).padStart(64, '0');
      s = hexToBytes(newSHex);
    }

    return { r, s };
  }

  /**
   * Create signature data for Smart Account UserOperation
   * Includes public key coordinates for verification
   */
  async createUserOpSignature(hash: Hash): Promise<{
    signature: Hex;
    publicKey: { x: Hex; y: Hex };
  }> {
    const signature = await this.signHash(hash);
    const { x, y } = await this.getPublicKeyCoordinates();

    return {
      signature,
      publicKey: {
        x: toHex(x),
        y: toHex(y),
      },
    };
  }
}
