import { useState } from 'react';
import { HeroSection } from './landing/HeroSection';
import { ProductsSection } from './landing/ProductsSection';
import { CTASection } from './landing/CTASection';
import { Footer } from './landing/Footer';
import { Header } from './landing/Header';
import { ShoppingCart } from './ShoppingCart';
import { CheckoutPage } from './CheckoutPage';
import { OrderHistory } from './OrderHistory';
import { RestaurantLocator } from './RestaurantLocator';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  items: Array<{ name: string; quantity: number; image: string }>;
  total: number;
  status: 'preparing' | 'ready' | 'delivered' | 'cancelled';
  timestamp: Date;
  deliveryMethod: 'delivery' | 'pickup';
  address: string;
}

export function LandingPage() {
  const [cart, setCart] = useState<{ [key: string]: CartItem }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'checkout' | 'orders' | 'locations'>(
    'home'
  );
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '001',
      items: [
        { name: 'Big Mac', quantity: 2, image: '🍔' },
        { name: 'French Fries', quantity: 2, image: '🍟' },
      ],
      total: 24.96,
      status: 'preparing',
      timestamp: new Date(Date.now() - 900000),
      deliveryMethod: 'delivery',
      address: '123 Main St, New York, NY 10001',
    },
    {
      id: '002',
      items: [
        { name: 'McChicken', quantity: 1, image: '🍗' },
        { name: 'Coca-Cola', quantity: 1, image: '🥤' },
      ],
      total: 8.48,
      status: 'delivered',
      timestamp: new Date(Date.now() - 86400000),
      deliveryMethod: 'pickup',
      address: 'Downtown Branch - 123 Main Street',
    },
  ]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (productId: string, name: string, price: number, image: string) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (existing) {
        return {
          ...prev,
          [productId]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [productId]: { id: productId, name, price, quantity: 1, image },
      };
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveItem(id);
      return;
    }
    setCart((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity },
    }));
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setCurrentView('checkout');
  };

  const handleOrderComplete = (orderDetails: any) => {
    const newOrder: Order = {
      id: String(orders.length + 1).padStart(3, '0'),
      items: orderDetails.items.map((item: CartItem) => ({
        name: item.name,
        quantity: item.quantity,
        image: item.image,
      })),
      total: orderDetails.total,
      status: 'preparing',
      timestamp: orderDetails.timestamp,
      deliveryMethod: orderDetails.deliveryMethod,
      address: orderDetails.address,
    };

    setOrders([newOrder, ...orders]);
    setCart({});
    setCurrentView('orders');
  };

  if (currentView === 'checkout') {
    return (
      <CheckoutPage
        items={cartItems}
        onBack={() => setCurrentView('home')}
        onComplete={handleOrderComplete}
      />
    );
  }

  if (currentView === 'orders') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          cartCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          onLocationClick={() => setCurrentView('locations')}
          onOrdersClick={() => setCurrentView('orders')}
        />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => setCurrentView('home')}
                className="text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                ← Back to Menu
              </button>
              <h1 className="mb-2 text-gray-900">Order History</h1>
              <p className="text-gray-600">Track your current and past orders</p>
            </div>
            <OrderHistory orders={orders} />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'locations') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          cartCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          onLocationClick={() => setCurrentView('locations')}
          onOrdersClick={() => setCurrentView('orders')}
        />
        <div className="pt-16">
          <button
            onClick={() => setCurrentView('home')}
            className="fixed top-20 left-4 z-10 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-lg transition-colors"
          >
            ← Back to Menu
          </button>
          <RestaurantLocator />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onLocationClick={() => setCurrentView('locations')}
        onOrdersClick={() => setCurrentView('orders')}
      />
      <HeroSection />
      <ProductsSection onAddToCart={handleAddToCart} cart={cart} />
      <CTASection />
      <Footer />

      <ShoppingCart
        items={cartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
