import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import verify from './routes/verify';
import settle from './routes/settle';
import { checkFacilitatorBalance } from './eip3009/transfer';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*', // Facilitator is internal service
    allowHeaders: ['Content-Type'],
  })
);

// Health check with facilitator status
app.get('/health', async (c) => {
  try {
    // Check facilitator balance on Base Sepolia (default testnet)
    const balance = await checkFacilitatorBalance('base-sepolia');

    return c.json({
      status: 'ok',
      facilitator: {
        address: balance.address,
        balanceWei: balance.balance.toString(),
        hasSufficientGas: balance.sufficient,
      },
    });
  } catch (error) {
    return c.json({
      status: 'error',
      error: 'Failed to check facilitator status',
    });
  }
});

// Routes
app.route('/verify', verify);
app.route('/settle', settle);

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Facilitator error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = parseInt(process.env.PORT || '3003', 10);

console.log(`🔐 Facilitator starting on http://localhost:${port}`);

// Startup check
checkFacilitatorBalance('base-sepolia')
  .then((balance) => {
    console.log(`💰 Facilitator address: ${balance.address}`);
    console.log(`⛽ Gas balance: ${Number(balance.balance) / 1e18} ETH`);
    if (!balance.sufficient) {
      console.warn('⚠️  Warning: Low gas balance, may fail to process payments');
    }
  })
  .catch((error) => {
    console.warn('⚠️  Could not check facilitator balance:', error.message);
    console.warn('   Make sure FACILITATOR_PRIVATE_KEY is set');
  });

serve({
  fetch: app.fetch,
  port,
});
