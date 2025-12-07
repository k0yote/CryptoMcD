import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Wallet, LogOut, ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';
import { WalletAvatar } from './WalletAvatar';

interface ProfileMenuProps {
  address: string;
  username?: string;
  loginMethod: 'wallet' | 'passkey-wallet';
  onShowHistory: () => void;
  onShowBalance: () => void;
  onLogout: () => void;
}

export function ProfileMenu({
  address,
  username,
  loginMethod,
  onShowHistory,
  onShowBalance,
  onLogout,
}: ProfileMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
      >
        <WalletAvatar address={address} size={28} />
        <span className="text-gray-700 text-sm hidden sm:block max-w-[120px] truncate">
          {username || truncateAddress(address)}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          {/* Profile Header */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <WalletAvatar address={address} size={48} />
              <div className="flex-1 min-w-0">
                {username && <p className="font-medium text-gray-900 truncate">{username}</p>}
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-500 font-mono">{truncateAddress(address)}</p>
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    title={t('profile.copyAddress')}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
                <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {loginMethod === 'passkey-wallet'
                    ? t('profile.passkeyWallet')
                    : t('profile.externalWallet')}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => handleMenuClick(onShowBalance)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('profile.balance')}</p>
                <p className="text-xs text-gray-500">{t('profile.balanceDescription')}</p>
              </div>
            </button>

            <button
              onClick={() => handleMenuClick(onShowHistory)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('profile.history')}</p>
                <p className="text-xs text-gray-500">{t('profile.historyDescription')}</p>
              </div>
            </button>

            {/* View on Explorer */}
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('profile.viewOnExplorer')}</p>
                <p className="text-xs text-gray-500">BaseScan</p>
              </div>
            </a>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-gray-100">
            <button
              onClick={() => handleMenuClick(onLogout)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors text-left"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-sm font-medium text-red-600">{t('common.logout')}</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
