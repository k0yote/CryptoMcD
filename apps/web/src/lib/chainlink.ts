/**
 * Chainlink Price Feed Integration
 * Fetches real-time JPY/USD exchange rate from Chainlink oracle
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';

// Chainlink AggregatorV3Interface ABI (minimal)
const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'description',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Chainlink Price Feed addresses on Sepolia
export const CHAINLINK_FEEDS = {
  'JPY/USD': '0x8A6af2B75F23831ADc973ce6288e5329F63D86c6',
} as const;

// Cache for price data
interface PriceCache {
  rate: number;
  timestamp: number;
  updatedAt: number;
}

const priceCache: { [key: string]: PriceCache } = {};
const CACHE_TTL_MS = 60000; // 1 minute cache

// Create Sepolia client for Chainlink (always use Sepolia for price feeds)
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
});

export interface PriceFeedResult {
  rate: number; // e.g., 0.0067 for JPY/USD (1 JPY = 0.0067 USD)
  inverseRate: number; // e.g., 149.25 for USD/JPY (1 USD = 149.25 JPY)
  decimals: number;
  updatedAt: Date;
  isStale: boolean;
}

/**
 * Fetch the latest JPY/USD exchange rate from Chainlink
 * Returns the price of 1 JPY in USD
 */
export async function getJpyUsdRate(): Promise<PriceFeedResult> {
  const feedAddress = CHAINLINK_FEEDS['JPY/USD'];
  const cacheKey = 'JPY/USD';

  // Check cache
  const cached = priceCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const rate = cached.rate;
    return {
      rate,
      inverseRate: 1 / rate,
      decimals: 8,
      updatedAt: new Date(cached.updatedAt * 1000),
      isStale: false,
    };
  }

  try {
    // Fetch decimals and latest round data in parallel
    const [decimals, roundData] = await Promise.all([
      sepoliaClient.readContract({
        address: feedAddress as `0x${string}`,
        abi: AGGREGATOR_V3_ABI,
        functionName: 'decimals',
      }),
      sepoliaClient.readContract({
        address: feedAddress as `0x${string}`,
        abi: AGGREGATOR_V3_ABI,
        functionName: 'latestRoundData',
      }),
    ]);

    const [, answer, , updatedAt] = roundData;

    // Convert answer to number with proper decimals
    const rate = parseFloat(formatUnits(answer, decimals));

    // Check if data is stale (older than 1 hour)
    const now = Math.floor(Date.now() / 1000);
    const isStale = now - Number(updatedAt) > 3600;

    // Update cache
    priceCache[cacheKey] = {
      rate,
      timestamp: Date.now(),
      updatedAt: Number(updatedAt),
    };

    console.log('[Chainlink] JPY/USD rate:', rate, 'Updated:', new Date(Number(updatedAt) * 1000));

    return {
      rate,
      inverseRate: 1 / rate,
      decimals,
      updatedAt: new Date(Number(updatedAt) * 1000),
      isStale,
    };
  } catch (error) {
    console.error('[Chainlink] Failed to fetch JPY/USD rate:', error);

    // Return cached value if available, even if stale
    if (cached) {
      return {
        rate: cached.rate,
        inverseRate: 1 / cached.rate,
        decimals: 8,
        updatedAt: new Date(cached.updatedAt * 1000),
        isStale: true,
      };
    }

    // Fallback to approximate rate if no cache
    const fallbackRate = 0.0067; // ~150 JPY per USD
    return {
      rate: fallbackRate,
      inverseRate: 1 / fallbackRate,
      decimals: 8,
      updatedAt: new Date(),
      isStale: true,
    };
  }
}

/**
 * Convert USD amount to JPY using Chainlink rate
 */
export async function convertUsdToJpy(usdAmount: number): Promise<{
  jpyAmount: number;
  rate: number;
  isStale: boolean;
}> {
  const priceData = await getJpyUsdRate();

  // JPY/USD rate gives us how much 1 JPY costs in USD
  // To convert USD to JPY: JPY = USD / (JPY/USD rate)
  const jpyAmount = usdAmount / priceData.rate;

  return {
    jpyAmount, // JPYC has 18 decimals, keep full precision for small amounts
    rate: priceData.inverseRate, // USD/JPY rate for display
    isStale: priceData.isStale,
  };
}

/**
 * Get formatted JPY/USD rate string for display
 */
export async function getFormattedRate(): Promise<string> {
  const priceData = await getJpyUsdRate();
  return `1 USD = ${priceData.inverseRate.toFixed(2)} JPY`;
}
