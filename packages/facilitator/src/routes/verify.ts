import { Hono } from 'hono';
import type { VerifyRequest, VerifyResponse } from '@cryptopay/shared';
import { verifyPayment } from '../eip3009/verify';

const app = new Hono();

/**
 * POST /verify
 * Verify a payment signature without settling
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json<VerifyRequest>();

    if (!body.payload) {
      return c.json<VerifyResponse>({ valid: false, error: 'Missing payload' }, 400);
    }

    const result = await verifyPayment(body.payload);

    return c.json<VerifyResponse>(result);
  } catch (error) {
    console.error('Verify error:', error);
    return c.json<VerifyResponse>(
      { valid: false, error: 'Verification failed' },
      500
    );
  }
});

export default app;
