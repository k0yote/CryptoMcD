import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { ReownAuthentication } from '@reown/appkit-siwx';

// Get project ID from environment or use a demo one
// Create your own at https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'demo-project-id';

// App metadata
const metadata = {
  name: 'CryptoPay',
  description: 'Pay with crypto or card - fast and easy',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Custom testnet chain definitions
const sepolia: AppKitNetwork = {
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
};

const baseSepolia: AppKitNetwork = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

const polygonAmoy: AppKitNetwork = {
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-amoy.polygon.technology'] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' },
  },
  testnet: true,
};

const avalancheFuji: AppKitNetwork = {
  id: 43113,
  name: 'Avalanche Fuji',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Snowtrace', url: 'https://testnet.snowtrace.io' },
  },
  testnet: true,
};

// Supported networks (testnets only)
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  baseSepolia,
  sepolia,
  polygonAmoy,
  avalancheFuji,
];

// Create Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

// Create AppKit instance with Smart Account support and SIWX authentication
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  siwx: new ReownAuthentication(), // Enable SIWX authentication (chain-agnostic)
  features: {
    analytics: false,
    email: true,
    socials: ['google', 'apple', 'discord', 'github'],
    emailShowWallets: true,
    connectMethodsOrder: ['email', 'social', 'wallet'],
  },
  // Enable Smart Account for EVM chains (uses Passkey-compatible secp256r1)
  defaultAccountTypes: {
    eip155: 'smartAccount',
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#4f46e5',
    '--w3m-border-radius-master': '12px',
  },
});

export { projectId };
