import { verifyTypedData, type Address } from 'viem';
import {
  type PaymentPayload,
  type NetworkId,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  getTokenAddress,
  SUPPORTED_NETWORKS,
} from '@cryptopay/shared';
import { getPublicClient } from '../chains/config';

interface VerifyResult {
  valid: boolean;
  error?: string;
}

/**
 * Get EIP-712 domain for a token contract
 */
async function getTokenDomain(tokenAddress: Address, network: NetworkId) {
  const client = getPublicClient(network);
  const chainId = SUPPORTED_NETWORKS[network].chainId;

  // Read token name and version from contract
  // USDC uses 'USD Coin' and '2' typically
  try {
    const [name, version] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: [
          {
            inputs: [],
            name: 'name',
            outputs: [{ type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'name',
      }),
      client.readContract({
        address: tokenAddress,
        abi: [
          {
            inputs: [],
            name: 'version',
            outputs: [{ type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'version',
      }).catch(() => '2'), // Default to '2' if version() doesn't exist
    ]);

    return {
      name: name as string,
      version: version as string,
      chainId,
      verifyingContract: tokenAddress,
    };
  } catch (error) {
    console.error('Failed to get token domain:', error);
    throw new Error('Failed to read token contract');
  }
}

/**
 * Check if authorization nonce has been used
 */
async function isNonceUsed(
  tokenAddress: Address,
  authorizer: Address,
  nonce: `0x${string}`,
  network: NetworkId
): Promise<boolean> {
  const client = getPublicClient(network);

  try {
    const used = await client.readContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [
            { name: 'authorizer', type: 'address' },
            { name: 'nonce', type: 'bytes32' },
          ],
          name: 'authorizationState',
          outputs: [{ type: 'bool' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'authorizationState',
      args: [authorizer, nonce],
    });

    return used as boolean;
  } catch {
    // If authorizationState doesn't exist, assume nonce is not used
    return false;
  }
}

/**
 * Verify an EIP-3009 payment signature
 */
export async function verifyPayment(payload: PaymentPayload): Promise<VerifyResult> {
  const { requirement, authorization, payer } = payload;
  const { network, token, amount, recipient } = requirement;

  // 1. Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (now > requirement.expiresAt) {
    return { valid: false, error: 'Payment request expired' };
  }

  // 2. Get token address
  const tokenAddress = getTokenAddress(token, network);
  if (tokenAddress === '0x0000000000000000000000000000000000000000') {
    return { valid: false, error: `Token ${token} not available on ${network}` };
  }

  // 3. Verify authorization parameters match requirement
  if (authorization.from.toLowerCase() !== payer.toLowerCase()) {
    return { valid: false, error: 'Authorization from address mismatch' };
  }
  if (authorization.to.toLowerCase() !== recipient.toLowerCase()) {
    return { valid: false, error: 'Authorization to address mismatch' };
  }
  if (authorization.value.toString() !== amount) {
    return { valid: false, error: 'Authorization amount mismatch' };
  }

  // 4. Verify validity window
  const validAfter = Number(authorization.validAfter);
  const validBefore = Number(authorization.validBefore);
  if (now < validAfter) {
    return { valid: false, error: 'Authorization not yet valid' };
  }
  if (now > validBefore) {
    return { valid: false, error: 'Authorization expired' };
  }

  // 5. Check if nonce is already used
  const nonceUsed = await isNonceUsed(tokenAddress, authorization.from, authorization.nonce, network);
  if (nonceUsed) {
    return { valid: false, error: 'Authorization nonce already used' };
  }

  // 6. Verify EIP-712 signature
  try {
    const domain = await getTokenDomain(tokenAddress, network);

    const valid = await verifyTypedData({
      address: authorization.from,
      domain,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: 'TransferWithAuthorization',
      message: {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value,
        validAfter: authorization.validAfter,
        validBefore: authorization.validBefore,
        nonce: authorization.nonce,
      },
      signature: `0x${authorization.r.slice(2)}${authorization.s.slice(2)}${authorization.v.toString(16).padStart(2, '0')}`,
    });

    if (!valid) {
      return { valid: false, error: 'Invalid signature' };
    }
  } catch (error) {
    console.error('Signature verification failed:', error);
    return { valid: false, error: 'Signature verification failed' };
  }

  return { valid: true };
}
