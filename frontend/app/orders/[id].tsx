import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { orderService, Order } from '@/services/orderService';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const orderData = await orderService.getOrderById(id);
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleGoBack = () => {
    router.back();
  };

  const handleAddMoreProducts = () => {
    router.push('/medicines');
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        text: 'Pending',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: 'clock-o' as const,
      },
      pending_assignment: {
        text: 'Pending Assignment',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: 'clock-o' as const,
      },
      confirmed: {
        text: 'Confirmed',
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        icon: 'check-circle' as const,
      },
      out_for_delivery: {
        text: 'Out for Delivery',
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        icon: 'truck' as const,
      },
      delivered: {
        text: 'Delivered',
        color: '#10B981',
        bgColor: '#D1FAE5',
        icon: 'check-circle' as const,
      },
      cancelled: {
        text: 'Cancelled',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        icon: 'times-circle' as const,
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <FontAwesome name="exclamation-triangle" size={48} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4">Order Not Found</Text>
          <Text className="text-gray-600 text-center mt-2 mb-6">
            The order you&apos;re looking for doesn&apos;t exist or has been removed.
          </Text>
          <TouchableOpacity
            onPress={handleGoBack}
            className="bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatusConfig(order.status);
  const orderId = order._id.slice(-8).toUpperCase();

  const handleCancelOrder = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.updateOrderStatus(order._id, 'cancelled');
              fetchOrderDetails(); // Refresh details
              Alert.alert('Success', 'Order has been cancelled.');
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel the order.');
            }
          },
        },
      ]
    );
  };

  const renderActionButtons = () => {
    if (!order.isPaid && !order.cod && ['pending', 'confirmed'].includes(order.status)) {
      return (
        <TouchableOpacity
          // onPress={() => router.push(`/payment/${order._id}`)} // TODO: Implement payment screen
          className="bg-green-600 py-4 rounded-xl flex-row justify-center items-center"
        >
          <FontAwesome name="credit-card" size={16} color="white" />
          <Text className="text-white font-bold text-lg ml-3">Pay Now {formatPrice(order.totalPrice)}</Text>
        </TouchableOpacity>
      );
    }

    if (['pending', 'confirmed'].includes(order.status)) {
      return (
        <TouchableOpacity
          onPress={handleCancelOrder}
          className="bg-red-600 py-4 rounded-xl flex-row justify-center items-center"
        >
          <FontAwesome name="times" size={16} color="white" />
          <Text className="text-white font-bold text-lg ml-3">Cancel Order</Text>
        </TouchableOpacity>
      );
    }

    if (order.status === 'delivered') {
      return (
        <TouchableOpacity
          onPress={handleAddMoreProducts}
          className="bg-blue-600 py-4 rounded-xl flex-row justify-center items-center"
        >
          <FontAwesome name="refresh" size={16} color="white" />
          <Text className="text-white font-bold text-lg ml-3">Reorder</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={handleAddMoreProducts}
        className="bg-blue-600 py-4 rounded-xl flex-row justify-center items-center"
      >
        <FontAwesome name="plus" size={16} color="white" />
        <Text className="text-white font-bold text-lg ml-3">Add More Products</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={handleGoBack} className="p-2">
          <FontAwesome name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Order #{orderId}</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-6">
          {/* Status Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Status</Text>
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: status.bgColor }}
                  className="flex-row items-center px-3 py-1 rounded-full"
                >
                  <FontAwesome name={status.icon} size={14} color={status.color} />
                  <Text
                    style={{ color: status.color }}
                    className="font-bold text-sm ml-2"
                  >
                    {status.text}
                  </Text>
                </View>
                <View
                  style={{ backgroundColor: order.isPaid ? Colors.light.successbg : Colors.light.warningbg }}
                  className="flex-row items-center px-3 py-1 rounded-full ml-2"
                >
                  <FontAwesome name={order.isPaid ? 'check-circle' : 'credit-card'} size={14} color={order.isPaid ? Colors.light.success : Colors.light.warning} />
                  <Text
                    style={{ color: order.isPaid ? Colors.light.success : Colors.light.warning }}
                    className="font-bold text-sm ml-2"
                  >
                    {order.isPaid ? 'Paid' : (order.cod ? 'COD' : 'Payment Pending')}
                  </Text>
                </View>
              </View>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Order Date</Text>
                <Text className="font-semibold text-gray-900">
                  {formatDate(order.createdAt)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Last Updated</Text>
                <Text className="font-semibold text-gray-900">
                  {formatDate(order.updatedAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Products Card */}
          {order.products && order.products.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <FontAwesome name="shopping-basket" size={18} color="#3B82F6" />
                <Text className="text-lg font-bold text-gray-900 ml-3">
                  Products
                </Text>
              </View>
              <View className="space-y-4">
                {order.products.map((item, index) => (
                  <View
                    key={index}
                    className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <View className="flex-row items-start justify-between">
                      <Text className="text-lg font-semibold text-gray-900 flex-1">
                        {item.product.name}
                      </Text>
                      <Text className="text-lg font-bold text-blue-600">
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Text className="text-gray-600">Quantity:</Text>
                        <Text className="font-semibold text-gray-900 ml-2">
                          {item.quantity}
                        </Text>
                      </View>
                      <Text className="text-gray-500">
                        ₹{item.product.price.toFixed(2)} each
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Prescription Card */}
          {order.prescription && (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <FontAwesome name="file-text" size={18} color="#3B82F6" />
                <Text className="text-lg font-bold text-gray-900 ml-3">
                  Prescription
                </Text>
              </View>
              
              <View className="bg-blue-50 rounded-xl p-4">
                <Text className="text-blue-700 font-medium">
                  Prescription has been uploaded and is being processed
                </Text>
              </View>
            </View>
          )}

          {/* Order Summary Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Order Summary</Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="font-semibold text-gray-900">
                  {formatPrice(order.totalPrice)}
                </Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Delivery Fee</Text>
                <Text className="font-semibold text-gray-900">₹0.00</Text>
              </View>
              
              <View className="border-t border-gray-200 pt-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-bold text-gray-900">Total</Text>
                  <Text className="text-xl font-bold text-blue-600">
                    {formatPrice(order.totalPrice)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            {renderActionButtons()}
            <TouchableOpacity
              onPress={handleGoBack}
              className="bg-gray-100 py-4 rounded-xl flex-row justify-center items-center"
            >
              <FontAwesome name="arrow-left" size={16} color="#6B7280" />
              <Text className="text-gray-700 font-semibold text-lg ml-3">Back to Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}