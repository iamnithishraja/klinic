import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaDownload, FaUser, FaFlask, FaBox, FaRupeeSign, FaClipboardList, FaSpinner, FaTruck } from 'react-icons/fa';
import OrderStatusBadge from './OrderStatusBadge';
import OrderDetailsModal from './OrderDetailsModal';
import LabAssignmentModal from './LabAssignmentModal';
import DeliveryAssignmentModal from './DeliveryAssignmentModal';
import axios from 'axios';

export interface Order {
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
  deliveryPartner?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  prescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  needAssignment?: boolean;
}

interface OrdersTableProps {
  filters?: OrderFilters;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ filters = {} }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showDeliveryAssignmentModal, setShowDeliveryAssignmentModal] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [orderToAssignDelivery, setOrderToAssignDelivery] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch orders from API - Memoized to prevent unnecessary re-renders
  const fetchOrders = useCallback(async (newFilters?: OrderFilters) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      const currentFilters = newFilters || filters;
      
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
      if (currentFilters.page) params.append('page', currentFilters.page.toString());
      if (currentFilters.limit) params.append('limit', currentFilters.limit.toString());
      if (currentFilters.needAssignment) params.append('needAssignment', 'true');

      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/orders?${params.toString()}`;
      
      // Get auth token
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // console.log('Fetching orders from:', apiUrl);
      const response = await axios.get(apiUrl, { headers });
      // console.log('Orders response:', response.data);
      
      if (response.data.success && response.data.data?.orders) {
        setOrders(response.data.data.orders);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        setPage(response.data.data.pagination?.page || 1);
      } else {
        // console.warn('No orders found or invalid response structure');
        setOrders([]);
        setTotalPages(1);
        setPage(1);
      }
    } catch {
      // console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
      setTotalPages(1);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle filter changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1); // Reset to first page when filters change
    } else {
      fetchOrders({ ...filters, page: 1 });
    }
  }, [filters.search, filters.status, filters.startDate, filters.endDate, filters.needAssignment]);

  // Handle page changes
  useEffect(() => {
    fetchOrders({ ...filters, page });
  }, [page]);

  // Add cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup function to cancel any pending requests if needed
    };
  }, []);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleAssignLab = (order: Order) => {
    setOrderToAssign(order);
    setShowAssignmentModal(true);
  };

  const handleAssignDelivery = (order: Order) => {
    setOrderToAssignDelivery(order);
    setShowDeliveryAssignmentModal(true);
  };

  const handleLabAssigned = async (labId: string) => {
    if (!orderToAssign) return;
    
    try {
      console.log('Assigning lab to order:', { orderId: orderToAssign._id, labId });
      
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/orders/${orderToAssign._id}/assign-lab`;
      
      // Get auth token
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.put(apiUrl, { labId }, { headers });
      
      console.log('Lab assignment response:', response.data);
      
      // Refresh orders to show updated data
      await fetchOrders();
      
      // Show success notification
      setToast(`Laboratory assigned successfully to order ${orderToAssign.orderId}!`);

      // Delay closing modal to show check
      setTimeout(() => {
        setShowAssignmentModal(false);
        setOrderToAssign(null);
      }, 1200);
    } catch (error: unknown) {
      console.error('Failed to assign laboratory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign laboratory. Please try again.';
      setToast(errorMessage);
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleDeliveryAssigned = async (deliveryPartnerId: string) => {
    if (!orderToAssignDelivery) return;
    
    try {
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/orders/${orderToAssignDelivery._id}/assign-delivery`;
      
      // Get auth token
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(apiUrl, { deliveryPartnerId }, { headers });
      
      // Refresh orders to show updated data
      await fetchOrders();
      
      // Show success notification
      setToast(`Delivery partner assigned successfully to order ${orderToAssignDelivery.orderId}!`);
      
      setShowDeliveryAssignmentModal(false);
      setOrderToAssignDelivery(null);
    } catch {
      // console.error('Failed to assign delivery partner:', error);
      setToast('Failed to assign delivery partner. Please try again.');
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProductCount = (products: Order['products']) => {
    return products.reduce((total, product) => total + product.quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <FaSpinner className="animate-spin text-blue-600 text-xl" />
          <span className="text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaClipboardList className="text-red-600 text-2xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading orders</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => fetchOrders()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FaClipboardList className="text-blue-600 text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
            <p className="text-sm text-gray-500">{orders.length} total orders</p>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Order Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaBox className="text-blue-600 text-sm" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.orderId}</h3>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaUser className="text-green-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{order.user ? order.user.name : 'Unknown User'}</p>
                  <div className="text-xs text-gray-500">
                    <p>{order.user ? order.user.email : 'N/A'}</p>
                    <p>{order.user ? order.user.phone : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Laboratory Info */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaFlask className="text-purple-600 text-sm" />
                </div>
                <div className="flex-1">
                  {order.assignedLab ? (
                    <>
                      <p className="font-medium text-gray-900">{order.assignedLab.name}</p>
                      <p className="text-xs text-gray-500">{order.assignedLab.email}</p>
                    </>
                  ) : order.prescription ? (
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 text-sm font-medium">Needs Assignment</span>
                      {order.needAssignment && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                          Urgent
                        </span>
                      )}
                    </div>
                  ) : order.needAssignment ? (
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 text-sm font-medium">Needs Assignment</span>
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                        Urgent
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500">Product Order</p>
                      {order.products.length > 0 && order.products[0].laboratory && (
                        <p className="text-xs text-purple-600">From: {order.products[0].laboratory.name}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Partner Info */}
              {order.deliveryPartner && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaTruck className="text-green-600 text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{order.deliveryPartner.name}</p>
                    <p className="text-xs text-gray-500">{order.deliveryPartner.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="p-6">
              {/* Products Summary */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Products</span>
                  <span className="text-xs text-gray-500">{getProductCount(order.products)} items</span>
                </div>
                <div className="space-y-2">
                  {order.products.slice(0, 2).map((product, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 truncate">{product.name}</span>
                        <span className="text-gray-900 font-medium">₹{product.price}</span>
                      </div>
                      {product.laboratory && (
                        <p className="text-xs text-purple-600 mt-1">From: {product.laboratory.name}</p>
                      )}
                    </div>
                  ))}
                  {order.products.length > 2 && (
                    <p className="text-xs text-gray-500">+{order.products.length - 2} more items</p>
                  )}
                </div>
              </div>

              {/* Total Price */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <div className="flex items-center gap-1">
                  <FaRupeeSign className="text-gray-600 text-sm" />
                  <span className="text-lg font-bold text-gray-900">₹{order.totalPrice}</span>
                </div>
              </div>

              {/* Prescription */}
              {order.prescription && (
                <div className="mb-4">
                  <a
                    href={order.prescription}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <FaDownload className="text-sm" />
                    View Prescription
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewDetails(order)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FaEye className="text-sm" />
                  View Details
                </button>
                {order.prescription && order.needAssignment && (
                  <button
                    onClick={() => handleAssignLab(order)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    Assign Lab
                  </button>
                )}
                {!order.prescription && order.needAssignment && (
                  <button
                    onClick={() => handleAssignLab(order)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Need Assignment
                  </button>
                )}
                {order.assignedLab && !order.deliveryPartner && (
                  <button
                    onClick={() => handleAssignDelivery(order)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <FaTruck className="text-sm mr-1" />
                    Assign Delivery
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaClipboardList className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">Orders will appear here once they are created.</p>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        order={selectedOrder}
      />

      {/* Lab Assignment Modal */}
      <LabAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false);
        }}
        orderId={orderToAssign?.orderId || ''}
        onAssign={handleLabAssigned}
      />

      {/* Delivery Assignment Modal */}
      <DeliveryAssignmentModal
        isOpen={showDeliveryAssignmentModal}
        onClose={() => setShowDeliveryAssignmentModal(false)}
        orderId={orderToAssignDelivery?._id || ''}
        onAssign={handleDeliveryAssigned}
      />
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out" role="alert">{toast}</div>
      )}
      <div className="flex justify-end pt-6 gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold disabled:opacity-50" aria-label="Previous Page">Prev</button>
        <span className="px-3 py-2">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold disabled:opacity-50" aria-label="Next Page">Next</button>
      </div>
    </div>
  );
};

export default OrdersTable; 