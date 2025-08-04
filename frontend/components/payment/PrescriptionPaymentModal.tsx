import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/api/client';
import { useUserStore } from '@/store/userStore';
import { useCustomAlert } from '../CustomAlert';
// @ts-ignore
import { useRouter } from 'expo-router';

interface PrescriptionPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  orderData: {
    prescription?: string;
    totalPrice: number;
    needAssignment: boolean;
  };
  onPaymentSuccess: () => void;
}

const PrescriptionPaymentModal: React.FC<PrescriptionPaymentModalProps> = ({
  visible,
  onClose,
  orderData,
  onPaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const user = useUserStore(state => state.user);
  const { showAlert, AlertComponent } = useCustomAlert();
  const router = useRouter();

  const handleCODSuccess = async () => {
    try {
      setLoading(true);
      
      const successMessage = 'COD order created successfully! Your prescription order has been created and will be assigned to a laboratory by our admin team. You will be notified once the order is processed. Payment will be collected upon delivery.';

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
        title: 'Order Cancelled',
        message: 'Your prescription order has been cancelled.',
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
      console.error('Error handling order cancellation:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to handle order cancellation. Please contact support.',
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
          message: 'Please ensure your prescription order is valid before proceeding with COD.',
          type: 'error'
        });
        return;
      }

      // For prescription orders, totalPrice can be 0 initially
      // The price will be calculated after laboratory assignment
      if (orderData.totalPrice === undefined || orderData.totalPrice === null) {
        showAlert({
          title: 'Invalid Order',
          message: 'Please ensure your prescription order is valid before proceeding with COD.',
          type: 'error'
        });
        return;
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
            <Text className="text-xl font-bold">Prescription Order</Text>
            <Pressable onPress={onClose} className="p-2">
              <FontAwesome name="times" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Order Details */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="font-semibold text-lg mb-2">
              Prescription Order
            </Text>
            <Text className="text-gray-600 mb-1">
              Prescription Upload
            </Text>
            <Text className="text-primary font-bold text-lg">
              Amount: ₹{orderData.totalPrice}
            </Text>
          </View>

          {/* Payment Options */}
          <View>
            <Text className="text-gray-600 mb-4 text-center">
              For prescription orders, we offer Cash on Delivery. After order creation, our admin team will review your prescription and assign it to a laboratory.
            </Text>
            
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
              Payment will be collected upon delivery. Your prescription will be reviewed and assigned to a laboratory.
            </Text>
          </View>
        </View>
      </View>
      
      {/* Custom Alert Component */}
      <AlertComponent />
    </Modal>
  );
};

export default PrescriptionPaymentModal; 