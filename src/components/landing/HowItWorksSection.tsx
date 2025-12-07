import { Wallet, ArrowRight, Send, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Connect Your Wallet',
    description: 'Link your MetaMask, WalletConnect, or any Web3 wallet in seconds.',
    step: '01',
  },
  {
    icon: Send,
    title: 'Enter Payment Details',
    description: 'Choose your stablecoin, enter amount, and select the network.',
    step: '02',
  },
  {
    icon: CheckCircle,
    title: 'Send & Confirm',
    description: 'Review and confirm. Your payment settles in seconds.',
    step: '03',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-gray-900">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start accepting crypto payments in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-indigo-300 mx-auto -ml-3" />
                  </div>
                )}
                
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center relative">
                  <div className="absolute -top-4 left-8 bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-lg">{step.step}</span>
                  </div>
                  
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                    <Icon className="w-8 h-8 text-indigo-600" />
                  </div>
                  
                  <h3 className="mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl inline-flex items-center gap-2 transition-colors shadow-lg">
            Start Your First Payment
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
