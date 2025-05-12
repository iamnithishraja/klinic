import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface FormButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: string;
}

const FormButton = ({ title, onPress, loading = false, disabled = false, style = '' }: FormButtonProps) => {
  return (
    <TouchableOpacity
      className={`rounded-xl py-4 px-4 items-center mb-6 shadow-md ${
        disabled || loading ? 'bg-primary/70' : 'bg-primary'
      } ${style}`}
      onPress={onPress}
      disabled={disabled || loading}
      style={{ elevation: 3 }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-white text-lg" style={{ fontWeight: '600' }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default FormButton; 