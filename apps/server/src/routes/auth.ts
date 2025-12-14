/**
 * SIWE (Sign-In with Ethereum) Authentication Routes
 * EIP-4361 implementation for wallet-based authentication
 */

import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { SiweMessage, generateNonce } from 'siwe';
import { SignJWT, jwtVerify } from 'jose';
import { getAddress } from 'viem';

const auth = new Hono();

// JWT secret - in production, use a strong secret from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cryptopay-jwt-secret-change-in-production'
);

// Nonce storage (in production, use Redis or database)
const nonceStore = new Map<string, { nonce: string; createdAt: number }>();

// Clean up expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of nonceStore.entries()) {
    // Nonces expire after 10 minutes
    if (now - value.createdAt > 10 * 60 * 1000) {
      nonceStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /api/auth/siwe/nonce
 * Generate a nonce for SIWE message
 */
auth.get('/siwe/nonce', (c) => {
  const nonce = generateNonce();
  const sessionId = crypto.randomUUID();

  // Store nonce with session ID
  nonceStore.set(sessionId, { nonce, createdAt: Date.now() });

  // Set session cookie to track nonce
  setCookie(c, 'siwe_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 10 * 60, // 10 minutes
    path: '/',
  });

  return c.json({ nonce });
});

/**
 * POST /api/auth/siwe/verify
 * Verify SIWE signature and issue JWT
 */
auth.post('/siwe/verify', async (c) => {
  try {
    const { message, signature } = await c.req.json<{
      message: string;
      signature: string;
    }>();

    if (!message || !signature) {
      return c.json({ success: false, error: 'Missing message or signature' }, 400);
    }

    // Get session ID from cookie
    const sessionId = getCookie(c, 'siwe_session');
    if (!sessionId) {
      return c.json({ success: false, error: 'No session found. Please get a nonce first.' }, 401);
    }

    // Get stored nonce
    const storedSession = nonceStore.get(sessionId);
    if (!storedSession) {
      return c.json({ success: false, error: 'Session expired. Please get a new nonce.' }, 401);
    }

    // Parse and verify SIWE message
    const siweMessage = new SiweMessage(message);

    // Verify nonce matches
    if (siweMessage.nonce !== storedSession.nonce) {
      return c.json({ success: false, error: 'Invalid nonce' }, 401);
    }

    // Verify the signature
    const { data: verifiedMessage } = await siweMessage.verify({
      signature,
      nonce: storedSession.nonce,
    });

    // Clean up used nonce
    nonceStore.delete(sessionId);
    deleteCookie(c, 'siwe_session');

    // Get checksummed address
    const address = getAddress(verifiedMessage.address);

    // Create JWT token
    const token = await new SignJWT({
      address,
      chainId: verifiedMessage.chainId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Token valid for 7 days
      .setSubject(address)
      .sign(JWT_SECRET);

    // Set auth cookie
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return c.json({
      success: true,
      address,
      chainId: verifiedMessage.chainId,
    });
  } catch (error) {
    console.error('SIWE verification failed:', error);

    if (error instanceof Error) {
      return c.json({ success: false, error: error.message }, 401);
    }

    return c.json({ success: false, error: 'Verification failed' }, 401);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
auth.get('/me', async (c) => {
  try {
    const token = getCookie(c, 'auth_token');

    if (!token) {
      return c.json({ authenticated: false }, 401);
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return c.json({
      authenticated: true,
      address: payload.address as string,
      chainId: payload.chainId as number,
    });
  } catch (error) {
    // Token invalid or expired
    deleteCookie(c, 'auth_token');
    return c.json({ authenticated: false }, 401);
  }
});

/**
 * POST /api/auth/logout
 * Clear authentication
 */
auth.post('/logout', (c) => {
  deleteCookie(c, 'auth_token');
  deleteCookie(c, 'siwe_session');
  return c.json({ success: true });
});

/**
 * Middleware to verify JWT and attach user to context
 * Use this in protected routes
 */
export async function authMiddleware(c: any, next: any) {
  try {
    const token = getCookie(c, 'auth_token');

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Attach user info to context
    c.set('user', {
      address: payload.address as string,
      chainId: payload.chainId as number,
    });

    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
}

export default auth;
