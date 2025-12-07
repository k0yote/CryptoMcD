import { useState } from 'react';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check } from 'lucide-react';

interface WalletConnectProps {
  onConnect: (address: string, provider: string) => void;
  onDisconnect: () => void;
  connectedAddress: string | null;
}

const walletProviders = [
  { id: 'metamask', name: 'MetaMask', logo: '🦊' },
  { id: 'walletconnect', name: 'WalletConnect', logo: '🔗' },
  { id: 'coinbase', name: 'Coinbase Wallet', logo: '💼' },
];

export function WalletConnect({ onConnect, onDisconnect, connectedAddress }: WalletConnectProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async (provider: string) => {
    // Simulate wallet connection
    const mockAddress = '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0');
    await new Promise(resolve => setTimeout(resolve, 1000));
    onConnect(mockAddress, provider);
    setShowProviders(false);
  };

  const handleCopy = () => {
    if (connectedAddress) {
      navigator.clipboard.writeText(connectedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!connectedAddress) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowProviders(!showProviders)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-lg"
        >
          <Wallet className="w-5 h-5" />
          Connect Wallet
        </button>

        {showProviders && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowProviders(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-20">
              <div className="p-3 border-b border-gray-200">
                <p className="text-sm text-gray-600">Select a wallet</p>
              </div>
              <div className="p-2">
                {walletProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleConnect(provider.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">{provider.logo}</span>
                    <span className="text-gray-900">{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-white border-2 border-gray-200 hover:border-gray-300 px-4 py-3 rounded-xl flex items-center gap-3 transition-colors shadow-sm"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="font-mono text-sm">{shortenAddress(connectedAddress)}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-20">
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Connected Address</p>
              <p className="font-mono text-sm text-gray-900 break-all">{connectedAddress}</p>
            </div>
            <div className="p-2">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
              <button
                onClick={() => window.open(`https://etherscan.io/address/${connectedAddress}`, '_blank')}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on Explorer</span>
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  onDisconnect();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
