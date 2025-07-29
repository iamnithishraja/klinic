import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { orderService } from '@/services/orderService';
import { CartItem } from './CartItem';
import { PrescriptionUpload } from './PrescriptionUpload';
import { CartItem as CartItemType } from '@/types/medicineTypes';

const { width, height } = Dimensions.get('window');

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { cart, getCartTotal, clearCart, removeFromCart, updateCartQuantity } = useProductStore();
  const { setPrescriptionUrl, setUploadingPrescription } = useCartStore();
  const [prescriptionUrl, setLocalPrescriptionUrl] = useState<string | null>(null);
  const [uploadingPrescription, setLocalUploadingPrescription] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const handleQuantityChange = (productId: string, quantity: number) => {
    updateCartQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  const handlePrescriptionUpload = (url: string) => {
    setLocalPrescriptionUrl(url);
    setPrescriptionUrl(url);
  };

  const handlePlaceOrder = async () => {
    setCreatingOrder(true);
    try {
      const orderData = {
        products: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        prescription: prescriptionUrl,
        totalPrice: getCartTotal(),
        needAssignment: false,
      };

      await orderService.createOrder(orderData);
      
      Alert.alert(
        'Order Placed Successfully',
        'Your order has been placed and will be processed soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              setLocalPrescriptionUrl(null);
              setPrescriptionUrl(null);
              setCreatingOrder(false);
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Order creation error:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
      setCreatingOrder(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItemType }) => (
    <CartItem
      item={item}
      onQuantityChange={handleQuantityChange}
      onRemove={handleRemoveItem}
    />
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <IconSymbol name="cart" size={64} color="#D1D5DB" weight="light" />
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add some medicines to get started with your order
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <IconSymbol name="chevron.left" size={20} color="#FFFFFF" weight="medium" />
        <Text style={styles.browseButtonText}>Browse Medicines</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <IconSymbol name="x" size={24} color={Colors.light.text} weight="medium" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={styles.placeholder} />
        </View>

        {cart.length === 0 ? (
          renderEmptyCart()
        ) : (
          <>
            {/* Cart Items */}
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.product._id}
              contentContainerStyle={styles.cartList}
              showsVerticalScrollIndicator={false}
            />

            {/* Prescription Upload */}
            <View style={styles.prescriptionSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <IconSymbol name="document-text" size={20} color={Colors.light.tint} weight="medium" />
                  <Text style={styles.sectionTitle}>Prescription</Text>
                </View>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              <PrescriptionUpload
                onUploadComplete={handlePrescriptionUpload}
                isUploading={uploadingPrescription}
              />
            </View>

            {/* Order Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.itemCountBadge}>
                  <Text style={styles.itemCountText}>{cart.length} items</Text>
                </View>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{getCartTotal()}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{getCartTotal()}</Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.placeOrderButton,
                  (!prescriptionUrl || cart.length === 0 || creatingOrder) && styles.disabledButton,
                ]}
                onPress={handlePlaceOrder}
                disabled={!prescriptionUrl || cart.length === 0 || creatingOrder}
                activeOpacity={0.8}
              >
                {creatingOrder ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <IconSymbol name="check-circle" size={20} color="#FFFFFF" weight="medium" />
                )}
                <Text style={styles.placeOrderButtonText}>
                  {creatingOrder ? 'Creating Order...' : `Place Order - ₹${getCartTotal()}`}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  cartList: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  browseButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.light.tint,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  prescriptionSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  requiredBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  requiredText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  summaryContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemCountBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  placeOrderButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: Colors.light.tint,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 