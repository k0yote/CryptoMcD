import { ArrowRight, Sparkles } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-600 to-yellow-500">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Special Offer - 10% Off First Order</span>
        </div>

        <h2 className="mb-6 text-white">
          Ready to Order?
        </h2>
        
        <p className="text-xl text-white/90 mb-8">
          Join thousands of customers enjoying fast food with even faster crypto payments.
          No wallet? No problem - just scan and pay!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white hover:bg-gray-100 text-red-600 px-8 py-4 rounded-xl inline-flex items-center justify-center gap-2 transition-colors shadow-xl">
            Start Ordering
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="bg-red-700 hover:bg-red-800 text-white px-8 py-4 rounded-xl border-2 border-white/20 transition-colors">
            Download App
          </button>
        </div>

        <p className="text-sm text-white/80 mt-6">
          Free delivery on orders over $15
        </p>
      </div>
    </section>
  );
}