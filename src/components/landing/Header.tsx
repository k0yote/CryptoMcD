import { useState } from 'react';
import { Menu, X, ShoppingCart, MapPin, Clock } from 'lucide-react';

interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
  onLocationClick?: () => void;
  onOrdersClick?: () => void;
}

export function Header({
  cartCount = 0,
  onCartClick,
  onLocationClick,
  onOrdersClick,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-4xl">🍔</div>
            <span className="text-xl text-gray-900">CryptoMcD</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Menu
            </a>
            <button
              onClick={onLocationClick}
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <MapPin className="w-4 h-4" />
              Locations
            </button>
            <button
              onClick={onOrdersClick}
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <Clock className="w-4 h-4" />
              Orders
            </button>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900 transition-colors">Sign In</button>
            <button
              onClick={onCartClick}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 relative"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Menu
              </a>
              <button
                onClick={() => {
                  onLocationClick?.();
                  setIsMenuOpen(false);
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Locations
              </button>
              <button
                onClick={() => {
                  onOrdersClick?.();
                  setIsMenuOpen(false);
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Orders
              </button>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                <button className="text-gray-600 hover:text-gray-900 text-left transition-colors">
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onCartClick?.();
                    setIsMenuOpen(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto bg-yellow-400 text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
