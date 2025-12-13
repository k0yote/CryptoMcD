import {
  type Address,
  type Hash,
  type Hex,
  type SignableMessage,
  type TypedDataDefinition,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Signer, LocalSignerConfig } from './types';

/**
 * Local private key signer
 * Uses viem's privateKeyToAccount for signing operations
 */
export class LocalSigner implements Signer {
  readonly type = 'local' as const;
  private readonly account: ReturnType<typeof privateKeyToAccount>;

  constructor(config: LocalSignerConfig) {
    this.account = privateKeyToAccount(config.privateKey);
  }

  async getAddress(): Promise<Address> {
    return this.account.address;
  }

  async signMessage(message: SignableMessage): Promise<Hex> {
    return this.account.signMessage({ message });
  }

  async signTypedData<T extends TypedDataDefinition>(typedData: T): Promise<Hex> {
    return this.account.signTypedData(typedData as any);
  }

  async signTransaction(hash: Hash): Promise<Hex> {
    // For raw hash signing, we use signMessage with the hash as raw bytes
    return this.account.signMessage({ message: { raw: hash } });
  }

  /**
   * Get the underlying viem account for use with wallet clients
   */
  getAccount() {
    return this.account;
  }
}
