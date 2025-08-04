import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
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
  };

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleGoBack}
              className="mr-4 p-2 -ml-2"
            >
              <FontAwesome name="arrow-left" size={20} color={Colors.light.text} />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold text-gray-900">Order Details</Text>
              <Text className="text-gray-600 text-sm">#{orderId}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleAddMoreProducts}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <FontAwesome name="plus" size={16} color="white" />
            <Text className="text-white font-semibold ml-2">Shop</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6 space-y-6">
          {/* Order Status Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Order Status</Text>
              <View 
                className="px-4 py-2 rounded-full flex-row items-center"
                style={{ backgroundColor: status.bgColor }}
              >
                <FontAwesome name={status.icon} size={14} color={status.color} />
                <Text 
                  className="text-sm font-bold ml-2"
                  style={{ color: status.color }}
                >
                  {status.text}
                </Text>
              </View>
            </View>
            
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Order Type</Text>
                <Text className="font-semibold text-gray-900">
                  {order.prescription ? 'Prescription Order' : 'Product Order'}
                </Text>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Payment Status</Text>
                <View className="flex-row items-center">
                  <FontAwesome 
                    name={order.isPaid ? "check-circle" : "clock-o"} 
                    size={14} 
                    color={order.isPaid ? "#10B981" : "#F59E0B"} 
                  />
                  <Text 
                    className={`ml-2 font-semibold ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}
                  >
                    {order.isPaid ? 'Paid' : 'Payment Pending'}
                  </Text>
                </View>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Order Date</Text>
                <Text className="font-semibold text-gray-900">
                  {formatDate(order.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Products Card */}
          {order.products && order.products.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <FontAwesome name="shopping-bag" size={18} color="#3B82F6" />
                <Text className="text-lg font-bold text-gray-900 ml-3">
                  Products ({order.products.length})
                </Text>
              </View>
              
              <View className="space-y-4">
                {order.products.map((item, index) => (
                  <View key={`${item.product._id}-${item.quantity}-${index}`} className="bg-gray-50 rounded-xl p-4">
                    <View className="flex-row justify-between items-start mb-2">
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
            <TouchableOpacity
              onPress={handleAddMoreProducts}
              className="bg-blue-600 py-4 rounded-xl flex-row justify-center items-center"
            >
              <FontAwesome name="plus" size={16} color="white" />
              <Text className="text-white font-bold text-lg ml-3">Add More Products</Text>
            </TouchableOpacity>
            
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