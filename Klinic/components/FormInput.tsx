import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  iconName: string;
  secureTextEntry?: boolean;
  showPassword?: boolean;
  togglePassword?: () => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  secureTextEntry = false,
  showPassword = false,
  togglePassword,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FormInputProps) => {
  return (
    <View className="mb-4">
      <Text className="text-text-secondary mb-2 font-medium">{label}</Text>
      <View className="flex-row items-center border border-divider rounded-xl px-4 py-3 bg-white shadow-sm">
        <MaterialCommunityIcons name={iconName} size={22} color="#4F46E5" />
        <TextInput
          className="flex-1 ml-3 text-text-primary"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor="#9CA3AF"
          style={{ fontFamily: 'System' }}
        />
        {secureTextEntry && togglePassword && (
          <TouchableOpacity onPress={togglePassword}>
            <FontAwesome 
              name={showPassword ? "eye" : "eye-slash"} 
              size={20} 
              color="#4F46E5" 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormInput; 