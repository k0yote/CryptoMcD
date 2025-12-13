import type { Address, Hex } from 'viem';
import { type PaymentPayload, type NetworkId, getTokenAddress, EIP3009_ABI } from '@cryptopay/shared';
import { getPublicClient, getWalletClient } from '../chains/config';

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

  try {
    const walletClient = getWalletClient(network);
    const publicClient = getPublicClient(network);

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
 * Check if facilitator has enough gas for a network
 */
export async function checkFacilitatorBalance(network: NetworkId): Promise<{
  address: Address;
  balance: bigint;
  sufficient: boolean;
}> {
  const walletClient = getWalletClient(network);
  const publicClient = getPublicClient(network);

  const address = walletClient.account.address;
  const balance = await publicClient.getBalance({ address });

  // Require at least 0.01 ETH/native token for gas
  const minBalance = BigInt(10_000_000_000_000_000); // 0.01 ETH

  return {
    address,
    balance,
    sufficient: balance >= minBalance,
  };
}
