/**
 * Stripe Checkout Integration
 * Uses Stripe Checkout for card payments
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Backend API URL for creating checkout sessions
const API_URL = import.meta.env.VITE_API_URL || '';

let stripePromise: Promise<Stripe | null> | null = null;

// Initialize Stripe
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise || Promise.resolve(null);
}

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!STRIPE_PUBLISHABLE_KEY && !!API_URL;
}

export interface CheckoutItem {
  id: string;
  name: string;
  price: number; // in USD
  quantity: number;
  image?: string;
}

export interface CreateCheckoutSessionRequest {
  items: CheckoutItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe Checkout session via backend API
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  if (!API_URL) {
    throw new Error('API URL not configured');
  }

  const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Failed to create checkout session' }));
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Redirect to Stripe Checkout URL
 */
export function redirectToCheckout(url: string): void {
  window.location.href = url;
}

/**
 * Create checkout session and redirect in one step
 */
export async function initiateStripeCheckout(
  items: CheckoutItem[],
  successUrl?: string,
  cancelUrl?: string
): Promise<void> {
  const baseUrl = window.location.origin;

  const session = await createCheckoutSession({
    items,
    successUrl: successUrl || `${baseUrl}?payment=success`,
    cancelUrl: cancelUrl || `${baseUrl}?payment=cancelled`,
  });

  if (!session.url) {
    throw new Error('No checkout URL returned from Stripe');
  }

  redirectToCheckout(session.url);
}

/**
 * Demo mode: Simulate Stripe checkout without actual payment
 * Use this when Stripe is not configured
 */
export async function simulateStripeCheckout(
  items: CheckoutItem[],
  onSuccess: () => void,
  onCancel: () => void
): Promise<{ showModal: boolean; onConfirm: () => void; onCancel: () => void }> {
  return {
    showModal: true,
    onConfirm: () => {
      // Simulate processing delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
    },
    onCancel,
  };
}
