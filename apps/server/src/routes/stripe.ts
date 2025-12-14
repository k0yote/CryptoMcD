import { Hono } from 'hono';
import Stripe from 'stripe';

const stripe = new Hono();

// Initialize Stripe with secret key
function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CreateCheckoutSessionRequest {
  items: CheckoutItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

/**
 * Create a Stripe Checkout Session
 * POST /api/stripe/create-checkout-session
 */
stripe.post('/create-checkout-session', async (c) => {
  const stripeClient = getStripeClient();

  if (!stripeClient) {
    return c.json(
      {
        error: 'Stripe not configured',
        message: 'STRIPE_SECRET_KEY environment variable is not set',
      },
      500
    );
  }

  try {
    const body = await c.req.json<CreateCheckoutSessionRequest>();
    const { items, successUrl, cancelUrl, customerEmail } = body;

    if (!items || items.length === 0) {
      return c.json({ error: 'No items provided' }, 400);
    }

    // Convert items to Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          ...(item.image && { images: [item.image] }),
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(customerEmail && { customer_email: customerEmail }),
    });

    return c.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return c.json({ error: message }, 500);
  }
});

/**
 * Webhook endpoint for Stripe events
 * POST /api/stripe/webhook
 */
stripe.post('/webhook', async (c) => {
  const stripeClient = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeClient) {
    return c.json({ error: 'Stripe not configured' }, 500);
  }

  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  try {
    const rawBody = await c.req.text();

    let event: Stripe.Event;

    if (webhookSecret) {
      event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // For testing without webhook signature verification
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Payment successful for session:', session.id);
        // TODO: Fulfill the order, update database, send email, etc.
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    return c.json({ error: message }, 400);
  }
});

/**
 * Check Stripe configuration status
 * GET /api/stripe/status
 */
stripe.get('/status', (c) => {
  const stripeClient = getStripeClient();
  return c.json({
    configured: !!stripeClient,
    message: stripeClient ? 'Stripe is configured' : 'STRIPE_SECRET_KEY not set',
  });
});

export default stripe;
