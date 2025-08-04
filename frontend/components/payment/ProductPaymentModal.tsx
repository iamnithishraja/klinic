import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/api/client';
import { useUserStore } from '@/store/userStore';
import { useCustomAlert } from '../CustomAlert';
import { orderService } from '@/services/orderService';
// @ts-ignore
import { useRouter } from 'expo-router';

// Import Razorpay
let RazorpayCheckout: any = null;
if (Platform.OS !== 'web') {
  try {
    RazorpayCheckout = require('react-native-razorpay').default;
  } catch (error) {
    console.log('Razorpay not available, using web fallback');
  }
}

interface ProductPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  orderData: {
    products: Array<{
      product: string; // Product ID
      quantity: number;
    }>;
    prescription?: string;
    totalPrice: number;
    needAssignment: boolean;
    deliveryAddress?: {
      address: string;
      pinCode: string;
    };
  };
  onPaymentSuccess: () => void;
}

const ProductPaymentModal: React.FC<ProductPaymentModalProps> = ({
  visible,
  onClose,
  orderData,
  onPaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const user = useUserStore(state => state.user);
  const { showAlert, AlertComponent } = useCustomAlert();
  const router = useRouter();

  const handlePaymentSuccess = async (response: any) => {
    try {
      setLoading(true);
      
      // First verify the payment with Razorpay
      const verificationResponse = await apiClient.post('/api/v1/verify-product-payment', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderData: orderData // Pass the order data for creation after verification
      });

      if (!verificationResponse.data.success) {
        throw new Error('Payment verification failed');
      }

      const successMessage = orderData.needAssignment 
        ? 'Payment successful! Your prescription order has been created and will be assigned to a laboratory by our admin team. You will be notified once the order is processed.'
        : 'Payment successful! Your order has been confirmed and will be processed soon.';

      showAlert({
        title: 'Payment Successful!',
        message: successMessage,
        type: 'success',
        buttons: [{ 
          text: 'OK', 
          style: 'primary', 
          onPress: () => {
            onClose();
            onPaymentSuccess();
            router.push('/');
          }
        }]
      });
    } catch (error) {
      console.error('Payment verification failed:', error);
      showAlert({
        title: 'Payment Verification Failed',
        message: 'Please contact support if the amount was deducted from your account.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCODSuccess = async () => {
    try {
      setLoading(true);
      
      const successMessage = orderData.needAssignment 
        ? 'COD order created successfully! Your prescription order has been created and will be assigned to a laboratory by our admin team. You will be notified once the order is processed. Payment will be collected upon delivery.'
        : 'COD order created successfully! Your order has been confirmed and will be processed soon. Payment will be collected upon delivery.';

      showAlert({
        title: 'COD Order Created!',
        message: successMessage,
        type: 'success',
        buttons: [{ 
          text: 'OK', 
          style: 'primary', 
          onPress: () => {
            onClose();
            onPaymentSuccess();
            router.push('/');
          }
        }]
      });
    } catch (error) {
      console.error('Error handling COD success:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to create COD order. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancellation = async () => {
    try {
      setLoading(true);
      
      showAlert({
        title: 'Payment Cancelled',
        message: 'Your payment has been cancelled. No order was created.',
        type: 'warning',
        buttons: [{ 
          text: 'OK', 
          style: 'primary', 
          onPress: () => {
            onClose();
            router.push('/');
          }
        }]
      });
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to handle payment cancellation. Please contact support.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setLoading(true);
      
      // Validate order data
      if (!orderData || !orderData.totalPrice || orderData.totalPrice <= 0) {
        showAlert({
          title: 'Invalid Order',
          message: 'Please ensure your order is valid before proceeding with payment.',
          type: 'error'
        });
        return;
      }

      // Validate user data
      if (!user || !user.email) {
        showAlert({
          title: 'User Not Found',
          message: 'Please log in to proceed with payment.',
          type: 'error'
        });
        return;
      }
      
      // Create payment order
      const orderResponse = await apiClient.post('/api/v1/create-product-payment-order', {
        amount: orderData.totalPrice * 100, // Convert to paise
        currency: 'INR',
        orderData: orderData // Pass order data for webhook processing
      });

      const { orderId, amount, currency } = orderResponse.data;

      // Initialize Razorpay payment options
      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_API_KEY,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: 'Klinic',
        description: orderData.needAssignment 
          ? 'Prescription Order Payment'
          : 'Product Order Payment',
        image: 'https://i.imgur.com/3g7nmJC.png', // Your app logo
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setLoading(false);
          }
        }
      };

      // Handle payment for different platforms
      if (Platform.OS === 'web') {
        // For web platform, use Razorpay web checkout
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new (window as any).Razorpay({
            ...options,
            handler: async (response: any) => {
              await handlePaymentSuccess(response);
            },
            modal: {
              ondismiss: () => {
                console.log('Payment modal dismissed');
                setLoading(false);
              }
            }
          });
          rzp.open();
        };
        script.onerror = () => {
          showAlert({
            title: 'Payment Error',
            message: 'Failed to load payment gateway. Please try again.',
            type: 'error'
          });
          setLoading(false);
        };
        document.body.appendChild(script);
      } else {
        // For mobile platforms, use react-native-razorpay
        if (RazorpayCheckout) {
          RazorpayCheckout.open(options)
            .then(async (data: any) => {
              await handlePaymentSuccess(data);
            })
            .catch((error: any) => {
              console.error('Payment failed:', error);
              if (error.code === 'PAYMENT_CANCELLED') {
                showAlert({
                  title: 'Payment Cancelled',
                  message: 'You cancelled the payment.',
                  type: 'warning'
                });
              } else {
                showAlert({
                  title: 'Payment Failed',
                  message: error.description || 'Payment failed. Please try again.',
                  type: 'error'
                });
              }
              setLoading(false);
            });
        } else {
          showAlert({
            title: 'Error',
            message: 'Payment service not available on this platform.',
            type: 'error'
          });
          setLoading(false);
        }
      }

    } catch (error) {
      console.error('Payment initiation failed:', error);
      showAlert({
        title: 'Payment Failed',
        message: 'Failed to initiate payment. Please check your internet connection and try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCODOrder = async () => {
    try {
      setLoading(true);
      
      // Validate order data
      if (!orderData) {
        showAlert({
          title: 'Invalid Order',
          message: 'Please ensure your order is valid before proceeding with COD.',
          type: 'error'
        });
        return;
      }

      // For prescription orders, totalPrice can be 0 initially
      // For product orders, totalPrice should be greater than 0
      if (orderData.needAssignment) {
        // Prescription orders can have 0 totalPrice initially
        if (orderData.totalPrice === undefined || orderData.totalPrice === null) {
          showAlert({
            title: 'Invalid Order',
            message: 'Please ensure your prescription order is valid before proceeding with COD.',
            type: 'error'
          });
          return;
        }
      } else {
        // Product orders should have totalPrice > 0
        if (!orderData.totalPrice || orderData.totalPrice <= 0) {
          showAlert({
            title: 'Invalid Order',
            message: 'Please ensure your order is valid before proceeding with COD.',
            type: 'error'
          });
          return;
        }
      }

      // Validate user data
      if (!user || !user.email) {
        showAlert({
          title: 'User Not Found',
          message: 'Please log in to proceed with COD order.',
          type: 'error'
        });
        return;
      }
      
      // Create COD order
      const codResponse = await apiClient.post('/api/v1/create-cod-order', {
        orderData: orderData
      });

      if (!codResponse.data.success) {
        throw new Error('Failed to create COD order');
      }

      await handleCODSuccess();

    } catch (error) {
      console.error('COD order creation failed:', error);
      showAlert({
        title: 'COD Order Failed',
        message: 'Failed to create COD order. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderDescription = () => {
    if (orderData.needAssignment) {
      return 'Prescription Order';
    }
    
    if (orderData.products && orderData.products.length > 0) {
      const itemCount = orderData.products.length;
      const totalItems = orderData.products.reduce((sum, item) => sum + item.quantity, 0);
      return `${itemCount} product${itemCount > 1 ? 's' : ''} (${totalItems} item${totalItems > 1 ? 's' : ''})`;
    }
    
    return 'Product Order';
  };

  const getPaymentMessage = () => {
    if (orderData.needAssignment) {
      return 'Choose your payment option for prescription orders. After payment, our admin team will review your prescription and assign it to a laboratory.';
    }
    return 'Choose your payment option to confirm your order.';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Payment Options</Text>
            <Pressable onPress={onClose} className="p-2">
              <FontAwesome name="times" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Order Details */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="font-semibold text-lg mb-2">
              {getOrderDescription()}
            </Text>
            <Text className="text-gray-600 mb-1">
              {orderData.needAssignment ? 'Prescription Upload' : 'Cart Items'}
            </Text>
            <Text className="text-primary font-bold text-lg">
              Amount: ₹{orderData.totalPrice}
            </Text>
          </View>

          {/* Payment Options */}
          <View>
            <Text className="text-gray-600 mb-4 text-center">
              {getPaymentMessage()}
            </Text>
            
            <Pressable
              onPress={handlePayNow}
              disabled={loading}
              className="bg-primary py-4 rounded-lg mb-3 flex-row justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <FontAwesome name="credit-card" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Pay Online Now
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleCODOrder}
              disabled={loading}
              className="bg-green-600 py-4 rounded-lg mb-3 flex-row justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <FontAwesome name="money" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Cash on Delivery
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handlePaymentCancellation}
              disabled={loading}
              className="bg-gray-100 py-4 rounded-lg mb-3 flex-row justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="#6B7280" />
              ) : (
                <>
                  <FontAwesome name="times" size={20} color="#6B7280" />
                  <Text className="text-gray-700 font-bold text-lg ml-2">
                    Cancel Order
                  </Text>
                </>
              )}
            </Pressable>

            <Text className="text-xs text-gray-500 text-center mt-3">
              {orderData.needAssignment 
                ? 'After payment, your prescription will be reviewed and assigned to a laboratory'
                : 'Secure payment powered by Razorpay or pay on delivery'
              }
            </Text>
          </View>
        </View>
      </View>
      
      {/* Custom Alert Component */}
      <AlertComponent />
    </Modal>
  );
};

export default ProductPaymentModal; 