import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import apiClient from '@/api/client';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import DeliveryAssignmentModal from '@/components/orders/DeliveryAssignmentModal';

// Define interfaces locally since they're not exported from userTypes
interface LabOrder {
  _id: string;
  orderedBy: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  laboratoryUser?: {
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
    profile?: {
      address?: {
        address?: string;
        pinCode?: string;
      };
      city?: string;
    };
  };
  products?: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
  }>;
  prescription?: string;
  totalPrice: number;
  isPaid: boolean;
  needAssignment: boolean;
  status: 'pending' | 'confirmed' | 'assigned_to_delivery' | 'delivery_accepted' | 'out_for_delivery' | 'delivered' | 'delivery_rejected' | 'cancelled';
  customerAddress?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from API response
  acceptedAt?: string | null;
  assignedAt?: string | null;
  deliveredAt?: string | null;
  outForDeliveryAt?: string | null;
  rejectionReason?: string | null;
  __v?: number;
}

interface OrderManagementTabProps {
  onRefresh?: () => void;
}

type FilterType = 'all' | 'new' | 'assigned' | 'delivered';

const OrderManagementTab: React.FC<OrderManagementTabProps> = ({ onRefresh }) => {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showAssignDelivery, setShowAssignDelivery] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchLabOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching lab orders...');
      const response = await apiClient.get('/api/v1/orders/lab-orders-with-addresses');
      
      console.log('Lab orders response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
      
      const orders = response.data.data.orders || [];
      console.log('Setting orders:', orders.length, 'orders found');
      
      // Log order statuses for debugging
      const statusCounts = orders.reduce((acc: Record<string, number>, order: LabOrder) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});
      console.log('Order status distribution:', statusCounts);
      
      setOrders(orders);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConfirmOrder = async (orderId: string) => {
    try {
      const response = await apiClient.put(`/api/v1/orders/${orderId}/status`, {
        status: 'confirmed'
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Order confirmed successfully!');
        fetchLabOrders(); // Refresh orders
      } else {
        Alert.alert('Error', 'Failed to confirm order. Please try again.');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      Alert.alert('Error', 'Failed to confirm order. Please try again.');
    }
  };

  useEffect(() => {
    fetchLabOrders();
  }, [fetchLabOrders]);

  // Log filter changes for debugging
  useEffect(() => {
    console.log('Active filter changed to:', activeFilter);
    const filteredOrders = getFilteredOrders();
    console.log('Filtered orders count:', filteredOrders.length);
  }, [activeFilter, orders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLabOrders();
    setRefreshing(false);
    onRefresh?.();
  }, [fetchLabOrders, onRefresh]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#3B82F6';
      case 'assigned_to_delivery':
        return '#8B5CF6';
      case 'delivery_accepted':
        return '#10B981';
      case 'out_for_delivery':
        return '#F97316';
      case 'delivered':
        return '#059669';
      case 'delivery_rejected':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'clock-o';
      case 'confirmed':
        return 'check-circle';
      case 'assigned_to_delivery':
        return 'user-plus';
      case 'delivery_accepted':
        return 'check-circle';
      case 'out_for_delivery':
        return 'truck';
      case 'delivered':
        return 'check-circle';
      case 'delivery_rejected':
        return 'times-circle';
      case 'cancelled':
        return 'times-circle';
      default:
        return 'clock-o';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'PENDING';
      case 'confirmed':
        return 'CONFIRMED';
      case 'assigned_to_delivery':
        return 'ASSIGNED';
      case 'delivery_accepted':
        return 'ACCEPTED';
      case 'out_for_delivery':
        return 'OUT FOR DELIVERY';
      case 'delivered':
        return 'DELIVERED';
      case 'delivery_rejected':
        return 'REJECTED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  // Filter orders based on active filter
  const getFilteredOrders = () => {
    const assignedOrders = orders.filter(order => order.laboratoryUser);
    console.log('Total orders:', orders.length, 'Assigned orders:', assignedOrders.length);
    
    const filtered = (() => {
      switch (activeFilter) {
        case 'new':
          return assignedOrders.filter(order => 
            order.status === 'pending' || order.status === 'confirmed'
          );
        case 'assigned':
          return assignedOrders.filter(order => 
            order.status === 'assigned_to_delivery' || 
            order.status === 'delivery_accepted' ||
            order.status === 'out_for_delivery'
          );
        case 'delivered':
          return assignedOrders.filter(order => 
            order.status === 'delivered'
          );
        case 'all':
        default:
          return assignedOrders;
      }
    })();
    
    console.log(`Filter "${activeFilter}" returned ${filtered.length} orders`);
    
    // Log order types for debugging
    const orderTypeCounts = filtered.reduce((acc: Record<string, number>, order: LabOrder) => {
      const isProductOrder = order.products && order.products.length > 0;
      const orderType = isProductOrder ? 'Product Order' : 'Prescription Order';
      acc[orderType] = (acc[orderType] || 0) + 1;
      return acc;
    }, {});
    console.log('Order type distribution:', orderTypeCounts);
    
    return filtered;
  };

  // Get count for each filter
  const getFilterCount = (filterType: FilterType) => {
    const assignedOrders = orders.filter(order => order.laboratoryUser);
    
    const count = (() => {
      switch (filterType) {
        case 'new':
          return assignedOrders.filter(order => 
            order.status === 'pending' || order.status === 'confirmed'
          ).length;
        case 'assigned':
          return assignedOrders.filter(order => 
            order.status === 'assigned_to_delivery' || 
            order.status === 'delivery_accepted' ||
            order.status === 'out_for_delivery'
          ).length;
        case 'delivered':
          return assignedOrders.filter(order => 
            order.status === 'delivered'
          ).length;
        case 'all':
        default:
          return assignedOrders.length;
      }
    })();
    
    return count;
  };

  const renderOrderItem = useCallback(({ item }: { item: LabOrder }) => {
    // Determine order type
    const isProductOrder = item.products && item.products.length > 0;
    const isPrescriptionOrder = !isProductOrder && item.prescription;
    const orderType = isProductOrder ? 'Product Order' : 'Prescription Order';
    
    // Check if lab can assign delivery partner
    const canAssignDelivery = item.laboratoryUser && 
      (item.status === 'confirmed' || item.status === 'pending') && 
      !item.deliveryPartner;
    
    // Check if lab can confirm order
    const canConfirmOrder = item.laboratoryUser && item.status === 'pending';
    
    // Check if order needs assignment
    const needsAssignment = item.needAssignment && !item.laboratoryUser;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          console.log('Opening order details for order:', item._id);
          console.log('Order data:', item);
          setSelectedOrder(item);
          setShowOrderDetails(true);
        }}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Order #{item._id.slice(-8)}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            <Text style={[styles.orderType, { 
              color: isProductOrder ? '#10B981' : '#F59E0B' 
            }]}>
              {orderType}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <FontAwesome name={getStatusIcon(item.status)} size={12} color="white" />
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.orderedBy.name}</Text>
          <Text style={styles.customerContact}>
            {item.orderedBy.phone} • {item.orderedBy.email}
          </Text>
          {item.customerAddress && (
            <Text style={styles.customerAddress} numberOfLines={2}>
              📍 {item.customerAddress}
            </Text>
          )}
        </View>

        {item.prescription && (
          <Text style={styles.prescriptionText} numberOfLines={2}>
            Prescription: {item.prescription}
          </Text>
        )}
        
        {item.products && item.products.length > 0 && (
          <Text style={styles.productsText}>
            {item.products.length} product{item.products.length > 1 ? 's' : ''}
          </Text>
        )}

        <View style={styles.orderActions}>
          <Text style={styles.orderPrice}>₹{item.totalPrice.toFixed(2)}</Text>
          <View style={styles.actionButtons}>
            {needsAssignment && (
              <View style={styles.needsAssignmentBadge}>
                <FontAwesome name="exclamation-triangle" size={14} color="#F59E0B" />
                <Text style={styles.needsAssignmentText}>Needs Admin Assignment</Text>
              </View>
            )}
            {canAssignDelivery && (
              <TouchableOpacity
                style={styles.assignDeliveryButton}
                onPress={() => {
                  setSelectedOrder(item);
                  setShowAssignDelivery(true);
                }}
              >
                <FontAwesome name="truck" size={14} color="white" />
                <Text style={styles.assignButtonText}>Assign Delivery</Text>
              </TouchableOpacity>
            )}
            {canConfirmOrder && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleConfirmOrder(item._id)}
              >
                <FontAwesome name="check" size={14} color="white" />
                <Text style={styles.assignButtonText}>Confirm Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [setSelectedOrder, setShowOrderDetails, setShowAssignDelivery]);

  const renderFilterChips = () => {
    const filters = [
      { id: 'all', label: 'Total', icon: 'list' },
      { id: 'new', label: 'New', icon: 'clock-o' },
      { id: 'assigned', label: 'Assigned', icon: 'user-plus' },
      { id: 'delivered', label: 'Delivered', icon: 'check-circle' },
    ];

    // Don't render filters if there are no orders at all
    if (orders.length === 0) {
      return null;
    }

    return (
      <View style={styles.filterContainer}>
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
          renderItem={({ item }) => {
            const count = getFilterCount(item.id as FilterType);
            const isActive = activeFilter === item.id;
            
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isActive && styles.activeFilterChip
                ]}
                onPress={() => {
                  console.log('Filter changed to:', item.id, 'Count:', count);
                  setActiveFilter(item.id as FilterType);
                }}
                accessibilityLabel={`${item.label} filter with ${count} orders`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <FontAwesome 
                  name={item.icon as any} 
                  size={14} 
                  color={isActive ? 'white' : '#6B7280'} 
                />
                <Text style={[
                  styles.filterChipText,
                  isActive && styles.activeFilterChipText
                ]}>
                  {item.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      </View>
    );
  };

  const renderEmptyState = () => {
    const getEmptyMessage = () => {
      switch (activeFilter) {
        case 'new':
          return 'No new orders waiting for confirmation.';
        case 'assigned':
          return 'No orders currently assigned to delivery partners.';
        case 'delivered':
          return 'No delivered orders found.';
        default:
          return 'No assigned orders at the moment. Orders will appear here when admin assigns them to your laboratory.';
      }
    };

    const getEmptyIcon = () => {
      switch (activeFilter) {
        case 'new':
          return 'clock-o';
        case 'assigned':
          return 'user-plus';
        case 'delivered':
          return 'check-circle';
        default:
          return 'shopping-bag';
      }
    };

    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name={getEmptyIcon()} size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Orders Found</Text>
        <Text style={styles.emptySubtitle}>
          {getEmptyMessage()}
        </Text>
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  console.log('Modal visible:', showOrderDetails, 'Selected order:', selectedOrder);

  return (
    <View style={styles.container}>
      {renderFilterChips()}
      
      <FlatList
        data={getFilteredOrders()}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        key={activeFilter} // Force re-render when filter changes
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        order={selectedOrder}
        onAssignDelivery={() => {
          setShowOrderDetails(false);
          setShowAssignDelivery(true);
        }}
      />

      {/* Assign Delivery Partner Modal */}
      <DeliveryAssignmentModal
        visible={showAssignDelivery}
        onClose={() => setShowAssignDelivery(false)}
        orderId={selectedOrder?._id || ''}
        onAssignmentSuccess={() => {
          fetchLabOrders();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  activeFilterChip: {
    backgroundColor: Colors.light.tint,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterChipText: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  orderType: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  customerContact: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  customerAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  prescriptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  productsText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  assignDeliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  needsAssignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  needsAssignmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  modalActions: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Overlay styles
});

export default OrderManagementTab;