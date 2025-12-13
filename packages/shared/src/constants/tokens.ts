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

export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
    supportsEIP3009: true,
    addresses: {
      ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      'polygon-amoy': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
      avalanche: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      'avalanche-fuji': '0x5425890298aed601595a70AB815c96711a31Bc65',
    },
  },
  JPYC: {
    symbol: 'JPYC',
    name: 'JPY Coin',
    decimals: 18,
    icon: '💴',
    supportsEIP3009: false, // JPYC does not support EIP-3009
    addresses: {
      ethereum: '0x2370f9d504c7a6E775bf6E14B3F12846b594cD53',
      sepolia: ZERO_ADDRESS,
      base: ZERO_ADDRESS,
      'base-sepolia': ZERO_ADDRESS,
      polygon: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB',
      'polygon-amoy': '0xAc5e2848c22052D5C674892562Fd900e512D5428',
      avalanche: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB',
      'avalanche-fuji': ZERO_ADDRESS,
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
