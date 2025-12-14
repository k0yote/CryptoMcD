import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Plus, Minus, Trash2, X, User } from 'lucide-react';
import { SimpleCheckout } from './SimpleCheckout';
import { PaymentHistory } from './PaymentHistory';
import { LoginModal } from './LoginModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ProfileMenu } from './ProfileMenu';
import { BalanceView } from './BalanceView';
import { SupportedChains } from './ChainIcons';
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { getPasskeyWalletInfo } from '../lib/passkeyWallet';

interface Product {
  id: string;
  nameKey: string;
  price: number;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface PaymentRecord {
  id: string;
  date: string;
  items: Array<{
    nameKey: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: 'USDC' | 'JPYC' | 'Stripe';
  network?: 'sepolia' | 'base-sepolia' | 'polygon-amoy' | 'avalanche-fuji';
  status: 'completed';
}

const products: Product[] = [
  { id: '1', nameKey: 'products.bigMac', price: 0.006, image: '🍔' },
];

export function SimpleLandingPage() {
  const { t } = useTranslation();
  const [cart, setCart] = useState<{ [key: string]: CartItem }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'wallet' | 'passkey-wallet' | null>(null);
  const [passkeyUsername, setPasskeyUsername] = useState<string | null>(null);
  const [passkeyWalletAddress, setPasskeyWalletAddress] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('paymentHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  // Check for saved passkey wallet on mount
  useEffect(() => {
    const savedMethod = localStorage.getItem('cryptopay_login_method');

    if (savedMethod === 'passkey-wallet') {
      const walletInfo = getPasskeyWalletInfo();
      if (walletInfo) {
        setPasskeyUsername(walletInfo.username);
        setPasskeyWalletAddress(walletInfo.address);
        setLoginMethod('passkey-wallet');
      }
    }
  }, []);

  // Detect wallet connection
  useEffect(() => {
    if (isConnected && address) {
      setLoginMethod('wallet');
    }
  }, [isConnected, address]);

  const isLoggedIn = loginMethod === 'passkey-wallet' || (loginMethod === 'wallet' && isConnected);

  // Get the current wallet address based on login method
  const currentWalletAddress = loginMethod === 'passkey-wallet' ? passkeyWalletAddress : address;

  const handleLoginSuccess = (
    method: 'wallet' | 'passkey-wallet',
    username?: string,
    walletAddress?: string
  ) => {
    setLoginMethod(method);
    if (method === 'passkey-wallet' && username && walletAddress) {
      setPasskeyUsername(username);
      setPasskeyWalletAddress(walletAddress);
      localStorage.setItem('cryptopay_user', username);
      localStorage.setItem('cryptopay_login_method', 'passkey-wallet');
    }
  };

  const handleLogout = () => {
    if (loginMethod === 'wallet') {
      disconnect();
    } else if (loginMethod === 'passkey-wallet') {
      // Keep wallet data in localStorage, only clear session state
      setPasskeyWalletAddress(null);
    }
    setLoginMethod(null);
    setPasskeyUsername(null);
    localStorage.removeItem('cryptopay_user');
    localStorage.removeItem('cryptopay_login_method');
  };

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev[product.id];
      if (existing) {
        return {
          ...prev,
          [product.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [product.id]: { ...product, quantity: 1 },
      };
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(id);
      return;
    }
    setCart((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity },
    }));
  };

  const removeItem = (id: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setShowCheckout(true);
  };

  const handlePaymentComplete = (
    paymentMethod: 'USDC' | 'JPYC' | 'Stripe',
    network?: 'sepolia' | 'base-sepolia' | 'polygon-amoy' | 'avalanche-fuji'
  ) => {
    const newRecord: PaymentRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cartItems.map((item) => ({
        nameKey: item.nameKey,
        quantity: item.quantity,
        price: item.price,
      })),
      total,
      paymentMethod,
      network,
      status: 'completed',
    };

    const updatedHistory = [newRecord, ...paymentHistory];
    setPaymentHistory(updatedHistory);
    localStorage.setItem('paymentHistory', JSON.stringify(updatedHistory));
    setCart({});
    setShowCheckout(false);
  };

  // Login Modal is always available regardless of current view
  const loginModal = (
    <LoginModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      onSuccess={handleLoginSuccess}
    />
  );

  if (showCheckout) {
    return (
      <>
        {loginModal}
        <SimpleCheckout
          items={cartItems.map((item) => ({ ...item, name: t(item.nameKey) }))}
          total={total}
          onBack={() => setShowCheckout(false)}
          onComplete={handlePaymentComplete}
        />
      </>
    );
  }

  if (showHistory) {
    return (
      <>
        {loginModal}
        <PaymentHistory history={paymentHistory} onBack={() => setShowHistory(false)} />
      </>
    );
  }

  if (showBalance && currentWalletAddress) {
    return (
      <>
        {loginModal}
        <BalanceView
          address={currentWalletAddress}
          username={loginMethod === 'passkey-wallet' ? (passkeyUsername ?? undefined) : undefined}
          onBack={() => setShowBalance(false)}
        />
      </>
    );
  }

  return (
    <>
      {/* Login Modal */}
      {loginModal}
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="text-4xl">🍔</div>
                <span className="text-xl text-gray-900">{t('header.brandName')}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSwitcher />
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center gap-2 relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.cart')}</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {cartCount}
                    </span>
                  )}
                </button>
                {isLoggedIn && currentWalletAddress && loginMethod ? (
                  <ProfileMenu
                    address={currentWalletAddress}
                    username={
                      loginMethod === 'passkey-wallet' ? (passkeyUsername ?? undefined) : undefined
                    }
                    loginMethod={loginMethod}
                    onShowHistory={() => setShowHistory(true)}
                    onShowBalance={() => setShowBalance(true)}
                    onLogout={handleLogout}
                  />
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('common.login')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-600 via-red-500 to-yellow-500">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="mb-4 text-white">{t('hero.title')}</h1>
            <p className="text-xl text-white/90">{t('hero.subtitle')}</p>
          </div>
        </section>

        {/* Menu */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="mb-8 text-gray-900 text-center">{t('menu.title')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                >
                  <div className="bg-gradient-to-br from-yellow-50 to-red-50 p-8 flex items-center justify-center">
                    <div className="text-8xl">{product.image}</div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-gray-900">{t(product.nameKey)}</h3>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                        ${product.price}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-4">
                      <SupportedChains iconSize={18} showNames={false} className="gap-1.5" />
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      {t('menu.addToCart')}
                    </button>
                    {cart[product.id] && (
                      <div className="mt-2 text-center text-sm text-gray-600">
                        {cart[product.id].quantity} {t('menu.inCart')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cart Sidebar */}
        {isCartOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsCartOpen(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-gray-900">{t('cart.title')}</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-gray-900">{t('cart.empty')}</h3>
                    <p className="text-gray-600">{t('cart.emptyDescription')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className="text-4xl">{item.image}</div>
                        <div className="flex-1">
                          <h4 className="text-gray-900 mb-1">{t(item.nameKey)}</h4>
                          <p className="text-red-600">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 p-6">
                  <div className="flex justify-between mb-6">
                    <span className="text-gray-900">{t('common.total')}</span>
                    <span className="text-xl text-gray-900">${total.toFixed(2)}</span>
                  </div>
                  {isLoggedIn ? (
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl transition-colors"
                    >
                      {t('cart.proceedToCheckout')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setShowLoginModal(true);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl transition-colors"
                    >
                      {t('checkout.signInToContinue')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
