import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

const FormSection = ({ title, children }: FormSectionProps) => {
  return (
    <View className="mb-5">
      <Text className="text-lg font-bold text-indigo-600 mb-3 font-['System']">
        {title}
      </Text>
      <View className="bg-white/80 p-4 rounded-xl shadow-sm">
        {children}
      </View>
    </View>
  );
};

export default FormSection; 