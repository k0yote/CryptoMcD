import { ArrowRight, Zap, Wallet } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-600 via-red-500 to-yellow-500">
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
          <Zap className="w-4 h-4" />
          <span className="text-sm">Pay with Crypto or QR Code</span>
        </div>
        
        <h1 className="mb-6 text-white">
          Order Your Favorites
        </h1>
        
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Fast food meets fast payments. Order now and pay with cryptocurrency or scan QR code - no wallet required!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="#products"
            className="bg-white hover:bg-gray-100 text-red-600 px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xl"
          >
            Order Now
            <ArrowRight className="w-5 h-5" />
          </a>
          <button className="bg-red-700 hover:bg-red-800 text-white px-8 py-4 rounded-xl border-2 border-white/20 transition-colors flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        </div>

        {/* Quick Features */}
        <div className="flex flex-wrap justify-center gap-6 text-white/90">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Instant Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>No Wallet Needed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Low Fees</span>
          </div>
        </div>
      </div>
    </section>
  );
}