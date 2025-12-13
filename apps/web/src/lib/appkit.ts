import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, base, avalanche } from '@reown/appkit/networks';

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

// Supported networks
export const networks = [base, polygon, avalanche, mainnet];

// Create Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

// Create AppKit instance with Smart Account support
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
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
