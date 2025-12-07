import { Shield, Zap, Globe, Lock, DollarSign, Smartphone } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Settlements',
    description: 'Transactions confirm in seconds, not days. Get your money when you need it.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Multi-signature wallets and advanced encryption protect your assets 24/7.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Send payments anywhere in the world without borders or exchange fees.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: DollarSign,
    title: 'Low Fees',
    description: 'Save up to 98% on transaction fees compared to traditional payment methods.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Lock,
    title: 'Non-Custodial',
    description: 'You control your funds. We never have access to your private keys.',
    color: 'bg-red-100 text-red-600',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Manage payments on the go with our intuitive mobile-friendly interface.',
    color: 'bg-indigo-100 text-indigo-600',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-gray-900">Everything You Need for Crypto Payments</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built for businesses and individuals who need fast, secure, and affordable payment
            solutions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-indigo-200 hover:shadow-lg transition-all"
              >
                <div
                  className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
