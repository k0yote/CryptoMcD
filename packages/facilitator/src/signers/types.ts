import type { Address, Hash, Hex, SignableMessage, TypedDataDefinition } from 'viem';

/**
 * Signer type enumeration
 */
export type SignerType = 'local' | 'gcp-kms-secp256k1' | 'gcp-kms-p256';

/**
 * Abstract signer interface for transaction signing
 * Supports both local private keys and cloud KMS
 */
export interface Signer {
  /** Signer type identifier */
  readonly type: SignerType;

  /** Get the signer's Ethereum address */
  getAddress(): Promise<Address>;

  /** Sign a message (EIP-191) */
  signMessage(message: SignableMessage): Promise<Hex>;

  /** Sign typed data (EIP-712) */
  signTypedData<T extends TypedDataDefinition>(typedData: T): Promise<Hex>;

  /** Sign a transaction hash */
  signTransaction(hash: Hash): Promise<Hex>;
}

/**
 * Configuration for local private key signer
 */
export interface LocalSignerConfig {
  type: 'local';
  privateKey: Hex;
}

/**
 * Configuration for GCP KMS secp256k1 signer
 * Uses native Ethereum signing algorithm
 */
export interface GcpKmsSecp256k1Config {
  type: 'gcp-kms-secp256k1';
  projectId: string;
  locationId: string;
  keyRingId: string;
  keyId: string;
  keyVersion?: string;
}

/**
 * Configuration for GCP KMS P-256 signer
 * Requires Smart Account for on-chain verification (EIP-7212)
 */
export interface GcpKmsP256Config {
  type: 'gcp-kms-p256';
  projectId: string;
  locationId: string;
  keyRingId: string;
  keyId: string;
  keyVersion?: string;
  /** Smart Account address that will verify P-256 signatures */
  smartAccountAddress?: Address;
}

/**
 * Union type for all signer configurations
 */
export type SignerConfig = LocalSignerConfig | GcpKmsSecp256k1Config | GcpKmsP256Config;
