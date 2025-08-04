import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cartStore';
import { useUserProfileStore } from '@/store/profileStore';
import { CartItem } from '@/components/medicines/CartItem';
import { PrescriptionUpload } from '@/components/medicines/PrescriptionUpload';
import ProductPaymentModal from '@/components/payment/ProductPaymentModal';
import { CartItem as CartItemType } from '@/types/medicineTypes';
import { useRouter } from 'expo-router';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  onBrowseItems?: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ visible, onClose, onBrowseItems }) => {
  const { items: cart, getCartTotal, clearCart } = useCartStore();
  const { address, pinCode, setAddress, setPinCode } = useUserProfileStore();
  const [prescription, setPrescription] = useState<string | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const router = useRouter();

  const handleUploadPrescription = async () => {
    try {
      setUploadingPrescription(true);
      // This will be handled by the PrescriptionUpload component
      // The actual upload logic is in the PrescriptionUpload component
    } catch (error) {
      console.error('Error uploading prescription:', error);
      Alert.alert('Error', 'Failed to upload prescription. Please try again.');
    } finally {
      setUploadingPrescription(false);
    }
  };

  const handleRemovePrescription = () => {
    setPrescription(null);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    if (!prescription) {
      Alert.alert('Prescription Required', 'Please upload a prescription before placing your order.');
      return;
    }

    if (!address) {
      Alert.alert('Address Required', 'Please add your delivery address before placing your order.');
      return;
    }

    // Prepare order data for payment (don't create order yet)
    const orderData = {
      products: cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      prescription: prescription || undefined,
      totalPrice: getCartTotal(),
      needAssignment: false,
      deliveryAddress: {
        address: address,
        pinCode: pinCode,
      },
    };

    // Store order data and show payment modal
    setOrderData(orderData);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setPrescription(null);
    setOrderData(null);
    setShowPaymentModal(false);
    onClose();
  };

  const renderCartItem = ({ item }: { item: CartItemType }) => (
    <CartItem 
      item={item} 
      onQuantityChange={(productId: string, quantity: number) => {
        // This will be handled by the CartItem component internally
      }}
      onRemove={(productId: string) => {
        // This will be handled by the CartItem component internally
      }}
    />
  );

  const canPlaceOrder = cart.length > 0 && prescription && address;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="x-mark" size={24} color={Colors.light.text} weight="medium" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cart Items */}
          <View style={styles.cartSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cart Items</Text>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{cart.length} items</Text>
              </View>
            </View>
            
            {cart.length === 0 ? (
              <View style={styles.emptyCartContainer}>
                <IconSymbol name="cart" size={64} color="#D1D5DB" weight="medium" />
                <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                <Text style={styles.emptyCartSubtitle}>Add some medicines to get started</Text>
                <TouchableOpacity 
                  style={styles.browseButton} 
                  onPress={() => {
                    onClose();
                    onBrowseItems?.();
                  }}
                >
                  <IconSymbol name="plus" size={20} color="white" weight="medium" />
                  <Text style={styles.browseButtonText}>Browse Items</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={cart}
                renderItem={renderCartItem}
                keyExtractor={(item: CartItemType) => item.product._id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Delivery Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <IconSymbol name="location" size={18} color={Colors.light.tint} weight="medium" />
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            </View>
            
            {address ? (
              <View style={styles.addressContainer}>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressText}>{address}</Text>
                  {pinCode && <Text style={styles.pinCodeText}>{pinCode}</Text>}
                </View>
                <TouchableOpacity 
                  onPress={() => setShowAddressModal(true)}
                  style={styles.editAddressButton}
                >
                  <IconSymbol name="edit" size={16} color={Colors.light.tint} weight="medium" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addAddressButton}
                onPress={() => setShowAddressModal(true)}
              >
                <IconSymbol name="plus" size={16} color={Colors.light.tint} weight="medium" />
                <Text style={styles.addAddressText}>Add Delivery Address</Text>
              </TouchableOpacity>
            )}

            {!address && (
              <View style={styles.addressWarning}>
                <IconSymbol name="icon" size={14} color="#92400E" weight="medium" />
                <Text style={styles.addressWarningText}>
                  Please add your delivery address to continue
                </Text>
              </View>
            )}
          </View>

          {/* Prescription Upload Section - Always visible */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <IconSymbol name="document" size={18} color={Colors.light.tint} weight="medium" />
                <Text style={styles.sectionTitle}>Prescription</Text>
              </View>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            </View>
            
            <PrescriptionUpload
              onUploadComplete={(url) => setPrescription(url)}
              isUploading={uploadingPrescription}
            />
          </View>

          {/* Order Summary Section */}
          <View style={styles.summarySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{getCartTotal().toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{getCartTotal().toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer - Show when prescription is uploaded and address is added */}
        {prescription && address && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.placeOrderButton,
                !canPlaceOrder && styles.placeOrderButtonDisabled
              ]}
              onPress={handlePlaceOrder}
              disabled={!canPlaceOrder}
            >
              <IconSymbol name="check-circle" size={20} color="white" weight="medium" />
              <Text style={styles.placeOrderButtonText}>
                Pay Now - ₹{getCartTotal().toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Address Input Modal */}
        <Modal
          visible={showAddressModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddressModal(false)}
        >
          <View style={styles.addressModalContainer}>
            <View style={styles.addressModalHeader}>
              <TouchableOpacity 
                onPress={() => setShowAddressModal(false)}
                style={styles.addressModalCloseButton}
              >
                <IconSymbol name="x-mark" size={24} color={Colors.light.text} weight="medium" />
              </TouchableOpacity>
              <Text style={styles.addressModalTitle}>Add Delivery Address</Text>
              <View style={styles.addressModalSpacer} />
            </View>
            
            <View style={styles.addressModalContent}>
              <View style={styles.addressInputContainer}>
                <Text style={styles.addressInputLabel}>Address</Text>
                <TextInput
                  style={styles.addressInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your full address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.addressInputContainer}>
                <Text style={styles.addressInputLabel}>PIN Code</Text>
                <TextInput
                  style={styles.addressInput}
                  value={pinCode}
                  onChangeText={setPinCode}
                  placeholder="Enter PIN code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              
              <TouchableOpacity
                style={styles.saveAddressButton}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={styles.saveAddressButtonText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Product Payment Modal */}
        {orderData && (
          <ProductPaymentModal
            visible={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            orderData={orderData}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cartSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summarySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 8,
  },
  itemCountBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  requiredBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  requiredText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  prescriptionContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prescriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prescriptionText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  prescriptionImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  uploadButtonText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    marginTop: 2,
  },
  uploadLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLoadingText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextContainer: {
    marginLeft: 12,
    alignItems: 'center',
  },
  addressButton: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  addressButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressInfo: {
    flex: 1,
  },
  addressButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  addressVerified: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.light.tint,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  prescriptionFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
  },
  prescriptionFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  prescriptionFileSize: {
    fontSize: 14,
    color: '#6B7280',
  },
  prescriptionFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prescriptionFileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  prescriptionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prescriptionStatusText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '600',
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  cityText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  pinCodeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  addressVerifiedText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '600',
    marginLeft: 4,
  },
  editAddressButton: {
    padding: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  addAddressText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
    marginLeft: 8,
  },
  addressWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  addressWarningText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  addressModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  addressModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  addressModalCloseButton: {
    padding: 8,
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  addressModalSpacer: {
    width: 40,
  },
  addressModalContent: {
    flex: 1,
    padding: 16,
  },
  addressInputContainer: {
    marginTop: 20,
  },
  addressInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  addressInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  saveAddressButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  saveAddressButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

CartModal.displayName = 'CartModal';
export { CartModal };

export default CartModal; 