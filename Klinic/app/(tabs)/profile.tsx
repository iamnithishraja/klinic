import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRecoilValue } from 'recoil';
import { userAtom } from '@/store/userAtoms';
import { UserRole } from '@/types/userTypes';
import UserProfileForm from '@/components/profile/UserProfileForm';
import FloatingIcons from '@/components/FloatingIcons';

export default function ProfileScreen() {
  const user = useRecoilValue(userAtom);
  
  const renderProfileForm = () => {
    if (!user) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-gray-700 text-lg text-center">
            Please log in to view your profile
          </Text>
        </View>
      );
    }
    
    // Render different forms based on user role
    switch (user.role) {
      case UserRole.USER:
        return <UserProfileForm />;
      case UserRole.DOCTOR:
        // This would be replaced with a DoctorProfileForm component
        return (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-700 text-lg text-center">
              Doctor profile management coming soon
            </Text>
          </View>
        );
      case UserRole.LABORATORY:
        // This would be replaced with a LabProfileForm component
        return (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-700 text-lg text-center">
              Laboratory profile management coming soon
            </Text>
          </View>
        );
      case UserRole.DELIVERY_BOY:
        // This would be replaced with a DeliveryProfileForm component
        return (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-700 text-lg text-center">
              Delivery profile management coming soon
            </Text>
          </View>
        );
      default:
        return (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-700 text-lg text-center">
              Unknown user role
            </Text>
          </View>
        );
    }
  };
  
  return (
    <LinearGradient
      colors={['#F9FAFB', '#EEF2FF']}
      className="flex-1"
    >
      <FloatingIcons />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 p-6 pt-12">
          <Text className="text-2xl font-bold text-indigo-600 mb-6 font-['System']">
            My Profile
          </Text>
          
          {renderProfileForm()}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
} 