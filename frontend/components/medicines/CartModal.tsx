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
  ScrollView,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { useUserProfileStore } from '@/store/profileStore';
import { orderService, Order } from '@/services/orderService';
import { CartItem } from './CartItem';
import { CartItem as CartItemType } from '@/types/medicineTypes';
import * as DocumentPicker from 'expo-document-picker';
import useProfileApi from '@/hooks/useProfileApi';

const { width, height } = Dimensions.get('window');

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  onBrowseItems?: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ visible, onClose, onBrowseItems }) => {
  const { items: cart, clearCart, getCartTotal } = useCartStore();
  const { address, city, pinCode } = useUserProfileStore();
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<string | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);

  const totalAmount = cart.reduce((total: number, item: CartItemType) => total + (item.product.price * item.quantity), 0);

  const { uploadFile } = useProfileApi({ endpoint: '/api/v1/user-profile' });

  const handleUploadPrescription = async () => {
    try {
      setUploadingPrescription(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file size (5MB limit)
        if (asset.size && asset.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a PDF file smaller than 5MB.');
          return;
        }
        
        // Upload the prescription to get a public URL
        const fileName = asset.name || `prescription-${Date.now()}.pdf`;
        const publicUrl = await uploadFile('application/pdf', fileName, asset.uri);
        
        if (publicUrl) {
          setPrescription(publicUrl);
          Alert.alert('Success', 'Prescription uploaded successfully!');
        } else {
          throw new Error('Failed to upload prescription');
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
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
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }

    if (!prescription) {
      Alert.alert('Error', 'Please upload your prescription first.');
      return;
    }

    // Address is optional - user can add it later or admin can contact them
    if (!address) {
      Alert.alert(
        'Address Information', 
        'No delivery address found. You can add your address in profile settings, or our team will contact you for delivery details.',
        [
          { text: 'Continue Without Address', onPress: () => proceedWithOrder() },
          { text: 'Add Address', onPress: () => onClose() }
        ]
      );
      return;
    }

    proceedWithOrder();
  };

  const proceedWithOrder = async () => {

    try {
      setLoading(true);
      
      const orderData = {
        products: cart.map((item: CartItemType) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        prescription: prescription || undefined,
        totalPrice: totalAmount,
        needAssignment: false,
      };

      const response = await orderService.createOrder(orderData);
      
      if (response.data) {
        Alert.alert(
          'Success',
          'Order placed successfully! You will receive a confirmation shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                clearCart();
                setPrescription(null);
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to place order. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
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

  const canPlaceOrder = cart.length > 0 && prescription;

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
            
            {prescription ? (
              <View style={styles.prescriptionContainer}>
                <View style={styles.prescriptionHeader}>
                  <View style={styles.prescriptionInfo}>
                    <IconSymbol name="check-circle" size={16} color="#10B981" weight="medium" />
                    <Text style={styles.prescriptionText}>Prescription uploaded</Text>
                  </View>
                  <TouchableOpacity onPress={handleRemovePrescription} style={styles.removeButton}>
                    <IconSymbol name="trash" size={14} color="#EF4444" weight="medium" />
                  </TouchableOpacity>
                </View>
                <View style={styles.prescriptionFileContainer}>
                  <View style={styles.prescriptionFileInfo}>
                    <IconSymbol name="document" size={24} color={Colors.light.tint} weight="medium" />
                    <View style={styles.prescriptionFileDetails}>
                      <Text style={styles.prescriptionFileName}>Prescription.pdf</Text>
                      <Text style={styles.prescriptionFileSize}>PDF Document • Ready for order</Text>
                    </View>
                  </View>
                  <View style={styles.prescriptionStatusBadge}>
                    <IconSymbol name="check-circle" size={12} color="#10B981" weight="medium" />
                    <Text style={styles.prescriptionStatusText}>Uploaded</Text>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.uploadButton, 
                  uploadingPrescription && styles.uploadButtonDisabled
                ]} 
                onPress={handleUploadPrescription}
                disabled={uploadingPrescription}
              >
                {uploadingPrescription ? (
                  <View style={styles.uploadLoadingContainer}>
                    <ActivityIndicator size="small" color={Colors.light.tint} />
                    <Text style={styles.uploadLoadingText}>Uploading...</Text>
                  </View>
                ) : (
                  <View style={styles.uploadContent}>
                    <IconSymbol name="upload" size={24} color={Colors.light.tint} weight="medium" />
                    <View style={styles.uploadTextContainer}>
                      <Text style={styles.uploadButtonText}>Upload Prescription</Text>
                      <Text style={styles.uploadSubtext}>PDF files only, max 5MB</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Delivery Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <IconSymbol name="location" size={18} color={Colors.light.tint} weight="medium" />
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>
              {!address && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            
            {address ? (
              <View style={styles.addressContainer}>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressText}>{address}</Text>
                  {city && <Text style={styles.cityText}>{city}</Text>}
                  {pinCode && <Text style={styles.pinCodeText}>{pinCode}</Text>}
                </View>
                <View style={styles.addressVerified}>
                  <IconSymbol name="check-circle" size={12} color="#10B981" weight="medium" />
                  <Text style={styles.addressVerifiedText}>Verified</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addAddressButton} onPress={() => {
                Alert.alert(
                  'Address Required',
                  'Please add your delivery address in your profile settings.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Profile', onPress: () => onClose() }
                  ]
                );
              }}>
                <IconSymbol name="plus" size={16} color={Colors.light.tint} weight="medium" />
                <Text style={styles.addAddressText}>Add Delivery Address</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Order Summary - Always visible */}
          <View style={styles.summarySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{totalAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>₹0.00</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer - Show when prescription is uploaded */}
        {prescription && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.placeOrderButton,
                !canPlaceOrder && styles.placeOrderButtonDisabled
              ]}
              onPress={handlePlaceOrder}
              disabled={!canPlaceOrder || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <IconSymbol name="check-circle" size={20} color="white" weight="medium" />
              )}
              <Text style={styles.placeOrderButtonText}>
                {loading ? 'Placing Order...' : `Place Order - ₹${totalAmount.toFixed(2)}`}
              </Text>
            </TouchableOpacity>
            
            {!address && (
              <View style={styles.addressWarning}>
                <Text style={styles.addressWarningText}>
                  ⚠️ Please add your delivery address to complete the order
                </Text>
              </View>
            )}
          </View>
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
});

CartModal.displayName = 'CartModal';
export { CartModal };

export default CartModal; 