import { Hono } from 'hono';
import type { SettleRequest, SettleResponse } from '@cryptopay/shared';
import { verifyPayment } from '../eip3009/verify';
import { executeTransferWithAuthorization } from '../eip3009/transfer';

const app = new Hono();

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

    // First verify the payment
    const verifyResult = await verifyPayment(body.payload);
    if (!verifyResult.valid) {
      return c.json<SettleResponse>(
        { success: false, error: verifyResult.error },
        400
      );
    }

    // Execute the transfer
    const settleResult = await executeTransferWithAuthorization(body.payload);

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
