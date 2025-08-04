import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// @ts-ignore
import { useRouter } from 'expo-router';

import Logo from './Logo';
import { isWeb } from '@/utils/platformUtils';

interface WebNavigationProps {
  onLogin?: () => void;
  onGetStarted?: () => void;
}

const WebNavigation: React.FC<WebNavigationProps> = ({ 
  onLogin, 
  onGetStarted 
}) => {
  const router = useRouter();

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      router.push('/(auth)/login' as any);
    }
  };

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push('/(auth)/register' as any);
    }
  };

  // Only show full navigation on web
  if (!isWeb) {
    return null; // Don't show web navigation on mobile
  }
  
  return (
    <View className="px-6 py-4 flex-row justify-between items-center bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <Logo size="small" />
      
      <View className="flex-row items-center space-x-6">
        {/* Navigation Links - only visible on larger screens */}
        <View className="hidden md:flex-row space-x-6">
          <TouchableOpacity>
            <Text className="text-text-secondary hover:text-primary font-medium">
              Features
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text className="text-text-secondary hover:text-primary font-medium">
              Doctors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text className="text-text-secondary hover:text-primary font-medium">
              Labs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text className="text-text-secondary hover:text-primary font-medium">
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity onPress={handleLogin}>
            <Text className="text-primary font-semibold hover:text-primary/80">
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGetStarted}
            className="bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Text className="text-white font-semibold">Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WebNavigation; 