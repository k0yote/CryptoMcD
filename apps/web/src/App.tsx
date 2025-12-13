import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiAdapter } from './lib/appkit';
import { SimpleLandingPage } from './components/SimpleLandingPage';

// Initialize AppKit (side effect import)
import './lib/appkit';

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SimpleLandingPage />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
