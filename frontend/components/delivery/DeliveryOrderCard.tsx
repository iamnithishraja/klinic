import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { DeliveryOrder ,useDeliveryStore} from '@/store/deliveryStore';

interface DeliveryOrderCardProps {
  order: DeliveryOrder;
}

const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({ order }) => {
  const { acceptOrder, rejectOrder, updateDeliveryStatus } = useDeliveryStore();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'assigned_to_delivery':
        return '#F59E0B';
      case 'delivery_accepted':
        return '#10B981';
      case 'out_for_delivery':
        return '#3B82F6';
      case 'delivered':
        return '#059669';
      case 'delivery_rejected':
        return '#EF4444';
      default:
        return Colors.light.icon;
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'assigned_to_delivery':
        return 'clock-o';
      case 'delivery_accepted':
        return 'check-circle';
      case 'out_for_delivery':
        return 'truck';
      case 'delivered':
        return 'check';
      case 'delivery_rejected':
        return 'times-circle';
      default:
        return 'clock-o';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'assigned_to_delivery':
        return 'NEW ORDER';
      case 'delivery_accepted':
        return 'ACCEPTED';
      case 'out_for_delivery':
        return 'IN TRANSIT';
      case 'delivered':
        return 'DELIVERED';
      case 'delivery_rejected':
        return 'REJECTED';
      default:
        return status.toUpperCase();
    }
  }, []);

  const getPriorityColor = useCallback((status: string) => {
    switch (status) {
      case 'assigned_to_delivery':
        return '#FEF3C7';
      case 'delivery_accepted':
        return '#D1FAE5';
      case 'out_for_delivery':
        return '#DBEAFE';
      case 'delivered':
        return '#D1FAE5';
      case 'delivery_rejected':
        return '#FEE2E2';
      default:
        return '#F3F4F6';
    }
  }, []);

  const handleAcceptOrder = useCallback(async () => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              console.log('Attempting to accept order:', order._id);
              const success = await acceptOrder(order._id);
              if (success) {
                Alert.alert('Success', `Order #${order._id.slice(-8)} accepted successfully!`);
              } else {
                Alert.alert('Error', 'Failed to accept order. Please try again.');
              }
            } catch (error) {
              console.error('Error accepting order:', error);
              Alert.alert('Error', 'Failed to accept order. Please try again.');
            }
          },
        },
      ]
    );
  }, [order._id, acceptOrder]);

  const handleRejectOrder = useCallback(async () => {
    // Use a simple alert with a default reason since Alert.prompt is not available on all platforms
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async () => {
            try {
              console.log('Attempting to reject order:', order._id, 'reason: Order rejected by delivery partner');
              const success = await rejectOrder(order._id, 'Order rejected by delivery partner');
              if (success) {
                Alert.alert('Success', `Order #${order._id.slice(-8)} rejected successfully!`);
              } else {
                Alert.alert('Error', 'Failed to reject order. Please try again.');
              }
            } catch (error) {
              console.error('Error rejecting order:', error);
              Alert.alert('Error', 'Failed to reject order. Please try again.');
            }
          },
        },
      ]
    );
  }, [order._id, rejectOrder]);

  const handleUpdateStatus = useCallback(async (newStatus: 'out_for_delivery' | 'delivered') => {
    const statusText = newStatus === 'out_for_delivery' ? 'out for delivery' : 'delivered';
    Alert.alert(
      'Update Status',
      `Are you sure you want to mark this order as ${statusText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setUpdatingStatus(newStatus);
              console.log('Attempting to update order status:', order._id, 'to:', newStatus);
              const success = await updateDeliveryStatus(order._id, newStatus);
              setUpdatingStatus(null);
              if (success) {
                Alert.alert('Success', `Order #${order._id.slice(-8)} status updated to ${statusText}!`);
              } else {
                Alert.alert('Error', 'Failed to update order status. Please try again.');
              }
            } catch (error) {
              console.error('Error updating order status:', error);
              setUpdatingStatus(null);
              Alert.alert('Error', 'Failed to update order status. Please try again.');
            }
          },
        },
      ]
    );
  }, [order._id, updateDeliveryStatus]);

  const renderActionButtons = () => {
    switch (order.status) {
      case 'assigned_to_delivery':
        return (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAcceptOrder}
            >
              <FontAwesome name="check" size={14} color="white" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleRejectOrder}
            >
              <FontAwesome name="times" size={14} color="white" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </>
        );
      case 'delivery_accepted':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.outForDeliveryButton]}
            onPress={() => handleUpdateStatus('out_for_delivery')}
            disabled={updatingStatus === 'out_for_delivery'}
          >
            {updatingStatus === 'out_for_delivery' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <FontAwesome name="truck" size={14} color="white" />
                <Text style={styles.actionButtonText}>Start Delivery</Text>
              </>
            )}
          </TouchableOpacity>
        );
      case 'out_for_delivery':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliveredButton]}
            onPress={() => handleUpdateStatus('delivered')}
            disabled={updatingStatus === 'delivered'}
          >
            {updatingStatus === 'delivered' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <FontAwesome name="check" size={14} color="white" />
                <Text style={styles.actionButtonText}>Mark Delivered</Text>
              </>
            )}
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.card, { borderLeftColor: getStatusColor(order.status), borderLeftWidth: 4 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order._id.slice(-8)}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <FontAwesome name={getStatusIcon(order.status)} size={12} color="white" />
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      {/* Priority Indicator */}
      {order.status === 'assigned_to_delivery' && (
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(order.status) }]}>
          <FontAwesome name="exclamation-circle" size={12} color="#F59E0B" />
          <Text style={styles.priorityText}>New order - Action required</Text>
        </View>
      )}

      {/* Customer Info */}
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{order.orderedBy.name}</Text>
        <Text style={styles.customerContact}>
          {order.orderedBy.phone} • {order.orderedBy.email}
        </Text>
      </View>

      {/* Order Details */}
      <View style={styles.orderDetails}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{order.totalPrice}</Text>
          {order.cod && (
            <View style={styles.codBadge}>
              <FontAwesome name="money" size={12} color="white" />
              <Text style={styles.codText}>COD</Text>
            </View>
          )}
        </View>
        
        {order.products && order.products.length > 0 && (
          <Text style={styles.productsText}>
            {order.products.length} product{order.products.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Delivery Address */}
      {order.customerAddress && (
        <View style={styles.addressContainer}>
          <FontAwesome name="map-marker" size={14} color="#6B7280" />
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressText} numberOfLines={2}>
              {order.customerAddress}
            </Text>
            {order.customerPinCode && (
              <Text style={styles.pinCodeText}>
                PIN: {order.customerPinCode}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Laboratory Info */}
      {order.laboratoryUser && (
        <View style={styles.labInfo}>
          <Text style={styles.labLabel}>From:</Text>
          <Text style={styles.labName}>{order.laboratoryUser.name}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <View style={styles.actionButtonsContainer}>
          {renderActionButtons()}
        </View>
        
        {/* COD Collection Reminder */}
        {order.cod && (order.status === 'out_for_delivery' || order.status === 'delivery_accepted') && (
          <View style={styles.codReminder}>
            <FontAwesome name="money" size={14} color="#EF4444" />
            <Text style={styles.codReminderText}>
              Collect ₹{order.totalPrice} as Cash on Delivery
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  header: {
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
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
    marginLeft: 6,
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
  orderDetails: {
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.tint,
  },
  codBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  codText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  productsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 2,
  },
  pinCodeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  labInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  labName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 48,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  outForDeliveryButton: {
    backgroundColor: '#3B82F6',
  },
  deliveredButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: 12,
  },
  codReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginTop: 4,
  },
  codReminderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
});

export default DeliveryOrderCard; 