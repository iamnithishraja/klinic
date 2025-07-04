import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import { UserRole } from '@/types/userTypes';
import UserDashboard from '@/components/UserDashboard';

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
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <FontAwesome name="spinner" size={24} color="#6B7280" />
        <Text className="text-gray-600 mt-2">Loading...</Text>
      </View>
    );
  }

  // Show UserDashboard only for users
  if (user?.role === UserRole.USER) {
    return <UserDashboard />;
  }

  // Show different content for other roles (doctors, labs, etc.)
  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case UserRole.DOCTOR:
        return (
          <View className="p-6">
            <Text className="text-3xl font-roboto-bold text-primary mb-4">Doctor Dashboard</Text>
            <Text className="text-lg font-opensans text-text-primary mb-6">
              Manage your appointments, patients, and practice.
            </Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
              <FontAwesome name="stethoscope" size={48} color="#4F46E5" />
              <Text className="text-gray-600 mt-4 text-center">
                Doctor-specific features coming soon!
              </Text>
            </View>
          </View>
        );
      
      case UserRole.LABORATORY:
        return (
          <View className="p-6">
            <Text className="text-3xl font-roboto-bold text-primary mb-4">Laboratory Dashboard</Text>
            <Text className="text-lg font-opensans text-text-primary mb-6">
              Manage your lab services and test appointments.
            </Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
              <FontAwesome name="flask" size={48} color="#8B5CF6" />
              <Text className="text-gray-600 mt-4 text-center">
                Laboratory-specific features coming soon!
              </Text>
            </View>
          </View>
        );
      
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
      
      case UserRole.DELIVERY_BOY:
        return (
          <View className="p-6">
            <Text className="text-3xl font-roboto-bold text-primary mb-4">Delivery Dashboard</Text>
            <Text className="text-lg font-opensans text-text-primary mb-6">
              Manage your deliveries and routes.
            </Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
              <FontAwesome name="truck" size={48} color="#F59E0B" />
              <Text className="text-gray-600 mt-4 text-center">
                Delivery features coming soon!
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
    <ScrollView className="flex-1 bg-gray-50">
      {getRoleSpecificContent()}
    </ScrollView>
  );
}
