import type { Context, Next } from 'hono';
import type { PaymentRequirement, PaymentPayload, SettleResponse } from '@cryptopay/shared';

const FACILITATOR_URL = process.env.FACILITATOR_URL || 'http://localhost:3002';

interface X402Options {
  /** Function to generate payment requirement for a request */
  getPaymentRequirement: (c: Context) => PaymentRequirement | null;
  /** Function called after successful payment */
  onPaymentSuccess?: (c: Context, payload: PaymentPayload, response: SettleResponse) => void;
}

/**
 * x402 Payment Middleware for Hono
 *
 * Implements HTTP 402 Payment Required flow:
 * 1. Check for PAYMENT-SIGNATURE header
 * 2. If missing, return 402 with payment requirements
 * 3. If present, verify and settle payment via facilitator
 * 4. On success, proceed to route handler
 */
export function x402Middleware(options: X402Options) {
  return async (c: Context, next: Next) => {
    const paymentSignature = c.req.header('X-PAYMENT-SIGNATURE');

    // Check if payment is required for this request
    const requirement = options.getPaymentRequirement(c);
    if (!requirement) {
      // No payment required, proceed
      return next();
    }

    if (!paymentSignature) {
      // No payment provided, return 402 Payment Required
      return c.json(
        {
          error: 'Payment Required',
          requirements: [requirement],
        },
        402,
        {
          'X-PAYMENT-REQUIRED': Buffer.from(JSON.stringify([requirement])).toString('base64'),
        }
      );
    }

    // Parse payment payload
    let payload: PaymentPayload;
    try {
      payload = JSON.parse(Buffer.from(paymentSignature, 'base64').toString('utf-8'));
    } catch {
      return c.json({ error: 'Invalid payment signature format' }, 400);
    }

    // Verify payment matches requirement
    if (payload.requirement.paymentId !== requirement.paymentId) {
      return c.json({ error: 'Payment ID mismatch' }, 400);
    }

    // Settle payment via facilitator
    try {
      const response = await fetch(`${FACILITATOR_URL}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });

      const result: SettleResponse = await response.json();

      if (!result.success) {
        return c.json({ error: result.error || 'Payment settlement failed' }, 402);
      }

      // Payment successful
      c.set('payment', { payload, result });

      if (options.onPaymentSuccess) {
        options.onPaymentSuccess(c, payload, result);
      }

      return next();
    } catch (error) {
      console.error('Facilitator error:', error);
      return c.json({ error: 'Payment processing error' }, 500);
    }
  };
}

/**
 * Helper to create a payment requirement
 */
export function createPaymentRequirement(
  params: Omit<PaymentRequirement, 'paymentId' | 'expiresAt'> & {
    expiresInSeconds?: number;
  }
): PaymentRequirement {
  const { expiresInSeconds = 900, ...rest } = params;
  return {
    ...rest,
    paymentId: crypto.randomUUID(),
    expiresAt: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
}
