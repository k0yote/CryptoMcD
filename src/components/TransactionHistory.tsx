import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';

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

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowUpRight className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-gray-900">No transactions yet</h3>
        <p className="text-gray-600">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'send' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
              }`}
            >
              {tx.type === 'send' ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <ArrowDownLeft className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-900 capitalize">{tx.type}</span>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full capitalize">
                  {tx.network}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    tx.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-mono">{shortenAddress(tx.address)}</span>
                <span>•</span>
                <span>{formatDate(tx.timestamp)}</span>
              </div>
            </div>

            <div className="text-right">
              <div className={`mb-1 ${tx.type === 'send' ? 'text-gray-900' : 'text-green-600'}`}>
                {tx.type === 'send' ? '-' : '+'}
                {tx.amount} {tx.currency}
              </div>
              <button
                onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, '_blank')}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm ml-auto"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
