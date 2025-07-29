import React from 'react';
import { FaCheckCircle, FaClock, FaTruck, FaBox, FaFlask } from 'react-icons/fa';

interface Order {
  _id: string;
  orderId: string;
  status: 'pending' | 'confirmed' | 'out for delivery' | 'delivered' | 'cancelled';
  createdAt: string;
  needAssignment: boolean;
}

interface OrderTimelineProps {
  order: Order;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const getTimelineEvents = (order: Order) => {
    const events = [
      {
        id: 1,
        title: 'Order Created',
        description: `Order ${order.orderId} was created`,
        timestamp: order.createdAt,
        icon: <FaBox className="text-blue-600" />,
        status: 'completed',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200'
      }
    ];

    if (order.status !== 'pending') {
      events.push({
        id: 2,
        title: 'Order Confirmed',
        description: 'Order has been confirmed and is being processed',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        icon: <FaCheckCircle className="text-green-600" />,
        status: 'completed',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200'
      });
    }

    if (order.status === 'out for delivery' || order.status === 'delivered') {
      events.push({
        id: 3,
        title: 'Out for Delivery',
        description: 'Order is out for delivery',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        icon: <FaTruck className="text-orange-600" />,
        status: 'completed',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200'
      });
    }

    if (order.status === 'delivered') {
      events.push({
        id: 4,
        title: 'Order Delivered',
        description: 'Order has been successfully delivered',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        icon: <FaCheckCircle className="text-green-600" />,
        status: 'completed',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200'
      });
    }

    if (order.needAssignment) {
      events.push({
        id: 5,
        title: 'Lab Assignment Pending',
        description: 'Waiting for laboratory assignment',
        timestamp: new Date().toISOString(),
        icon: <FaFlask className="text-yellow-600" />,
        status: 'pending',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200'
      });
    }

    return events;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const events = getTimelineEvents(order);

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <FaClock className="text-gray-600" />
        Order Timeline
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`relative z-10 w-12 h-12 rounded-full border-2 ${event.borderColor} ${event.bgColor} flex items-center justify-center flex-shrink-0`}>
                {event.icon}
              </div>
              
              {/* Event content */}
              <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{event.title}</h4>
                  <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-600">{event.description}</p>
                
                {event.status === 'pending' && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-yellow-600 font-medium">Pending</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline; 