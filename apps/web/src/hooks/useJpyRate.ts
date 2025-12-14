/**
 * React hook for fetching JPY/USD exchange rate from Chainlink
 */

import { useState, useEffect, useCallback } from 'react';
import { getJpyUsdRate, type PriceFeedResult } from '@/lib/chainlink';

interface UseJpyRateResult {
  rate: number | null; // USD/JPY rate (e.g., 149.25)
  jpyPerUsd: number | null; // Same as rate, for clarity
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  updatedAt: Date | null;
  refetch: () => Promise<void>;
  convertUsdToJpy: (usdAmount: number) => number | null;
}

export function useJpyRate(): UseJpyRateResult {
  const [data, setData] = useState<PriceFeedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getJpyUsdRate();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rate');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();

    // Refresh rate every 60 seconds
    const interval = setInterval(fetchRate, 60000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  const convertUsdToJpy = useCallback(
    (usdAmount: number): number | null => {
      if (!data) return null;
      // JPY = USD / (JPY/USD rate)
      // JPYC has 18 decimals, so we keep full precision for small amounts
      return usdAmount / data.rate;
    },
    [data]
  );

  return {
    rate: data?.inverseRate ?? null,
    jpyPerUsd: data?.inverseRate ?? null,
    isLoading,
    isStale: data?.isStale ?? false,
    error,
    updatedAt: data?.updatedAt ?? null,
    refetch: fetchRate,
    convertUsdToJpy,
  };
}
