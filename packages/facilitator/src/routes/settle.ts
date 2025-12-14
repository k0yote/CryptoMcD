import { Hono } from 'hono';
import type { SettleRequest, SettleResponse, PaymentPayload } from '@cryptopay/shared';
import { verifyPayment } from '../eip3009/verify';
import { executeTransferWithAuthorization, executePasskeyTransfer } from '../eip3009/transfer';

const app = new Hono();

/**
 * Extended payload type for passkey payments
 */
interface PasskeyPaymentPayload extends PaymentPayload {
  isPasskeyPayment: true;
  p256Signature: {
    r: string;
    s: string;
  };
  webauthnMetadata: {
    authenticatorData: string;
    clientDataJSON: string;
    challengeIndex: number;
    typeIndex: number;
    userVerificationRequired: boolean;
  };
  publicKey: string;
}

function isPasskeyPayment(payload: PaymentPayload): payload is PasskeyPaymentPayload {
  return 'isPasskeyPayment' in payload && (payload as PasskeyPaymentPayload).isPasskeyPayment === true;
}

/**
 * POST /settle
 * Verify and execute a payment
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json<SettleRequest>();

    if (!body.payload) {
      return c.json<SettleResponse>({ success: false, error: 'Missing payload' }, 400);
    }

    const payload = body.payload;

    // Check if this is a passkey payment
    if (isPasskeyPayment(payload)) {
      console.log('[Passkey Payment] Processing passkey payment from:', payload.payer);
      console.log('[Passkey Payment] P256 Signature r:', payload.p256Signature.r.slice(0, 20) + '...');
      console.log('[Passkey Payment] Public Key:', payload.publicKey.slice(0, 20) + '...');

      // For passkey payments, we verify the P256 signature
      // In production, this would be done on-chain via EIP-7951's P256VERIFY precompile
      // For demo, we trust the signature and execute a facilitator-funded transfer

      // Execute transfer from facilitator's funds
      const settleResult = await executePasskeyTransfer(payload);

      if (!settleResult.success) {
        return c.json<SettleResponse>(
          { success: false, error: settleResult.error },
          500
        );
      }

      return c.json<SettleResponse>({
        success: true,
        transactionHash: settleResult.transactionHash,
      });
    }

    // Standard EIP-3009 flow for external wallets
    // First verify the payment
    const verifyResult = await verifyPayment(payload);
    if (!verifyResult.valid) {
      return c.json<SettleResponse>(
        { success: false, error: verifyResult.error },
        400
      );
    }

    // Execute the transfer
    const settleResult = await executeTransferWithAuthorization(payload);

    if (!settleResult.success) {
      return c.json<SettleResponse>(
        { success: false, error: settleResult.error },
        500
      );
    }

    return c.json<SettleResponse>({
      success: true,
      transactionHash: settleResult.transactionHash,
    });
  } catch (error) {
    console.error('Settle error:', error);
    return c.json<SettleResponse>(
      { success: false, error: 'Settlement failed' },
      500
    );
  }
});

export default app;
