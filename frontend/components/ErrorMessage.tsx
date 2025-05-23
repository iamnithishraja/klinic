import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
  if (!message) return null;
  
  return (
    <View className="bg-red-50 p-3 rounded-lg mb-4 flex-row items-center">
      <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
      <Text className="text-accent ml-2 flex-1" style={{ fontFamily: 'System' }}>
        {message}
      </Text>
    </View>
  );
};

export default ErrorMessage; 