import React, { useEffect, useState } from 'react';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaTruck, FaCheckCircle, FaClock, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

interface DeliveryPartnerDetails {
  profile: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      isPhoneEmailVerified: boolean;
      createdAt: string;
      updatedAt: string;
    };
    city?: string;
    vehicleNumber?: string;
    licenseNumber?: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  };
  recentOrders: Array<{
    _id: string;
    orderId: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    orderedBy: {
      name: string;
      email: string;
      phone: string;
    };
    laboratoryUser?: {
      name: string;
      email: string;
      phone: string;
    };
  }>;
}

interface DeliveryPartnerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string | null;
}

const DeliveryPartnerDetailsModal: React.FC<DeliveryPartnerDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  partnerId 
}) => {
  const [partnerDetails, setPartnerDetails] = useState<DeliveryPartnerDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !partnerId) return;
    
    const fetchPartnerDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('admin_token');
        const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/delivery-partners/${partnerId}`;
        
        const res = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch delivery partner details');
        }
        
        const data = await res.json();
        if (data.success && data.data) {
          setPartnerDetails(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching delivery partner details:', err);
        setError('Failed to load delivery partner details');
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerDetails();
  }, [isOpen, partnerId]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'delivery_accepted':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned_to_delivery':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (!isOpen || !partnerId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaTruck className="text-blue-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delivery Partner Details</h2>
              <p className="text-sm text-gray-500">
                {partnerDetails?.profile.user.name || 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-light focus:outline-none transition-colors"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                <span className="text-gray-600">Loading delivery partner details...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading details</h3>
              <p className="text-gray-500">{error}</p>
            </div>
          ) : partnerDetails ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Partner Info & Stats */}
              <div className="space-y-6">
                {/* Partner Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaUser className="text-blue-600" />
                    Partner Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{partnerDetails.profile.user.name}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaEnvelope className="text-gray-400" />
                          {partnerDetails.profile.user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaPhone className="text-gray-400" />
                          {partnerDetails.profile.user.phone}
                        </div>

                      </div>
                    </div>
                    
                    {partnerDetails.profile.city && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">City:</span> {partnerDetails.profile.city}
                        </p>
                      </div>
                    )}
                    
                    {partnerDetails.profile.vehicleNumber && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Vehicle:</span> {partnerDetails.profile.vehicleNumber}
                        </p>
                      </div>
                    )}
                    
                    {partnerDetails.profile.licenseNumber && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">License:</span> {partnerDetails.profile.licenseNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    Performance Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FaTruck className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Total Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{partnerDetails.stats.totalOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCheckCircle className="text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Completed</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{partnerDetails.stats.completedOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FaClock className="text-orange-600" />
                        <span className="text-sm font-medium text-gray-600">Pending</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{partnerDetails.stats.pendingOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">₹{partnerDetails.stats.totalRevenue}</p>
                    </div>
                  </div>
                  
                  {partnerDetails.stats.totalOrders > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completion Rate:</span>
                        <span className="text-lg font-semibold text-green-600">
                          {Math.round((partnerDetails.stats.completedOrders / partnerDetails.stats.totalOrders) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member Since:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(partnerDetails.profile.user.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(partnerDetails.profile.updatedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Delivery Partner
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Recent Orders */}
              <div className="space-y-6">
                {/* Recent Orders */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaTruck className="text-blue-600" />
                    Recent Orders ({partnerDetails.recentOrders.length})
                  </h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {partnerDetails.recentOrders.length > 0 ? (
                      partnerDetails.recentOrders.map((order) => (
                        <div key={order._id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Order #{order.orderId}</h4>
                              <p className="text-sm text-gray-500">
                                Customer: {order.orderedBy.name}
                              </p>
                              {order.laboratoryUser && (
                                <p className="text-sm text-gray-500">
                                  Lab: {order.laboratoryUser.name}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">₹{order.totalPrice}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FaTruck className="text-gray-400 text-4xl mx-auto mb-4" />
                        <p className="text-gray-500">No orders found</p>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DeliveryPartnerDetailsModal; 