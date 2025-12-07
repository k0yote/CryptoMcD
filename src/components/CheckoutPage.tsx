import { useState } from 'react';
import { ArrowLeft, MapPin, CreditCard, Wallet as WalletIcon, QrCode } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutPageProps {
  items: CartItem[];
  onBack: () => void;
  onComplete: (orderDetails: any) => void;
}

export function CheckoutPage({ items, onBack, onComplete }: CheckoutPageProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'card'>('crypto');
  const [address, setAddress] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const deliveryFee = deliveryMethod === 'delivery' ? 2.99 : 0;
  const total = subtotal + tax + deliveryFee;

  const restaurants = [
    { id: '1', name: 'Downtown Branch', address: '123 Main St', distance: '1.2 mi' },
    { id: '2', name: 'Westside Location', address: '456 West Ave', distance: '2.5 mi' },
    { id: '3', name: 'Airport Plaza', address: '789 Airport Rd', distance: '4.1 mi' },
  ];

  const handlePlaceOrder = () => {
    const orderDetails = {
      items,
      deliveryMethod,
      paymentMethod,
      address: deliveryMethod === 'delivery' ? address : selectedRestaurant,
      total,
      timestamp: new Date(),
    };
    onComplete(orderDetails);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Menu
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="mb-4 text-gray-900">Delivery Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    deliveryMethod === 'delivery'
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MapPin className={`w-6 h-6 mx-auto mb-2 ${
                    deliveryMethod === 'delivery' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm">Delivery</div>
                  <div className="text-xs text-gray-500">$2.99</div>
                </button>
                <button
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    deliveryMethod === 'pickup'
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="text-sm">Pickup</div>
                  <div className="text-xs text-gray-500">Free</div>
                </button>
              </div>
            </div>

            {/* Address / Restaurant Selection */}
            {deliveryMethod === 'delivery' ? (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="mb-4 text-gray-900">Delivery Address</h3>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="mb-4 text-gray-900">Select Restaurant</h3>
                <div className="space-y-3">
                  {restaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => setSelectedRestaurant(restaurant.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRestaurant === restaurant.id
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-gray-900 mb-1">{restaurant.name}</div>
                          <div className="text-sm text-gray-600">{restaurant.address}</div>
                        </div>
                        <div className="text-sm text-gray-500">{restaurant.distance}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="mb-4 text-gray-900">Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'crypto'
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <WalletIcon className={`w-6 h-6 mx-auto mb-2 ${
                    paymentMethod === 'crypto' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm">Crypto</div>
                  <div className="text-xs text-gray-500">USDC, JPYC</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                    paymentMethod === 'card' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm">Card</div>
                  <div className="text-xs text-gray-500">Visa, Mastercard</div>
                </button>
              </div>

              {paymentMethod === 'crypto' && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-2 text-sm text-indigo-900">
                    <QrCode className="w-4 h-4" />
                    <span>QR code payment available - no wallet needed!</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              <h3 className="mb-4 text-gray-900">Order Summary</h3>
              
              {/* Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="text-2xl">{item.image}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-sm text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${tax.toFixed(2)}</span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-900">${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900">Total</span>
                    <span className="text-xl text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={
                  (deliveryMethod === 'delivery' && !address) ||
                  (deliveryMethod === 'pickup' && !selectedRestaurant)
                }
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-colors mt-6 shadow-lg"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
