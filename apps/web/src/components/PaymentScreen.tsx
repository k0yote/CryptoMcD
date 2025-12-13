import { useState } from 'react';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { AmountInput } from './AmountInput';
import { WalletConnect } from './WalletConnect';
import { TransactionHistory } from './TransactionHistory';
import { QRScanner } from './QRScanner';
import { QRPayment } from './QRPayment';
import { ArrowRight, CheckCircle2, QrCode } from 'lucide-react';

type PaymentMethod = 'USDC' | 'JPYC' | 'Stripe';
type Network = 'sepolia' | 'base-sepolia' | 'polygon-amoy' | 'avalanche-fuji';

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  currency: string;
  address: string;
  network: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
}

export function PaymentScreen() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('USDC');
  const [network, setNetwork] = useState<Network>('base-sepolia');
  const [amount, setAmount] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'send',
      amount: '100.00',
      currency: 'USDC',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      network: 'base-sepolia',
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed',
      txHash: '0x1234...5678',
    },
    {
      id: '2',
      type: 'receive',
      amount: '50.00',
      currency: 'JPYC',
      address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      network: 'polygon-amoy',
      timestamp: new Date(Date.now() - 7200000),
      status: 'completed',
      txHash: '0xabcd...efgh',
    },
    {
      id: '3',
      type: 'send',
      amount: '25.50',
      currency: 'USDC',
      address: '0x9f8a26e2e7D33C3B8e2e5c7a1D4F6B9C8A7E6D5C',
      network: 'sepolia',
      timestamp: new Date(Date.now() - 86400000),
      status: 'pending',
      txHash: '0x9876...5432',
    },
  ]);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add new transaction to history
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'send',
      amount: amount,
      currency: paymentMethod,
      address: recipient,
      network: paymentMethod === 'Stripe' ? 'stripe' : network,
      timestamp: new Date(),
      status: 'completed',
      txHash: '0x' + Math.random().toString(16).substring(2, 10),
    };

    setTransactions([newTransaction, ...transactions]);
    setIsProcessing(false);
    setIsSuccess(true);

    // Reset after showing success
    setTimeout(() => {
      setIsSuccess(false);
      setAmount('0');
      setRecipient('');
    }, 3000);
  };

  const handleQRPayment = () => {
    setShowQRPayment(true);
  };

  const handleQRPaymentSuccess = () => {
    // Add new transaction to history
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'send',
      amount: amount,
      currency: paymentMethod,
      address: recipient || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      network: network,
      timestamp: new Date(),
      status: 'completed',
      txHash: '0x' + Math.random().toString(16).substring(2, 10),
    };

    setTransactions([newTransaction, ...transactions]);
    setShowQRPayment(false);
    setIsSuccess(true);

    // Reset after showing success
    setTimeout(() => {
      setIsSuccess(false);
      setAmount('0');
      setRecipient('');
    }, 3000);
  };

  const handleWalletConnect = (address: string, provider: string) => {
    setConnectedWallet(address);
  };

  const handleWalletDisconnect = () => {
    setConnectedWallet(null);
  };

  const handleQRScan = (address: string) => {
    setRecipient(address);
  };

  const isValidAmount = parseFloat(amount) > 0;
  const isValidRecipient = recipient.length > 0;
  const canPay = isValidAmount && !isProcessing;
  const canPayWithWallet = canPay && isValidRecipient && connectedWallet;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2">Crypto Payment</h1>
            <p className="text-gray-600">Send stablecoins securely and instantly</p>
          </div>
          <WalletConnect
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
            connectedAddress={connectedWallet}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Left Side - Payment Method & Network Selection */}
          <div className="space-y-6">
            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              network={network}
              onPaymentMethodChange={setPaymentMethod}
              onNetworkChange={setNetwork}
            />

            {/* Recipient Address */}
            {paymentMethod !== 'Stripe' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <label className="block mb-3 text-gray-700">
                  Recipient Address (Optional for QR Payment)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  />
                  <QRScanner onScan={handleQRScan} />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Leave empty to generate QR code for customer payment
                </p>
              </div>
            )}

            {paymentMethod === 'Stripe' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <label className="block mb-3 text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Transaction Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="mb-4">Transaction Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount</span>
                  <span>
                    {amount} {paymentMethod}
                  </span>
                </div>
                {paymentMethod !== 'Stripe' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Network</span>
                    <span className="capitalize">{network}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network Fee</span>
                  <span className="text-gray-900">
                    {paymentMethod === 'Stripe' ? '$0.30 + 2.9%' : '~$0.50'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-900">Total</span>
                    <span>
                      {paymentMethod === 'Stripe'
                        ? `$${(parseFloat(amount) * 1.029 + 0.3).toFixed(2)}`
                        : `${amount} ${paymentMethod}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Amount Input with Keypad */}
          <div>
            <AmountInput amount={amount} onAmountChange={setAmount} currency={paymentMethod} />

            {/* Payment Buttons */}
            <div className="space-y-3 mt-6">
              {/* Wallet Payment - Only show if wallet connected and recipient provided */}
              {connectedWallet && (
                <button
                  onClick={handlePayment}
                  disabled={!canPayWithWallet}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Payment Successful!
                    </>
                  ) : (
                    <>
                      Send from Wallet
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}

              {/* QR Payment - Always available for crypto */}
              {paymentMethod !== 'Stripe' && (
                <button
                  onClick={handleQRPayment}
                  disabled={!isValidAmount || isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <QrCode className="w-5 h-5" />
                  Generate QR Code (No Wallet Needed)
                </button>
              )}
            </div>

            {!connectedWallet && paymentMethod !== 'Stripe' && (
              <p className="text-sm text-center text-indigo-600 mt-3">
                <span className="block">💡 No wallet? No problem!</span>
                <span>Use QR code payment for customers without wallets</span>
              </p>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <TransactionHistory transactions={transactions} />
      </div>

      {/* QR Payment Modal */}
      {showQRPayment && (
        <QRPayment
          amount={amount}
          currency={paymentMethod}
          network={network}
          recipient={recipient}
          onClose={() => setShowQRPayment(false)}
          onSuccess={handleQRPaymentSuccess}
        />
      )}
    </div>
  );
}
