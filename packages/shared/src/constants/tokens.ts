import type { Address } from 'viem';
import type { NetworkId } from './chains';
import { ZERO_ADDRESS } from './chains';

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  /** Supports EIP-3009 transferWithAuthorization */
  supportsEIP3009: boolean;
  addresses: Record<NetworkId, Address>;
}

// Testnet USDC addresses - use faucets to get test tokens
export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
    supportsEIP3009: true,
    addresses: {
      sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      'polygon-amoy': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
      'avalanche-fuji': '0x5425890298aed601595a70AB815c96711a31Bc65',
    },
  },
  JPYC: {
    symbol: 'JPYC',
    name: 'JPY Coin',
    decimals: 18,
    icon: '💴',
    supportsEIP3009: true, // JPYC supports EIP-3009
    addresses: {
      sepolia: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB',
      'base-sepolia': ZERO_ADDRESS, // JPYC not available on Base Sepolia
      'polygon-amoy': '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB',
      'avalanche-fuji': '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB',
    },
  },
} as const satisfies Record<string, TokenConfig>;

export type TokenSymbol = keyof typeof SUPPORTED_TOKENS;

export function getTokenAddress(token: TokenSymbol, network: NetworkId): Address {
  return SUPPORTED_TOKENS[token].addresses[network] as Address;
}

export function getTokenConfig(token: TokenSymbol): TokenConfig {
  return SUPPORTED_TOKENS[token];
}

export function isTokenAvailable(token: TokenSymbol, network: NetworkId): boolean {
  const address = getTokenAddress(token, network);
  return address !== ZERO_ADDRESS;
}

export function getAvailableTokens(network: NetworkId): TokenSymbol[] {
  return (Object.keys(SUPPORTED_TOKENS) as TokenSymbol[]).filter((token) =>
    isTokenAvailable(token, network)
  );
}

export function getAvailableNetworks(token: TokenSymbol): NetworkId[] {
  const tokenConfig = SUPPORTED_TOKENS[token];
  return (Object.keys(tokenConfig.addresses) as NetworkId[]).filter((network) =>
    isTokenAvailable(token, network)
  );
}

export function supportsGaslessTransfer(token: TokenSymbol): boolean {
  return SUPPORTED_TOKENS[token].supportsEIP3009;
}
