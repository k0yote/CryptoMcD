import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Fingerprint, Wallet, AlertCircle, CheckCircle2, KeyRound, Loader2, LogIn } from 'lucide-react';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  createPasskeyWallet,
  authenticatePasskeyWallet,
  getPasskeyWalletInfo,
} from '@/lib/passkeyWallet';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (method: 'wallet' | 'passkey-wallet', username?: string, address?: string) => void;
}

type AuthMode = 'select' | 'passkey-wallet-create' | 'passkey-wallet-login';

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingWallet, setExistingWallet] = useState<{ address: string; username: string } | null>(null);

  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { connect, isPending: isConnecting } = useConnect();
  const [hasMetaMask, setHasMetaMask] = useState(false);

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      setHasMetaMask(typeof window !== 'undefined' && typeof window.ethereum !== 'undefined');
    };
    checkMetaMask();
  }, []);

  useEffect(() => {
    // Check for existing passkey wallet
    const walletInfo = getPasskeyWalletInfo();
    if (walletInfo) {
      setExistingWallet(walletInfo);
    }
  }, []);

  // Handle wallet connection success
  useEffect(() => {
    if (isConnected && address) {
      onSuccess('wallet', undefined, address);
      onClose();
    }
  }, [isConnected, address, onSuccess, onClose]);

  const handleWalletConnect = () => {
    open();
  };

  const handleMetaMaskConnect = () => {
    if (hasMetaMask) {
      connect({ connector: injected() });
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  const handlePasskeyWalletCreate = async () => {
    setIsLoading(true);
    setMessage(null);

    // Auto-generate username with timestamp
    const autoUsername = `User_${Date.now().toString(36).toUpperCase()}`;
    const result = await createPasskeyWallet(autoUsername);

    if (result.success && result.wallet) {
      setExistingWallet({
        address: result.wallet.address,
        username: result.wallet.username,
      });
      setMessage({
        type: 'success',
        text: t('login.walletCreated'),
      });
      // Auto login after wallet creation
      setTimeout(() => {
        onSuccess('passkey-wallet', result.wallet!.username, result.wallet!.address);
        onClose();
      }, 1500);
    } else {
      setMessage({
        type: 'error',
        text: result.error || t('login.walletCreateFailed'),
      });
    }

    setIsLoading(false);
  };

  const handlePasskeyWalletLogin = async () => {
    setIsLoading(true);
    setMessage(null);

    const result = await authenticatePasskeyWallet();

    if (result.success && result.wallet) {
      setMessage({
        type: 'success',
        text: t('login.loginSuccess', { username: result.wallet.username }),
      });
      setTimeout(() => {
        onSuccess('passkey-wallet', result.wallet!.username, result.wallet!.address);
        onClose();
      }, 1000);
    } else {
      setMessage({
        type: 'error',
        text: result.error || t('login.authFailed'),
      });
    }

    setIsLoading(false);
  };

  const resetModal = () => {
    setMode('select');
    setMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            {mode === 'select' ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            ) : (
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'passkey-wallet-create' && t('login.passkeyWallet')}
                {mode === 'passkey-wallet-login' && t('login.passkeyWallet')}
              </h2>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Message */}
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg flex items-start gap-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}


            {/* Select Mode */}
            {mode === 'select' && (
              <div className="space-y-3">
                {/* Passkey Wallet Option - Featured */}
                <button
                  onClick={() => existingWallet ? setMode('passkey-wallet-login') : setMode('passkey-wallet-create')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl p-4 flex items-center gap-4 transition-all text-white shadow-lg"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-medium">{t('login.passkeyWallet')}</h3>
                    <p className="text-sm text-indigo-100">{t('login.passkeyWalletDescription')}</p>
                    {existingWallet && (
                      <p className="text-xs text-indigo-200 mt-1 font-mono">
                        {truncateAddress(existingWallet.address)}
                      </p>
                    )}
                  </div>
                </button>

                {/* MetaMask - Direct Connection or Install */}
                <button
                  onClick={handleMetaMaskConnect}
                  disabled={isConnecting}
                  className="w-full bg-white border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl p-4 flex items-center gap-4 transition-all disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M36.0112 3.33337L22.1207 13.6277L24.7012 7.56091L36.0112 3.33337Z" fill="#E17726"/>
                      <path d="M3.98877 3.33337L17.7428 13.7307L15.2989 7.56091L3.98877 3.33337Z" fill="#E27625"/>
                      <path d="M31.0149 27.2023L27.3227 32.8573L35.2287 35.0397L37.4797 27.3258L31.0149 27.2023Z" fill="#E27625"/>
                      <path d="M2.53027 27.3258L4.77129 35.0397L12.6773 32.8573L8.98508 27.2023L2.53027 27.3258Z" fill="#E27625"/>
                      <path d="M12.2515 17.5765L10.0713 20.8631L17.8757 21.2124L17.6066 12.7765L12.2515 17.5765Z" fill="#E27625"/>
                      <path d="M27.7484 17.5765L22.3238 12.6736L22.1207 21.2124L29.9287 20.8631L27.7484 17.5765Z" fill="#E27625"/>
                      <path d="M12.6772 32.8574L17.3989 30.5652L13.336 27.3809L12.6772 32.8574Z" fill="#E27625"/>
                      <path d="M22.6009 30.5652L27.3226 32.8574L26.6639 27.3809L22.6009 30.5652Z" fill="#E27625"/>
                      <path d="M27.3226 32.8573L22.6009 30.5765L22.9502 33.6579L22.9124 34.9367L27.3226 32.8573Z" fill="#D5BFB2"/>
                      <path d="M12.6772 32.8573L17.0874 34.9367L17.0609 33.6579L17.3989 30.5765L12.6772 32.8573Z" fill="#D5BFB2"/>
                      <path d="M17.1571 25.5765L13.2299 24.4624L16.0237 23.2336L17.1571 25.5765Z" fill="#233447"/>
                      <path d="M22.8428 25.5765L23.9762 23.2336L26.78 24.4624L22.8428 25.5765Z" fill="#233447"/>
                      <path d="M12.6773 32.8573L13.3738 27.2023L8.98511 27.3258L12.6773 32.8573Z" fill="#CC6228"/>
                      <path d="M26.6261 27.2023L27.3226 32.8573L31.0148 27.3258L26.6261 27.2023Z" fill="#CC6228"/>
                      <path d="M29.9287 20.8631L22.1207 21.2124L22.8429 25.5765L23.9763 23.2336L26.7801 24.4624L29.9287 20.8631Z" fill="#CC6228"/>
                      <path d="M13.2299 24.4624L16.0237 23.2336L17.1571 25.5765L17.8757 21.2124L10.0713 20.8631L13.2299 24.4624Z" fill="#CC6228"/>
                      <path d="M10.0713 20.8631L13.336 27.3809L13.2299 24.4624L10.0713 20.8631Z" fill="#E27525"/>
                      <path d="M26.7801 24.4624L26.6639 27.3809L29.9287 20.8631L26.7801 24.4624Z" fill="#E27525"/>
                      <path d="M17.8757 21.2124L17.1571 25.5765L18.0514 30.2252L18.2545 23.8631L17.8757 21.2124Z" fill="#E27525"/>
                      <path d="M22.1207 21.2124L21.7521 23.8517L21.9486 30.2252L22.8429 25.5765L22.1207 21.2124Z" fill="#E27525"/>
                      <path d="M22.8429 25.5765L21.9486 30.2252L22.6009 30.5651L26.6639 27.3809L26.7801 24.4624L22.8429 25.5765Z" fill="#F5841F"/>
                      <path d="M13.2299 24.4624L13.336 27.3809L17.399 30.5651L18.0513 30.2252L17.1571 25.5765L13.2299 24.4624Z" fill="#F5841F"/>
                      <path d="M22.9125 34.9367L22.9502 33.6579L22.6272 33.3752H17.3727L17.0609 33.6579L17.0874 34.9367L12.6772 32.8573L14.2145 34.1197L17.3237 36.2105H22.6764L25.7856 34.1197L27.3226 32.8573L22.9125 34.9367Z" fill="#C0AC9D"/>
                      <path d="M22.6009 30.5651L21.9486 30.2252H18.0513L17.399 30.5651L17.0609 33.6579L17.3727 33.3752H22.6272L22.9502 33.6579L22.6009 30.5651Z" fill="#161616"/>
                      <path d="M36.5875 14.3256L37.7994 8.63658L36.0112 3.33337L22.6009 13.2556L27.7484 17.5765L35.0264 19.6973L36.6561 17.7906L35.9496 17.2879L37.0866 16.2559L36.2177 15.5905L37.3547 14.7272L36.5875 14.3256Z" fill="#763E1A"/>
                      <path d="M2.20056 8.63658L3.42265 14.3256L2.63533 14.7272L3.77234 15.5905L2.91338 16.2559L4.05039 17.2879L3.34395 17.7906L4.9736 19.6973L12.2515 17.5765L17.399 13.2556L3.98877 3.33337L2.20056 8.63658Z" fill="#763E1A"/>
                      <path d="M35.0264 19.6973L27.7484 17.5765L29.9287 20.8631L26.6639 27.3809L31.0149 27.3258H37.4797L35.0264 19.6973Z" fill="#F5841F"/>
                      <path d="M12.2515 17.5765L4.9736 19.6973L2.53027 27.3258H8.98508L13.336 27.3809L10.0713 20.8631L12.2515 17.5765Z" fill="#F5841F"/>
                      <path d="M22.1207 21.2124L22.6009 13.2556L24.7012 7.56091H15.2989L17.399 13.2556L17.8757 21.2124L18.0415 23.8745L18.0514 30.2252H21.9486L21.9585 23.8745L22.1207 21.2124Z" fill="#F5841F"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-medium text-gray-900">{t('login.metamask')}</h3>
                    <p className="text-sm text-gray-500">
                      {hasMetaMask ? t('login.metamaskDescription') : t('login.metamaskInstall')}
                    </p>
                  </div>
                  {isConnecting && <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />}
                </button>

                {/* Other Wallets */}
                <button
                  onClick={handleWalletConnect}
                  className="w-full bg-white border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl p-4 flex items-center gap-4 transition-all"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{t('login.connectWallet')}</h3>
                    <p className="text-sm text-gray-500">{t('login.walletDescription')}</p>
                  </div>
                </button>
              </div>
            )}

            {/* Passkey Wallet Create Mode */}
            {mode === 'passkey-wallet-create' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 text-sm">
                    {t('login.passkeyWalletDescription')}
                  </p>
                </div>

                <button
                  onClick={handlePasskeyWalletCreate}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <KeyRound className="w-5 h-5" />
                  {isLoading ? t('login.creatingWallet') : t('login.createWallet')}
                </button>

                {existingWallet && (
                  <div className="text-center">
                    <button
                      onClick={() => setMode('passkey-wallet-login')}
                      className="text-indigo-600 hover:bg-indigo-50 text-sm"
                    >
                      {t('login.hasPasskey')}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setMode('select')}
                  className="w-full text-gray-600 hover:text-gray-900 py-2 text-sm"
                >
                  ← {t('common.back')}
                </button>
              </div>
            )}

            {/* Passkey Wallet Login Mode */}
            {mode === 'passkey-wallet-login' && existingWallet && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-900 font-medium">{existingWallet.username}</p>
                  <p className="text-gray-500 text-sm font-mono">
                    {truncateAddress(existingWallet.address)}
                  </p>
                </div>

                <button
                  onClick={handlePasskeyWalletLogin}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Fingerprint className="w-5 h-5" />
                  {isLoading ? t('login.authenticating') : t('login.passkeyLogin')}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => setMode('passkey-wallet-create')}
                    className="text-indigo-600 text-sm"
                  >
                    {t('login.noPasskey')}
                  </button>
                </div>

                <button
                  onClick={() => setMode('select')}
                  className="w-full text-gray-600 hover:text-gray-900 py-2 text-sm"
                >
                  ← {t('common.back')}
                </button>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 text-center">
                {mode === 'select' && t('login.selectInfo')}
                {(mode === 'passkey-wallet-create' || mode === 'passkey-wallet-login') && t('login.smartAccountInfo')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
