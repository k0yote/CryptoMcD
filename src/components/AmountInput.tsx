import { Delete } from 'lucide-react';

interface AmountInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  currency: string;
}

export function AmountInput({ amount, onAmountChange, currency }: AmountInputProps) {
  const handleNumberClick = (num: string) => {
    if (amount === '0') {
      onAmountChange(num);
    } else {
      onAmountChange(amount + num);
    }
  };

  const handleDecimalClick = () => {
    if (!amount.includes('.')) {
      onAmountChange(amount + '.');
    }
  };

  const handleDelete = () => {
    if (amount.length === 1) {
      onAmountChange('0');
    } else {
      onAmountChange(amount.slice(0, -1));
    }
  };

  const handleClear = () => {
    onAmountChange('0');
  };

  const buttons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '.', '0', 'delete'
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Amount Display */}
      <div className="mb-6">
        <label className="block mb-2 text-gray-600 text-sm">
          Amount
        </label>
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <div className="text-right">
            <div className="text-5xl text-gray-900 mb-1 font-mono">
              {amount}
            </div>
            <div className="text-xl text-gray-500">
              {currency}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[10, 50, 100, 500].map((val) => (
          <button
            key={val}
            onClick={() => onAmountChange(val.toString())}
            className="py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
          >
            {val}
          </button>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {buttons.map((btn) => {
          if (btn === 'delete') {
            return (
              <button
                key={btn}
                onClick={handleDelete}
                className="aspect-square bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center justify-center"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }

          if (btn === '.') {
            return (
              <button
                key={btn}
                onClick={handleDecimalClick}
                className="aspect-square bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-2xl"
              >
                {btn}
              </button>
            );
          }

          return (
            <button
              key={btn}
              onClick={() => handleNumberClick(btn)}
              className="aspect-square bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-2xl"
            >
              {btn}
            </button>
          );
        })}
      </div>

      {/* Clear Button */}
      <button
        onClick={handleClear}
        className="w-full mt-3 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
