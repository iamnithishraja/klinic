import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { UserRole } from '@/types/userTypes';
import UserDashboard from '@/components/UserDashboard';
import DoctorDashboard from '@/components/DoctorDashboard';
import LaboratoryDashboard from '@/components/LaboratoryDashboard';
import DeliveryDashboard from '@/components/delivery/DeliveryDashboard';

export default function HomeScreen() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading check for user data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <FontAwesome name="spinner" size={24} color="#6B7280" />
        <Text className="text-gray-600 mt-2">Loading...</Text>
      </SafeAreaView>
    );
  }

  // Show appropriate dashboard based on user role
  if (user?.role === UserRole.USER) {
    return <UserDashboard />;
  }

  if (user?.role === UserRole.DOCTOR) {
    return <DoctorDashboard />;
  }

  if (user?.role === UserRole.LABORATORY) {
    return <LaboratoryDashboard />;
  }

  if (user?.role === UserRole.DELIVERY_BOY) {
    return <DeliveryDashboard />;
  }

  // Show different content for other roles (admin, etc.)
  const getRoleSpecificContent = () => {
    switch (user?.role) {
      
      case UserRole.ADMIN:
        return (
          <View className="p-6">
            <Text className="text-3xl font-roboto-bold text-primary mb-4">Admin Dashboard</Text>
            <Text className="text-lg font-opensans text-text-primary mb-6">
              Monitor and manage the platform.
            </Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
              <FontAwesome name="cogs" size={48} color="#059669" />
              <Text className="text-gray-600 mt-4 text-center">
                Admin features coming soon!
              </Text>
            </View>
          </View>
        );
      
      default:
        return (
          <View className="p-6">
            <Text className="text-3xl font-roboto-bold text-primary mb-4">Welcome to Klinic</Text>
            <Text className="text-lg font-opensans text-text-primary mb-6">
              Please complete your profile setup to get started.
            </Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
              <FontAwesome name="user-circle" size={48} color="#6B7280" />
              <Text className="text-gray-600 mt-4 text-center">
                Setup your profile to continue
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {getRoleSpecificContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
