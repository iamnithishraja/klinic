import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/api/client';
import { useUserStore } from '@/store/userStore';
import { useCustomAlert } from './CustomAlert';
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

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentData: {
    appointmentId: string;
    appointmentType: 'doctor' | 'lab';
    amount: number;
    consultationType?: string;
    collectionType?: string;
    serviceName?: string;
    doctorName?: string;
    laboratoryName?: string;
  };
  isOnlineRequired: boolean; // true for online consultations
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  appointmentData,
  isOnlineRequired,
  onPaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const user = useUserStore(state => state.user);
  const { showAlert, AlertComponent } = useCustomAlert();
  const router = useRouter();

  const handlePaymentSuccess = async (response: any) => {
    try {
      setLoading(true);
      // Verify payment
      await apiClient.post('/api/v1/verify-payment', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        appointmentId: appointmentData.appointmentId,
        appointmentType: appointmentData.appointmentType
      });

      showAlert({
        title: 'Payment Successful!',
        message: 'Your payment has been processed successfully.',
        type: 'success',
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
      console.error('Payment verification failed:', error);
      showAlert({
        title: 'Payment Verification Failed',
        message: 'Please contact support.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setLoading(true);
      
      // Create payment order
      const orderResponse = await apiClient.post('/api/v1/create-payment-order', {
        appointmentId: appointmentData.appointmentId,
        appointmentType: appointmentData.appointmentType,
        amount: appointmentData.amount
      });

      const { orderId, amount, currency } = orderResponse.data;

      // Initialize Razorpay payment options
      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_API_KEY,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: 'Klinic',
        description: appointmentData.appointmentType === 'doctor' 
          ? `Consultation with ${appointmentData.doctorName}`
          : `${appointmentData.serviceName} at ${appointmentData.laboratoryName}`,
        image: 'https://i.imgur.com/3g7nmJC.png', // Your app logo
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#3B82F6'
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
        message: 'Failed to initiate payment. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayLater = () => {
    showAlert({
      title: 'Appointment Confirmed',
      message: 'Your appointment has been booked. You can pay during the consultation.',
      type: 'success',
      buttons: [
        {
          text: 'OK',
          style: 'primary',
          onPress: () => {
            onClose();
            router.push('/');
          }
        }
      ]
    });
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

          {/* Appointment Details */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="font-semibold text-lg mb-2">
              {appointmentData.appointmentType === 'doctor' 
                ? `Dr. ${appointmentData.doctorName}`
                : appointmentData.serviceName
              }
            </Text>
            <Text className="text-gray-600 mb-1">
              {appointmentData.appointmentType === 'doctor' 
                ? `Type: ${appointmentData.consultationType}`
                : `Collection: ${appointmentData.collectionType === 'lab' ? 'Lab Visit' : 'Home Collection'}`
              }
            </Text>
            <Text className="text-primary font-bold text-lg">
              Amount: ₹{appointmentData.amount}
            </Text>
          </View>

          {/* Payment Options */}
          {isOnlineRequired ? (
            // For online consultations - payment is mandatory
            <View>
              <Text className="text-gray-600 mb-4 text-center">
                Payment is required for online consultations
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
                      Pay Now ₹{appointmentData.amount}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            // For in-person consultations and lab appointments - optional payment
            <View>
              <Text className="text-gray-600 mb-4 text-center">
                Choose your preferred payment option
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
                onPress={handlePayLater}
                className="bg-gray-100 py-4 rounded-lg flex-row justify-center items-center"
              >
                <FontAwesome name="clock-o" size={20} color="#4B5563" />
                <Text className="text-gray-700 font-bold text-lg ml-2">
                  Pay During {appointmentData.appointmentType === 'doctor' ? 'Consultation' : 'Visit'}
                </Text>
              </Pressable>

              <Text className="text-xs text-gray-500 text-center mt-3">
                You can pay online now for convenience or pay during your appointment
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Custom Alert Component */}
      <AlertComponent />
    </Modal>
  );
};

export default PaymentModal; 