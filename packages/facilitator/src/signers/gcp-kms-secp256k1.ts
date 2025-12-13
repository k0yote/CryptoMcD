import { KeyManagementServiceClient } from '@google-cloud/kms';
import {
  type Address,
  type Hash,
  type Hex,
  type SignableMessage,
  type TypedDataDefinition,
  hashMessage,
  hashTypedData,
  serializeSignature,
  toHex,
} from 'viem';
import { publicKeyToAddress } from 'viem/utils';
import type { Signer, GcpKmsSecp256k1Config } from './types';

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
 * GCP KMS secp256k1 signer
 * Uses Google Cloud KMS for secure key management with native Ethereum signing
 */
export class GcpKmsSecp256k1Signer implements Signer {
  readonly type = 'gcp-kms-secp256k1' as const;
  private readonly client: KeyManagementServiceClient;
  private readonly keyVersionName: string;
  private cachedAddress: Address | null = null;
  private cachedPublicKey: Uint8Array | null = null;

  constructor(config: GcpKmsSecp256k1Config) {
    this.client = new KeyManagementServiceClient();
    this.keyVersionName = this.client.cryptoKeyVersionPath(
      config.projectId,
      config.locationId,
      config.keyRingId,
      config.keyId,
      config.keyVersion || '1'
    );
  }

  async getAddress(): Promise<Address> {
    if (this.cachedAddress) {
      return this.cachedAddress;
    }

    const publicKey = await this.getPublicKey();
    // Remove the 0x04 prefix (uncompressed public key marker) and hash
    const publicKeyWithoutPrefix = publicKey.slice(1);
    this.cachedAddress = publicKeyToAddress(toHex(publicKeyWithoutPrefix));
    return this.cachedAddress;
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
   * Get the public key from GCP KMS
   */
  private async getPublicKey(): Promise<Uint8Array> {
    if (this.cachedPublicKey) {
      return this.cachedPublicKey;
    }

    const [publicKey] = await this.client.getPublicKey({
      name: this.keyVersionName,
    });

    if (!publicKey.pem) {
      throw new Error('Failed to get public key from KMS');
    }

    // Parse the PEM-encoded public key
    this.cachedPublicKey = this.parsePublicKeyPem(publicKey.pem);
    return this.cachedPublicKey;
  }

  /**
   * Parse PEM-encoded public key to raw bytes
   */
  private parsePublicKeyPem(pem: string): Uint8Array {
    // Remove PEM headers and decode base64
    const base64 = pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');

    const der = Buffer.from(base64, 'base64');

    // For secp256k1, the public key is at the end of the DER structure
    // Skip the ASN.1 header (typically 23 bytes for secp256k1)
    // The public key is 65 bytes (0x04 + 32 bytes X + 32 bytes Y)
    const publicKeyStart = der.length - 65;
    return new Uint8Array(der.slice(publicKeyStart));
  }

  /**
   * Sign a hash using GCP KMS
   */
  private async signHash(hash: Hex): Promise<Hex> {
    const hashBytes = hexToBytes(hash);

    // Sign with KMS
    const [signResponse] = await this.client.asymmetricSign({
      name: this.keyVersionName,
      digest: {
        sha256: hashBytes,
      },
    });

    if (!signResponse.signature) {
      throw new Error('Failed to sign with KMS');
    }

    // Convert DER signature to Ethereum format
    const signatureBytes =
      signResponse.signature instanceof Uint8Array
        ? signResponse.signature
        : new Uint8Array(signResponse.signature as unknown as ArrayBuffer);
    const { r, s } = this.parseDerSignature(signatureBytes);

    // Recover the v value by trying both possibilities
    const publicKey = await this.getPublicKey();
    const v = await this.recoverV(hash, r, s, publicKey);

    return serializeSignature({
      r: toHex(r),
      s: toHex(s),
      v: BigInt(v),
    });
  }

  /**
   * Parse DER-encoded signature to r and s values
   */
  private parseDerSignature(der: Uint8Array): { r: Uint8Array; s: Uint8Array } {
    // DER signature format: 0x30 [length] 0x02 [r-length] [r] 0x02 [s-length] [s]
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

    // Remove leading zero if present (DER encoding adds it for positive numbers)
    if (r[0] === 0x00 && r.length > 32) {
      r = r.slice(1);
    }

    // Pad r to 32 bytes if needed
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

    // Pad s to 32 bytes if needed
    if (s.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(s, 32 - s.length);
      s = padded;
    }

    // Ensure s is in the lower half of the curve order (EIP-2)
    const curveOrder = BigInt(
      '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141'
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
   * Recover the v value by trying ecrecover with both v=27 and v=28
   */
  private async recoverV(
    hash: Hex,
    r: Uint8Array,
    s: Uint8Array,
    publicKey: Uint8Array
  ): Promise<number> {
    const { recoverPublicKey } = await import('viem');

    for (const v of [27, 28]) {
      try {
        const signature = serializeSignature({
          r: toHex(r),
          s: toHex(s),
          v: BigInt(v),
        });

        const recovered = await recoverPublicKey({
          hash,
          signature,
        });

        // Compare recovered public key with our public key
        const recoveredBytes = Buffer.from(recovered.slice(2), 'hex');
        if (this.comparePublicKeys(recoveredBytes, publicKey)) {
          return v;
        }
      } catch {
        continue;
      }
    }

    throw new Error('Failed to recover v value');
  }

  /**
   * Compare two public keys
   */
  private comparePublicKeys(a: Buffer | Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
