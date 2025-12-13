import { Hono } from 'hono';
import { x402Middleware, createPaymentRequirement } from '../middleware/x402';

const STORE_ADDRESS = (process.env.STORE_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

export interface Product {
  id: string;
  name: string;
  nameKey: string;
  price: number; // USD price
  image: string;
}

const products: Product[] = [
  { id: '1', name: 'Big Mac', nameKey: 'products.bigMac', price: 5.99, image: '🍔' },
  { id: '2', name: 'Quarter Pounder', nameKey: 'products.quarterPounder', price: 6.49, image: '🍔' },
  { id: '3', name: 'McChicken', nameKey: 'products.mcChicken', price: 4.99, image: '🍗' },
  { id: '4', name: 'Filet-O-Fish', nameKey: 'products.filetOFish', price: 5.49, image: '🐟' },
  { id: '5', name: 'McDouble', nameKey: 'products.mcDouble', price: 3.99, image: '🍔' },
  { id: '6', name: 'Chicken McNuggets', nameKey: 'products.chickenMcNuggets', price: 5.99, image: '🍗' },
  { id: '7', name: 'French Fries', nameKey: 'products.frenchFries', price: 2.99, image: '🍟' },
  { id: '8', name: 'Coca-Cola', nameKey: 'products.cocaCola', price: 1.99, image: '🥤' },
  { id: '9', name: 'McFlurry', nameKey: 'products.mcFlurry', price: 3.49, image: '🍦' },
];

const app = new Hono();

// GET /products - List all products (no payment required)
app.get('/', (c) => {
  return c.json({ products });
});

// GET /products/:id - Get single product (no payment required)
app.get('/:id', (c) => {
  const product = products.find((p) => p.id === c.req.param('id'));
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  return c.json({ product });
});

// POST /products/order - Create order (payment required)
app.post(
  '/order',
  x402Middleware({
    getPaymentRequirement: (c) => {
      // Get order total from request body
      const body = c.req.raw.clone();
      // For demo, we'll compute requirement based on header hint
      const totalHint = c.req.header('X-Order-Total');
      const total = totalHint ? parseFloat(totalHint) : 0;

      if (total <= 0) {
        return null; // No payment required for invalid orders
      }

      // Convert USD to USDC (1:1 for stablecoins)
      // Amount in smallest unit (6 decimals for USDC)
      const amountInSmallestUnit = Math.floor(total * 1_000_000).toString();

      return createPaymentRequirement({
        scheme: 'eip3009',
        network: 'base-sepolia', // Default to testnet
        token: 'USDC',
        amount: amountInSmallestUnit,
        recipient: STORE_ADDRESS,
        resource: '/products/order',
      });
    },
    onPaymentSuccess: (c, payload, result) => {
      console.log('Payment successful:', {
        paymentId: payload.requirement.paymentId,
        transactionHash: result.transactionHash,
        amount: payload.requirement.amount,
      });
    },
  }),
  async (c) => {
    const body = await c.req.json<{ items: Array<{ productId: string; quantity: number }> }>();
    const payment = c.get('payment');

    // Create order
    const order = {
      id: crypto.randomUUID(),
      items: body.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          product,
          quantity: item.quantity,
        };
      }),
      payment: payment
        ? {
            paymentId: payment.payload.requirement.paymentId,
            transactionHash: payment.result.transactionHash,
            amount: payment.payload.requirement.amount,
            token: payment.payload.requirement.token,
            network: payment.payload.requirement.network,
          }
        : null,
      createdAt: new Date().toISOString(),
    };

    return c.json({ order }, 201);
  }
);

export default app;
