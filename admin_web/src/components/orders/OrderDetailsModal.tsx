import React, { useEffect, useState } from 'react';
import { FaTimes, FaUser, FaFlask, FaBox, FaDownload, FaPhone, FaEnvelope, FaFileAlt, FaEye, FaTruck } from 'react-icons/fa';
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
  cod: boolean;
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
  assignedDeliveryPartner?: {
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
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

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

  const handleViewPrescription = () => {
    setShowPrescriptionModal(true);
  };

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
    <>
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

                  {/* Prescription Section */}
                  {displayOrder.prescription && (
                    <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FaFileAlt className="text-orange-600" />
                        Prescription
                      </h3>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          This order includes a prescription that needs to be processed by a laboratory.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleViewPrescription}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                          >
                            <FaEye className="text-sm" />
                            View Prescription
                          </button>
                          <a
                            href={displayOrder.prescription}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                          >
                            <FaDownload className="text-sm" />
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

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
                            {displayOrder.cod && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  <span className="text-sm font-medium text-blue-800">COD Order</span>
                                </div>
                                <div className="text-sm text-blue-700">
                                  <p className="font-medium">Order value: ₹{displayOrder.totalPrice}</p>
                                  <p className="text-xs mt-1">Payment will be collected by delivery partner</p>
                                </div>
                              </div>
                            )}
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
                        {displayOrder.cod && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              <span className="text-sm font-medium text-orange-800">COD Order</span>
                            </div>
                            <div className="text-sm text-orange-700">
                              <p>When assigning laboratory, inform them this is a COD order worth ₹{displayOrder.totalPrice}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaFlask className="text-green-600 text-xl" />
                        </div>
                        <p className="text-green-600 font-medium mb-2">Product Order</p>
                        <p className="text-sm text-gray-500">Products are sourced from their respective laboratories</p>
                        {displayOrder.cod && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span className="text-sm font-medium text-green-800">COD Order</span>
                            </div>
                            <div className="text-sm text-green-700">
                              <p>Order value: ₹{displayOrder.totalPrice} - Payment will be collected by delivery partner</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delivery Partner Information */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaTruck className="text-blue-600" />
                      Delivery Partner Information
                    </h3>
                    {displayOrder.assignedDeliveryPartner ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{displayOrder.assignedDeliveryPartner.name}</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaEnvelope className="text-gray-400" />
                              {displayOrder.assignedDeliveryPartner.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaPhone className="text-gray-400" />
                              {displayOrder.assignedDeliveryPartner.phone}
                            </div>
                            {displayOrder.cod && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                  <span className="text-sm font-medium text-red-800">Cash on Delivery</span>
                                </div>
                                <div className="text-sm text-red-700">
                                  <p className="font-medium">Collect ₹{displayOrder.totalPrice} from customer</p>
                                  <p className="text-xs mt-1">Payment due upon delivery</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaTruck className="text-gray-400 text-xl" />
                        </div>
                        <p className="text-gray-600 font-medium mb-2">No Delivery Partner Assigned</p>
                        <p className="text-sm text-gray-500">This order has not been assigned to a delivery partner yet</p>
                        {displayOrder.cod && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              <span className="text-sm font-medium text-orange-800">COD Order</span>
                            </div>
                            <div className="text-sm text-orange-700">
                              <p>When assigning delivery partner, inform them to collect ₹{displayOrder.totalPrice}</p>
                            </div>
                          </div>
                        )}
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
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-blue-600">₹{displayOrder.totalPrice}</span>
                          {displayOrder.cod && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              COD
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">Payment Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          displayOrder.cod 
                            ? 'bg-orange-100 text-orange-800' 
                            : displayOrder.isPaid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {displayOrder.cod ? 'Cash on Delivery' : (displayOrder.isPaid ? 'Paid' : 'Pending')}
                        </span>
                      </div>
                      {displayOrder.cod && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            <span className="text-sm font-medium text-orange-800">Cash on Delivery Order</span>
                          </div>
                          <div className="text-sm text-orange-700 space-y-1">
                            <p>• Delivery partner must collect ₹{displayOrder.totalPrice} from customer</p>
                            <p>• Payment will be processed after successful delivery</p>
                            <p>• Ensure delivery partner is informed about COD amount</p>
                          </div>
                        </div>
                      )}
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

      {/* Prescription Modal */}
      {showPrescriptionModal && displayOrder.prescription && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Prescription Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="text-orange-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Prescription Details</h2>
                  <p className="text-sm text-gray-500">Order: {displayOrder.orderId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={displayOrder.prescription}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <FaDownload className="text-sm" />
                  Download
                </a>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl font-light focus:outline-none transition-colors"
                  aria-label="Close prescription modal"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            {/* Prescription Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-6">
                {/* Prescription Image/Content */}
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription Content</h3>
                  <div className="bg-white rounded-lg p-4 border border-orange-300">
                    <div className="flex items-center justify-center">
                      <img
                        src={displayOrder.prescription}
                        alt="Prescription"
                        className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="text-center py-8">
                                <FaFileAlt class="text-orange-400 text-4xl mx-auto mb-4" />
                                <p class="text-gray-600 mb-2">Prescription image not available</p>
                                <a href="${displayOrder.prescription}" target="_blank" rel="noopener noreferrer" 
                                   class="text-orange-600 hover:text-orange-700 font-medium">
                                  Click here to view/download
                                </a>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Prescription Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium text-gray-900">{displayOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium text-gray-900">{displayOrder.user ? displayOrder.user.name : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(displayOrder.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <OrderStatusBadge status={displayOrder.status} />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <a
                    href={displayOrder.prescription}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    <FaDownload className="text-sm" />
                    Download Prescription
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailsModal; 