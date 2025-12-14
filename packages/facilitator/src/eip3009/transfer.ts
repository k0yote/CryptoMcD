import type { Address, Hex } from 'viem';
import { type PaymentPayload, type NetworkId, getTokenAddress, EIP3009_ABI } from '@cryptopay/shared';
import { getPublicClient, getWalletClient, getSigner, getFacilitatorAddress } from '../chains/config';
import { LocalSigner } from '../signers';

interface TransferResult {
  success: boolean;
  transactionHash?: Hex;
  error?: string;
}

/**
 * Execute transferWithAuthorization on behalf of a user
 * The facilitator pays gas, user's tokens are transferred
 */
export async function executeTransferWithAuthorization(
  payload: PaymentPayload
): Promise<TransferResult> {
  const { requirement, authorization } = payload;
  const { network, token } = requirement;

  const tokenAddress = getTokenAddress(token, network);
  const signer = getSigner();

  try {
    const publicClient = getPublicClient(network);

    // For local signer, use wallet client directly
    if (signer instanceof LocalSigner) {
      const walletClient = getWalletClient(network);

      // Prepare transaction
      const { request } = await publicClient.simulateContract({
        address: tokenAddress,
        abi: EIP3009_ABI,
        functionName: 'transferWithAuthorization',
        args: [
          authorization.from,
          authorization.to,
          authorization.value,
          authorization.validAfter,
          authorization.validBefore,
          authorization.nonce,
          authorization.v,
          authorization.r,
          authorization.s,
        ],
        account: walletClient.account,
      });

      // Send transaction
      const hash = await walletClient.writeContract(request);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === 'reverted') {
        return {
          success: false,
          transactionHash: hash,
          error: 'Transaction reverted',
        };
      }

      console.log('Transfer successful:', {
        hash,
        from: authorization.from,
        to: authorization.to,
        value: authorization.value.toString(),
        network,
      });

      return {
        success: true,
        transactionHash: hash,
      };
    }

    // For KMS signers, we need to manually sign and send
    // This is a more complex flow that requires raw transaction signing
    throw new Error(
      `KMS signer transaction execution not yet implemented for ${signer.type}. ` +
        'Please use a local private key signer for now.'
    );
  } catch (error) {
    console.error('Transfer failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Parse common errors
    if (errorMessage.includes('insufficient funds')) {
      return {
        success: false,
        error: 'Facilitator has insufficient gas funds',
      };
    }
    if (errorMessage.includes('nonce')) {
      return {
        success: false,
        error: 'Authorization nonce already used',
      };
    }
    if (errorMessage.includes('balance')) {
      return {
        success: false,
        error: 'Insufficient token balance',
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Execute a passkey payment transfer
 *
 * For passkey wallets, we can't use transferWithAuthorization because:
 * 1. P256 signatures can't be verified by ecrecover (token contract uses secp256k1)
 * 2. The passkey wallet is a counterfactual Smart Account address
 *
 * In production, this would:
 * 1. Deploy the Smart Account if needed
 * 2. Submit a UserOperation to the bundler
 * 3. The Smart Account verifies P256 signature via EIP-7951 precompile
 * 4. Execute the token transfer
 *
 * For demo purposes, the facilitator executes a transfer from its own funded account
 * to simulate what the Smart Account would do.
 */
export async function executePasskeyTransfer(
  payload: PaymentPayload
): Promise<TransferResult> {
  const { requirement } = payload;
  const { network, token } = requirement;

  const tokenAddress = getTokenAddress(token, network);
  const signer = getSigner();

  try {
    const publicClient = getPublicClient(network);

    // For local signer, use wallet client directly
    if (signer instanceof LocalSigner) {
      const walletClient = getWalletClient(network);

      // Execute a regular ERC-20 transfer from facilitator to recipient
      // This simulates what a deployed Smart Account would do after P256 verification
      const { request } = await publicClient.simulateContract({
        address: tokenAddress,
        abi: [
          {
            name: 'transfer',
            type: 'function',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'value', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
          },
        ],
        functionName: 'transfer',
        args: [
          requirement.recipient as Address,
          BigInt(requirement.amount),
        ],
        account: walletClient.account,
      });

      // Send transaction
      const hash = await walletClient.writeContract(request);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === 'reverted') {
        return {
          success: false,
          transactionHash: hash,
          error: 'Transaction reverted',
        };
      }

      console.log('[Passkey] Transfer successful:', {
        hash,
        from: walletClient.account?.address,
        to: requirement.recipient,
        value: requirement.amount,
        network,
        note: 'Facilitator-funded transfer (simulating Smart Account execution)',
      });

      return {
        success: true,
        transactionHash: hash,
      };
    }

    throw new Error('Only local signer is supported for passkey transfers');
  } catch (error) {
    console.error('[Passkey] Transfer failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('insufficient funds')) {
      return {
        success: false,
        error: 'Facilitator has insufficient gas funds',
      };
    }
    if (errorMessage.includes('balance')) {
      return {
        success: false,
        error: 'Facilitator has insufficient token balance',
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if facilitator has enough gas for a network
 */
export async function checkFacilitatorBalance(network: NetworkId): Promise<{
  address: Address;
  balance: bigint;
  sufficient: boolean;
}> {
  const publicClient = getPublicClient(network);
  const address = await getFacilitatorAddress();
  const balance = await publicClient.getBalance({ address });

  // Require at least 0.01 ETH/native token for gas
  const minBalance = BigInt(10_000_000_000_000_000); // 0.01 ETH

  return {
    address,
    balance,
    sufficient: balance >= minBalance,
  };
}
