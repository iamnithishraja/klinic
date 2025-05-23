import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

const Logo = ({ size = 'medium', showTagline = false }: LogoProps) => {
  // Size mappings
  const sizeMap = {
    small: {
      iconSize: 40,
      titleSize: 'text-xl',
      taglineSize: 'text-xs',
      marginBottom: 'mb-2',
    },
    medium: {
      iconSize: 60,
      titleSize: 'text-2xl',
      taglineSize: 'text-sm',
      marginBottom: 'mb-4',
    },
    large: {
      iconSize: 80,
      titleSize: 'text-3xl',
      taglineSize: 'text-base',
      marginBottom: 'mb-6',
    },
  };

  const { iconSize, titleSize, taglineSize, marginBottom } = sizeMap[size];

  return (
    <View className={`items-center ${marginBottom}`}>
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        style={{ 
          borderRadius: 16, 
          padding: 16,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        }}
      >
        <MaterialCommunityIcons name="hospital-building" size={iconSize} color="#ffffff" />
      </LinearGradient>
      
      <Text 
        className={`${titleSize} text-primary mt-3 font-bold`}
        style={{ fontFamily: 'System' }}
      >
        Klinic
      </Text>
      
      {showTagline && (
        <Text 
          className={`${taglineSize} text-text-secondary mt-1`}
          style={{ fontFamily: 'System' }}
        >
          Healthcare at your fingertips
        </Text>
      )}
    </View>
  );
};

export default Logo; 