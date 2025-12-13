import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import products from './routes/products';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173'],
    allowHeaders: ['Content-Type', 'X-PAYMENT-SIGNATURE', 'X-Order-Total'],
    exposeHeaders: ['X-PAYMENT-REQUIRED'],
  })
);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/products', products);

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`🚀 Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
