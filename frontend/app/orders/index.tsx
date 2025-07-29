import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import OrdersTab from '@/components/dashboard/OrdersTab';

export default function OrdersIndexScreen() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleAddProducts = () => {
    router.push('/medicines');
  };

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
              <Text className="text-2xl font-bold text-gray-900">My Orders</Text>
              <Text className="text-gray-600 text-sm">Track your health orders</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleAddProducts}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <FontAwesome name="plus" size={16} color="white" />
            <Text className="text-white font-semibold ml-2">Shop</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders Content */}
      <View className="flex-1">
        <OrdersTab />
      </View>
    </SafeAreaView>
  );
} 