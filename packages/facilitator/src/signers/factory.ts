import type { Hex } from 'viem';
import type { Signer, SignerConfig, SignerType } from './types';
import { LocalSigner } from './local';
import { GcpKmsSecp256k1Signer } from './gcp-kms-secp256k1';
import { GcpKmsP256Signer } from './gcp-kms-p256';

/**
 * Create a signer from configuration
 */
export function createSigner(config: SignerConfig): Signer {
  switch (config.type) {
    case 'local':
      return new LocalSigner(config);
    case 'gcp-kms-secp256k1':
      return new GcpKmsSecp256k1Signer(config);
    case 'gcp-kms-p256':
      return new GcpKmsP256Signer(config);
    default:
      throw new Error(`Unknown signer type: ${(config as any).type}`);
  }
}

/**
 * Create a signer from environment variables
 */
export function createSignerFromEnv(): Signer {
  const signerType = (process.env.SIGNER_TYPE || 'local') as SignerType;

  switch (signerType) {
    case 'local': {
      const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('FACILITATOR_PRIVATE_KEY environment variable is required for local signer');
      }
      return new LocalSigner({
        type: 'local',
        privateKey: privateKey as Hex,
      });
    }

    case 'gcp-kms-secp256k1': {
      const projectId = process.env.GCP_PROJECT_ID;
      const locationId = process.env.GCP_KMS_LOCATION || 'global';
      const keyRingId = process.env.GCP_KMS_KEY_RING;
      const keyId = process.env.GCP_KMS_KEY_ID;
      const keyVersion = process.env.GCP_KMS_KEY_VERSION || '1';

      if (!projectId || !keyRingId || !keyId) {
        throw new Error(
          'GCP_PROJECT_ID, GCP_KMS_KEY_RING, and GCP_KMS_KEY_ID are required for GCP KMS secp256k1 signer'
        );
      }

      return new GcpKmsSecp256k1Signer({
        type: 'gcp-kms-secp256k1',
        projectId,
        locationId,
        keyRingId,
        keyId,
        keyVersion,
      });
    }

    case 'gcp-kms-p256': {
      const projectId = process.env.GCP_PROJECT_ID;
      const locationId = process.env.GCP_KMS_LOCATION || 'global';
      const keyRingId = process.env.GCP_KMS_KEY_RING;
      const keyId = process.env.GCP_KMS_KEY_ID;
      const keyVersion = process.env.GCP_KMS_KEY_VERSION || '1';
      const smartAccountAddress = process.env.SMART_ACCOUNT_ADDRESS as Hex | undefined;

      if (!projectId || !keyRingId || !keyId) {
        throw new Error(
          'GCP_PROJECT_ID, GCP_KMS_KEY_RING, and GCP_KMS_KEY_ID are required for GCP KMS P-256 signer'
        );
      }

      return new GcpKmsP256Signer({
        type: 'gcp-kms-p256',
        projectId,
        locationId,
        keyRingId,
        keyId,
        keyVersion,
        smartAccountAddress,
      });
    }

    default:
      throw new Error(`Unknown SIGNER_TYPE: ${signerType}. Valid options: local, gcp-kms-secp256k1, gcp-kms-p256`);
  }
}

/**
 * Get signer configuration description for logging
 */
export function getSignerDescription(signer: Signer): string {
  switch (signer.type) {
    case 'local':
      return 'Local Private Key';
    case 'gcp-kms-secp256k1':
      return 'GCP KMS (secp256k1)';
    case 'gcp-kms-p256':
      return 'GCP KMS (P-256/secp256r1)';
    default:
      return 'Unknown';
  }
}
