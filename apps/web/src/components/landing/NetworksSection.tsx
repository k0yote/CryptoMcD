import { Check } from 'lucide-react';

const networks = [
  {
    name: 'Base',
    color: 'bg-blue-500',
    fee: '$0.01',
    speed: '2 sec',
    description: 'Ultra-low fees, built on Ethereum',
  },
  {
    name: 'Polygon',
    color: 'bg-purple-500',
    fee: '$0.02',
    speed: '3 sec',
    description: 'Fast and scalable network',
  },
  {
    name: 'Avalanche',
    color: 'bg-red-500',
    fee: '$0.05',
    speed: '1 sec',
    description: 'Blazing fast confirmation',
  },
  {
    name: 'Ethereum',
    color: 'bg-gray-700',
    fee: '$2.50',
    speed: '15 sec',
    description: 'Most secure and trusted',
  },
];

const stablecoins = ['USDC', 'USDT', 'DAI', 'JPYC', 'EURC'];

export function NetworksSection() {
  return (
    <section id="networks" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-gray-900">Multi-Chain & Multi-Currency</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from multiple blockchain networks and stablecoins for maximum flexibility
          </p>
        </div>

        {/* Networks */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {networks.map((network) => (
            <div
              key={network.name}
              className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 ${network.color} rounded-full`}></div>
                <h3 className="text-gray-900">{network.name}</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">{network.description}</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg. Fee</span>
                  <span className="text-gray-900">{network.fee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Speed</span>
                  <span className="text-gray-900">{network.speed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stablecoins */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="mb-2 text-gray-900">Supported Stablecoins</h3>
            <p className="text-gray-600">Accept payments in your preferred stable currency</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {stablecoins.map((coin) => (
              <div
                key={coin}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100 flex items-center gap-2"
              >
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-900">{coin}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
