import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserRole } from '@/types/userTypes';

interface ProfileHeaderProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    profilePicture?: string;
  } | null;
  onLogout: () => void;
  onProfilePicturePress: () => void;
}

const ProfileHeader = ({ 
  userData, 
  onLogout,
  onProfilePicturePress
}: ProfileHeaderProps) => {
  const displayName = userData?.name || 'User';
  const displayEmail = userData?.email || 'email@example.com';
  const displayPhone = userData?.phone || 'Not provided';
  const displayRole = userData?.role || UserRole.USER;
  const profilePicture = userData?.profilePicture;
  
  // Add 'Dr.' prefix for doctors
  const formattedName = displayRole === UserRole.DOCTOR ? `Dr. ${displayName}` : displayName;

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mt-2 mb-8">
        <Text className="text-text-primary text-3xl font-bold">My Profile</Text>
        <TouchableOpacity 
          onPress={onLogout}
          className="flex-row items-center bg-red-100 rounded-full px-5 py-2.5"
        >
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text className="text-red-500 ml-2 font-medium">Logout</Text>
        </TouchableOpacity>
      </View>

      <View className="items-center">
        {/* Profile image with upload button */}
        <TouchableOpacity 
          onPress={onProfilePicturePress}
          className="mb-4 relative"
        >
          <View className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden">
            {profilePicture ? (
              <Image 
                source={{ uri: profilePicture }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <MaterialCommunityIcons name="account" size={60} color="#6366F1" />
              </View>
            )}
          </View>
          <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2">
            <MaterialCommunityIcons name="camera" size={20} color="white" />
          </View>
        </TouchableOpacity>
        
        <Text className="text-text-primary text-xl font-semibold">
          {formattedName}
        </Text>
        <Text className="text-text-secondary text-base mt-1">
          {displayEmail}
        </Text>
        <View className="flex-row items-center mt-1">
          <MaterialCommunityIcons name="phone" size={16} color="#6B7280" />
          <Text className="text-text-secondary ml-2">
            {displayPhone}
          </Text>
        </View>
        <View className="px-4 py-1.5 bg-primary/10 rounded-full mt-3">
          <Text className="text-primary font-medium">
            {displayRole === UserRole.USER ? 'Patient' : 
            displayRole === UserRole.DOCTOR ? 'Doctor' : 
            displayRole === UserRole.LABORATORY ? 'Laboratory' : 
            displayRole === UserRole.DELIVERY_BOY ? 'Delivery Personnel' : 
            'Admin'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader; 