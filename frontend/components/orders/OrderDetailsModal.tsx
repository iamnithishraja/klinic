import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomModal from '@/components/ui/CustomModal';
import { Colors } from '@/constants/Colors';

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
  acceptedAt?: string | null;
  assignedAt?: string | null;
  deliveredAt?: string | null;
  outForDeliveryAt?: string | null;
  rejectionReason?: string | null;
  __v?: number;
}

interface OrderDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  order: LabOrder | null;
  onAssignDelivery?: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  onClose,
  order,
  onAssignDelivery,
}) => {
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
        return '#F59E0B';
      case 'delivered':
        return '#10B981';
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

  if (!order) return null;

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      title="Order Details"
      size="full"
      animationType="slide"
      zIndex={1000}
      scrollable={false} // We'll handle scrollability ourselves
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <FontAwesome name="shopping-bag" size={22} color={Colors.light.tint} />
              <Text style={styles.headerOrderId}>#{order._id.slice(-8)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(order.status) }]}>
              <FontAwesome name={getStatusIcon(order.status)} size={13} color="white" />
              <Text style={styles.statusPillText}>{getStatusText(order.status)}</Text>
            </View>
          </View>

          {/* Order Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Info</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Order ID</Text>
                <Text style={styles.infoValue}>#{order._id.slice(-8)}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Total</Text>
                <Text style={styles.infoValue}>₹{order.totalPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Payment</Text>
                <Text style={[styles.infoValue, { color: order.isPaid ? '#10B981' : '#F59E0B' }]}>
                  {order.isPaid ? 'Paid' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer</Text>
            <View style={styles.userRow}>
              <FontAwesome name="user" size={16} color={Colors.light.tint} />
              <Text style={styles.userName}>{order.orderedBy.name}</Text>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.userDetailRow}>
                <FontAwesome name="envelope" size={13} color="#6B7280" />
                <Text style={styles.userDetailText}>{order.orderedBy.email}</Text>
              </View>
              <View style={styles.userDetailRow}>
                <FontAwesome name="phone" size={13} color="#6B7280" />
                <Text style={styles.userDetailText}>{order.orderedBy.phone}</Text>
              </View>
              {order.customerAddress && (
                <View style={styles.userDetailRow}>
                  <FontAwesome name="map-marker" size={13} color="#6B7280" />
                  <Text style={styles.userDetailText} numberOfLines={3}>
                    {order.customerAddress}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Prescription */}
          {order.prescription && (
            <View style={[styles.card, styles.prescriptionCard]}>
              <Text style={styles.cardTitle}>Prescription</Text>
              <View style={{ marginTop: 8, gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FEF3C7',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => {
                    // Open prescription in browser
                    if (order.prescription) {
                      Linking.openURL(order.prescription);
                    }
                  }}
                >
                  <FontAwesome name="eye" size={15} color="#92400E" />
                  <Text style={{ color: '#92400E', fontWeight: 'bold', marginLeft: 8 }}>View Prescription</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#DBEAFE',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => {
                    // Download prescription
                    if (order.prescription) {
                      Linking.openURL(order.prescription);
                    }
                  }}
                >
                  <FontAwesome name="download" size={15} color="#1E40AF" />
                  <Text style={{ color: '#1E40AF', fontWeight: 'bold', marginLeft: 8 }}>Download Prescription</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Products */}
          {order.products && order.products.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Products ({order.products.length})</Text>
              {order.products.map((item, idx) => (
                <View key={`${item.product._id}-${item.quantity}`} style={styles.productRow}>
                  <View style={styles.productLeft}>
                    <Text style={styles.productName}>{item.product.name}</Text>
                    <Text style={styles.productQty}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.productPrice}>₹{item.product.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Delivery Partner */}
          {order.deliveryPartner && (
            <View style={[styles.card, styles.deliveryCard]}>
              <Text style={styles.cardTitle}>Delivery Partner</Text>
              <View style={styles.userRow}>
                <FontAwesome name="truck" size={16} color={Colors.light.tint} />
                <Text style={styles.userName}>{order.deliveryPartner.name}</Text>
              </View>
              <View style={styles.userDetails}>
                <View style={styles.userDetailRow}>
                  <FontAwesome name="phone" size={13} color="#6B7280" />
                  <Text style={styles.userDetailText}>{order.deliveryPartner.phone}</Text>
                </View>
                <View style={styles.userDetailRow}>
                  <FontAwesome name="envelope" size={13} color="#6B7280" />
                  <Text style={styles.userDetailText}>{order.deliveryPartner.email}</Text>
                </View>
                {/* Debug: Show delivery partner data */}
                <View style={styles.userDetailRow}>
                  <FontAwesome name="info-circle" size={13} color="#6B7280" />
                  <Text style={styles.userDetailText}>
                    Profile: {order.deliveryPartner.profile ? 'Yes' : 'No'}
                  </Text>
                </View>
                {(order.deliveryPartner.profile?.address?.address || order.deliveryPartner.profile?.city) && (
                  <View style={styles.userDetailRow}>
                    <FontAwesome name="map-marker" size={13} color="#6B7280" />
                    <Text style={styles.userDetailText}>
                      {order.deliveryPartner.profile?.address?.address || order.deliveryPartner.profile?.city || 'Address not available'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Button */}
          {order.needAssignment && !order.deliveryPartner && onAssignDelivery && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.assignBtn}
                onPress={() => {
                  onClose();
                  onAssignDelivery();
                }}
              >
                <FontAwesome name="user-plus" size={16} color="white" />
                <Text style={styles.assignBtnText}>Assign Delivery Partner</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Add bottom padding so last item is not hidden behind modal controls */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerOrderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 10,
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoCol: {
    flex: 1,
    marginRight: 10,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 8,
  },
  userDetails: {
    gap: 7,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  userDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  prescriptionCard: {
    backgroundColor: '#FEF3C7',
  },
  prescriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  prescriptionText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 10,
    flex: 1,
    fontStyle: 'italic',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 7,
  },
  productLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  productQty: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
    marginLeft: 10,
  },
  deliveryCard: {
    backgroundColor: '#F0F9FF',
  },
  actionRow: {
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 200,
  },
  assignBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});

export default OrderDetailsModal;