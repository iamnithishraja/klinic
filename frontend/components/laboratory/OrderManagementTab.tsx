import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useOrderStore } from '@/store/orderStore';
import { Order } from '@/types/medicineTypes';
import { Colors } from '@/constants/Colors';
import apiClient from '@/api/client';

interface OrderDetailsModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ visible, order, onClose }) => {
  if (!order) return null;

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
      case 'confirmed':
        return '#3B82F6';
      case 'out_for_delivery':
        return '#F59E0B';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return Colors.light.icon;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID:</Text>
              <Text style={styles.detailValue}>{order._id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Price:</Text>
              <Text style={styles.detailValue}>₹{order.totalPrice}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
            </View>

            {order.prescription && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prescription:</Text>
                <Text style={styles.detailValue}>{order.prescription}</Text>
              </View>
            )}

            {order.products && order.products.length > 0 && (
              <View style={styles.productsSection}>
                <Text style={styles.sectionTitle}>Products</Text>
                {order.products.map((productItem, index) => (
                  <View key={`${productItem.product._id}-${index}`} style={styles.productItem}>
                    <Text style={styles.productName}>{productItem.product.name}</Text>
                    <Text style={styles.productQuantity}>Qty: {productItem.quantity}</Text>
                    <Text style={styles.productPrice}>₹{productItem.product.price}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const OrderManagementTab: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const labOrders = useOrderStore(state => state.labOrders);
  const pagination = useOrderStore(state => state.pagination);
  const isLoading = useOrderStore(state => state.isLoading);
  const fetchLabOrders = useOrderStore(state => state.fetchLabOrders);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  console.log('OrderManagementTab render - labOrders:', labOrders.length, 'isLoading:', isLoading);

  // Fetch orders on mount and when filter changes
  useEffect(() => {
    console.log('OrderManagementTab useEffect triggered - orderFilter:', orderFilter, 'selectedStatus:', selectedStatus);
    
    const filters: any = {};
    if (orderFilter === 'assigned') filters.assignedOnly = true;
    if (orderFilter === 'unassigned') filters.unassignedOnly = true;
    if (selectedStatus) filters.status = selectedStatus;
    
    console.log('Calling fetchLabOrders with filters:', filters);
    fetchLabOrders(filters);
  }, [orderFilter, selectedStatus, fetchLabOrders]);

  const handleRefresh = useCallback(async () => {
    console.log('Refreshing lab orders...');
    setRefreshing(true);
    const filters: any = {};
    if (orderFilter === 'assigned') filters.assignedOnly = true;
    if (orderFilter === 'unassigned') filters.unassignedOnly = true;
    if (selectedStatus) filters.status = selectedStatus;
    await fetchLabOrders(filters, true);
    setRefreshing(false);
  }, [orderFilter, selectedStatus, fetchLabOrders]);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: 'confirmed' | 'out_for_delivery' | 'delivered') => {
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to update the order status to "${newStatus.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              console.log('Updating order status:', orderId, 'to:', newStatus);
              setUpdatingStatus(orderId);
              const response = await apiClient.put(`/api/v1/orders/${orderId}/status`, {
                status: newStatus
              });
              
              if (response.data.success) {
                Alert.alert('Success', 'Order status updated successfully!');
                await fetchLabOrders(undefined, true);
              } else {
                Alert.alert('Error', 'Failed to update order status');
              }
            } catch (error: any) {
              console.error('Error updating order status:', error);
              Alert.alert('Error', 'Failed to update order status. Please try again.');
            } finally {
              setUpdatingStatus(null);
            }
          },
        },
      ]
    );
  }, [fetchLabOrders]);

  const handleClaimOrder = useCallback(async (orderId: string) => {
    Alert.alert(
      'Claim Order',
      'Are you sure you want to claim this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              console.log('Claiming order:', orderId);
              const response = await apiClient.post(`/api/v1/orders/${orderId}/claim`);
              
              if (response.data.success) {
                Alert.alert('Success', 'Order claimed successfully!');
                await fetchLabOrders(undefined, true);
              } else {
                Alert.alert('Error', 'Failed to claim order');
              }
            } catch (error: any) {
              console.error('Error claiming order:', error);
              Alert.alert('Error', 'Failed to claim order. Please try again.');
            }
          },
        },
      ]
    );
  }, [fetchLabOrders]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed':
        return '#3B82F6';
      case 'out_for_delivery':
        return '#F59E0B';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return Colors.light.icon;
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'confirmed':
        return 'check-circle';
      case 'out_for_delivery':
        return 'truck';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'times-circle';
      default:
        return 'clock-o';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const filteredOrders = labOrders;

  const renderOrderItem = useCallback(({ item: order }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
      }}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order._id.slice(-8)}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <FontAwesome name={getStatusIcon(order.status)} size={12} color="white" />
          <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.priceText}>₹{order.totalPrice}</Text>
        {order.prescription && (
          <Text style={styles.prescriptionText} numberOfLines={2}>
            Prescription: {order.prescription}
          </Text>
        )}
        {order.products && order.products.length > 0 && (
          <Text style={styles.productsText}>
            {order.products.length} product{order.products.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.orderActions}>
        {order.needAssignment ? (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => handleClaimOrder(order._id)}
          >
            <FontAwesome name="hand-paper-o" size={14} color="white" />
            <Text style={styles.claimButtonText}>Claim Order</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statusActions}>
            {order.status === 'pending' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => handleStatusUpdate(order._id, 'confirmed')}
                disabled={updatingStatus === order._id}
              >
                {updatingStatus === order._id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <FontAwesome name="check" size={12} color="white" />
                    <Text style={styles.actionButtonText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {order.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deliveryButton]}
                onPress={() => handleStatusUpdate(order._id, 'out_for_delivery')}
                disabled={updatingStatus === order._id}
              >
                {updatingStatus === order._id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <FontAwesome name="truck" size={12} color="white" />
                    <Text style={styles.actionButtonText}>Out for Delivery</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {order.status === 'out_for_delivery' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deliveredButton]}
                onPress={() => handleStatusUpdate(order._id, 'delivered')}
                disabled={updatingStatus === order._id}
              >
                {updatingStatus === order._id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <FontAwesome name="check-circle" size={12} color="white" />
                    <Text style={styles.actionButtonText}>Mark Delivered</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [handleClaimOrder, handleStatusUpdate, updatingStatus, formatDate, getStatusColor, getStatusIcon]);

  const renderEmptyState = useCallback(() => {
    let message = 'No orders found';
    if (orderFilter === 'assigned') {
      message = 'No assigned orders found';
    } else if (orderFilter === 'unassigned') {
      message = 'No unassigned orders found';
    }
    if (selectedStatus) {
      message += ` with status "${selectedStatus}"`;
    }

    return (
      <View style={styles.emptyState}>
        <FontAwesome name="inbox" size={48} color={Colors.light.icon} />
        <Text style={styles.emptyStateText}>{message}</Text>
        <Text style={styles.emptyStateSubtext}>
          {isLoading ? 'Loading orders...' : 'Pull to refresh'}
        </Text>
      </View>
    );
  }, [orderFilter, selectedStatus, isLoading]);

  const renderFilterChips = useCallback(() => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterChip, orderFilter === 'all' && styles.filterChipActive]}
          onPress={() => setOrderFilter('all')}
        >
          <FontAwesome name="list" size={12} color={orderFilter === 'all' ? 'white' : Colors.light.text} />
          <Text style={[styles.filterChipText, orderFilter === 'all' && styles.filterChipTextActive]}>
            All Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, orderFilter === 'assigned' && styles.filterChipActive]}
          onPress={() => setOrderFilter('assigned')}
        >
          <FontAwesome name="check-circle" size={12} color={orderFilter === 'assigned' ? 'white' : Colors.light.text} />
          <Text style={[styles.filterChipText, orderFilter === 'assigned' && styles.filterChipTextActive]}>
            Assigned
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, orderFilter === 'unassigned' && styles.filterChipActive]}
          onPress={() => setOrderFilter('unassigned')}
        >
          <FontAwesome name="clock-o" size={12} color={orderFilter === 'unassigned' ? 'white' : Colors.light.text} />
          <Text style={[styles.filterChipText, orderFilter === 'unassigned' && styles.filterChipTextActive]}>
            Unassigned
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilterScroll}>
        {['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusChip, selectedStatus === status && styles.statusChipActive]}
            onPress={() => setSelectedStatus(selectedStatus === status ? null : status)}
          >
            <FontAwesome 
              name={getStatusIcon(status)} 
              size={10} 
              color={selectedStatus === status ? 'white' : getStatusColor(status)} 
            />
            <Text style={[styles.statusChipText, selectedStatus === status && styles.statusChipTextActive]}>
              {status.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ), [orderFilter, selectedStatus, getStatusIcon, getStatusColor]);

  return (
    <View style={styles.container}>
      {renderFilterChips()}

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.light.tint]}
            tintColor={Colors.light.tint}
          />
        }
        ListEmptyComponent={renderEmptyState}
        onEndReached={() => {
          if (pagination.hasNextPage && !isLoading) {
            const filters: any = {};
            if (orderFilter === 'assigned') filters.assignedOnly = true;
            if (orderFilter === 'unassigned') filters.unassignedOnly = true;
            if (selectedStatus) filters.status = selectedStatus;
            fetchLabOrders({ ...filters, page: pagination.currentPage + 1 });
          }
        }}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => 
          pagination.hasNextPage && isLoading ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={Colors.light.tint} />
              <Text style={styles.loadMoreText}>Loading more orders...</Text>
            </View>
          ) : null
        }
      />

      <OrderDetailsModal
        visible={showOrderDetails}
        order={selectedOrder}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    marginBottom: 8,
  },
  statusFilterScroll: {
    marginTop: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: 'white',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 3,
  },
  statusChipTextActive: {
    color: 'white',
  },
  ordersList: {
    padding: 16,
    paddingBottom: 100,
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
    fontWeight: '600',
    color: Colors.light.text,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  orderDetails: {
    marginBottom: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.tint,
    marginBottom: 4,
  },
  prescriptionText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  productsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  deliveryButton: {
    backgroundColor: '#F59E0B',
  },
  deliveredButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    marginLeft: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
    textAlign: 'right',
  },
  productsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productName: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  productQuantity: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
});