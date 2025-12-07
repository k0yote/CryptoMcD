import { Package, Clock, CheckCircle, XCircle, MapPin } from 'lucide-react';

interface Order {
  id: string;
  items: Array<{ name: string; quantity: number; image: string }>;
  total: number;
  status: 'preparing' | 'ready' | 'delivered' | 'cancelled';
  timestamp: Date;
  deliveryMethod: 'delivery' | 'pickup';
  address: string;
}

interface OrderHistoryProps {
  orders: Order[];
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return <Clock className="w-5 h-5" />;
      case 'ready':
        return <Package className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return 'bg-yellow-100 text-yellow-700';
      case 'ready':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="mb-2 text-gray-900">No orders yet</h3>
        <p className="text-gray-600">Your order history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-gray-900">Order #{order.id}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getStatusColor(order.status)}`}
                >
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{formatDate(order.timestamp)}</p>
            </div>
            <div className="text-right">
              <div className="text-xl text-gray-900">${order.total.toFixed(2)}</div>
              <div className="text-sm text-gray-600 capitalize">{order.deliveryMethod}</div>
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-wrap gap-2 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xl">{item.image}</span>
                <span className="text-sm text-gray-700">
                  {item.name} ×{item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{order.address}</span>
          </div>

          {/* Track Order Button */}
          {(order.status === 'preparing' || order.status === 'ready') && (
            <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition-colors">
              Track Order
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
