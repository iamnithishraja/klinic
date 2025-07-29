import React, { useEffect, useState } from 'react';
import { FaTimes, FaUser, FaFlask, FaBox, FaDownload, FaPhone, FaEnvelope } from 'react-icons/fa';
import OrderStatusBadge from './OrderStatusBadge';
import OrderTimeline from './OrderTimeline';

interface Order {
  _id: string;
  orderId: string;
  orderedBy: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  products: Array<{
    _id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    laboratory?: {
      _id: string;
      name: string;
      email: string;
      phone: string;
    };
  }>;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'out for delivery' | 'delivered' | 'cancelled';
  isPaid: boolean;
  needAssignment: boolean;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  laboratoryUser?: string;
  assignedLab?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  prescription?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !order) return;
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('admin_token');
        const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/orders/${order._id}`;
        
        const res = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch order details');
        }
        
        const data = await res.json();
        if (data.success && data.data) {
          setOrderDetails(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details');
        // Fallback to the original order data
        setOrderDetails(order);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const displayOrder = orderDetails || order;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaBox className="text-blue-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-500">{displayOrder.orderId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={displayOrder.status} />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl font-light focus:outline-none transition-colors"
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading order details...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBox className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading order details</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <p className="text-sm text-gray-400">Showing available information...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Order Info & Customer */}
              <div className="space-y-6">
                {/* Order Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaBox className="text-blue-600" />
                    Order Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium text-gray-900">{displayOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">{formatDate(displayOrder.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <OrderStatusBadge status={displayOrder.status} />
                    </div>
                    {displayOrder.needAssignment && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assignment:</span>
                        <span className="text-orange-600 font-medium">Needs Lab Assignment</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaUser className="text-green-600" />
                    Customer Information
                  </h3>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{displayOrder.user ? displayOrder.user.name : 'Unknown User'}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaEnvelope className="text-gray-400" />
                        {displayOrder.user ? displayOrder.user.email : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaPhone className="text-gray-400" />
                        {displayOrder.user ? displayOrder.user.phone : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laboratory Information */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaFlask className="text-purple-600" />
                    Laboratory Information
                  </h3>
                  {displayOrder.assignedLab ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{displayOrder.assignedLab.name}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaEnvelope className="text-gray-400" />
                            {displayOrder.assignedLab.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaPhone className="text-gray-400" />
                            {displayOrder.assignedLab.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : displayOrder.prescription ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaFlask className="text-orange-600 text-xl" />
                      </div>
                      <p className="text-orange-600 font-medium mb-2">No Laboratory Assigned</p>
                      <p className="text-sm text-gray-500">This prescription order needs to be assigned to a laboratory</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaFlask className="text-green-600 text-xl" />
                      </div>
                      <p className="text-green-600 font-medium mb-2">Product Order</p>
                      <p className="text-sm text-gray-500">Products are sourced from their respective laboratories</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Products & Timeline */}
              <div className="space-y-6">
                {/* Products */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaBox className="text-blue-600" />
                    Products ({displayOrder.products.length})
                  </h3>
                  <div className="space-y-4">
                    {displayOrder.products.map((product, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-500">Quantity: {product.quantity}</p>
                            {product.laboratory && (
                              <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                <p className="text-xs text-purple-700 font-medium">From Laboratory:</p>
                                <p className="text-xs text-purple-600">{product.laboratory.name}</p>
                                <p className="text-xs text-purple-500">{product.laboratory.email}</p>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">₹{product.price}</p>
                            <p className="text-sm text-gray-500">Total: ₹{product.price * product.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">₹{displayOrder.totalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">Payment Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        displayOrder.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {displayOrder.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaDownload className="text-green-600" />
                    Order Timeline
                  </h3>
                  <OrderTimeline order={displayOrder} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal; 