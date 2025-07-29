import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useProductStore } from '@/store/productStore';
import { orderService } from '@/services/orderService';
import { CartItem } from '@/components/medicines/CartItem';
import { PrescriptionUpload } from '@/components/medicines/PrescriptionUpload';
import { CartItem as CartItemType } from '@/types/medicineTypes';

export default function CartScreen() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart } = useProductStore();
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);

  const handleQuantityChange = (productId: string, quantity: number) => {
    // This will be handled by the CartItem component
  };

  const handleRemoveItem = (productId: string) => {
    // This will be handled by the CartItem component
  };

  const handlePrescriptionUpload = (url: string) => {
    setPrescriptionUrl(url);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    if (!prescriptionUrl) {
      Alert.alert('Prescription Required', 'Please upload a prescription before placing your order.');
      return;
    }

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

      const result = await orderService.createOrder(orderData);
      
      // orderService.createOrder returns the order directly, not a response object
        Alert.alert(
          'Order Placed Successfully',
          'Your order has been placed and will be processed soon.',
          [
            {
              text: 'OK',
              onPress: () => {
                clearCart();
                setPrescriptionUrl(null);
                router.back();
              },
            },
          ]
        );
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
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
      <IconSymbol name="cart" size={64} color={Colors.light.icon} weight="light" />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add some medicines to get started
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.back()}
      >
        <Text style={styles.browseButtonText}>Browse Medicines</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={Colors.light.text} weight="medium" />
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
            <Text style={styles.sectionTitle}>Prescription</Text>
            <PrescriptionUpload
              onUploadComplete={handlePrescriptionUpload}
              isUploading={uploadingPrescription}
            />
          </View>

          {/* Order Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{getCartTotal()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryValue}>{cart.length}</Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.placeOrderButton,
                (!prescriptionUrl || cart.length === 0) && styles.disabledButton,
              ]}
              onPress={handlePlaceOrder}
              disabled={!prescriptionUrl || cart.length === 0}
            >
              <Text style={styles.placeOrderButtonText}>
                Place Order - ₹{getCartTotal()}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  placeholder: {
    width: 32,
  },
  cartList: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  prescriptionSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  summaryContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  placeOrderButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});